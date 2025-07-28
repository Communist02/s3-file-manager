import { api } from './api';

export const getBucketsAPI = async (token) => {
  try {
    const response = await api.get('/buckets' + '?token=' + token);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
