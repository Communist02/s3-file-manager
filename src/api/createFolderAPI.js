import { api } from "./api";

export const createFolderAPI = async (name, path, bucket) => {
  try {
    const response = await api.post("/folder", { name, path, bucket });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
