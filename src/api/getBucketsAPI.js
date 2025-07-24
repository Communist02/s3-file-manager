import { api } from './api';

export const getBucketsAPI = async () => {
  try {
    const response = await api.get('/buckets');
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
