import { useEffect } from 'react';
import { Button, Spin, Card, Result } from 'antd';
import { useAuth } from 'react-oidc-context';
import './AuthPage.css';

function AuthPage() {
    const auth = useAuth();

    useEffect(() => {
        if (auth.error?.message === "No matching state found in storage") {
            auth.signinRedirect();
        }
    }, [auth.error?.message, auth.signinRedirect]);

    let body = <></>;
    if (auth.isLoading) {
        body = <Spin description="Идет процесс входа" size='large' />
    } else {
        body = <Result
            title="Требуется войти в систему"
            extra={
                <Button style={{ width: '100%' }} type='primary' onClick={() => auth.signinRedirect()}>Войти</Button>
            }
        />
    }

    if (auth.error) {
        body = <Result
            status="warning"
            title={auth.error.message}
            subTitle="Попробуйте перезагрузить страницу!"
        />
    }

    return (
        <div className='auth-page'>
            {body}
        </div>
    );
}

export default AuthPage;