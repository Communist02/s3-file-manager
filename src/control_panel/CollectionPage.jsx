import { useState, useRef, useEffect } from 'react';
import { Button, Flex, Modal, Select, Segmented, Table, Popconfirm, message, Empty, Tag, Descriptions, Dropdown, Space, Tooltip, Form, Typography, Input, Switch, Checkbox } from 'antd';
import { removeCollection, getGroups, getOtherUsers, giveAccessUserToCollection, giveAccessGroupToCollection, getAccessToCollection, deleteAccessToCollection, getAccessTypes, changeAccessType, changeCollectionInfo, getCollectionInfo, changeAccessToAll } from '../api/api';
import { DeleteOutlined, DownOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';

function CollectionPage({ collection, getCollections, token, open, setOpen }) {
    const [isModalOpenRemove, setIsModalOpenRemove] = useState(false);
    const [isModalOpenAccess, setIsModalOpenAccess] = useState(false);
    const [isModalOpenEditCollection, setIsModalOpenEditCollection] = useState(false);
    const [users, setUsers] = useState([]);
    const [access, setAccess] = useState([]);
    const [collectionInfo, setCollectionInfo] = useState(null);
    const [groups, setGroups] = useState([]);
    const [accessTypes, setAccessTypes] = useState([]);
    const [accessTypeId, setAccessTypeId] = useState('');
    const [accessId, setAccessId] = useState('');
    const [isAccessToAll, setIsAccessAll] = useState(collection.is_access_all);
    const [groupMode, setGroupMode] = useState(false);
    const lastId = useRef(-1);
    const [form] = Form.useForm();

    const getAccess = async () => {
        const response = await getAccessToCollection(collection.id, token);
        if (response.status === 200) {
            setAccess(response.data);
        }
    }

    async function getInfo() {
        const response = await getCollectionInfo(collection.id, token);
        if (response.status === 200) {
            setCollectionInfo(response.data);
        } else if (response.status === 404) {
            setCollectionInfo(null);
        }
    }

    if (lastId.current !== collection.id) {
        lastId.current = collection.id;
        getAccess();
        getInfo();
    }

    async function showModalAccess() {
        let response = await getOtherUsers(token);
        if (response.status === 200) {
            let usersOptions = [];
            const usersList = response.data;
            for (const user of usersList) {
                usersOptions.push({
                    label: user.username,
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
        const response = await removeCollection(collection.id, token);
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
            response = await giveAccessUserToCollection(collection.id, accessId, accessTypeId, token);
        } else {
            response = await giveAccessGroupToCollection(collection.id, accessId, accessTypeId, token);
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
            if (collection.type !== 'owner') {
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

    async function handleOkChangeInfo(data) {
        const response = await changeCollectionInfo(collection.id, data, token);
        if (response.status === 200) {
            message.success('Описание изменено!');
            setIsModalOpenEditCollection(false);
            await getInfo();
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    };

    async function handleAccessAll(e) {
        const response = await changeAccessToAll(collection.id, e.target.checked, token);
        if (response.status === 200) {
            if (e.target.checked) {
                setIsAccessAll(true);
                collection.is_access_all = true;
                message.success('Доступ дан!');
            } else {
                setIsAccessAll(false);
                collection.is_access_all = false;
                message.success('Доступ отозван!');
            }
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    }

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
                if (collection.access_type_id === 1 && value !== 1) {
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
            render: (_, record) => record.type_id !== 1 && (collection.access_type_id === 1 || record.target_type !== 'group') ?
                <Popconfirm title="Вы действительно хотите удалить доступ?" okText="Удалить" onConfirm={() => handleDeleteAccess(record.id)}>
                    <a>Удалить</a>
                </Popconfirm>
                : ''
        },
    ];

    let itemsInfo;
    if (collectionInfo !== null) {
        const tags = [];
        if (collectionInfo.tags) {
            for (const item of collectionInfo.tags) {
                tags.push(<Tag>{item}</Tag>);
            }
        }

        const types = [];
        if (collectionInfo.types) {
            for (const item of collectionInfo.types) {
                types.push(<Tag>{item.type}: {item.description}</Tag>);
            }
        }
        itemsInfo = [
            {
                key: 'collection-name',
                label: 'Тема',
                children: collectionInfo.title,
            },
            {
                key: 'collection-description',
                label: 'Описание',
                children: collectionInfo.description,
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
    }

    if (open) {
        // if (!isModalOpenEditCollection) {
        //     setTimeout(() => form.resetFields(), 2000);
        // }
        return (
            <>
                <Flex vertical gap="small" style={{ width: '100%' }}>
                    <Descriptions
                        bordered
                        size='small'
                        layout='vertical'
                        title={
                            <Space>
                                {collection.name}
                                {collection.access_type_id === 1 && <>
                                    <Tooltip title='Редактировать информацию'><Button onClick={() => setIsModalOpenEditCollection(true)} icon={<EditOutlined />} /></Tooltip>
                                    <Tooltip title="Удалить коллекцию"><Button color="danger" variant="outlined" icon={<DeleteOutlined />} onClick={() => setIsModalOpenRemove(true)} /></Tooltip>
                                </>}
                                {collection.type === 'access_to_all' &&
                                    <Popconfirm title="Вы действительно хотите скрыть коллекцию из общего списка?" onConfirm={() => {
                                        let ids = localStorage.getItem('freeCollectionIds');
                                        if (ids !== null) {
                                            ids = JSON.parse(ids);
                                            ids = ids.filter(element => element !== collection.id);
                                            localStorage.setItem('freeCollectionIds', JSON.stringify(ids));
                                        } else {
                                            localStorage.setItem('freeCollectionIds', '[]');
                                        }
                                        message.success('Коллекция успешно скрыта!');
                                        getCollections(token, true);
                                        setOpen(false);
                                    }}>
                                        <a>Скрыть коллекцию</a>
                                    </Popconfirm>
                                }
                            </Space>
                        }
                        items={[
                            { key: 'collection_id', label: 'id', children: collection.id },
                            { key: 'access_type', label: 'Тип доступа', children: ['Владелец', 'Чтение и запись', 'Только чтение', 'Только запись'][collection.access_type_id - 1] },
                            { key: 'access_count', label: 'Количество пользователей', children: access.length },
                        ]}
                    />
                    {
                        collectionInfo !== null &&
                        <Descriptions title='Информация' layout='vertical' items={itemsInfo} />
                    }
                    <Space>
                        {
                            collection.access_type_id === 1 && <>
                                <Button type='primary' onClick={showModalAccess}>Предоставить доступ к коллекции</Button>
                                <Checkbox checked={isAccessToAll} onChange={handleAccessAll}>Сделать коллекцию доступной для чтения для всех</Checkbox>
                            </>
                        }
                    </Space>
                    <Table rowKey="id" pagination={{ hideOnSinglePage: true }} columns={columns} dataSource={access} />
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
                <Modal
                    title="Редактирование описания"
                    open={isModalOpenEditCollection}
                    okText='Сохранить'
                    onOk={() => handleOkChangeInfo(form.getFieldsValue())}
                    onCancel={() => {
                        setIsModalOpenEditCollection(false);
                        form.resetFields();
                    }}
                    width={1000}
                >
                    <Form
                        form={form}
                        name="dynamic_form_complex"
                        autoComplete="off"
                        initialValues={collectionInfo === null ? { collection_id: collection.id, collection_name: collection.name } : collectionInfo}
                        onFieldsChange={(_, allFields) => {
                            // setFields(allFields);
                        }}
                    >
                        <Form.Item
                            name="collection_id"
                            label="ID Коллекции"
                            initialValue={collection.id}
                        >
                            <Input disabled />
                        </Form.Item>

                        <Form.Item
                            name="collection_name"
                            label="Название коллекции"
                            initialValue={collection.name}
                        >
                            <Input disabled />
                        </Form.Item>

                        <Form.Item
                            name="title"
                            label="Тема"
                            rules={[{ required: true }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="Описание коллекции"
                            rules={[{ required: true }]}
                        >
                            <Input.TextArea />
                        </Form.Item>

                        <Form.Item label="Ключевые слова для категоризации">
                            <Form.List name='tags'>
                                {(subFields, subOpt) => (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {subFields.map(subField => (
                                            <Flex key={subField.key} gap={6}>
                                                <Form.Item noStyle name={[subField.name]}>
                                                    <Input placeholder="Ключевое слово" />
                                                </Form.Item>
                                                <CloseOutlined
                                                    onClick={() => {
                                                        subOpt.remove(subField.name);
                                                    }}
                                                />
                                            </Flex>
                                        ))}
                                        <Button type="dashed" onClick={() => subOpt.add('')} block>Добавить</Button>
                                    </div>
                                )}
                            </Form.List>
                        </Form.Item>

                        <Form.Item label="Описание типов файлов">
                            <Form.List name='types'>
                                {(subFields, subOpt) => (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {subFields.map(subField => (
                                            <Space key={subField.key} align='start'>
                                                <Form.Item noStyle name={[subField.name, 'type']} initialValue={''}>
                                                    <Input style={{ width: '120px' }} placeholder="Тип файла" />
                                                </Form.Item>
                                                <Form.Item noStyle name={[subField.name, 'description']} initialValue={''}>
                                                    <Input.TextArea style={{ resize: 'both' }} placeholder="Описание" />
                                                </Form.Item>
                                                <CloseOutlined
                                                    onClick={() => {
                                                        subOpt.remove(subField.name);
                                                    }}
                                                />
                                            </Space>
                                        ))}
                                        <Button type="dashed" onClick={() => subOpt.add('')} block>Добавить</Button>
                                    </div>
                                )}
                            </Form.List>
                        </Form.Item>

                        <Form.Item noStyle shouldUpdate>
                            {() => (
                                <Typography>
                                    <pre>{JSON.stringify(form.getFieldsValue(), null, 4)}</pre>
                                </Typography>
                            )}
                        </Form.Item>
                    </Form>
                </Modal>
            </>
        );
    } else {
        return <Empty description={'Выберите коллекцию'} />;
    }
}

export default CollectionPage;
