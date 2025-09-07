import axios from "axios";
import { url } from "../url";

export const api = axios.create({
  baseURL: url,
});

export const authAPI = async (username, password) => {
  try {
    const response = await api.get('/auth', {
      auth: {
        username: username,
        password: password,
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
      const response = await api.get('/check_token?token=' + token);
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
    const response = await api.post("/new_folder", { name, path, bucket, token });
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
    let url;
    if (files.length === 1 && !files[0].isDirectory) {
      url = `${api.defaults.baseURL}/download?file=${files[0].path}&bucket=${bucket}&token=${token}`;
    } else {
      const fileQuery = 'files=' + files.map((file) => `${file.isDirectory ? file.path + '/' : file.path}`).join('|');
      url = `${api.defaults.baseURL}/download_files?${fileQuery}&collection_name=${bucket}&token=${token}`;
    }
    window.location.href = url;
  } catch (error) {
    return error;
  }
};

export const copyItemAPI = async (source_collection_id, source_paths, destination_collection_id, destination_path, token) => {
  try {
    const response = await api.post("/copy", { source_collection_id, source_paths, destination_collection_id, destination_path, token });
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

export const giveAccessUserToCollection = async (collection_id, user_id, access_type_id, token) => {
  try {
    const response = await api.post('/give_access_user_to_collection', { token, collection_id, user_id, access_type_id });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const giveAccessGroupToCollection = async (collection_id, group_id, access_type_id, token) => {
  try {
    const response = await api.post('/give_access_group_to_collection', { token, collection_id, group_id, access_type_id });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getAccessToCollection = async (collection_id, token) => {
  try {
    const response = await api.get('/get_access_to_collection' + '?token=' + token + '&collection_id=' + collection_id);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const deleteAccessToCollection = async (access_id, token) => {
  try {
    const response = await api.delete('/delete_access_to_collection' + '?token=' + token + '&access_id=' + access_id);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const deleteUserToGroup = async (group_id, user_id, token) => {
  try {
    const response = await api.delete('/delete_user_to_group' + '?token=' + token + '&group_id=' + group_id + '&user_id=' + user_id);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const addUserToGroup = async (group_id, user_id, role_id, token) => {
  try {
    const response = await api.post('/add_user_to_group', { token, group_id, user_id, role_id });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getGroupUsers = async (group_id, token) => {
  try {
    const response = await api.get('/get_group_users' + '?token=' + token + '&group_id=' + group_id);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getAccessTypes = async (token) => {
  try {
    const response = await api.get('/get_access_types' + '?token=' + token);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const transferPowerToGroup = async (group_id, user_id, token) => {
  try {
    const response = await api.post('/transfer_power_to_group' + '?token=' + token + '&group_id=' + group_id + '&user_id=' + user_id);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const exitGroup = async (group_id, token) => {
  try {
    const response = await api.delete('/exit_group' + '?token=' + token + '&group_id=' + group_id);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const changeRoleInGroup = async (group_id, user_id, role_id, token) => {
  try {
    const response = await api.post('/change_role_in_group' + '?token=' + token + '&group_id=' + group_id + '&user_id=' + user_id + '&role_id=' + role_id);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getUserInfo = async (token) => {
  try {
    const response = await api.get('/get_user_info' + '?token=' + token);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const changeAccessType = async (access_id, access_type_id, token) => {
  try {
    const response = await api.post('/change_access_type' + '?token=' + token + '&access_id=' + access_id + '&access_type_id=' + access_type_id);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const changeGroupInfo = async (group_id, title, description, token) => {
  try {
    const response = await api.post('/change_group_info', { group_id, title, description, token });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
