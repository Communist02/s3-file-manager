import { useState, useRef } from 'react';
import { Button, Flex, Modal, Select, Segmented, Table, Popconfirm, message, Empty, Tag, Descriptions, Dropdown, Space, Tooltip } from 'antd';
import { removeCollection, getGroups, getOtherUsers, giveAccessUserToCollection, giveAccessGroupToCollection, getAccessToCollection, deleteAccessToCollection, getAccessTypes, changeAccessType } from '../api/api';
import { DeleteOutlined, DownOutlined } from '@ant-design/icons';

function CollectionPage({ collection, getCollections, setCurrentCollection, token, setOpen }) {
    const [isModalOpenRemove, setIsModalOpenRemove] = useState(false);
    const [isModalOpenAccess, setIsModalOpenAccess] = useState(false);
    const [users, setUsers] = useState([]);
    const [access, setAccess] = useState([]);
    const [groups, setGroups] = useState([]);
    const [accessTypes, setAccessTypes] = useState([]);
    const [accessTypeId, setAccessTypeId] = useState('');
    const [accessId, setAccessId] = useState('');
    const [groupMode, setGroupMode] = useState(false);
    const lastId = useRef(-1);

    const collections = [collection];
    const index = 0;

    const getAccess = async () => {
        const response = await getAccessToCollection(collections[index].id, token);
        if (response.status === 200) {
            setAccess(response.data);
        }
    }

    if (lastId.current !== collection.id) {
        lastId.current = collection.id;
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
        response = await getAccessTypes(token);
        if (response.status === 200) {
            let accessTypesOptions = [];
            const accessTypesList = response.data;
            let label;
            for (const accessType of accessTypesList) {
                switch (accessType.id) {
                    case 1:
                        label = 'Владелец';
                        break;
                    case 2:
                        label = 'Чтение и запись';
                        break;
                    case 3:
                        label = 'Только чтение';
                        break;
                    case 4:
                        label = 'Только запись';
                        break;
                }
                accessTypesOptions.push({
                    label: label,
                    value: accessType.id,
                });
            }
            setAccessTypes(accessTypesOptions);
        }
        setIsModalOpenAccess(true);
    }

    const handleOkRemove = async () => {
        const response = await removeCollection(collections[index].name, token);
        if (response.status === 200) {
            message.success('Коллекция успешно удалена!');
            await getCollections(token, true);
            setIsModalOpenRemove(false);
            setOpen(false);
        } else if (response.status === 406) {
            message.error('Коллекция не является пустой, удалите все файлы!');
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    };

    const handleOkAccess = async () => {
        let response;
        if (!groupMode) {
            response = await giveAccessUserToCollection(collections[index].id, accessId, accessTypeId, token);
        } else {
            response = await giveAccessGroupToCollection(collections[index].id, accessId, accessTypeId, token);
        }
        if (response.status === 200) {
            message.success('Доступ успешно предоставлен!');
            await getAccess();
            setAccessId('');
            setAccessTypeId('');
            setGroupMode(false);
            setIsModalOpenAccess(false);
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    };

    async function handleDeleteAccess(access_id) {
        const response = await deleteAccessToCollection(access_id, token);
        if (response.status === 200) {
            message.success('Доступ успешно удален!');
            if (collections[index].type !== 'person') {
                await getCollections(token, true);
            }
            await getAccess();
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    };

    async function handleChangeAccess(access_id, accessTypeId) {
        const response = await changeAccessType(access_id, accessTypeId, token);
        if (response.status === 200) {
            message.success('Доступ успешно изменен!');
            await getAccess();
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    };

    const columns = [
        {
            title: 'Тип получателя',
            dataIndex: 'target_type',
            render: (value) =>
                <Tag color={value === 'user' ? 'blue' : 'magenta'}>
                    {value === 'user' ? 'Пользователь' : 'Группа'}
                </Tag>
        },
        {
            title: 'Имя получателя',
            dataIndex: 'target_name',
        },
        {
            title: 'Тип доступа',
            dataIndex: 'type_id',
            render: (value, record) => {
                let color;
                let name;
                switch (value) {
                    case 1:
                        color = 'cyan';
                        name = 'Владелец';
                        break;
                    case 2:
                        color = 'purple';
                        name = 'Чтение и запись';
                        break;
                    case 3:
                        color = 'orange';
                        name = 'Только чтение';
                        break;
                    case 4:
                        color = 'magenta';
                        name = 'Только запись';
                        break;
                }
                const items = [
                    { key: 2, label: 'Чтение и запись' },
                    { key: 3, label: 'Только чтение' },
                    { key: 4, label: 'Только запись' },
                ]
                if (collections[index].access_type_id === 1 && value !== 1) {
                    return <Dropdown menu={{ items, onClick: (e) => handleChangeAccess(record.id, e.key) }} trigger={['click']}>
                        <a>
                            <Tag color={color}>{name}</Tag>
                            <DownOutlined />
                        </a>
                    </Dropdown>
                } else {
                    return <Tag color={color}>{name}</Tag>
                }
            }
        },
        {
            title: '',
            render: (_, record) => record.type_id !== 1 && (collections[index].access_type_id === 1 || record.target_type !== 'group') ?
                <Popconfirm title="Вы действительно хотите удалить доступ?" okText="Удалить" onConfirm={() => handleDeleteAccess(record.id)}>
                    <a>Удалить</a>
                </Popconfirm>
                : ''
        },
    ];

    if (index !== -1 && index < collections.length) {
        const collection = collections[index]
        return (
            <>
                <Flex vertical gap="small" style={{ width: '100%' }}>
                    <Descriptions bordered size='small' layout='vertical' title={<Space>{collection.name}{collection.access_type_id === 1 && <Tooltip title="Удалить коллекцию"><Button color="danger" variant="outlined" icon={<DeleteOutlined />} onClick={() => setIsModalOpenRemove(true)}></Button></Tooltip>}</Space>} items={[
                        { key: 'collection_id', label: 'id', children: collection.id },
                        { key: 'access_type', label: 'Тип доступа', children: ['Владелец', 'Чтение и запись', 'Только чтение', 'Только запись'][collection.access_type_id - 1] },
                        { key: 'access_count', label: 'Количество пользователей', children: access.length },
                    ]} />
                    <Table title={() => <div>{collection.access_type_id === 1 && <Button type='primary' onClick={showModalAccess}>Предоставить доступ к коллекции</Button>}</div>} rowKey="id" pagination={{ hideOnSinglePage: true }} columns={columns} dataSource={access} />
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
                    <p>Для удаления требуется, чтобы коллекция была пустой!</p>
                </Modal>
                <Modal
                    title={"Предоставление доступа для коллекции " + collection.name}
                    open={isModalOpenAccess}
                    onOk={handleOkAccess}
                    onCancel={
                        () => {
                            setAccessId('');
                            setAccessTypeId('');
                            setGroupMode(false);
                            setIsModalOpenAccess(false);
                        }
                    }
                    okButtonProps={{ disabled: accessId === '' || accessTypeId === '' }}
                >
                    <Segmented
                        value={groupMode ? 'Для группы' : 'Для пользователя'}
                        options={['Для пользователя', 'Для группы']}
                        onChange={value => {
                            setAccessId('');
                            setAccessTypeId('');
                            setGroupMode(value === 'Для группы');
                        }}
                    />
                    {groupMode ? <p>Группа</p> : <p>Пользователь</p>}
                    <Select
                        showSearch
                        value={accessId}
                        style={{ width: '100%' }}
                        placeholder="Выберите кому предоставить доступ"
                        optionFilterProp="label"
                        onChange={(value) => setAccessId(value)}
                        // onSearch={onSearch}
                        options={groupMode ? groups : users}
                    />
                    <p>Тип доступа</p>
                    <Select
                        value={accessTypeId}
                        style={{ width: '100%' }}
                        placeholder="Выберите тип доступа"
                        onChange={(value) => setAccessTypeId(value)}
                        // onSearch={onSearch}
                        options={accessTypes}
                    />
                </Modal>
            </>
        );
    } else {
        return <Empty description={'Выберите коллекцию'} />;
    }
}

export default CollectionPage;
