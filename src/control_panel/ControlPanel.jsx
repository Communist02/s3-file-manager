import { useState, useEffect } from 'react';
import './ControlPanel.css';
import GroupPage from './GroupPage';
import { Tabs, Layout, Menu, Modal, Input, Button, message } from 'antd';
import { UsergroupAddOutlined, TeamOutlined } from '@ant-design/icons';
import { getGroups, createGroup } from '../api/api';

const ControlPanel = ({ page, token, getCollections }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpenCreateGroup, setIsModalOpenCreateGroup] = useState(false);
    const [groups, setGroups] = useState([]);
    const [newGroupTitle, setNewGroupTitle] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
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
        updateGroups();
    }, []);

    const handleOkCreateGroup = async () => {
        let response = await createGroup(newGroupTitle, newGroupDescription, token);
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
