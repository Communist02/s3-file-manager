import { useState, useEffect } from 'react';
import './ControlPanel.css';
import CollectionPage from './CollectionPage';
import GroupPage from './GroupPage';
import ProfilePage from './ProfilePage';
import { Tabs, Layout, Menu, Modal, Input, Button, message } from 'antd';
import { FolderAddOutlined, UsergroupAddOutlined, GroupOutlined, TeamOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { createCollection, getGroups, createGroup } from '../api/api';

const ControlPanel = ({ page, username, outAccount, showCtrlPanel, collections, token, getCollections }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalOpenCreateGroup, setIsModalOpenCreateGroup] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [groups, setGroups] = useState([]);
    const [newGroupTitle, setNewGroupTitle] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [currentCollection, setCurrentCollection] = useState(-1);
    const [currentGroup, setCurrentGroup] = useState(-1);

    const updateGroups = async () => {
        const response = await getGroups(token);
        if (response.status === 200) {
            setGroups(response.data);
            if (currentGroup === -1 && response.data.length > 0) {
                setCurrentGroup(0);
            }
        }
    }

    useEffect(() => {
        if (currentCollection === -1 && collections.length > 0) {
            setCurrentCollection(0);
        }
        updateGroups();
    }, []);

    const handleOkCreateGroup = async () => {
        let response = await createGroup(newGroupTitle.current, newGroupDescription.current, token);
        if (response.status === 200) {
            messageApi.success('Группа успешно создана!');
            setNewGroupTitle('');
            setNewGroupDescription('');
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
                            onSelect={(e) => setCurrentCollection(e.key)}
                            selectedKeys={[currentCollection.toString()]}
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
                            onSelect={(e) => setCurrentGroup(e.key)}
                            selectedKeys={[currentGroup.toString()]}
                        />
                    </Layout.Sider>
                    <Layout.Content style={{ padding: '10px 10px 0', overflow: 'auto', height: 'calc(100vh - 180px)' }}>
                        <GroupPage index={currentGroup} groups={groups} getCollections={getCollections} updateGroups={updateGroups} token={token} />
                    </Layout.Content>
                </Layout>,
        },
    ];

    function getCreateButton() {
        switch (page.toString()) {
            case '2':
                return <Button type="primary" style={{ marginLeft: 5 }} icon={<FolderAddOutlined />} onClick={() => setIsModalOpen(true)}>Создать новую коллекцию</Button>;
            case '3':
                return <Button type="primary" style={{ marginLeft: 5 }} icon={<UsergroupAddOutlined />} onClick={() => setIsModalOpenCreateGroup(true)}>Создать новую группу</Button>;
        }
    }

    return (
        <div className="control-panel">
            <div className="control-panel-main">
                <Tabs activeKey={page.toString()} items={tabItems} tabBarExtraContent={{ left: getCreateButton() }} />
                <Modal
                    title="Создание группы"
                    open={isModalOpenCreateGroup}
                    onOk={handleOkCreateGroup}
                    onCancel={
                        () => {
                            setIsModalOpenCreateGroup(false);
                            setNewGroupTitle('');
                            setNewGroupDescription('');
                        }
                    }
                >
                    <p>Название группы</p>
                    <Input value={newGroupTitle} placeholder="Название" count={{ show: true, max: 255 }} onChange={(e) => setNewGroupTitle(e.target.value)} />
                    <p>Описание группы</p>
                    <Input.TextArea value={newGroupDescription} placeholder="Описание" onChange={(e) => setNewGroupDescription(e.target.value)} />
                </Modal>
            </div>
            {contextHolder}
        </div>
    );
}

export default ControlPanel;
