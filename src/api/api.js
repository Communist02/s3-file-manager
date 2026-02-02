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
    console.log(error);
    return error;
  }
};

export const checkTokenAPI = async (token) => {
  if (token !== null) {
    try {
      const response = await api.get('/check_session?token=' + token);
      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
};

export const deleteSession = async (token) => {
  if (token !== null) {
    try {
      const response = await api.delete('/delete_session?token=' + token);
      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
};

export const createFolderAPI = async (name, path, collection_id, token) => {
  try {
    const response = await api.post(`/collections/${collection_id}/create_folder`, { name, path, token });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const deleteAPI = async (collection_id, files, token) => {
  const fileQuery = 'files=' + encodeURIComponent(files.map((file) => `${file.isDirectory ? file.path + '/' : file.path}`).join('|'));
  try {
    const response = await api.delete(`/collections/${collection_id}/${token}?${fileQuery}`);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const downloadFile = async (files, collection_id, token) => {
  if (files.length === 0) return;
  try {
    let url;
    if (files.length === 1 && !files[0].isDirectory) {
      url = `${api.defaults.baseURL}/collections/${collection_id}/file/${token}/${encodeURIComponent(files[0].path)}`;
    } else {
      const fileQuery = 'files=' + encodeURIComponent(files.map((file) => `${file.isDirectory ? file.path + '/' : file.path}`).join('|'));
      url = `${api.defaults.baseURL}/collections/${collection_id}/archive/${token}?${fileQuery}`;
    }
    window.location.href = url;
  } catch (error) {
    console.log(error);
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

export const getAllFilesAPI = async (collection_id, token, path = '', recursive = true) => {
  try {
    const response = await api.get('/collections/' + collection_id + '/list/' + token + '/' + encodeURIComponent(path) + '?recursive=' + recursive);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getBucketsAPI = async (token) => {
  try {
    const response = await api.get('/collections/list/' + token);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getFreeCollections = async (token, collection_ids) => {
  try {
    const response = await api.post('/collections/specific_list', { token, collection_ids });
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const searchCollections = async (text, token) => {
  try {
    const response = await api.get('/search_collections?token=' + token + '&text=' + text);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const renameAPI = async (path, new_name, collection_id, token) => {
  try {
    const response = await api.post('/collections/' + collection_id + '/rename', { path, new_name, token });
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

export const removeCollection = async (collection_id, token) => {
  try {
    const response = await api.delete('/remove_collection' + '?token=' + token + '&collection_id=' + collection_id);
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

export const getLogs = async (token) => {
  try {
    const response = await api.get('/get_logs' + '?token=' + token);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getHistoryCollection = async (collection_id, token) => {
  try {
    const response = await api.get('/get_history_collection' + '?token=' + token + '&collection_id=' + collection_id);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const changeCollectionInfo = async (collection_id, data, token) => {
  try {
    const response = await api.post('/change_collection_info' + '?token=' + token + '&collection_id=' + collection_id, data);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getCollectionInfo = async (collection_id, token) => {
  try {
    const response = await api.get('/get_collection_info' + '?token=' + token + '&collection_id=' + collection_id);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getFileInfo = async (collection_id, token, path, is_dir) => {
  try {
    const response = await api.get('/collections/' + collection_id + '/file_info/' + token + encodeURIComponent(path) + '?is_dir=' + is_dir);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const indexFile = async (collection_id, token, path) => {
  try {
    const response = await api.post('/collections/' + collection_id + '/indexing_file/' + token + encodeURIComponent(path));
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const changeAccessToAll = async (collection_id, is_access, token) => {
  try {
    const response = await api.post('/change_access_to_all' + '?token=' + token + '&collection_id=' + collection_id + '&is_access=' + is_access);
    return response;
  } catch (error) {
    console.log(error);
    return error;
  }
};
