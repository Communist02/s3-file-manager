import { useState, useEffect } from 'react';
import { Button, Drawer, Table } from 'antd';
import { getLogs } from '../api/api';

function Logs({ open, setOpen, token }) {
    const [logs, setLogs] = useState([]);

    async function updateLogs() {
        const response = await getLogs(token);
        setLogs(response.data);
    }

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
        },
        {
            title: 'Время',
            dataIndex: 'date_time',
        },
        {
            title: 'Действие',
            dataIndex: 'action',
        },
        {
            title: 'Результат',
            dataIndex: 'result',
        },
    ];

    return (
        <Drawer
            size='large'
            style={{ padding: 0 }}
            title='Логи'
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
            <Table
                scroll={{ y: 'calc(100vh - 180px)' }}
                rowKey="id"
                size="small"
                dataSource={logs}
                columns={columns}
                pagination={{ pageSize: 50, hideOnSinglePage: true, showSizeChanger: false, size: 'default' }}
                expandable={{
                    expandedRowRender: record => <p style={{ margin: 0 }}>{record.message + ', group_id: ' + record.group_id}</p>,
                    rowExpandable: record => record.message !== null && record.message !== ''
                }}
            />
        </Drawer>
    );
};

export default Logs;
