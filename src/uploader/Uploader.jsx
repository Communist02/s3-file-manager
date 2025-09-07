import React, { useState } from 'react';
import { InboxOutlined } from '@ant-design/icons'
import { Drawer, Upload, message, Checkbox } from 'antd';

function Uploader({ open, setOpen, url, token, collection_id, path, updateCollection }) {
    const [dirMode, setDirMode] = useState(false);

    function onChange(info, collection_id) {
        if (info.file.status !== 'uploading') {
            // console.log(info.file, info.fileList);
        }
        if (info.file.status === 'done') {
            message.success(`${info.file.name} был успешно загружен!`);
            updateCollection(collection_id);
        } else if (info.file.status === 'error') {
            message.error(`${info.file.name} не удалось загрузить.`);
        }
    };

    return (
        <Drawer
            size='large'
            title="Загрузки"
            onClose={() => setOpen(false)}
            open={open}
        >
            <Checkbox checked={dirMode} onChange={(e) => setDirMode(e.target.checked)}>Режим директории</Checkbox>
            <Upload.Dragger
                height={300}
                action={(file) => {
                    let filePath;
                    if (dirMode) {
                        filePath = path + '/' + file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf('/'));
                        console.log(file.webkitRelativePath.lastIndexOf('/'));
                    } else {
                        filePath = path;
                        if (file.size === 0) {
                            message.error('Не может быть загружен пустой файл!');
                            return '';
                        }
                    }
                    return url + `?token=${token}&collection_id=${collection_id}&path=${filePath}`
                }
                }
                onChange={(info, collection = collection_id) => onChange(info, collection)}
                listType="picture"
                showUploadList={{
                    extra: ({ size = 0, percent }) => {
                        if (percent < 100) {
                            return <span style={{ color: '#cccccc' }}> ({(size / 1024 / 1024 * percent / 100).toFixed(2)} / {(size / 1024 / 1024).toFixed(2)} MB)</span>
                        } else {
                            return <span style={{ color: '#cccccc' }}> ({(size / 1024 / 1024).toFixed(2)} MB)</span>
                        }
                    }
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
                {/* <Button type='primary'>Загрузить</Button> */}
            </Upload.Dragger>
        </Drawer>
    );
};

export default Uploader;