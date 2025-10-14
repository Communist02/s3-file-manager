import { useState, useRef, useEffect } from 'react';
import { InboxOutlined } from '@ant-design/icons'
import { Drawer, Upload, message, Checkbox, notification } from 'antd';

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
    const [uploadingFiles, setUploadingFiles] = useState(new Set());

    // Функция для форматирования размера файла
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    function onChange(info, collection_id) {
        if (info.file.status === 'done') {
            // Удаляем файл из трекера при успешной загрузке
            !open && setCurrentCountUploading(uploadingFiles.size - 1);
            setUploadingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(info.file.uid);
                return newSet;
            });
            notification.success({ key: 'uploading-done', message: `Успешно загружен!`, description: info.file.name, placement: 'topLeft' });
            updateCollection(collection_id);
        } else if (info.file.status === 'error') {
            // Удаляем файл из трекера при ошибке
            !open && setCurrentCountUploading(uploadingFiles.size - 1);
            setUploadingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(info.file.uid);
                return newSet;
            });
            message.error(`${info.file.name} не удалось загрузить.`);
        } else if (info.file.status === 'uploading') {
            // Добавляем файл в трекер при начале загрузки
            !open && setCurrentCountUploading(uploadingFiles.size + 1);
            setUploadingFiles(prev => new Set(prev).add(info.file.uid));
        }
    };

    // Функция для проверки, можно ли начать загрузку файла
    const beforeUpload = (file, fileList) => {
        if (!dirMode && file.size === 0) {
            message.error('Не может быть загружен пустой файл!');
            return false;
        }
        return true;
    };

    // Кастомный элемент для отображения в списке загрузок
    const renderUploadListExtra = ({ uid, size = 0, percent, status }) => {
        const speed = useUploadSpeed(uid, percent, size);
        const formattedSize = formatFileSize(size);

        if (percent < 100 && status === 'uploading') {
            const uploadedSize = formatFileSize((size * percent) / 100);
            return (
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>{uploadedSize} / {formattedSize}</div>
                    <div style={{ color: '#1890ff', fontSize: '12px' }}>{speed}</div>
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

    return (
        <Drawer
            size='large'
            title='Загрузки'
            onClose={() => {
                setOpen(false);
                setCurrentCountUploading(uploadingFiles.size);
            }
            }
            open={open}
            extra={
                <div>
                    <Checkbox checked={dirMode} onChange={(e) => setDirMode(e.target.checked)}>
                        Режим директории
                    </Checkbox>
                    <div style={{ marginTop: 4, fontSize: '12px', color: '#666', textAlign: 'right', marginRight: 8 }}>
                        Сейчас загружается: {uploadingFiles.size}
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
                showUploadList={{
                    showRemoveIcon: true,
                    extra: renderUploadListExtra,
                }}
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
        </Drawer>
    );
};

export default Uploader;
