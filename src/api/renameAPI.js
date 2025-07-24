import { api } from "./api";

export const renameAPI = async (path, newName, bucket, token) => {
  try {
    const response = await api.post("/rename", { path, newName, bucket, token });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
