import { useState, useRef } from 'react';
import { Button, Flex, Modal, Select, Segmented, Table, Popconfirm, Empty, Tag, Descriptions, Dropdown, Space, Tooltip, Form, Input, Checkbox, Spin, App } from 'antd';
import { DeleteOutlined, DownOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';
import type { Collection } from '../App'
import { apiClient } from '../api';

interface CollectionPageProps {
    open: boolean;
    setOpen: (value: boolean) => void;
    getCollections: (value?: boolean) => Promise<Collection[]>;
    collection: Collection;
}

interface CollectionInfo {
    title: string;
    description: string;
    types: Array<any>;
    tags: Array<string>;
}

interface Option {
    label: string;
    value: number;
}

interface Access {
    id: number;
    target_id: number;
    target_type: string;
    type_id: number;
    type_name: string;
}

function CollectionPage({ collection, getCollections, open, setOpen }: CollectionPageProps) {
    const [isModalOpenRemove, setIsModalOpenRemove] = useState(false);
    const [isModalOpenAccess, setIsModalOpenAccess] = useState(false);
    const [isModalOpenEditCollection, setIsModalOpenEditCollection] = useState(false);
    const [users, setUsers] = useState<Option[]>([]);
    const [access, setAccess] = useState<Access[]>([]);
    const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null);
    const [groups, setGroups] = useState<Option[]>([]);
    const [accessTypes, setAccessTypes] = useState<Option[]>([]);
    const [accessTypeId, setAccessTypeId] = useState<number | null>(null);
    const [accessId, setAccessId] = useState<number | null>(null);
    const [isAccessToAll, setIsAccessAll] = useState(collection.is_access_all);
    const [groupMode, setGroupMode] = useState(false);
    const lastId = useRef(-1);
    const [form] = Form.useForm();
    const [isRemovingCollection, setIsRemovingCollection] = useState(false);
    const [isUpdatingGiveAccess, setIsUpdatingGiveAccess] = useState(false);
    const [isUpdatingAccess, setIsUpdatingAccess] = useState(false);
    const { message } = App.useApp();

    const getAccess = async () => {
        const response = await apiClient.getAccessToCollection(collection.id);
        if (response.status === 200) {
            setAccess(response.data);
        }
    }

    async function getInfo() {
        const response = await apiClient.getCollectionInfo(collection.id);
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
        setIsUpdatingAccess(true)
        let response = await apiClient.getOtherUsers();
        if (response.status === 200) {
            const usersList: any[] = response.data;

            const usersIds: Set<string> = new Set(access.map(access => access.target_type + access.target_id));
            const usersOptions = usersList
                .filter(user => !usersIds.has('user' + user.id))
                .map(user => ({
                    label: user.username,
                    value: user.id,
                }));
            setUsers(usersOptions);
        }
        response = await apiClient.getGroups();
        if (response.status === 200) {
            const groupsList: any[] = response.data;

            const groupsIds: Set<string> = new Set(access.map(access => access.target_type + access.target_id));
            const groupsOptions = groupsList
                .filter(group => !groupsIds.has('group' + group.id))
                .map(group => ({
                    label: group.title,
                    value: group.id,
                }));
            setGroups(groupsOptions);
        }
        response = await apiClient.getAccessTypes();
        if (response.status === 200) {
            let accessTypesOptions = [];
            const accessTypesList = response.data;
            let label = '';
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
        setIsUpdatingAccess(false);
        setIsModalOpenAccess(true);
    }

    const handleOkRemove = async () => {
        setIsRemovingCollection(true);
        const response = await apiClient.removeCollection(collection.id);
        if (response.status === 200) {
            message.success('Коллекция успешно удалена');
            await getCollections(true);
            setIsModalOpenRemove(false);
            setOpen(false);
        } else if (response.status === 406) {
            message.error('Коллекция не является пустой, удалите все файлы!');
        } else {
            message.error('Произошла ошибка! ' + response);
        }
        setIsRemovingCollection(false);
    };

    const handleOkAccess = async () => {
        setIsUpdatingGiveAccess(true);
        let response;
        if (!groupMode) {
            response = await apiClient.giveAccessUserToCollection(collection.id, accessId!, accessTypeId!);
        } else {
            response = await apiClient.giveAccessGroupToCollection(collection.id, accessId!, accessTypeId!);
        }
        if (response.status === 200) {
            message.success('Доступ успешно предоставлен');
            await getAccess();
            setAccessId(null);
            setAccessTypeId(null);
            setGroupMode(false);
            setIsModalOpenAccess(false);
        } else {
            message.error('Произошла ошибка! ' + response);
        }
        setIsUpdatingGiveAccess(false);
    };

    async function handleDeleteAccess(access_id: number) {
        const response = await apiClient.deleteAccess(access_id);
        if (response.status === 200) {
            message.success('Доступ успешно удален');
            if (collection.type !== 'owner') {
                await getCollections(true);
            }
            await getAccess();
        } else {
            message.error('Произошла ошибка! ' + response);
            console.log(response.toString())
        }
    };

    async function handleChangeAccess(access_id: number, accessTypeId: number) {
        setIsUpdatingAccess(true);
        const response = await apiClient.changeAccessType(access_id, accessTypeId);
        if (response.status === 200) {
            message.success('Доступ успешно изменен');
            await getAccess();
        } else {
            message.error('Произошла ошибка! ' + response);
        }
        setIsUpdatingAccess(false);
    };

    async function handleOkChangeInfo(data: {}) {
        const response = await apiClient.changeCollectionInfo(collection.id, data);
        if (response.status === 200) {
            message.success('Описание изменено');
            setIsModalOpenEditCollection(false);
            await getInfo();
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    };

    async function handleAccessAll(e: any) {
        setIsUpdatingAccess(true);
        const response = await apiClient.changeAccessToAll(collection.id, e.target.checked);
        setIsUpdatingAccess(false);
        if (response.status === 200) {
            if (e.target.checked) {
                setIsAccessAll(true);
                collection.is_access_all = true;
                message.success('Доступ дан всем');
            } else {
                setIsAccessAll(false);
                collection.is_access_all = false;
                message.success('Доступ отозван у всех');
            }
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    }

    const columns = [
        {
            title: 'Тип получателя',
            dataIndex: 'target_type',
            render: (value: string) =>
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
            render: (value: number, record: any) => {
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
                    return <Dropdown menu={{ items, onClick: (e) => handleChangeAccess(record.id, Number(e.key)) }} trigger={['click']}>
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
            render: (_: any, record: any) => record.type_id !== 1 && (collection.access_type_id === 1 || record.target_type !== 'group') ?
                <Popconfirm title="Вы действительно хотите удалить доступ?" okText="Удалить" onConfirm={() => handleDeleteAccess(record.id)}>
                    <a>Удалить</a>
                </Popconfirm>
                : ''
        },
    ];

    let itemsInfo: Record<string, any>[] = [];
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
        ];
        if (tags.length !== 0) {
            itemsInfo.push({
                key: 'collection-tags',
                label: 'Ключевые слова',
                children: <Space size={5}>{tags}</Space>,
            });
        }
        if (types.length !== 0) {
            itemsInfo.push({
                key: 'collection-types',
                label: 'Описание файлов',
                children: <Space size={5}>{types}</Space>,
            });
        }
    }

    if (open) {
        // if (!isModalOpenEditCollection) {
        //     setTimeout(() => form.resetFields(), 2000);
        // }
        return (
            <>
                {isUpdatingAccess && <Spin size='large' fullscreen />}
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
                                        const ids_str = localStorage.getItem('freeCollectionIds');
                                        if (ids_str !== null) {
                                            let ids: Array<any> = JSON.parse(ids_str);
                                            ids = ids.filter(element => element !== collection.id);
                                            localStorage.setItem('freeCollectionIds', JSON.stringify(ids));
                                        } else {
                                            localStorage.setItem('freeCollectionIds', '[]');
                                        }
                                        message.success('Коллекция скрыта');
                                        getCollections(true);
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
                        <Descriptions size='small' style={{ marginBottom: 10 }} title='Информация' layout='vertical' items={itemsInfo} />
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
                    okButtonProps={{ loading: isRemovingCollection }}
                    onCancel={() => setIsModalOpenRemove(false)}
                >
                    <p>Вы действительно хотите удалить {collection.name} ?</p>
                    <p>Для удаления требуется, чтобы коллекция была пустой!</p>
                </Modal>
                <Modal
                    confirmLoading={isUpdatingGiveAccess}
                    title={"Предоставление доступа для коллекции " + collection.name}
                    open={isModalOpenAccess}
                    onOk={handleOkAccess}
                    onCancel={
                        () => {
                            setAccessId(null);
                            setAccessTypeId(null);
                            setGroupMode(false);
                            setIsModalOpenAccess(false);
                        }
                    }
                    okButtonProps={{ disabled: accessId === null || accessTypeId === null }}
                >
                    <Segmented
                        value={groupMode ? 'Для группы' : 'Для пользователя'}
                        options={['Для пользователя', 'Для группы']}
                        onChange={value => {
                            setAccessId(null);
                            setAccessTypeId(null);
                            setGroupMode(value === 'Для группы');
                        }}
                    />
                    {groupMode ? <p>Группа</p> : <p>Пользователь</p>}
                    <Select
                        showSearch={{ optionFilterProp: 'label' }}
                        value={accessId}
                        style={{ width: '100%' }}
                        placeholder="Выберите кому предоставить доступ"
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
                    centered
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

                        {/* <Form.Item noStyle shouldUpdate>
                            {() => (
                                <Typography>
                                    <pre>{JSON.stringify(form.getFieldsValue(), null, 4)}</pre>
                                </Typography>
                            )}
                        </Form.Item> */}
                    </Form>
                </Modal>
            </>
        );
    } else {
        return <Empty description={'Выберите коллекцию'} />;
    }
}

export default CollectionPage;
