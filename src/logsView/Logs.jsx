import { useState, useRef } from 'react';
import { Button, Drawer, Table, Tag, Typography } from 'antd';
import { getLogs } from '../api/api';

function Logs({ open, setOpen, token }) {
    const [logs, setLogs] = useState([]);
    const updated = useRef(false);

    async function updateLogs() {
        const response = await getLogs(token);
        setLogs(response.data);
    }

    if (!updated.current && open) {
        updated.current = true;
        updateLogs();
    }

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
        },
        {
            title: 'Время',
            dataIndex: 'date_time',
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
            title: 'Действие',
            dataIndex: 'action',
        },
        {
            title: 'Результат',
            dataIndex: 'result',
            render: (value) => {
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
            extra={<Button type='primary' onClick={updateLogs}>Обновить</Button>}
        >
            {open ? <Table
                scroll={{ y: 'calc(100vh - 180px)' }}
                rowKey="id"
                size="small"
                dataSource={logs}
                columns={columns}
                pagination={{ pageSize: 50, hideOnSinglePage: true, showSizeChanger: false, size: 'default' }}
                expandable={{
                    expandedRowRender: record => <Typography><pre>{JSON.stringify(record, null, 4)}</pre></Typography>,
                    // rowExpandable: record => record.message !== null && record.message !== ''
                }}
            /> : <></>}
        </Drawer>
    );
};

export default Logs;
