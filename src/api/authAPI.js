import { api } from './api';

export const authAPI = async (username, password) => {
    try {
        const response = await api.get('/auth', {
            auth: {
                username: username,
                password: password
            }
        });
        if (response.status === 200) {
            localStorage.setItem('token', response.data.token)
            return response.data.token;
        }
        return null;
    } catch (error) {
        console.log(error);
        return null;
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
