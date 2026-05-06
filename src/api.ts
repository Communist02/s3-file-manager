import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { url } from "./url";
import { File } from "./App"

export class ApiClient {
    private api;
    private token: string = '';

    constructor() {
        this.api = axios.create({
            baseURL: url,
            timeout: 10000,
            validateStatus: () => true,
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
    }

    private normalizeErrorResponse(error: AxiosError): AxiosResponse {
        if (error.response) {
            // Сервер дал ответ (даже 500) — возвращаем как есть
            return error.response;
        }

        // Если ответа нет — создаём фейковый AxiosResponse
        return {
            data: null,
            status: 0,
            statusText: error.code ?? "NETWORK_ERROR",
            headers: {},
            config: (error.config ?? {}) as InternalAxiosRequestConfig,
        };
    }

    private handleError(error: AxiosError, context?: string): AxiosResponse {
        console.error(`[${context}] Ошибка запроса:`, error);
        return this.normalizeErrorResponse(error);
    }

    public updateToken(token: string) {
        this.api = axios.create({
            baseURL: url,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        this.token = token;
    }

    public async checkToken(token: string): Promise<AxiosResponse> {
        try {
            const response = await this.api.get('/session', { params: { token } });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "get_session");
        }
    }

    public async deleteSession(token: string): Promise<AxiosResponse> {
        try {
            const response = await this.api.delete('/session', {
                params: { token }
            });
            return response.data;
        } catch (error) {
            return this.handleError(error as AxiosError, "delete_session");
        }
    }

    public downloadFile = async (files: File[], collection_id: number) => {
        if (files.length === 0) return;
        try {
            let url;
            if (files.length === 1 && !files[0].isDirectory) {
                url = `${this.api.defaults.baseURL}/collection/${collection_id}/file/${encodeURIComponent(files[0].path)}?token=${this.token}`;
            } else {
                const fileQuery = 'files=' + encodeURIComponent(files.map((file) => `${file.isDirectory ? file.path + '/' : file.path}`).join('|'));
                url = `${this.api.defaults.baseURL}/collection/${collection_id}/archive?${fileQuery}&token=${this.token}`;
            }
            window.location.href = url;
        } catch (error) {
            return this.handleError(error as AxiosError, "download");
        }
    };

    public createFolder = async (name: string, path: string, collection_id: number) => {
        try {
            const response = await this.api.post(`/collection/${collection_id}/create_folder`, { name, path });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "create_folder");
        }
    };

    public deleteFiles = async (collection_id: number, files: File[]) => {
        const fileQuery = 'files=' + encodeURIComponent(files.map((file) => `${file.isDirectory ? file.path + '/' : file.path}`).join('|'));
        try {
            const response = await this.api.delete(`/collection/${collection_id}/files?${fileQuery}`);
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "delete_files");
        }
    };

    public copyFiles = async (source_collection_id: number, source_paths: string[], destination_collection_id: number, destination_path: string) => {
        try {
            const response = await this.api.post("/copy", { source_collection_id, source_paths, destination_collection_id, destination_path });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "copy_files");
        }
    };

