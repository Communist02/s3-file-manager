import { useState, useRef } from 'react';
import { Button, Drawer, Table, Tag, Typography, type TableProps } from 'antd';
import { apiClient } from '../api';

interface LogsProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

interface LogsType {
    id: number;
    created_at: string;
    status: number;
}

function Logs({ open, setOpen }: LogsProps) {
    const [logs, setLogs] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const updated = useRef(false);

    async function updateLogs() {
        setIsUpdating(true);
        const response = await apiClient.getLogs();
        setLogs(response.data);
        setIsUpdating(false);
    }

    if (!updated.current && open) {
        updated.current = true;
        updateLogs();
    }

    const columns: TableProps<LogsType>['columns'] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 100,
        },
        {
            title: 'Результат',
            dataIndex: 'status',
            width: 90,
            render: (value: number) => {
                let color;
                switch (value) {
                    case 200:
                    case 201:
                        color = 'green';
                        break;
                    case 300:
                        color = 'purple';
                        break;
                    case 400:
                    case 404:
                    case 406:
                    case 403:
                    case 409:
                    case 410:
                        color = 'orange';
                        break;
                    case 500:
                        color = 'red';
                        break;
                }
                return <Tag color={color}>{value}</Tag>;
            }
        },
        {
            title: 'Время',
            dataIndex: 'created_at',
            width: 140,
            render: (value: string) => {
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
            title: 'Действие',
            dataIndex: 'action',
        },
    ];

    return (
        <Drawer
            size='large'
            title='Логи'
            onClose={() => setOpen(false)}
            open={open}
            styles={{
                body: {
                    padding: 0,
                }
            }}
            extra={<Button loading={isUpdating} type='primary' onClick={updateLogs}>Обновить</Button>}
        >
            {open ? <Table
                scroll={{ y: 'calc(100vh - 180px)' }}
                rowKey="id"
                size="small"
                dataSource={logs}
                columns={columns}
                pagination={{ pageSize: 50, hideOnSinglePage: true, showSizeChanger: false, size: 'medium' }}
                expandable={{
                    expandedRowRender: record => <Typography><pre>{JSON.stringify(record, null, 4)}</pre></Typography>
                }}
            /> : <></>}
        </Drawer>
    );
};

export default Logs;
