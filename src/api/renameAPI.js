import { api } from "./api";

export const renameAPI = async (path, newName) => {
  try {
    const response = await api.post("/rename", { path, newName });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
