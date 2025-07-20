import { api } from "./api";

export const createFolderAPI = async (name, path) => {
  try {
    const response = await api.post("/folder", { name, path });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
