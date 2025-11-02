import { useState, useRef } from 'react';
import { Button, Flex, Modal, Select, Table, message, Empty, Tag, Popconfirm, Space, Collapse, Descriptions, Input, Tooltip } from 'antd';
import { getOtherUsers, addUserToGroup, getGroupUsers, deleteUserToGroup, transferPowerToGroup, exitGroup, changeRoleInGroup, changeGroupInfo } from '../api/api';
import { EditOutlined, UserAddOutlined } from '@ant-design/icons';

function GroupPage({ index, groups, getCollections, updateGroups, token }) {
    const [users, setUsers] = useState([]);
    const [members, setMembers] = useState([]);
    const [userId, setUserId] = useState('');
    const [roleId, setRoleId] = useState('');
    const [newOwnerUserId, setNewOwnerUserId] = useState('');
    const [isModalOpenAddUser, setIsModalOpenAddUser] = useState(false);
    const [isModalOpenTransferPower, setIsModalOpenTransferPower] = useState(false);
    const lastGroupId = useRef(-1);
    const [isModalOpenEditGroup, setIsModalOpenEditGroup] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const getMembers = async () => {
        const response = await getGroupUsers(groups[index].id, token);
        if (response.status === 200) {
            setMembers(response.data);
        }
    }

    if (index !== -1 && groups.length > index && lastGroupId.current !== groups[index].id) {
        lastGroupId.current = groups[index].id;
        getMembers();
    }

    async function showModalAddUser() {
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
        setIsModalOpenAddUser(true);
    }

    async function showModalTranferPower() {
        let usersOptions = [];
        for (const user of members) {
            if (user.role_id !== 1) {
                usersOptions.push({
                    label: user.username,
                    value: user.id,
                });
            }
        }
        setUsers(usersOptions);
        setIsModalOpenTransferPower(true);
    }

    async function handleOkAddUser() {
        const response = await addUserToGroup(groups[index].id, userId, roleId, token);
        if (response.status === 200) {
            message.success('Пользователь успешно добавлен в группу!');
            setUserId('');
            setRoleId('');
            getMembers();
            setIsModalOpenAddUser(false);
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    }

    async function handleOkTransferPower() {
        const response = await transferPowerToGroup(groups[index].id, newOwnerUserId, token);
        if (response.status === 200) {
            message.success('Власть успешно передана!');
            setNewOwnerUserId('');
            updateGroups();
            getMembers();
            setIsModalOpenTransferPower(false);
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    }

    async function handleDeleteUser(userId, name) {
        const response = await deleteUserToGroup(groups[index].id, userId, token);
        if (response.status === 200) {
            message.success('Пользователь ' + name + ' успешно покинул группу!');
            await getCollections(token);
            getMembers();
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    }

    async function handleExitGroup() {
        const response = await exitGroup(groups[index].id, token);
        if (response.status === 200) {
            message.success('Вы успешно покинули группу!');
            await getCollections(token);
            updateGroups();
            getMembers();
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    }

    async function handleChangeRole(userId, roleId) {
        const response = await changeRoleInGroup(groups[index].id, userId, roleId, token);
        if (response.status === 200) {
            if (roleId === 2) {
                message.success('Участник успешно повышен до админа!');
            } else {
                message.success('Админ успешно понижен до участника!');
            }
            getMembers();
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    }

    async function handleOkEditGroup() {
        const response = await changeGroupInfo(groups[index].id, title, description, token);
        if (response.status === 200) {
            message.success('Данные успешно изменены!');
            setTitle('');
            setDescription('');
            updateGroups();
            setIsModalOpenEditGroup(false);
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    }

    function showModalEditGroup() {
        setTitle(groups[index].title);
        setDescription(groups[index].description);
        setIsModalOpenEditGroup(true);
    }

    const columns = [
        {
            title: 'ID пользователя',
            dataIndex: 'id',
        },
        {
            title: 'Имя пользователя',
            dataIndex: 'username',
        },
        {
            title: 'Роль',
            dataIndex: 'role_id',
            render: (value) => {
                let color;
                let name;
                switch (value) {
                    case 1:
                        color = 'cyan';
                        name = 'Владелец';
                        break;
                    case 2:
                        color = 'magenta';
                        name = 'Админ';
                        break;
                    case 3:
                        color = 'orange';
                        name = 'Участник';
                        break;
                }
                return (
                    <Tag color={color}>
                        {name}
                    </Tag>
                );
            }
        },
        {
            title: '',
            render: (_, record) => (groups[index].role_id < record.role_id) ?
                <Space size="large">
                    {record.role_id === 2 ?
                        <Popconfirm title="Вы действительно хотите понизить админа до участника?" okText="Понизить" onConfirm={() => handleChangeRole(record.id, 3)}>
                            <a>Понизить</a>
                        </Popconfirm> :
                        groups[index].role_id == 1 && <Popconfirm title="Вы действительно хотите повысить участника до админа?" okText="Повысить" onConfirm={() => handleChangeRole(record.id, 2)}>
                            <a>Повысить</a>
                        </Popconfirm>
                    }
                    <Popconfirm title="Вы действительно хотите выгнать?" okText="Выгнать" onConfirm={() => handleDeleteUser(record.id, record.username)}>
                        <a>Выгнать</a>
                    </Popconfirm>
                </Space>
                : ''
        },
    ];

    if (index !== -1 && index < groups.length) {
        const group = groups[index]
        return (
            <>
                <Flex vertical gap="small" style={{ width: '100%' }}>
                    <Descriptions bordered size='small' layout='vertical' title={
                        <Space>
                            {group.title}
                            {group.role_id < 3 &&
                                <>
                                    <Tooltip title='Редактировать название и описание группы'><Button onClick={showModalEditGroup} icon={<EditOutlined />} /></Tooltip>
                                    <Tooltip title='Добавить пользователя в группу'><Button type='primary' onClick={showModalAddUser} icon={<UserAddOutlined />} /></Tooltip>
                                </>}
                            {
                                group.role_id == 1 && members.length > 1 ?
                                    <Button onClick={showModalTranferPower}>Передать власть</Button> :
                                    <Popconfirm title="Вы действительно хотите выйти из группы?" okText="Выйти" onConfirm={handleExitGroup}>
                                        <Button color="danger" variant="outlined">Выйти из группы</Button>
                                    </Popconfirm>

                            }
                        </Space>
                    } items={[{ key: 'group_id', label: 'id', children: group.id }, { key: 'group_count', label: 'Количество участников', children: members.length }]}></Descriptions>
                    <Collapse size="small" items={[{ key: 'group_description', label: 'Описание', children: group.description }]} />
                    {<Table rowKey="id" columns={columns} dataSource={members} pagination={{ hideOnSinglePage: true }} />}
                </Flex>
                <Modal
                    title={"Добавление пользователя в группу " + group.title}
                    open={isModalOpenAddUser}
                    onOk={handleOkAddUser}
                    onCancel={
                        () => {
                            setUserId('');
                            setRoleId('');
                            setIsModalOpenAddUser(false);
                        }
                    }
                    okButtonProps={{ disabled: userId === '' || roleId === '' }}
                >
                    <p>Пользователь</p>
                    <Select
                        showSearch
                        value={userId}
                        style={{ width: '100%' }}
                        placeholder="Выберите кого добавить"
                        optionFilterProp="label"
                        onChange={(value) => setUserId(value)}
                        // onSearch={onSearch}
                        options={users}
                    />
                    <p>Роль</p>
                    <Select
                        value={roleId}
                        style={{ width: '100%' }}
                        placeholder="Выберите роль"
                        onChange={(value) => setRoleId(value)}
                        // onSearch={onSearch}
                        options={[{ label: 'Админ', value: 2 }, { label: 'Участник', value: 3 }]}
                    />
                </Modal>
                <Modal
                    title={"Передать власть над группой " + group.title}
                    open={isModalOpenTransferPower}
                    onOk={handleOkTransferPower}
                    onCancel={
                        () => {
                            setNewOwnerUserId('');
                            setIsModalOpenTransferPower(false);
                        }
                    }
                    okButtonProps={{ disabled: newOwnerUserId === '' }}
                >
                    <p>Кому</p>
                    <Select
                        showSearch
                        value={newOwnerUserId}
                        style={{ width: '100%' }}
                        placeholder="Выберите кому передать"
                        optionFilterProp="label"
                        onChange={(value) => setNewOwnerUserId(value)}
                        // onSearch={onSearch}
                        options={users}
                    />
                </Modal>
                <Modal
                    title="Редактирование"
                    open={isModalOpenEditGroup}
                    onOk={handleOkEditGroup}
                    onCancel={() => setIsModalOpenEditGroup(false)}
                >
                    <p>Название группы</p>
                    <Input value={title} placeholder="Название" count={{ show: true, max: 255 }} onChange={(e) => setTitle(e.target.value)} />
                    <p>Описание группы</p>
                    <Input.TextArea value={description} placeholder="Описание" onChange={(e) => setDescription(e.target.value)} />
                </Modal>
            </>
        );
    } else {
        return <Empty description='Выберите группу' />;
    }
}

export default GroupPage;
