import { useState, useRef, useEffect } from 'react';
import './ControlPanel.css';
import CollectionPage from './CollectionPage';
import GroupPage from './GroupPage';
import ProfilePage from './ProfilePage';
import { Tabs, Layout, Menu, Modal, Input, Button, Dropdown, Avatar, message, Descriptions } from 'antd';
import { FolderAddOutlined, UsergroupAddOutlined, LeftOutlined, GroupOutlined, TeamOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { createCollection, getGroups, createGroup } from '../api/api';

const ControlPanel = ({ page, username, outAccount, showCtrlPanel, collections, token, getCollections }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalOpenCreateGroup, setIsModalOpenCreateGroup] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [groups, setGroups] = useState([]);
    const newGroupTitle = useRef('');
    const newGroupDescription = useRef('');
    const [currentCollection, setCurrentCollection] = useState(-1);
    const [currentGroup, setCurrentGroup] = useState(-1);
    const [typeCreate, setTypeCreate] = useState(page);

    const updateGroups = async () => {
        const response = await getGroups(token);
        if (response.status === 200) {
            setGroups(response.data);
        }
    }

    useEffect(() => {
        updateGroups();
    }, []);

    const handleOk = async () => {
        let response = await createCollection(newCollectionName, token);
        if (response.status === 200) {
            messageApi.success('Коллекция успешно создана!');
            await getCollections(token);
            setNewCollectionName('');
            setIsModalOpen(false);
        } else if (response.status === 406) {
            messageApi.error('Имя может содержать только латинские буквы и цифры!');
        } else {
            messageApi.error('Произошла ошибка! ' + response);
        }
    };

    const handleOkCreateGroup = async () => {
        let response = await createGroup(newGroupTitle.current, newGroupDescription.current, token);
        if (response.status === 200) {
            messageApi.success('Группа успешно создана!');
            newGroupTitle.current = '';
            newGroupDescription.current = '';
            setIsModalOpenCreateGroup(false);
        } else {
            messageApi.error('Произошла ошибка! ' + response);
        }

        response = await getGroups(token);
        if (response.status === 200) {
            setGroups(response.data);
        } else {
            messageApi.error('Произошла ошибка! ' + response);
        }
    };

    function onChangeNewNameCollection(e) {
        setNewCollectionName(e.target.value);
    }

    function onChangeNewGroupTitle(e) {
        newGroupTitle.current = e.target.value;
    }

    function onChangeNewGroupDescription(e) {
        newGroupTitle.current = e.target.value;
    }

    function openCollection(e) {
        setCurrentCollection(e.key);
    }

    function openGroup(e) {
        setCurrentGroup(e.key);
    }

    function getCollectionItems() {
        const personItems = [];
        const accessItems = [];
        const groupItems = [];

        for (let i = 0; i < collections.length; i++) {
            const item = {
                key: i,
                label: collections[i].name || collection[i].id,
            };

            switch (collections[i].type) {
                case 'person': personItems.push(item); break;
                case 'access': accessItems.push(item); break;
                case 'group': groupItems.push(item); break;
            }
        }

        const result = [];
        if (personItems.length > 0) {
            result.push({ key: 'person', label: 'Персональные', children: personItems });
        }
        if (accessItems.length > 0) {
            result.push({ key: 'access', label: 'Получен доступ', children: accessItems });
        }
        if (groupItems.length > 0) {
            result.push({ key: 'group', label: 'Групповые', children: groupItems });
        }

        return result;
    }

    const getGroupItems = () => {
        const ownerItems = [];
        const adminItems = [];
        const memberItems = [];

        for (let i = 0; i < groups.length; i++) {
            const item = {
                key: i,
                label: groups[i].title || groups[i].id,
            };

            switch (groups[i].role_id) {
                case 1: ownerItems.push(item); break;
                case 2: adminItems.push(item); break;
                case 3: memberItems.push(item); break;
            }
        };

        const result = [];
        if (ownerItems.length > 0) {
            result.push({ key: 'owner', label: 'Вы владелец', children: ownerItems });
        }
        if (adminItems.length > 0) {
            result.push({ key: 'admin', label: 'Вы администратор', children: adminItems });
        }
        if (memberItems.length > 0) {
            result.push({ key: 'member', label: 'Вы участник', children: memberItems });
        }

        return result;
    };

    const tabItems = [
        {
            key: '1',
            label: 'Профиль',
            icon: <UserOutlined />,
            children:
                <Layout.Content style={{ padding: '10px 10px 0', overflow: 'auto', height: 'calc(100vh - 180px)' }}>
                    <ProfilePage token={token} />
                </Layout.Content>,
        },
        {
            key: '2',
            label: 'Коллекции',
            icon: <GroupOutlined />,
            children: (
                <Layout>
                    <Layout.Sider>
                        <Menu
                            style={{ overflow: 'auto', height: 'calc(100vh - 170px)' }}
                            defaultOpenKeys={['person', 'access', 'group']}
                            mode="inline"
                            items={getCollectionItems()}
                            onSelect={openCollection}
                        />
                    </Layout.Sider>
                    <Layout.Content style={{ padding: '10px 10px 0', overflow: 'auto', height: 'calc(100vh - 180px)' }}>
                        <CollectionPage index={currentCollection} collections={collections} getCollections={getCollections} token={token} />
                    </Layout.Content>
                </Layout>
            ),
        },
        {
            key: '3',
            label: 'Группы',
            icon: <TeamOutlined />,
            children:
                <Layout>
                    <Layout.Sider>
                        <Menu
                            style={{ overflow: 'auto', height: 'calc(100vh - 170px)' }}
                            defaultOpenKeys={['owner', 'admin', 'member']}
                            mode="inline"
                            items={getGroupItems()}
                            onSelect={openGroup}
                        />
                    </Layout.Sider>
                    <Layout.Content style={{ padding: '10px 10px 0', overflow: 'auto', height: 'calc(100vh - 180px)' }}>
                        <GroupPage index={currentGroup} groups={groups} getCollections={getCollections} updateGroups={updateGroups} token={token} />
                    </Layout.Content>
                </Layout>,
        },
    ];

    function getCreateButton() {
        switch (typeCreate) {
            case '2':
                return <Button type="primary" icon={<FolderAddOutlined />} onClick={() => setIsModalOpen(true)}>Создать новую коллекцию</Button>;
            case '3':
                return <Button type="primary" icon={<UsergroupAddOutlined />} onClick={() => setIsModalOpenCreateGroup(true)}>Создать новую группу</Button>;
        }
    }

    const items = [
        {
            key: '1',
            label: 'Назад',
            icon: <LeftOutlined />,
        },
        {
            type: 'divider',
        },
        {
            key: '2',
            label: 'Выход',
            icon: <LogoutOutlined />,
        },
    ];

    function onClickLogin(e) {
        switch (e.key) {
            case '1':
                showCtrlPanel();
                break;
            case '2':
                outAccount();
                break;
        }
    }

    return (
        <div className="control-panel">
            <div className="header">
                <div className='header-right'>
                    <img height='50px' width='50px' src={'./favicon.svg'} />
                    <h1>S3 File Manager</h1>
                </div>
                <div className="header-left">
                    <Button icon={<LeftOutlined />} onClick={showCtrlPanel} />
                    <Dropdown menu={{ items, onClick: onClickLogin }}>
                        <Button type="text" shape="circle">
                            <Avatar size={40} style={{ backgroundColor: 'SteelBlue' }}>{username}</Avatar>
                        </Button>
                    </Dropdown>
                </div>
            </div>
            <div className="control-panel-main">
                <Tabs onChange={(key) => setTypeCreate(key)} defaultActiveKey={page} items={tabItems} tabBarExtraContent={getCreateButton()} />
                <Modal
                    title="Создание коллекции"
                    open={isModalOpen}
                    onOk={handleOk}
                    onCancel={() => setIsModalOpen(false)}
                    okButtonProps={{ disabled: newCollectionName.length < 3 }}
                >
                    <p>Имя коллекции</p>
                    <Input placeholder="Имя" value={newCollectionName} count={{ show: true, max: 63 }} onChange={onChangeNewNameCollection} />
                </Modal>
                <Modal
                    title="Создание группы"
                    open={isModalOpenCreateGroup}
                    onOk={handleOkCreateGroup}
                    onCancel={() => setIsModalOpenCreateGroup(false)}
                >
                    <p>Название группы</p>
                    <Input placeholder="Название" count={{ show: true, max: 255 }} onChange={onChangeNewGroupTitle} />
                    <p>Описание группы</p>
                    <Input.TextArea placeholder="Описание" onChange={onChangeNewGroupDescription} />
                </Modal>
            </div>
            {contextHolder}
        </div>
    );
}

export default ControlPanel;
