import { useState, useEffect } from 'react';
import { Descriptions, Avatar, Space, Typography, Divider, Input, message } from 'antd';
import { apiClient } from '../api';
import { UserOutlined } from '@ant-design/icons';
import './ProfilePage.css';

interface UserProps {
    id: number;
    count_collections: number;
    username: string;
}

interface ProfilePageProps {
    token: string;
}

function ProfilePage({ token }: ProfilePageProps) {
    const [user, setUser] = useState<UserProps>({id: 0, count_collections: 0, username: ''});

    async function getUser() {
        const response = await apiClient.getUserInfo();
        if (response.status === 200) {
            setUser(response.data);
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    }

    useEffect(() => {
        getUser();
    }, []);
    const items = [
        {
            key: 'id',
            label: 'ID',
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
            children: <Input.Password value={token} />,
        },
    ];

    return <>
        <Space size='large' align='start'>
            <Avatar size={160} icon={<UserOutlined />}>{user.username}</Avatar>
            <Typography.Title className='profile-username'>
                {user.username}
            </Typography.Title>
        </Space>
        <Divider />
        <Descriptions bordered title='Информация' layout='vertical' items={items} />
    </>;
}

export default ProfilePage;
