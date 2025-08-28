import { useState, useEffect } from 'react';
import { Descriptions, Avatar, Space, Typography, Divider, Input } from 'antd';
import { getUserInfo } from '../api/api';
import { UserOutlined } from '@ant-design/icons';
import './ProfilePage.css';

function ProfilePage({ token }) {
    const [user, setUser] = useState({});

    async function getUser() {
        const response = await getUserInfo(token);
        if (response.status === 200) {
            setUser(response.data);
        } else {
            messageApi.error('Произошла ошибка! ' + response);
        }
    }

    useEffect(() => {
        getUser();
    }, []);
    const items = [
        {
            key: 'id',
            label: 'id',
            children: user.id,
        },
        {
            key: 'count_collections',
            label: 'Количество коллекций',
            children: user.count_collections,
        },
        {
            key: 'token',
            label: 'Токен авторизации',
            children: <Input.Password value={token}/>,
        },
    ];

    return <>
        <Space size='large' align='start'>
            <Avatar size={160} icon={<UserOutlined />}>{user.login}</Avatar>
            <Typography.Title className='profile-username'>
                {user.login}
            </Typography.Title>
        </Space>
        <Divider />
        <Descriptions bordered title='Информация' layout='vertical' items={items} />
    </>;
}

export default ProfilePage;
