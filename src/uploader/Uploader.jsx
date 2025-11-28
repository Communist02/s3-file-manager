import { useState, useRef, useEffect } from 'react';
import { InboxOutlined } from '@ant-design/icons'
import { Drawer, Upload, message, Checkbox, notification, Card, Progress, Button } from 'antd';
import { FixedSizeList } from 'react-window';

const useUploadSpeed = (uid, percent, size) => {
    const prevPercentRef = useRef(0);
    const prevTimeRef = useRef(Date.now());
    const speedRef = useRef('0 B/s');

    const formatSpeed = (bytesPerSecond) => {
        if (bytesPerSecond === 0) return '0 B/s';

        const k = 1024;
        const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];

        const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));

        return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    useEffect(() => {
        if (percent > prevPercentRef.current) {
            const currentTime = Date.now();
            const timeDiff = (currentTime - prevTimeRef.current) / 1000; // в секундах
            const percentDiff = percent - prevPercentRef.current;

            if (timeDiff > 0.5) { // Обновляем скорость каждые 0.5 секунды минимум
                const bytesUploaded = (size * percentDiff) / 100;
                const speedBps = bytesUploaded / timeDiff;

                speedRef.current = formatSpeed(speedBps);

                prevPercentRef.current = percent;
                prevTimeRef.current = currentTime;
            }
        }

        if (percent === 0) {
            // Сброс при начале новой загрузки
            prevPercentRef.current = 0;
            prevTimeRef.current = Date.now();
            speedRef.current = '0 B/s';
        }
    }, [percent, size, uid]);

    return speedRef.current;
};

function Uploader({ open, setOpen, url, token, collection_id, path, updateCollection, setCurrentCountUploading }) {
    const [dirMode, setDirMode] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState([]);

    // Функция для форматирования размера файла
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Функции для работы с файлами
    const addUploadingFile = (fileInfo) => {
        setUploadingFiles(prev => {
            const exists = prev.find(f => f.uid === fileInfo.uid);
            if (exists) return prev;
            return [...prev, fileInfo];
        });
        !open && setCurrentCountUploading(uploadingFiles.length + 1);
    };

    const updateUploadingFile = (uid, updates) => {
        setUploadingFiles(prev =>
            prev.map(file =>
                file.uid === uid ? { ...file, ...updates } : file
            )
        );
    };

    const removeUploadingFile = (uid) => {
        setUploadingFiles(prev => {
            const newFiles = prev.filter(file => file.uid !== uid);
            !open && setCurrentCountUploading(newFiles.length);
            return newFiles;
        });
    };

    const removeDoneFiles = () => {
        setUploadingFiles(prev => {
            const newFiles = prev.filter(file => file.status !== 'done');
            !open && setCurrentCountUploading(newFiles.length);
            return newFiles;
        });
    };

    function onChange(info, collection_id) {
        if (info.file.status === 'done') {
            updateUploadingFile(info.file.uid, {
                status: 'done',
                percent: 100
            });

            // Удаляем через некоторое время или оставляем в списке
            // setTimeout(() => {
            //     removeUploadingFile(info.file.uid);
            // }, 3000); // Удаляем через 3 секунды после успешной загрузки

            notification.success({
                key: 'uploading-done',
                message: `Успешно загружен!`,
                description: info.file.name,
                placement: 'topLeft'
            });
            updateCollection(collection_id);

        } else if (info.file.status === 'error') {
            updateUploadingFile(info.file.uid, {
                status: 'error',
                percent: 0
            });

            // Оставляем файлы с ошибкой в списке или удаляем через время
            setTimeout(() => {
                removeUploadingFile(info.file.uid);
            }, 5000);

            message.error(`${info.file.name} не удалось загрузить.`);

        } else if (info.file.status === 'uploading') {
            console.log(info.file.percent || 0)
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
    const beforeUpload = (file, fileList) => {
        if (!dirMode && file.size === 0) {
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

    // Кастомный элемент для отображения в списке загрузок
    const renderUploadListExtra = ({ uid, percent, status, size = 0 }) => {
        const speed = useUploadSpeed(uid, percent, size);
        const formattedSize = formatFileSize(size);

        if (percent < 100 && status === 'uploading') {
            const uploadedSize = formatFileSize((size * percent) / 100);
            return (
                <div style={{ display: 'flex', gap: 10 }}>
                    <Progress percent={Math.round(percent)} />
                    <div style={{ fontSize: '12px', color: '#666' }}>{uploadedSize} / {formattedSize}</div>
                    <div style={{ color: '#1890ff', fontSize: '12px' }}>{speed}</div>
                </div>
            );
        } else if (status === 'uploading') {
            return (
                <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{formattedSize}</div>
                    <div style={{ fontSize: '12px', color: '#1a72c4ff' }}>Обработка</div>
                </div>
            );
        } else if (status !== 'done') {
            return <div style={{ fontSize: '12px', color: '#666' }}>{formattedSize}</div>;
        } else if (status === 'done') {
            return (
                <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{formattedSize}</div>
                    <div style={{ fontSize: '12px', color: '#52c41a' }}>✓ Завершено</div>
                </div>
            );
        }
    };

    function getItem(value) {
        const index = value.index;
        const file = uploadingFiles[index];

        if (!file) return null;

        return (
            <div style={value.style}>
                <Card size="small" title={file.name} extra={file.status == 'done' && <Button onClick={() => removeUploadingFile(file.uid)}>Скрыть</Button>} style={{ width: '100%', marginTop: 10, height: 100 }}>
                    {renderUploadListExtra(file)}
                </Card>
            </div>
        );
    }

    return (
        <Drawer
            size='large'
            title='Загрузки'
            onClose={() => {
                setOpen(false);
                setCurrentCountUploading(uploadingFiles.length);
            }
            }
            open={open}
            extra={
                <div>
                    <Checkbox checked={dirMode} onChange={(e) => setDirMode(e.target.checked)}>
                        Режим директории
                    </Checkbox>
                    {uploadingFiles.length > 0 && <Button onClick={removeDoneFiles}>Очистить завершенные</Button>}
                    <div style={{ marginTop: 4, fontSize: '12px', color: '#666', textAlign: 'right', marginRight: 8 }}>
                        Количество загрузок: {uploadingFiles.length}
                    </div>
                </div>
            }
        >
            <Upload.Dragger
                height={300}
                action={
                    (file) => {
                        let filePath;
                        if (dirMode) {
                            filePath = path + '/' + file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf('/'));
                        } else {
                            filePath = path;
                        }
                        return url + `/collections/${collection_id}/upload/${token}${filePath}`
                    }
                }
                onChange={(info, collection = collection_id) => onChange(info, collection)}
                beforeUpload={beforeUpload}
                listType="picture"
                showUploadList={false}
                directory={dirMode}
                multiple
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Нажмите или перетащите файлы в эту область для загрузки</p>
                <p className="ant-upload-hint">
                    Поддерживается один или несколько файлов.
                    Включите режим директории, чтобы загрузить папку.
                    Файлы будут загружены в текущую директорию{path !== '' ? ` ${path}` : ''}.
                </p>
            </Upload.Dragger>
            {uploadingFiles.length > 0 && (
                <div style={{ marginTop: 10 }}>
                    <FixedSizeList
                        className="upload-virtual-list"
                        height={window.outerHeight - 620}
                        itemCount={uploadingFiles.length}
                        itemSize={110}
                    >
                        {getItem}
                    </FixedSizeList>
                </div>
            )}
        </Drawer>
    );
};

export default Uploader;
