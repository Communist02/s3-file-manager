import { useEffect } from 'react';
import { Button, Spin, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import './AuthPage.css';
import { useAuth } from 'react-oidc-context';

function AuthPage() {
    const auth = useAuth();

    useEffect(() => {
        if (auth.error?.message === "No matching state found in storage") {
            auth.signinRedirect();
        }
    }, [auth.error?.message, auth.signinRedirect]);

    let body = <></>;
    if (auth.isLoading) {
        body = <>
            <h1>Идет процесс входа</h1>
        </>
    } else {
        body = <>
            <h1>Требуется войти в систему</h1>
            <Button style={{ width: '100%' }} type='primary' onClick={() => auth.signinRedirect()}>Войти</Button>
        </>
    }

    if (auth.error) {
        body = <>
            <h1>{auth.error.message}</h1>
            <div>Попробуйте перезагрузить страницу!</div>
        </>
    }

    return (
        <div className='auth-page'>
            <Card className="auth-container">
                {body}
            </Card>
            {auth.isLoading && <Spin size="large" fullscreen />}
        </div>
    );
}

export default AuthPage;