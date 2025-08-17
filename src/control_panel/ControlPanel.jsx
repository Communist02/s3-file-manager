import { useState, useRef, useEffect } from 'react';
import './ControlPanel.css';
import CollectionPage from './CollectionPage';
import GroupPage from './GroupPage';
import { Tabs, Layout, Menu, FloatButton, Modal, Input, Button } from 'antd';
import { FolderAddOutlined, UsergroupAddOutlined, LeftOutlined, GroupOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { createCollection, getGroups, createGroup } from '../api/api';

const ControlPanel = ({ outAccount, showCtrlPanel, collections, token, getCollections }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalOpenCreateGroup, setIsModalOpenCreateGroup] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [groups, setGroups] = useState([]);
    const newGroupTitle = useRef('');
    const newGroupDescription = useRef('');
    const [currentCollection, setCurrentCollection] = useState(-1);
    const [currentGroup, setCurrentGroup] = useState(-1);
    const [typeCreate, setTypeCreate] = useState('1');

    useEffect(() => {
        const get = async () => {
            const response = await getGroups(token);
            if (response.status === 200) {
                setGroups(response.data);
            }
        }
        get();
    }, []);

    const handleOk = async () => {
        await createCollection(newCollectionName, token);
        await getCollections(token);
        setNewCollectionName('');
        setIsModalOpen(false);
    };

    const handleOkCreateGroup = async () => {
        await createGroup(newGroupTitle.current, newGroupDescription.current, token);
        const response = await getGroups(token);
        if (response.status === 200) {
            setGroups(response.data);
        }
        newGroupTitle.current = '';
        newGroupDescription.current = '';
        setIsModalOpenCreateGroup(false);
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
        const adminItems = [];

        for (let i = 0; i < groups.length; i++) {
            const item = {
                key: i,
                label: groups[i].title || groups[i].id
            };

            switch ('admin') {
                case 'admin': adminItems.push(item); break;
            }
        };

        return [
            {
                key: 'admin',
                label: 'Вы администратор',
                children: adminItems,
            }
        ];
    };

    const tabItems = [
        {
            key: '1',
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
            key: '2',
            label: 'Группы',
            icon: <TeamOutlined />,
            children:
                <Layout>
                    <Layout.Sider>
                        <Menu
                            style={{ overflow: 'auto', height: 'calc(100vh - 170px)' }}
                            defaultOpenKeys={['admin']}
                            mode="inline"
                            items={getGroupItems()}
                            onSelect={openGroup}
                        />
                    </Layout.Sider>
                    <Layout.Content style={{ padding: '10px 10px 0', overflow: 'auto', height: 'calc(100vh - 180px)' }}>
                        <GroupPage index={currentGroup} groups={groups} getCollections={getCollections} token={token} />
                    </Layout.Content>
                </Layout>,
        },
        {
            key: '3',
            label: 'Профиль',
            icon: <UserOutlined />,
            children:
                <Layout>

                </Layout>,
        },
    ];

    function getCreateButton(){ 
        switch (typeCreate) {
            case '1':
                return <Button type="primary" icon={<FolderAddOutlined />} onClick={() => setIsModalOpen(true)}>Создать новую коллекцию</Button>;
            case '2':
                return <Button type="primary" icon={<UsergroupAddOutlined />} onClick={() => setIsModalOpenCreateGroup(true)}>Создать новую группу</Button>;
        }
    }

    return (
        <div className="control-panel">
            <div className="header">
                <h1>Панель управления</h1>
                <div className="header-left">
                    <Button icon={<LeftOutlined />} onClick={showCtrlPanel} />
                </div>
            </div>
            <div className="control-panel-main">
                <Tabs onChange={(key) => setTypeCreate(key)} defaultActiveKey="1" items={tabItems} tabBarExtraContent={getCreateButton()} />
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
        </div>
    );
}

export default ControlPanel;
