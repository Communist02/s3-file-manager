import { useState, useRef } from 'react';
import { Button, Flex, Modal, Select, Table, message, Empty, Tag } from 'antd';
import { getOtherUsers, addUserToGroup, getGroupUsers } from '../api/api';

function GroupPage({ index, groups, getCollections, token }) {
    const [messageApi, contextHolder] = message.useMessage();
    const [users, setUsers] = useState([]);
    const [members, setMembers] = useState([]);
    const [userId, setUserId] = useState('');
    const [roleId, setRoleId] = useState('');
    const [isModalOpenAddUser, setIsModalOpenAddUser] = useState(false);
    const lastUpdateIndex = useRef(-1);

    const getMembers = async () => {
        const response = await getGroupUsers(groups[index].id, token);
        if (response.status === 200) {
            setMembers(response.data);
        }
    }

    if (index !== -1 & lastUpdateIndex.current !== index) {
        lastUpdateIndex.current = index;
        getMembers();
    }

    async function showModalAddUser() {
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
        setIsModalOpenAddUser(true);
    }

    async function handleOkAddUser() {
        const response = await addUserToGroup(groups[index].id, userId, roleId, token);
        if (response.status === 200) {
            messageApi.success('Пользователь успешно добавлен в группу!');
            setUserId('');
            setRoleId('');
            await getCollections(token);
            getMembers();
            setIsModalOpenAddUser(false);
        } else {
            messageApi.error('Произошла ошибка! ' + response);
        }
    }

    const columns = [
        {
            title: 'ID пользователя',
            dataIndex: 'id',
        },
        {
            title: 'Имя пользователя',
            dataIndex: 'login',
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
    ];

    if (index !== -1 && index < groups.length) {
        const group = groups[index]
        return (
            <>
                <Flex vertical gap="small" style={{ width: '100%' }}>
                    {contextHolder}
                    {/* <Button color="danger" variant="outlined" onClick={showModalRemove}>Выйти из группы {group.title}</Button> */}
                    <Button type='primary' onClick={showModalAddUser}>Добавить пользователя в группу</Button>
                    {<Table rowKey="id" columns={columns} dataSource={members} />}
                </Flex>
                {/* <Modal
                    title="Удаление коллекции"
                    open={isModalOpenRemove}
                    okType='danger'
                    okText='Выйти'
                    onOk={handleOkRemove}
                    onCancel={handleCancelRemove}
                >
                    <p>Вы действительно хотите выйти из {group.title} ?</p>
                </Modal> */}
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
                    okButtonProps={{ disabled: userId === '' }}
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
            </>
        );
    } else {
        return <Empty description='Выберите группу' />;
    }
}

export default GroupPage;
