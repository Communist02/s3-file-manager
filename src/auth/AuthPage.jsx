import { useState, useEffect, useRef } from 'react';
import { Button, Checkbox, Watermark, Form, Input, message, Spin, Select, Card, Modal } from 'antd';
import { authAPI, checkTokenAPI } from '../api/api';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import './AuthPage.css';

function AuthPage({ authEvent }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [org, setOrg] = useState('default');
    const remember = useRef(true);
    const [isLoading, setIsLoading] = useState(true);

    const start = async () => {
        let token = localStorage.getItem('token');
        if (token !== null) {
            const response = await checkTokenAPI(token);
            setIsLoading(false);
            if (response.status === 200) {
                const login = localStorage.getItem('login');
                authEvent(token, login);
            } else if (response.status === 401) {
                message.info('Сессия устарела');
                localStorage.removeItem('token');
                localStorage.removeItem('login');
            } else {
                message.error(response.message);
            }
        } else {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        start();
    }, []);

    const auth = async () => {
        setIsLoading(true);
        const response = await authAPI(`${username}/${org}`, password);
        setIsLoading(false);
        if (response.status === 200) {
            const token = response.data.token;
            if (remember.current) {
                localStorage.setItem('token', token);
                localStorage.setItem('login', response.data.login);
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('login');
            }
            if (token !== null && token !== '') {
                await authEvent(token, response.data.login)
            }
        } else if (response.status === 401) {
            window.alert("Неверно введен логин или пароль!")
        } else if (response.status === 500) {
            window.alert("Ошибка сервера! Обратитесь в службу поддержки!")
        } else {
            message.error(response.message);
        }
    }

    return (
        <Watermark height={70} width={100} image='/favicon.svg'>
            <div className='auth-page'>
                <Card className="auth-container">
                    <h1>Вход в систему</h1>

                    <Form
                        layout='vertical'
                        onFinish={auth}
                        requiredMark='optional'
                        size='large'
                        initialValues={{ remember: true, org: 'default' }}
                    >
                        <Form.Item
                            label="Имя пользователя"
                            name="username"
                            rules={[{ required: true, message: 'Введите ваш логин!' }]}
                        >
                            <Input prefix={<UserOutlined />} onChange={(e) => setUsername(e.target.value)} />
                        </Form.Item>
                        <Form.Item
                            label="Пароль"
                            name="password"
                            rules={[{ required: true, message: 'Введите ваш пароль!' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} onChange={(e) => setPassword(e.target.value)} />
                        </Form.Item>
                        <Form.Item
                            label="Организация"
                            name="org"
                            rules={[{ required: true, message: 'Выберите организацию!' }]}
                        >
                            <Select
                                options={[
                                    { value: 'default', label: 'Нет' },
                                    { value: 'iapu_dvo_ran', label: 'ИАПУ ДВО РАН' },
                                    { value: 'vvsu', label: 'ВВГУ' },
                                ]}
                                onChange={(value) => setOrg(value)}
                            />
                        </Form.Item>
                        <Form.Item name="remember" valuePropName="checked">
                            <Checkbox onChange={(value) => remember.current = value.target.checked}>Запомнить</Checkbox>
                        </Form.Item>
                        <Form.Item label={null}>
                            <Button style={{ width: '100%' }} htmlType="submit" type="primary">Войти</Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
            {isLoading && <Spin size="large" fullscreen />}
        </Watermark>
    );
}

export default AuthPage;
