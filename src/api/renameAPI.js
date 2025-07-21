import { api } from "./api";

export const renameAPI = async (path, newName, bucket) => {
  try {
    const response = await api.post("/rename", { path, newName, bucket });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
