import { api } from "./api";

export const deleteAPI = async (bucket, files, token) => {
  const fileQuery = 'files=' + files.map((file) => `${file.isDirectory ? file.path + '/' : file.path}`).join('|');
  try {
    const response = await api.delete(`?${fileQuery}` + '&bucket=' + bucket + '&token=' + token);
    return response;
  } catch (error) {
    return error;
  }
};
