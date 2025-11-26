import { useState } from 'react';
import { Descriptions, Space, Input, Card, Tag, Popconfirm, message, Table, Typography } from 'antd';
import { searchCollections } from '../api/api';

function CollectionsSearch({ token, getCollections }) {
    const [collections, setCollections] = useState([]);

    const onSearch = async (value, _e, info) => {
        const response = await searchCollections(value, token);
        if (response.status === 200) {
            if (response.data.length === 0) {
                message.info('Ничего не найдено!');
            } else {
                message.info(`Найдено ${response.data.length} коллекции`);
            }
            setCollections(response.data);
        } else {
            message.error('Ошибка поиска!');
        }
    }

    const columns = [
        {
            title: 'Имя',
            dataIndex: 'name',
            width: '15%',
        },
        {
            title: 'Тема',
            dataIndex: 'index',
            render: (value) => {
                if (value !== undefined) return value.title
            }
        },
        {
            title: 'Описание',
            dataIndex: 'index',
            width: '50%',
            render: (value) => {
                if (value !== undefined) return value.description
            }
        },
        // {
        //     title: 'Ключевые слова',
        //     dataIndex: 'index',
        //     render: (value, record) => {
        //         const tags = [];
        //         if (value.tags) {
        //             for (const item of value.tags) {
        //                 tags.push(<Tag>{item}</Tag>);
        //             }
        //         }
        //         return <Space size={0}>{tags}</Space>;
        //     }
        // },
    ];

    const columnsFile = [
        {
            title: 'Путь',
            dataIndex: 'path',
            width: '50%',
        },
        {
            title: 'Размер',
            dataIndex: 'size',
            render: (value) => {
                const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
                let index = 0

                for (let i = 0; i < 4; i++) {
                    if (value >= 1024) {
                        value = value / 1024;
                        index += 1;
                    }
                }
                return `${Math.round(value)} ${sizes[index]}`
            }
        },
        // {
        //     title: 'Описание',
        //     dataIndex: 'index',
        //     width: '50%',
        //     render: (value) => {
        //         if (value !== undefined) return value.description
        //     }
        // },
        // {
        //     title: 'Ключевые слова',
        //     dataIndex: 'index',
        //     render: (value, record) => {
        //         const tags = [];
        //         if (value.tags) {
        //             for (const item of value.tags) {
        //                 tags.push(<Tag>{item}</Tag>);
        //             }
        //         }
        //         return <Space size={0}>{tags}</Space>;
        //     }
        // },
    ];



    // const cards = () => {
    //     const listCards = []
    //     let tags = [];
    //     let types = [];

    //     let ids = localStorage.getItem('freeCollectionIds');
    //     if (ids !== null) {
    //         ids = JSON.parse(ids);
    //     } else {
    //         ids = [];
    //     }

    //     for (const collection of collections) {
    //         if (collection.index.tags) {
    //             for (const item of collection.index.tags) {
    //                 tags.push(<Tag>{item}</Tag>);
    //             }
    //         }

    //         if (collection.index.types) {
    //             for (const item of collection.index.types) {
    //                 types.push(<Tag>{item.type}: {item.description}</Tag>);
    //             }
    //         }
    //         const itemsInfo = [
    //             {
    //                 key: 'collection-id',
    //                 label: 'ID',
    //                 children: collection.id,
    //             },
    //             {
    //                 key: 'collection-name',
    //                 label: 'Тема',
    //                 children: collection.index.title,
    //             },
    //             {
    //                 key: 'collection-description',
    //                 label: 'Описание',
    //                 children: collection.index.description,
    //             },
    //             {
    //                 key: 'collection-tags',
    //                 label: 'Ключевые слова',
    //                 children: <Space size={0}>{tags}</Space>,
    //             },
    //             {
    //                 key: 'collection-types',
    //                 label: 'Описание файлов',
    //                 children: <Space size={0}>{types}</Space>,
    //             },
    //         ];

    //         listCards.push(
    //             <Card size="small" title={collection.name} extra={
    //                 <Popconfirm disabled={ids.includes(collection.id)} title="Вы действительно хотите добавить в общий список?" onConfirm={async () => {
    //                     if (ids.length > 0) {
    //                         ids.push(collection.id);
    //                         ids = [...new Set(ids)];
    //                         localStorage.setItem('freeCollectionIds', JSON.stringify(ids));
    //                     } else {
    //                         localStorage.setItem('freeCollectionIds', JSON.stringify([collection.id]));
    //                     }
    //                     message.success('Коллекция успешно добавлена!');
    //                     await getCollections(token, true);
    //                 }}>
    //                     <a>{ids.includes(collection.id) || collection.type !== 'access_to_all' ? 'Уже находится в общем списке' : 'Добавить в общий список'}</a>
    //                 </Popconfirm>
    //             }>
    //                 <Descriptions layout='vertical' items={itemsInfo} />
    //             </Card>
    //         );
    //         tags = [];
    //         types = [];
    //     }
    //     return listCards;
    // }

    const getItems = (collection) => {
        let tags = [];
        let types = [];

        let ids = localStorage.getItem('freeCollectionIds');
        if (ids !== null) {
            ids = JSON.parse(ids);
        } else {
            ids = [];
        }

        if (collection.index !== undefined && collection.index.tags !== undefined && collection.index.tags) {
            for (const item of collection.index.tags) {
                tags.push(<Tag>{item}</Tag>);
            }
        }

        if (collection.index !== undefined && collection.index.types !== undefined && collection.index.types) {
            for (const item of collection.index.types) {
                types.push(<Tag>{item.type}: {item.description}</Tag>);
            }
        }
        const itemsInfo = [
            {
                key: 'collection-status',
                label: 'Добавление в общий список',
                children: <Popconfirm disabled={ids.includes(collection.id) || collection.type !== 'access_to_all'} title="Вы действительно хотите добавить в общий список?" onConfirm={async () => {
                    if (ids.length > 0) {
                        ids.push(collection.id);
                        ids = [...new Set(ids)];
                        localStorage.setItem('freeCollectionIds', JSON.stringify(ids));
                    } else {
                        localStorage.setItem('freeCollectionIds', JSON.stringify([collection.id]));
                    }
                    message.success('Коллекция успешно добавлена!');
                    await getCollections(token, true);
                }}>
                    <a>{ids.includes(collection.id) || collection.type !== 'access_to_all' ? 'Уже находится в общем списке' : 'Добавить в общий список'}</a>
                </Popconfirm>,
            },
            {
                key: 'collection-id',
                label: 'ID',
                children: collection.id,
            },
        ];
        if (collection.index !== undefined) {
            itemsInfo.push(
                // {
                //     key: 'collection-name',
                //     label: 'Тема',
                //     children: collection.index !== undefined && collection.index.title,
                // },
                // {
                //     key: 'collection-description',
                //     label: 'Описание',
                //     children: collection.index !== undefined && collection.index.description,
                // },
                {
                    key: 'collection-tags',
                    label: 'Ключевые слова',
                    children: <Space size={0}>{tags}</Space>,
                },
                {
                    key: 'collection-types',
                    label: 'Описание файлов',
                    children: <Space size={0}>{types}</Space>,
                },
            )
        }

        return <>
            <Descriptions layout='vertical' items={itemsInfo} />
            <Table
                rowKey="path"
                size="small"
                dataSource={collection.files}
                columns={columnsFile}
                bordered
                pagination={{ pageSize: 50, hideOnSinglePage: true, showSizeChanger: false, size: 'default' }}
                expandable={{
                    expandedRowRender: record => <Typography><pre>{JSON.stringify(record, null, 4)}</pre></Typography>,
                    // rowExpandable: record => record.message !== null && record.message !== ''
                }}
            />
        </>;
    }

    return <>
        <Input.Search style={{ marginBottom: 10 }} placeholder="Поиск" onSearch={onSearch} enterButton />
        <Table
            scroll={{ y: 'calc(100vh - 180px - 42px)' }}
            rowKey="id"
            size="small"
            dataSource={collections}
            columns={columns}
            bordered
            pagination={{ pageSize: 50, hideOnSinglePage: true, showSizeChanger: false, size: 'default' }}
            expandable={{
                expandedRowRender: record => getItems(record),
                // rowExpandable: record => record.message !== null && record.message !== ''
            }}
        />
    </>;
}

export default CollectionsSearch;