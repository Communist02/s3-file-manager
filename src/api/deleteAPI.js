import { api } from "./api";

export const deleteAPI = async (files) => {
  const fileQuery = 'files=' + files.map((file) => `${file.isDirectory ? file.path + '/' : file.path}`).join('|');
  try {
    const response = await api.delete(`?${fileQuery}`);
    return response;
  } catch (error) {
    return error;
  }
};
