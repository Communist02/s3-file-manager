import { useState, useRef, useEffect } from 'react';
import './ControlPanel.css';
import CollectionPage from './CollectionPage';
import { Tabs, Layout, Menu, FloatButton, Modal, Input } from 'antd';
import { FolderAddOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { createCollection, getGroups, createGroup } from '../api/api';

const ControlPanel = ({ outAccount, showCtrlPanel, collections, token, getCollections }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalOpenCreateGroup, setIsModalOpenCreateGroup] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [groups, setGroups] = useState([]);
    const newGroupTitle = useRef('');
    const newGroupDescription = useRef('');
    const [currentCollection, setCurrentCollection] = useState(-1);

    useEffect(() => {
        const get = async () => {
            const response = await getGroups(token);
            if (response.status === 200) {
                setGroups(response.data);
            }
        }
        get();
    }, []);

    const showModal = () => setIsModalOpen(true);
    const showModalCreateGroup = () => setIsModalOpenCreateGroup(true);
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
    const handleCancel = () => setIsModalOpen(false);
    const handleCancelCreateGroup = () => setIsModalOpenCreateGroup(false);

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

    const getCollectionItems = () => {
        const person_items = [];
        const access_items = [];
        const group_items = [];

        for (let i = 0; i < collections.length; i++) {
            const item = {
                key: i,
                label: collections[i].name || collection[i].id
            };

            switch (collections[i].type) {
                case 'person': person_items.push(item); break;
                case 'access': access_items.push(item); break;
                case 'group': group_items.push(item); break;
            }
        }

        return [
            {
                key: 'person',
                label: 'Персональные',
                children: person_items,
            },
            {
                key: 'access',
                label: 'Получен доступ',
                children: access_items,
            },
            {
                key: 'group',
                label: 'Групповые',
                children: group_items,
            },
        ];
    };

    const getGroupItems = () => {
        const adminItems = [];

        groups.forEach(group => {
            const item = {
                key: group.id,
                label: group.title || group.id
            };

            switch ('admin') {
                case 'admin': adminItems.push(item); break;
            }
        });

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
            children: (
                <Layout>
                    <Layout.Sider>
                        <Menu style={{ overflow: 'auto', height: 'calc(100vh - 170px)' }}
                            defaultOpenKeys={['person']}
                            mode="inline"
                            items={getCollectionItems()}
                            onSelect={openCollection}
                        />
                    </Layout.Sider>
                    <FloatButton
                        type="primary"
                        icon={<FolderAddOutlined />}
                        onClick={showModal}
                        style={{ insetInlineEnd: 50, width: 150, height: 60 }}
                        description='Создать новую коллекцию'
                        shape='square'
                    />
                    <Layout.Content style={{ padding: '10px 10px 0', overflow: 'auto', height: 'calc(100vh - 180px)' }}>
                        <CollectionPage index={currentCollection} collections={collections} getCollections={getCollections} token={token}></CollectionPage>
                    </Layout.Content>
                </Layout>
            ),
        },
        {
            key: '2',
            label: 'Группы',
            children:
                <Layout>
                    <Layout.Sider>
                        <Menu
                            defaultOpenKeys={['admin']}
                            mode="inline"
                            items={getGroupItems()}
                        />
                    </Layout.Sider>
                    <FloatButton
                        type="primary"
                        icon={<UsergroupAddOutlined />}
                        onClick={showModalCreateGroup}
                        style={{ insetInlineEnd: 50, width: 150, height: 60 }}
                        description='Создать новую группу'
                        shape='square'
                    />
                </Layout>,
        },
        {
            key: '3',
            label: 'Аккаунт',
            children: 'Content of Tab Pane 3',
        },
    ];

    return (
        <div className="control-panel">
            <div className="header">
                <h1>Панель управления</h1>
                <div className="header-left">
                    <button onClick={outAccount}>Выход</button>
                    <button onClick={showCtrlPanel}>Закрыть панель управления</button>
                </div>
            </div>
            <div className="control-panel-main">
                <Tabs defaultActiveKey="1" items={tabItems} style={{ margin: 0 }} />
                <Modal
                    title="Создание коллекции"
                    open={isModalOpen}
                    onOk={handleOk}
                    onCancel={handleCancel}
                    okButtonProps={{ disabled: newCollectionName.length < 3 }}
                >
                    <p>Имя коллекции</p>
                    <Input placeholder="Имя" value={newCollectionName} count={{ show: true, max: 63 }} onChange={onChangeNewNameCollection} />
                </Modal>
                <Modal
                    title="Создание группы"
                    open={isModalOpenCreateGroup}
                    onOk={handleOkCreateGroup}
                    onCancel={handleCancelCreateGroup}
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
