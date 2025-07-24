import { api } from "./api";

export const getAllFilesAPI = async (bucket, token) => {
  try {
    const response = await api.get('?bucket=' + bucket + '&token=' + token);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
