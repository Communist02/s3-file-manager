import { api } from './api';

export const authAPI = async (username, password) => {
    try {
        const response = await api.get('/auth', {
            auth: {
                username: username,
                password: password
            }
        });
        return response;
    } catch (error) {
        if (error.code === "ERR_NETWORK") {
            window.alert('Не получилось подключится к серверу\nКод ошибки: ' + error.code);
        }
        return error;
    }
};

export const checkTokenAPI = async (token) => {
    if (token !== null) {
        try {
            const response = await api.get('/check?token=' + token);
            if (response.status === 200) return token;
            return null;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
};
