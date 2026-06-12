export const getFileExtension = (fileName: string) => {
  return fileName.split(".").pop() as string;
};
