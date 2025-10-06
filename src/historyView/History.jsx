import { useState, useRef } from 'react';
import { Button, Drawer, Table } from 'antd';
import { getHistoryCollection } from '../api/api';

function History({ open, setOpen, collection_id, token }) {
    const [logs, setLogs] = useState([]);
    const last_collection_id = useRef(null);

    async function updateLogs() {
        const response = await getHistoryCollection(collection_id, token);
        setLogs(response.data);
    }

    if (open && last_collection_id.current !== collection_id) {
        last_collection_id.current = collection_id;
        updateLogs();
    }

    const columns = [
        {
            title: 'Время',
            dataIndex: 'date_time',
            width: '20%',
            render: (value) => {
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
            dataIndex: 'login',
            width: '20%',
        },
        {
            title: 'Действие',
            dataIndex: 'action',
            render: (value, record) => {
                switch (value) {
                    case 'copy':
                        return `Копирование ${JSON.stringify(record.message.source_paths, null, 1).replace('[', '').replace(']', '')} из коллекции ${record.message.source_collection_id} в «${record.message.destination_path}»`
                    case 'delete':
                        return `Удаление ${JSON.stringify(record.message.files, null, 1).replace('[', '').replace(']', '')}`;
                    case 'upload':
                        if (record.message.path !== '') {
                            return `Загрузка в «${record.message.path}» файла «${record.message.file_name}»`;
                        } else {
                            return `Загрузка в корень коллекции файла «${record.message.file_name}»`;
                        }
                    case 'rename':
                        return `Переименование «${record.message.path}» в «${record.message.new_name}»`;
                    case 'create_folder':
                        return `Создание новой папки «${record.message.name}» в «${record.message.path}»`;
                    case 'change_collection_info':
                        return 'Изменена информация о коллекции';
                }
            }
        },
    ];

    return (
        <Drawer
            size='large'
            style={{ padding: 0 }}
            title='История'
            onClose={() => setOpen(false)}
            open={open}
            styles={{
                body: {
                    padding: 0,
                }
            }}
            // placement='top'
            extra={<Button type='primary' onClick={updateLogs}>Обновить</Button>}
        >
            {open ? <Table
                scroll={{ y: 'calc(100vh - 180px)' }}
                rowKey="id"
                size="small"
                dataSource={logs}
                columns={columns}
                pagination={{ pageSize: 50, hideOnSinglePage: true, showSizeChanger: false, size: 'default' }}
            /> : <></>}

        </Drawer>
    );
};

export default History;
