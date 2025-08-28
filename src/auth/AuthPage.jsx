import { useState, useEffect, useRef, use } from 'react';
import { Button, Checkbox, Watermark, Form, Input } from 'antd';
import { authAPI, checkTokenAPI } from '../api/api';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import './AuthPage.css';

function AuthPage({ authEvent }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const remember = useRef(true);

    useEffect(() => {
        const fun = async () => {
            const token = await checkTokenAPI(localStorage.getItem('token'));
            const login = localStorage.getItem('login');
            if (token !== null) {
                authEvent(token, login);
            }
        }
        fun();
    }, []);

    const auth = async () => {
        const response = await authAPI(username, password);
        if (response.status === 200) {
            const token = response.data.token;
            if (remember.current) {
                localStorage.setItem('token', token);
                localStorage.setItem('login', response.data.login);
            } else {
                localStorage.setItem('token', null);
                localStorage.setItem('login', null);
            }
            if (token !== null && token !== '') {
                await authEvent(token, response.data.login)
            }
        } else if (response.status === 401) {
            window.alert("Неверно введен логин или пароль!")
        } else if (response.status === 500) {
            window.alert("Ошибка сервера. Обратитесь в службу поддержки!")
        }
    }

    return (
        <Watermark image='/favicon.svg' zIndex={-1}>
            <div className='auth-page'>
                <div className="auth-container">
                    <h1>Вход в систему</h1>

                    <Form
                        layout='vertical'
                        onFinish={auth}
                        requiredMark='optional'
                        size='large'
                        initialValues={{ remember: true }}
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
                        <Form.Item name="remember" valuePropName="checked">
                            <Checkbox onChange={(value) => remember.current = value.target.checked}>Запомнить</Checkbox>
                        </Form.Item>
                        <Form.Item label={null}>
                            <Button style={{ width: '100%' }} htmlType="submit" type="primary">Войти</Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </Watermark>
    );
}

export default AuthPage;
