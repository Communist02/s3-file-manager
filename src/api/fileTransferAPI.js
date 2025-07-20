import { api } from "./api";

export const copyItemAPI = async (sourcePaths, destinationPath) => {
  try {
    const response = await api.post("/copy", { sourcePaths, destinationPath });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const moveItemAPI = async (sourcePaths, destinationPath) => {
  try {
    const response = await api.put("/move", { sourcePaths, destinationPath });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
