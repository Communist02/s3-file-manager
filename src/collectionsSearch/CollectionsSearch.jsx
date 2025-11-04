import { useState } from 'react';
import { Descriptions, Space, Input, Card, Tag, Popconfirm, message } from 'antd';
import { searchCollections } from '../api/api';

function CollectionsSearch({ token, getCollections }) {
    const [collections, setCollections] = useState([]);

    const onSearch = async (value, _e, info) => {
        const response = await searchCollections(value, token);
        if (response.status === 200) {
            setCollections(response.data);
        } else {
            message.error('Ошибка поиска!');
        }
    }

    const cards = () => {
        const listCards = []
        let tags = [];
        let types = [];

        for (const collection of collections) {
            if (collection.index.tags) {
                for (const item of collection.index.tags) {
                    tags.push(<Tag>{item}</Tag>);
                }
            }

            if (collection.index.types) {
                for (const item of collection.index.types) {
                    types.push(<Tag>{item.type}: {item.description}</Tag>);
                }
            }
            const itemsInfo = [
                {
                    key: 'collection-id',
                    label: 'ID',
                    children: collection.id,
                },
                {
                    key: 'collection-name',
                    label: 'Тема',
                    children: collection.index.title,
                },
                {
                    key: 'collection-description',
                    label: 'Описание',
                    children: collection.index.description,
                },
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
            ];

            listCards.push(
                <Card size="small" title={collection.name} extra={
                    <Popconfirm title="Вы действительно хотите добавить в общий список?" onConfirm={async () => {
                        let ids = localStorage.getItem('freeCollectionIds');
                        if (ids !== null) {
                            ids = JSON.parse(ids);
                            ids.push(collection.id);
                            ids = [...new Set(ids)];
                            localStorage.setItem('freeCollectionIds', JSON.stringify(ids));
                        } else {
                            localStorage.setItem('freeCollectionIds', JSON.stringify([collection.id]));
                        }
                        message.success('Коллекция успешно добавлена!');
                        await getCollections(token, true);
                    }}>
                        <a>Добавить в общий список</a>
                    </Popconfirm>
                }>
                    <Descriptions layout='vertical' items={itemsInfo} />
                </Card>
            );
            tags = [];
            types = [];
        }
        return listCards;
    }

    return <>
        <Input.Search style={{ marginBottom: 10 }} placeholder="Поиск" onSearch={onSearch} enterButton />
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            {cards()}
        </Space>
    </>;
}

export default CollectionsSearch;