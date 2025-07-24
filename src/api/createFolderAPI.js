import { api } from "./api";

export const createFolderAPI = async (name, path, bucket, token) => {
  try {
    const response = await api.post("/folder", { name, path, bucket, token });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
