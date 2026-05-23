import { useState, useRef } from 'react';
import { Button, Drawer, Table } from 'antd';
import { apiClient } from '../api';

interface HistoryProps {
    open: boolean;
    setOpen: (value: boolean) => void;
    collection_id: number;
}

function History({ open, setOpen, collection_id }: HistoryProps) {
    const [logs, setLogs] = useState([]);
    const last_collection_id = useRef<number | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    async function updateLogs() {
        setIsUpdating(true);
        const response = await apiClient.getHistoryCollection(collection_id);
        setLogs(response.data);
        setIsUpdating(false);
    }

    if (open && last_collection_id.current !== collection_id) {
        last_collection_id.current = collection_id;
        updateLogs();
    }

    const columns = [
        {
            title: 'Время',
            dataIndex: 'created_at',
            width: '20%',
            render: (value: any) => {
                const formatter = Intl.DateTimeFormat('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                return formatter.format(Date.parse(value));
            }
        },
        {
            title: 'Пользователь',
            dataIndex: 'username',
            width: '20%',
        },
        {
            title: 'Действие',
            dataIndex: 'action',
            render: (value: string, record: any) => {
                switch (value) {
                    case 'copy_files':
                        return `Копирование ${JSON.stringify(record.detail.source_paths, null, 1).replace('[', '').replace(']', '')} из коллекции ${record.detail.source_collection_id} в «${record.detail.destination_path}»`
                    case 'delete_files':
                        return `Удаление ${JSON.stringify(record.detail.files, null, 1).replace('[', '').replace(']', '')}`;
                    case 'upload':
                        if (record.detail.path !== '') {
                            return `Загрузка в «${record.detail.path}» файла «${record.detail.file_name}»`;
                        } else {
                            return `Загрузка в «/» файла «${record.detail.file_name}»`;
                        }
                    case 'rename':
                        return `Переименование «${record.detail.path}» в «${record.detail.new_name}»`;
                    case 'create_folder':
                        return `Создание новой папки «${record.detail.name}» в «${record.detail.path}»`;
                    case 'change_collection_info':
                        return 'Изменена информация о коллекции';
                    case 'create_collection':
                        return 'Создана коллекция';
                    default:
                        return value
                }
            }
        },
    ];

    return (
        <Drawer
            size='large'
            title='История'
            onClose={() => setOpen(false)}
            open={open}
            styles={{
                body: {
                    padding: 0,
                }
            }}
            // placement='top'
            extra={<Button loading={isUpdating} type='primary' onClick={updateLogs}>Обновить</Button>}
        >
            {open ? <Table
                scroll={{ y: 'calc(100vh - 180px)' }}
                rowKey="id"
                size="small"
                dataSource={logs}
                columns={columns}
                pagination={{ pageSize: 50, hideOnSinglePage: true, showSizeChanger: false, size: 'medium' }}
            /> : <></>}

        </Drawer>
    );
};

export default History;
