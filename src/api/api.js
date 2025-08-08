import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const authAPI = async (username, password) => {
  try {
    const response = await api.get('/auth', {
      auth: {
        username: username,
        password: password
      }
    });
    return response;
  } catch (error) {
    if (error.code === "ERR_NETWORK") {
      window.alert('Не получилось подключится к серверу\nКод ошибки: ' + error.code);
    }
    return error;
  }
};

export const checkTokenAPI = async (token) => {
  if (token !== null) {
    try {
      const response = await api.get('/check?token=' + token);
      if (response.status === 200) return token;
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
};

export const createFolderAPI = async (name, path, bucket, token) => {
  try {
    const response = await api.post("/folder", { name, path, bucket, token });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const deleteAPI = async (bucket, files, token) => {
  const fileQuery = 'files=' + files.map((file) => `${file.isDirectory ? file.path + '/' : file.path}`).join('|');
  try {
    const response = await api.delete(`?${fileQuery}` + '&bucket=' + bucket + '&token=' + token);
    return response;
  } catch (error) {
    return error;
  }
};

export const downloadFile = async (files, bucket, token) => {
  if (files.length === 0) return;

  try {
    let i = 0;
    for (const file of files) {
      const url = `${api.defaults.baseURL}/download?file=${file.path}&bucket=${bucket}&token=${token}`;
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

export const copyItemAPI = async (bucket, sourcePaths, destinationPath, token) => {
  try {
    const response = await api.post("/copy", { sourcePaths, destinationPath, bucket, token });
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

export const getAllFilesAPI = async (bucket, token) => {
  try {
    const response = await api.get('?bucket=' + bucket + '&token=' + token);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getBucketsAPI = async (token) => {
  try {
    const response = await api.get('/get_list_collections' + '?token=' + token);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const renameAPI = async (path, newName, bucket, token) => {
  try {
    const response = await api.post("/rename", { path, newName, bucket, token });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const createCollection = async (name, token) => {
  try {
    const response = await api.post('/create_collection', { name, token });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getGroups = async (token) => {
  try {
    const response = await api.get('/get_groups' + '?token=' + token);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const createGroup = async (title, description, token) => {
  try {
    const response = await api.post('/create_group', { token, title, description });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const removeCollection = async (collection, token) => {
  try {
    const response = await api.delete('/remove_collection' + '?token=' + token + '&collection=' + collection);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getOtherUsers = async (token) => {
  try {
    const response = await api.get('/get_other_users' + '?token=' + token);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const giveAccessUserToCollection = async (collection_id, user_id, token) => {
  try {
    const response = await api.post('/give_access_user_to_collection', { token, collection_id, user_id });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
