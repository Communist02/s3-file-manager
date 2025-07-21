import { api } from "./api";

export const copyItemAPI = async (bucket, sourcePaths, destinationPath) => {
  try {
    const response = await api.post("/copy", { sourcePaths, destinationPath, bucket });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const moveItemAPI = async (bucket, sourcePaths, destinationPath) => {
  try {
    const response = await api.put("/move", { sourcePaths, destinationPath, bucket });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
