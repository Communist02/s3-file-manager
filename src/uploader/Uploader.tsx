import { useState, useRef } from 'react';
import { InboxOutlined } from '@ant-design/icons'
import { Drawer, message, notification, Progress, Button, Table, Segmented } from 'antd';
import CustomUploader from './CustomUploader';

// Функция для форматирования размера файла
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface UploadingFile {
    uid: any;
    percent: number;
    status: string;
    name: string;
    lastPercent: number;
    lastUpdateAt: number;
    size: number;
}

interface UploaderProps {
    open: boolean;
    setOpen: (value: boolean) => void;
    url: string;
    token: string;
    collection_id: number | null;
    path: string;
    updateCollection: (collection_id: number) => void;
    setCurrentCountUploading: (count: number) => void;
}

function Uploader({ open, setOpen, url, token, collection_id, path, updateCollection, setCurrentCountUploading }: UploaderProps) {
    const [isDirMode, setIsDirMode] = useState(false);
    const [isArchiveMode, setIsArchiveMode] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const uploadRequestsRef = useRef(new Map()); // Храним XMLHttpRequest для отмены

    const cancelUpload = (uid: any) => {
        const request = uploadRequestsRef.current.get(uid);
        if (request) {
            request.abort(); // Отменяем запрос
            uploadRequestsRef.current.delete(uid);
        }
        message.info(`Загрузка отменена: ${uploadingFiles.find(f => f.uid === uid)?.name}`);
        removeUploadingFile(uid);
    };

    // Функции для работы с файлами
    const addUploadingFile = (fileInfo: UploadingFile) => {
        uploadingFiles.push(fileInfo);
        setUploadingFiles(uploadingFiles);
        !open && setCurrentCountUploading(uploadRequestsRef.current.size + 1);
    };

    function updateUploadingFile(uid: any, updates: UploadingFile) {
        const currentTime = new Date().getTime()
        const fileIndex = uploadingFiles.findIndex(file =>
            file.uid === uid && (updates.percent === 100 || updates.status === 'done' || updates.status === 'error' || currentTime - file.lastUpdateAt > 500)
        );

        function getSpeed(size: number, percent: number, oldPercent: number, lastUpdateAt: any) {
            const uploadedSize = (size * percent);
            const oldUploadedSize = (size * oldPercent);
            if (percent === 100 || percent === undefined || oldPercent === undefined || lastUpdateAt === undefined) {
                return ''
            }
            const speed = formatFileSize((uploadedSize - oldUploadedSize) / ((currentTime - lastUpdateAt) / 10));
            return `${speed}/s`
        }

        if (fileIndex !== -1) {
            uploadingFiles[fileIndex].lastPercent = uploadingFiles[fileIndex].percent;
            uploadingFiles[fileIndex].percent = updates.percent;
            const speed = getSpeed(uploadingFiles[fileIndex].size, updates.percent, uploadingFiles[fileIndex].lastPercent, uploadingFiles[fileIndex].lastUpdateAt)
            uploadingFiles[fileIndex].lastUpdateAt = currentTime;
            uploadingFiles[fileIndex].status = updates.status;

            setUploadingFiles(prev =>
                prev.map(file =>
                    file.uid === uid ? { ...file, ...{ lastUpdateAt: currentTime, lastPercent: uploadingFiles[fileIndex].lastPercent, speed: speed }, ...updates } : file
                )
            );
        }
    }

    const removeUploadingFile = (uid: any) => {
        setUploadingFiles(prev => {
            const newFiles = prev.filter(file => file.uid !== uid);
            return newFiles;
        });
    };

    const removeDoneFiles = () => {
        setUploadingFiles(prev => {
            const newFiles = prev.filter(file => file.status !== 'done');
            return newFiles;
        });
    };

    function onError(file: UploadingFile) {
        updateUploadingFile(file.uid, {
            status: 'error',
            uid: file.uid,
            name: file.name,
            size: file.size,
            percent: 100,
            lastPercent: 0,
            lastUpdateAt: new Date().getTime()
        });
        uploadRequestsRef.current.delete(file.uid);
    };

    function onChange(file: UploadingFile, collection_id: number) {
        if (file.status === 'done') {
            updateUploadingFile(file.uid, {
                uid: file.uid,
                name: file.name,
                size: file.size,
                status: 'done',
                percent: 100,
                lastPercent: 100,
                lastUpdateAt: new Date().getTime()
            });
            uploadRequestsRef.current.delete(file.uid);

            notification.success({
                key: 'uploading-done',
                title: `Успешно загружен!`,
                description: file.name,
                placement: 'topLeft'
            });
            setCurrentCountUploading(uploadRequestsRef.current.size);
            if (uploadRequestsRef.current.size == 0) {
                updateCollection(collection_id);
            }

        } else if (file.status === 'error') {
            updateUploadingFile(file.uid, {
                status: 'error',
                uid: file.uid,
                name: file.name,
                size: file.size,
                percent: 0,
                lastPercent: 0,
                lastUpdateAt: new Date().getTime()
            });
            uploadRequestsRef.current.delete(file.uid);

            // Оставляем файлы с ошибкой в списке или удаляем через время
            setTimeout(() => {
                removeUploadingFile(file.uid);
            }, 5000);

            message.error(`${file.name} не удалось загрузить.`);

        } else if (file.status === 'uploading') {
            // Обновляем проценты при загрузке
            updateUploadingFile(file.uid, {
                uid: file.uid,
                name: file.name,
                size: file.size,
                status: 'uploading',
                percent: file.percent || 0,
                lastPercent: 0,
                lastUpdateAt: new Date().getTime()
            });
            // Если файл еще не добавлен, добавляем его
            if (!uploadingFiles.find(f => f.uid === file.uid)) {
                addUploadingFile({
                    uid: file.uid,
                    name: file.name,
                    size: file.size,
                    status: 'uploading',
                    percent: file.percent || 0,
                    lastPercent: 0,
                    lastUpdateAt: new Date().getTime()
                });
            }
        }
    };

    // Функция для проверки, можно ли начать загрузку файла
    const beforeUpload = (file: UploadingFile) => {
        if (file.size === 0) {
            message.error('Не может быть загружен пустой файл!');
            return false;
        }

        // Добавляем файл в список сразу при выборе
        addUploadingFile({
            uid: file.uid,
            name: file.name,
            size: file.size,
            status: 'pending', // Новый статус - ожидание загрузки
            percent: 0,
            lastPercent: 0,
            lastUpdateAt: new Date().getTime()
        });

        return true;
    };

    const columns = [
        {
            title: 'Имя',
            dataIndex: 'name',
        },
        {
            title: 'Размер',
            dataIndex: 'size',
            width: 100,
            render: (value: number) => {
                return formatFileSize(value);
            }
        },
        {
            title: 'Процесс',
            dataIndex: 'percent',
            width: 130,
            render: (value: number, record: UploadingFile) => {
                if (record.status === 'error') {
                    return <Progress size={{ width: 150 }} percent={Math.round(value)} status="exception" />
                }
                return <Progress size={{ width: 150 }} percent={Math.round(value)} />;
            }
        },
        {
            title: 'Скорость',
            dataIndex: 'speed',
            width: 100
        },
        {
            title: 'Действие',
            dataIndex: 'status',
            width: 100,
            render: (_: string, record: UploadingFile) => {
                if (record.status === 'done' || record.status === 'error') {
                    return <Button style={{ height: 22, padding: 4 }} onClick={() => removeUploadingFile(record.uid)}>Скрыть</Button>
                } else if (record.percent === 100) {
                    return <div style={{ fontSize: '12px', color: '#1a72c4ff' }}>Обработка</div>
                } else {
                    return <Button style={{ height: 22, padding: 4 }} danger onClick={() => cancelUpload(record.uid)}>Отмена</Button>
                }
            }
        },
    ];

    return (
        <Drawer
            id='drawer-upload'
            size='large'
            title='Загрузки'
            onClose={
                () => {
                    setOpen(false);
                    setCurrentCountUploading(uploadRequestsRef.current.size);
                }
            }
            open={open}
            extra={
                <div>
                    {uploadingFiles.filter((file) => file.status === 'done').length > 0 && <Button style={{ marginRight: 4 }} onClick={removeDoneFiles}>Очистить завершенные</Button>}
                    <Segmented<string>
                        title='Режим'
                        options={['Файлы', 'Директория', 'Архив']}
                        onChange={(value: string) => {
                            switch (value) {
                                case 'Файлы':
                                    setIsDirMode(false);
                                    setIsArchiveMode(false);
                                    break;
                                case 'Директория':
                                    setIsDirMode(true);
                                    setIsArchiveMode(false);
                                    break;
                                case 'Архив':
                                    setIsDirMode(false);
                                    setIsArchiveMode(true);
                                    break;
                            }
                        }}
                    />
                    <div style={{ marginTop: 4, fontSize: '12px', color: '#666', textAlign: 'right', marginRight: 8 }}>
                        Количество загрузок: {uploadRequestsRef.current.size}
                    </div>
                </div>
            }
        >
            {collection_id !== null && <CustomUploader
                url={url}
                path={path}
                token={token}
                collection_id={collection_id}
                dirMode={isDirMode}
                archiveMode={isArchiveMode}
                beforeUpload={beforeUpload}
                onChange={(info) => onChange(info, collection_id)}
                onCreateXhr={(uid, xhr) => { uploadRequestsRef.current.set(uid, xhr) }}
                onError={onError}
                onProgress={() => { }}
                onSuccess={() => { }}
            >
                <p style={{ fontSize: 80, margin: 0 }} className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                    Нажмите или перетащите файлы в эту область для загрузки
                </p>
                <p className="ant-upload-hint">
                    Поддерживается один или несколько файлов.
                    Включите режим директории, чтобы загрузить папку.
                    Включите режим архива, если хотите чтобы архив распаковался после загрузки.
                    Файлы будут загружены в текущую директорию
                    {path !== '' ? ` ${path}` : ''}.
                </p>
            </CustomUploader>}
            {uploadingFiles.length > 0 && (
                <div style={{ marginTop: 10 }}>
                    <Table
                        scroll={{ y: 'calc(100vh - 505px)' }}
                        rowKey="uid"
                        size="small"
                        dataSource={uploadingFiles}
                        columns={columns}
                        pagination={{ pageSize: 50, hideOnSinglePage: true, showSizeChanger: false, size: 'medium', style: { margin: 0, marginTop: 10 } }}
                    />
                </div>
            )}
        </Drawer>
    );
};

export default Uploader;
