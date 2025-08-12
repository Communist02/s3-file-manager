import { useState, useRef } from 'react';
import { Button, Flex, Modal, Select, Segmented, Table, Popconfirm, message, Empty, Tag } from 'antd';
import { removeCollection, getGroups, getOtherUsers, giveAccessUserToCollection, giveAccessGroupToCollection, getAccessToCollection, deleteAccessToCollection } from '../api/api';

function CollectionPage({ index, collections, getCollections, token }) {
    const [isModalOpenRemove, setIsModalOpenRemove] = useState(false);
    const [isModalOpenAccess, setIsModalOpenAccess] = useState(false);
    const [users, setUsers] = useState([]);
    const [access, setAccess] = useState([]);
    const [groups, setGroups] = useState([]);
    const [accessId, setAccessId] = useState('');
    const [groupMode, setGroupMode] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const lastUpdateIndex = useRef(-1);

    const getAccess = async () => {
        const response = await getAccessToCollection(collections[index].id, token);
        if (response.status === 200) {
            setAccess(response.data);
        }
    }

    if (index !== -1 & lastUpdateIndex.current !== index) {
        lastUpdateIndex.current = index;
        getAccess();
    }

    async function showModalAccess() {
        let response = await getOtherUsers(token);
        if (response.status === 200) {
            let usersOptions = [];
            const usersList = response.data;
            for (const user of usersList) {
                usersOptions.push({
                    label: user.login,
                    value: user.id,
                });
            }
            setUsers(usersOptions);
        }
        response = await getGroups(token);
        if (response.status === 200) {
            let groupsOptions = [];
            const groupsList = response.data;
            for (const group of groupsList) {
                groupsOptions.push({
                    label: group.title,
                    value: group.id,
                });
            }
            setGroups(groupsOptions);
        }
        setIsModalOpenAccess(true);
    }

    const handleOkRemove = async () => {
        const response = await removeCollection(collections[index].name, token);
        if (response.status === 200) {
            messageApi.success('Коллекция успешно удалена!');
            await getCollections(token);
            setIsModalOpenRemove(false);
        } else if (response.status === 406) {
            messageApi.error('Коллекция не является пустой, удалите все файлы!');
        } else {
            messageApi.error('Произошла ошибка! ' + response);
        }
    };

    const handleOkAccess = async () => {
        let response;
        if (!groupMode) {
            response = await giveAccessUserToCollection(collections[index].id, accessId, token);
        } else {
            response = await giveAccessGroupToCollection(collections[index].id, accessId, token);
        }
        if (response.status === 200) {
            messageApi.success('Доступ успешно предоставлен!');
            await getAccess();
            setAccessId('');
            setGroupMode(false);
            setIsModalOpenAccess(false);
        } else {
            messageApi.error('Произошла ошибка! ' + response);
        }
    };

    async function handleDeleteAccess(access_id) {
        const response = await deleteAccessToCollection(access_id, token);
        if (response.status === 200) {
            messageApi.success('Доступ успешно удален!');
            await getAccess();
        } else {
            messageApi.error('Произошла ошибка! ' + response);
        }
    };

    const columns = [
        {
            title: 'ID доступа',
            dataIndex: 'id',
        },
        {
            title: 'Тип цели',
            dataIndex: 'target_type',
            render: (value) =>
                <Tag color={value === 'user' ? 'blue' : 'magenta'}>
                    {value === 'user' ? 'Пользователь' : 'Группа'}
                </Tag>
        },
        {
            title: 'Имя цели',
            dataIndex: 'target_name',
        },
        {
            title: 'Действие',
            render: (_, record) =>
                <Popconfirm title="Вы действительно хотите удалить доступ?" okText="Удалить" onConfirm={() => handleDeleteAccess(record.id)}>
                    <a>Удалить</a>
                </Popconfirm>
        },
    ];

    if (index !== -1 && index < collections.length) {
        const collection = collections[index]
        return (
            <>
                <Flex vertical gap="small" style={{ width: '100%' }}>
                    {contextHolder}
                    <Button color="danger" variant="outlined" onClick={() => setIsModalOpenRemove(true)}>Удалить коллекцию {collection.name}</Button>
                    <Button color="cyan" variant="solid" onClick={showModalAccess}>Предоставить доступ к коллекции</Button>
                    <Table pagination={{ position: ['bottomLeft'] }} rowKey="id" columns={columns} dataSource={access} />
                </Flex>
                <Modal
                    title="Удаление коллекции"
                    open={isModalOpenRemove}
                    okType='danger'
                    okText='Удалить'
                    onOk={handleOkRemove}
                    onCancel={() => setIsModalOpenRemove(false)}
                >
                    <p>Вы действительно хотите удалить {collection.name} ?</p>
                    <p>Для удаления требуется, чтобы коллекция была пустая!</p>
                </Modal>
                <Modal
                    title={"Предоставление доступа для коллекции " + collection.name}
                    open={isModalOpenAccess}
                    onOk={handleOkAccess}
                    onCancel={
                        () => {
                            setAccessId('');
                            setGroupMode(false);
                            setIsModalOpenAccess(false);
                        }
                    }
                    okButtonProps={{ disabled: accessId === '' }}
                >
                    <Segmented
                        value={groupMode ? 'Для группы' : 'Для пользователя'}
                        options={['Для пользователя', 'Для группы']}
                        onChange={value => {
                            setAccessId('');
                            setGroupMode(value === 'Для группы');
                        }}
                    />
                    {groupMode ? <p>Группа</p> : <p>Пользователь</p>}
                    <Select
                        showSearch
                        value={accessId}
                        style={{ width: '100%' }}
                        placeholder="Выберите кому предоставить"
                        optionFilterProp="label"
                        onChange={(value) => setAccessId(value)}
                        // onSearch={onSearch}
                        options={groupMode ? groups : users}
                    />
                </Modal>
            </>
        );
    } else {
        return <Empty description={'Выберите коллекцию'} />;
    }
}

export default CollectionPage;
