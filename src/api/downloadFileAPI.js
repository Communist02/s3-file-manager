import { api } from "./api";

export const downloadFile = async (files) => {
  if (files.length === 0) return;

  try {
    let i = 0;
    for (const file of files) {
      const url = `${api.defaults.baseURL}/download?file=${file.path}`;
      if (i++ === 0) {
        window.location.href = url;
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  } catch (error) {
    return error;
  }
};