    public getFiles = async (collection_id: number, path: string = '', recursive = true) => {
        try {
            const response = await this.api.get('/collection/' + collection_id + '/files/' + encodeURIComponent(path) + '?recursive=' + recursive);
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "get_files");
        }
    };

    public getCollections = async () => {
        try {
            const response = await this.api.get('/collections');
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "get_collections");
        }
    };

    public getFreeCollections = async (collection_ids: number[]) => {
        try {
            const response = await this.api.post('/collections/specific', { collection_ids });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "get_specific_collection");
        }
    };

    public searchCollections = async (text: string) => {
        try {
            const response = await this.api.get('/collections/search', { params: { text } });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "get_session");
        }
    };

    public rename = async (path: string, new_name: string, collection_id: number) => {
        try {
            const response = await this.api.post('/collection/' + collection_id + '/rename', { path, new_name });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "rename");
        }
    };

    public createCollection = async (name: string) => {
        try {
            const response = await this.api.post('/create_collection', { name });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public getGroups = async () => {
        try {
            const response = await this.api.get('/groups');
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public createGroup = async (title: string, description: string) => {
        try {
            const response = await this.api.post('/create_group', { title, description });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public removeCollection = async (collection_id: number) => {
        try {
            const response = await this.api.delete('/collection', { params: { collection_id } });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public getOtherUsers = async () => {
        try {
            const response = await this.api.get('/other_users');
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public giveAccessUserToCollection = async (collection_id: number, user_id: number, access_type_id: number) => {
        try {
            const response = await this.api.post('/give_access_user_to_collection', { collection_id, user_id, access_type_id });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public giveAccessGroupToCollection = async (collection_id: number, group_id: number, access_type_id: number) => {
        try {
            const response = await this.api.post('/give_access_group_to_collection', { collection_id, group_id, access_type_id });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public getAccessToCollection = async (collection_id: number) => {
        try {
            const response = await this.api.get(`/collection/${collection_id}/access`, { params: { collection_id } });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public deleteAccessToCollection = async (access_id: number) => {
        try {
            const response = await this.api.delete(`/collection/access`, { params: { access_id } });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public deleteUserToGroup = async (group_id: number, user_id: number) => {
        try {
            const response = await this.api.delete('/user_to_group', { params: { user_id, group_id } });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public addUserToGroup = async (group_id: number, user_id: number, role_id: number) => {
        try {
            const response = await this.api.post('/add_user_to_group', { group_id, user_id, role_id });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public getGroupUsers = async (group_id: number) => {
        try {
            const response = await this.api.get('/group_users', { params: { group_id } });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public getAccessTypes = async () => {
        try {
            const response = await this.api.get('/access_types');
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public transferPowerToGroup = async (group_id: number, user_id: number) => {
        try {
            const response = await this.api.post('/transfer_power_to_group', { params: { user_id, group_id } });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public exitGroup = async (group_id: number) => {
        try {
            const response = await this.api.post('/exit_group', { params: { group_id } });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public changeRoleInGroup = async (group_id: number, user_id: number, role_id: number) => {
        try {
            const response = await this.api.post('/change_role_in_group' + '?group_id=' + group_id + '&user_id=' + user_id + '&role_id=' + role_id);
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public async getUserInfo(): Promise<AxiosResponse> {
        try {
            const response = await this.api.get('/user_info');
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "get_user_info");
        }
    };

    public changeAccessType = async (access_id: number, access_type_id: number) => {
        try {
            const response = await this.api.post('/change_access_type' + '?access_id=' + access_id + '&access_type_id=' + access_type_id);
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "change_access_type");
        }
    };

    public changeGroupInfo = async (group_id: number, title: string, description: string) => {
        try {
            const response = await this.api.post('/change_group_info', { group_id, title, description });
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "change_group_info");
        }
    };

    public async getLogs(): Promise<AxiosResponse> {
        try {
            const response = await this.api.get('/logs');
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "get_logs");
        }
    };

    public async getHistoryCollection(collection_id: number): Promise<AxiosResponse> {
        try {
            const response = await this.api.get(`/collection/${collection_id}/history`);
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "get_history_collection");
        }
    };

    public changeCollectionInfo = async (collection_id: number, data: {}) => {
        try {
            const response = await this.api.post('/change_collection_info' + '?collection_id=' + collection_id, data);
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public getCollectionInfo = async (collection_id: number) => {
        try {
            const response = await this.api.get(`/collection/${collection_id}/info`);
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public getFileInfo = async (collection_id: number, path: string, is_dir: boolean) => {
        try {
            const response = await this.api.get('/collection/' + collection_id + '/file_info/' + encodeURIComponent(path) + '?is_dir=' + is_dir);
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public indexFile = async (collection_id: number, path: string) => {
        try {
            const response = await this.api.post('/collection/' + collection_id + '/indexing_file/' + encodeURIComponent(path));
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

    public changeAccessToAll = async (collection_id: number, is_access: boolean) => {
        try {
            const response = await this.api.post('/change_access_to_all' + '?collection_id=' + collection_id + '&is_access=' + is_access);
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, "");
        }
    };

}

export const apiClient = new ApiClient();