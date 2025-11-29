import { useState, useRef } from 'react';
import { InboxOutlined } from '@ant-design/icons'
import { Drawer, message, Checkbox, notification, Progress, Button, Table } from 'antd';
import CustomUploader from './CustomUploader';


function Uploader({ open, setOpen, url, token, collection_id, path, updateCollection, setCurrentCountUploading }) {
    const [dirMode, setDirMode] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState([]);
    const uploadRequestsRef = useRef(new Map()); // Храним XMLHttpRequest для отмены

    // Функция для форматирования размера файла
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const cancelUpload = (uid) => {
        const request = uploadRequestsRef.current.get(uid);
        if (request) {
            request.abort(); // Отменяем запрос
            uploadRequestsRef.current.delete(uid);
        }
        message.info(`Загрузка отменена: ${uploadingFiles.find(f => f.uid === uid)?.name}`);
        removeUploadingFile(uid);
    };

    // Функции для работы с файлами
    const addUploadingFile = (fileInfo) => {
        uploadingFiles.push(fileInfo);
        setUploadingFiles(uploadingFiles);
        !open && setCurrentCountUploading(uploadRequestsRef.current.size + 1);
    };

    function updateUploadingFile(uid, updates) {
        const currentTime = new Date().getTime()
        const fileIndex = uploadingFiles.findIndex(file =>
            file.uid === uid && (updates.procent === 100 || updates.status === 'done' || file.lastUpdateInfo === undefined || currentTime - file.lastUpdateInfo > 500)
        );

        function getSpeed(size, percent, oldPercent, lastUpdateInfo) {
            const uploadedSize = (size * percent);
            const oldUploadedSize = (size * oldPercent);
            if (percent === 0 || percent === 100) {
                return ''
            }
            const speed = formatFileSize((uploadedSize - oldUploadedSize) / ((currentTime - lastUpdateInfo) / 10));
            return `${speed}/s`
        }

        if (fileIndex !== -1) {
            uploadingFiles[fileIndex].lastPercent = uploadingFiles[fileIndex].percent;
            uploadingFiles[fileIndex].percent = updates.percent;
            const speed = getSpeed(uploadingFiles[fileIndex].size, updates.percent, uploadingFiles[fileIndex].lastPercent, uploadingFiles[fileIndex].lastUpdateInfo)
            uploadingFiles[fileIndex].lastUpdateInfo = currentTime;
            uploadingFiles[fileIndex].status = updates.status;

            setUploadingFiles(prev =>
                prev.map(file =>
                    file.uid === uid ? { ...file, ...{ lastUpdateInfo: currentTime, lastPercent: uploadingFiles[fileIndex].lastPercent, speed: speed }, ...updates } : file
                )
            );
        }
    }

    const removeUploadingFile = (uid) => {
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

    function onChange(info, collection_id) {
        if (info.file.status === 'done') {
            updateUploadingFile(info.file.uid, {
                status: 'done',
                percent: 100
            });
            uploadRequestsRef.current.delete(info.file.uid);

            notification.success({
                key: 'uploading-done',
                title: `Успешно загружен!`,
                description: info.file.name,
                placement: 'topLeft'
            });
            setCurrentCountUploading(uploadRequestsRef.current.size);
            updateCollection(collection_id);

        } else if (info.file.status === 'error') {
            updateUploadingFile(info.file.uid, {
                status: 'error',
                percent: 0
            });
            uploadRequestsRef.current.delete(info.file.uid);

            // Оставляем файлы с ошибкой в списке или удаляем через время
            setTimeout(() => {
                removeUploadingFile(info.file.uid);
            }, 5000);

            message.error(`${info.file.name} не удалось загрузить.`);

        } else if (info.file.status === 'uploading') {
            // Обновляем проценты при загрузке
            updateUploadingFile(info.file.uid, {
                status: 'uploading',
                percent: info.file.percent || 0,
                name: info.file.name,
                size: info.file.size
            });
            // Если файл еще не добавлен, добавляем его
            if (!uploadingFiles.find(f => f.uid === info.file.uid)) {
                addUploadingFile({
                    uid: info.file.uid,
                    name: info.file.name,
                    size: info.file.size,
                    status: 'uploading',
                    percent: info.file.percent || 0
                });
            }
        }
    };

    // Функция для проверки, можно ли начать загрузку файла
    const beforeUpload = (file) => {
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
            percent: 0
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
            render: (value) => {
                return formatFileSize(value);
            }
        },
        {
            title: 'Процесс',
            dataIndex: 'percent',
            width: 130,
            render: (value) => {
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
            render: (value, record) => {
                if (record.status === 'done') {
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
            size={900}
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
                    <Checkbox checked={dirMode} onChange={(e) => setDirMode(e.target.checked)}>
                        Режим директории
                    </Checkbox>
                    {uploadingFiles.filter((file) => file.status === 'done').length > 0 && <Button style={{ height: 24, padding: 4 }} onClick={removeDoneFiles}>Очистить завершенные</Button>}
                    <div style={{ marginTop: 4, fontSize: '12px', color: '#666', textAlign: 'right', marginRight: 8 }}>
                        Количество загрузок: {uploadRequestsRef.current.size}
                    </div>
                </div>
            }
        >
            <CustomUploader
                url={url}
                path={path}
                token={token}
                collection_id={collection_id}
                dirMode={dirMode}
                beforeUpload={beforeUpload}
                onChange={(info, collection) => onChange(info, collection)}
                onCreateXhr={(uid, xhr) => { uploadRequestsRef.current.set(uid, xhr) }}
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
                    Файлы будут загружены в текущую директорию
                    {path !== '' ? ` ${path}` : ''}.
                </p>
            </CustomUploader>
            {uploadingFiles.length > 0 && (
                <div style={{ marginTop: 10 }}>
                    <Table
                        scroll={{ y: 'calc(100vh - 505px)' }}
                        rowKey="uid"
                        size="small"
                        dataSource={uploadingFiles}
                        columns={columns}
                        pagination={{ pageSize: 50, hideOnSinglePage: true, showSizeChanger: false, size: 'default', style: { margin: 0, marginTop: 10 } }}
                    />
                </div>
            )}
        </Drawer>
    );
};

export default Uploader;
