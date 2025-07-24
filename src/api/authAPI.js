import { api } from './api';

export const authAPI = async (token) => {
    if (token !== null) {
        try {
            const response = await api.get('/check?token=' + token);
            return token;
        } catch (error) {
            console.log(error);
        }
    }
    try {
        const response = await api.get('/auth', {
            auth: {
                username: 'admin',
                password: 'password'
            }
        });
        if (response.status === 200) {
            localStorage.setItem('token', response.data.token)
            return response.data.token;
        }
        return false;
    } catch (error) {
        console.log(error);
        return error;
    }
};

// export const checkTokenAPI = async (token) => {
//     try {
//         const response = await api.get('/check?token=' + token);
//         return response;
//     } catch (error) {
//         console.log(error);
//         return error;
//     }
// };
