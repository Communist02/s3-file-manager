import { useState, useRef, useEffect } from 'react'
import './App.css'
import FileManager from './file_manager/FileManager/FileManager'
import AuthPage from './auth/AuthPage'
import { getAllFilesAPI, downloadFile, deleteAPI, copyItemAPI, renameAPI, createFolderAPI, getCollectionsAPI, createCollection, deleteSession, getFileInfo, getFreeCollections, indexFile, update_token } from './api/api'
import ControlPanel from './control_panel/ControlPanel';
import { Button, Avatar, Dropdown, Select, Result, Flex, Space, Tag, ConfigProvider, App as AntApp, theme, Layout, Card, Drawer, message, Modal, Input, FloatButton, Typography, Descriptions, Tooltip } from 'antd';
import { LogoutOutlined, TeamOutlined, UserOutlined, HistoryOutlined, UploadOutlined, SunOutlined, SettingOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { url } from "./url";
import ruRU from 'antd/locale/ru_RU';
import Uploader from './uploader/Uploader'
import Logs from './logsView/Logs'
import History from './historyView/History'
import CollectionPage from './control_panel/CollectionPage'
import ProfilePage from './control_panel/ProfilePage'
import CollectionsSearch from './collectionsSearch/CollectionsSearch'
import { useAuth } from 'react-oidc-context'

function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<Collection[]>([]);
    const [buckets, setBuckets] = useState([]);
    const [currentBucket, setCurrentBucket] = useState<Collection | null>(null);
    const [tokenAuth, setTokenAuth] = useState('');
    const [showControlPanel, setShowControlPanel] = useState(false);
    const copyCollection = useRef<Collection | null>(null);
    const [openUploader, setOpenUploader] = useState(false);
    const [openLogs, setOpenLogs] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [openCollection, setOpenCollection] = useState(false);
    const [openSearchCollections, setOpenSearchCollections] = useState(false);
    const [openHistory, setOpenHistory] = useState(false);
    const [currentPath, setCurrentPath] = useState('');
    const [darkTheme, setDarkTheme] = useState(localStorage.getItem('darkTheme') === 'true');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [currentCountUploading, setCurrentCountUploading] = useState(0);
    const auth = useAuth();

    useEffect(() => {
        if (auth.user) {
            //update_token(auth.user?.access_token)
            login(auth.user?.access_token);
        }
    }, [auth.isAuthenticated]);

    interface Collection {
        id: number;
        name: string;
        path: string;
        access_type_id: number;
        type: string;
    }

    const getFiles = async (collection: Collection) => {
        setIsLoading(true);
        const response = await getAllFilesAPI(collection.id);
        setIsLoading(false);
        if (response.status === 200) {
            if (response.data.length > 0) {
                setFiles(response.data);
            } else {
                setFiles([{}]);
            };
        } else if (response.status === 410) {
            setFiles([{}]);
            Modal.error({
                title: "Фатальная ошибка!",
                centered: true,
                content: 'Коллекция не существует, данные утеряны!\nПожалуйста удалите коллекцию через меню "Управление" или обратитесь в службу поддержки!'
            });
        } else {
            setFiles([{}]);
            Modal.error({
                title: "Ошибка сервера!",
                centered: true,
                content: 'Попробуйте авторизоваться заново или обратитесь в службу поддержки!'
            });
        }
    };

    async function updateCollection(collection_id: number, path: string = '') {
        if (currentBucket !== null && collection_id === currentBucket.id) {
            const response = await getAllFilesAPI(currentBucket.id, path);
            if (response.status === 200) {
                if (response.data.length > 0) {
                    setFiles(response.data);
                } else {
                    setFiles([{}]);
                };
            }
        }
    };

    const getBuckets = async (clear = false) => {
        let result = [];
        setIsLoading(true);
        const response = await getCollectionsAPI();
        let responseFree = null;
        const freeCollectionIds = localStorage.getItem('freeCollectionIds');
        if (freeCollectionIds !== null) {
            responseFree = await getFreeCollections(JSON.parse(freeCollectionIds));
        }
        setIsLoading(false);
        if (response.status === 200) {
            result = response.data;
            if (responseFree !== null && responseFree.status === 200) {
                result = result.concat(responseFree.data);
            }
            if (result.length > 0) {
                if (currentBucket === null || clear) {
                    setCurrentBucket(result[0]);
                }
                if (clear) {
                    getFiles(result[0]);
                }
            }
        } else if (response.status === 500) {
            Modal.error({
                title: "Ошибка сервера!",
                centered: true,
                content: 'Попробуйте авторизоваться заново или обратитесь в службу поддержки!'
            });
        }
        setBuckets(result);
        return result;
    }

    // Refresh Files
    const handleRefresh = () => {
        currentBucket !== null && getFiles(currentBucket);
    };

    const handleDownload = async (files) => {
        currentBucket !== null && await downloadFile(files, currentBucket.id);
    };

    // File Upload Handlers
    const handleFileUploading = (file, parentFolder) => {
        console.log(file);
        return { bucket: currentBucket.name, path: parentFolder !== null ? parentFolder.path : '/' };
    };

    const handleFileUploaded = async (response) => {
        console.log(response);
        // const uploadedFile = JSON.parse(response);
        // setFiles((prev) => [...prev, uploadedFile]);
        currentBucket !== null && await getFiles(currentBucket);
    };

    const handleError = (error, file) => {
        console.error(error);
    };

    // Delete File/Folder
    const handleDelete = async (files) => {
        setIsLoading(true);
        const response = await deleteAPI(currentBucket.id, files);
        setIsLoading(false);
        if (response.status === 200) {
            currentBucket !== null && await getFiles(currentBucket);
            message.success(`Успешно удалено!`);
        } else if (response.status === 500) {
            Modal.error({
                title: "Ошибка сервера!",
                centered: true,
                content: 'Попробуйте авторизоваться заново или обратитесь в службу поддержки!'
            });
        }
    };

    const handleRename = async (file, newName: string) => {
        setIsLoading(true);
        await renameAPI(file.isDirectory ? file.path + '/' : file.path, newName, currentBucket.id);
        currentBucket !== null && await getFiles(currentBucket);
    };

    // Create Folder
    const handleCreateFolder = async (name: string, parentFolder) => {
        setIsLoading(true);
        const response = await createFolderAPI(name, parentFolder !== null ? parentFolder.path : '/', currentBucket.id);
        if (response.status === 200 || response.status === 201) {
            currentBucket !== null && await getFiles(currentBucket);
            message.success(`Папка "${name}" создана!`);
        } else {
            console.error(response.data);
        }
        setIsLoading(false);
    };

    function handleCopy(files) {
        copyCollection.current = currentBucket;
        message.success('Готово к вставке!');
    }

    function handleFolderChange(path: string) {
        setCurrentPath(path);
    }

    const handlePaste = async (copiedItems, destinationFolder, operationType) => {
        let copiedFiles = [];
        for (const file of copiedItems) {
            if (file.isDirectory) {
                copiedFiles.push(file.path + '/');
            } else {
                copiedFiles.push(file.path);
            }
        }
        if (operationType === "copy" && copyCollection.current !== null && currentBucket !== null) {
            setIsLoading(true);
            const response = await copyItemAPI(copyCollection.current.id, copiedFiles, currentBucket.id, destinationFolder !== null ? destinationFolder.path : '/');
            setIsLoading(false);
            if (response.status === 200) {
                message.success('Файлы успешно скопированы!');
                await getFiles(currentBucket);
            } else if (response.status === 403) {
                message.error('Нет прав на копирование!');
            }
        }
    };

    const handleBucket = async (id: number, collections: Collection[] | null = null) => {
        let collection;
        if (collections !== null) {
            collection = collections.find(item => item.id === id);
        } else {
            collection = buckets.find(item => item.id === id);
        }
        try {
            document.querySelector('.breadcrumb-file-path .ant-breadcrumb-link span').click();
        } catch (error) {
            console.error(error);
        }
        if (collection) {
            setCurrentBucket(collection);
            await getFiles(collection);
        }
    }

    const outAccount = () => {
        auth.removeUser();
        setShowControlPanel(false);
        setTokenAuth('');
        setBuckets([]);
        setCurrentBucket(null);
        setFiles([{}]);
    };

    const handleOkCreateCollection = async () => {
        let response = await createCollection(newCollectionName);
        if (response.status === 200) {
            setIsModalOpen(false);
            message.success('Коллекция успешно создана!');
            const collections = await getBuckets();
            setNewCollectionName('');
            await handleBucket(response.data, collections);
        } else if (response.status === 406) {
            message.error('Имя может содержать только латинские буквы и цифры!');
        } else if (response.status === 409) {
            message.error('Коллекция с таким именем уже существует в системе!');
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    };

    // Функция для форматирования размера файла
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleProperties = async (file) => {
        let response = await getFileInfo(currentBucket.id, file['path'], file['isDirectory']);
        if (response.status === 200) {
            if (response.data !== null) {
                const items = [];
                for (let [key, value] of Object.entries(response.data)) {
                    switch (key) {
                        case "size":
                        case "sum_size": {
                            value = formatFileSize(value);
                        }
                    }
                    items.push({
                        key: key,
                        label: key,
                        children: typeof value === 'object' ? <Typography><pre style={{ margin: 0 }}>{JSON.stringify(value, null, 4)}</pre></Typography> : value,
                    })
                }
                Modal.info({
                    title: "Свойства " + file['name'],
                    icon: null,
                    centered: true,
                    content: <Descriptions size={'small'} column={1} items={items} />,
                    width: 720
                });
            } else {
                Modal.confirm({
                    title: "Свойства " + file['name'],
                    centered: true,
                    content: "Файл не индексирован",
                    cancelText: 'Закрыть',
                    okText: 'Индексировать',
                    onOk: async () => {
                        let response = await indexFile(currentBucket.id, file['path']);
                        if (response.status === 200) {
                            handleProperties(file);
                        } else {
                            message.error('Не удалость индексировать файл!')
                        }
                    }
                });
            }
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    };

    function getCollectionItems() {
        const ownerItems = [];
        const accessItems = [];
        const groupItems = [];
        const accessToAllItems = [];
        const collections: Collection[] = buckets;

        for (let i = 0; i < collections.length; i++) {
            const item = {
                label: collections[i].name || collections[i].id,
                value: collections[i].id,
            };

            switch (collections[i].type) {
                case 'owner': ownerItems.push(item); break;
                case 'access': accessItems.push(item); break;
                case 'group': groupItems.push(item); break;
                case 'access_to_all': accessToAllItems.push(item); break;
            }
        }

        const result = [];
        if (ownerItems.length > 0) {
            result.push({ label: 'Вы владелец', options: ownerItems });
        }
        if (accessItems.length > 0) {
            result.push({ label: 'Получен доступ', options: accessItems });
        }
        if (groupItems.length > 0) {
            result.push({ label: 'Групповые', options: groupItems });
        }
        if (accessToAllItems.length > 0) {
            result.push({ label: 'Для всех', options: accessToAllItems });
        }

        return result;
    }

    const items = [
        {
            key: 'fileManager',
            label: 'Файловый менеджер',
            icon: <img height='40px' width='40px' src={'./favicon.svg'} />,
        },
        {
            type: 'divider',
        },
        {
            key: 'search',
            label: 'Поиск',
            icon: <SearchOutlined />,
        },
        {
            key: 'profile',
            label: 'Профиль',
            icon: <UserOutlined />,
        },
        {
            key: 'groups',
            label: 'Группы',
            icon: <TeamOutlined />,
        },
        {
            type: 'divider',
        },
        {
            key: 'logs',
            label: 'Логи',
            icon: <HistoryOutlined />,
        },
        {
            type: 'divider',
        },
        {
            key: 'theme',
            label: 'Переключить тему',
            icon: <SunOutlined />,
        },
        {
            type: 'divider',
        },
        {
            key: 'exit',
            label: 'Выход',
            icon: <LogoutOutlined />,
        },
    ];

    function onClickLogin(e) {
        switch (e.key) {
            case 'fileManager':
                setShowControlPanel(false);
                break;
            case 'search':
                setOpenSearchCollections(true);
                break;
            case 'profile':
                setOpenProfile(true);
                break;
            case 'groups':
                setShowControlPanel(true);
                break;
            case 'logs':
                setOpenLogs(!openLogs);
                break;
            case 'theme':
                localStorage.setItem('darkTheme', (!darkTheme).toString());
                setDarkTheme(!darkTheme);
                break;
            case 'exit':
                outAccount();
                break;
        }
    }

    async function login(token: string) {
        setTokenAuth(token);
        update_token(token);
        const buckets = await getBuckets(true);
        setBuckets(buckets);
    }

    const permissions = [
        { create: true, upload: true, move: false, copy: true, rename: true, download: true, delete: true }, // owner
        { create: true, upload: true, move: false, copy: true, rename: true, download: true, delete: true }, // readwrite
        { create: false, upload: false, move: false, copy: true, rename: false, download: true, delete: false }, // readonly
        { create: true, upload: true, move: false, copy: false, rename: false, download: false, delete: false }, // writeonly
    ]

    let page = <></>;
    if (!tokenAuth) {
        page = <AuthPage />;
    } else {
        page = <>
            <Modal
                title="Создание коллекции"
                open={isModalOpen}
                onOk={handleOkCreateCollection}
                onCancel={
                    () => {
                        setIsModalOpen(false);
                        setNewCollectionName('');
                    }
                }
                okButtonProps={{ disabled: newCollectionName.length < 3 }}
            >
                <p>Имя коллекции</p>
                <Input placeholder="Имя" value={newCollectionName} count={{ show: true, max: 63 }} onChange={(e) => setNewCollectionName(e.target.value)} />
            </Modal>
            {buckets.length > 0 ?
                <FileManager
                    files={files}
                    language='ru'
                    isLoading={isLoading}
                    layout={'list'}
                    onRefresh={handleRefresh}
                    onError={handleError}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onCopy={handleCopy}
                    onPaste={handlePaste}
                    onRename={handleRename}
                    onShowProperties={handleProperties}
                    onFileUploading={handleFileUploading}
                    onFileUploaded={handleFileUploaded}
                    onCreateFolder={handleCreateFolder}
                    fileUploadConfig={{ url: url, method: 'PUT' }}
                    defaultNavExpanded={!window.matchMedia('(pointer:coarse)').matches}
                    collapsibleNav={true}
                    filePreviewPath={url + `/collections/${currentBucket?.id}/file/${tokenAuth}?preview=true`}
                    primaryColor='#1677ff'
                    permissions={currentBucket !== null ? permissions[currentBucket.access_type_id - 1] : permissions[0]}
                    onFolderChange={handleFolderChange}
                /> :
                <Flex className='not-collections' style={{ height: 'calc(100vh - 38px - 70px)' }} justify="center" align="center">
                    <Result
                        title="У вас нет доступных коллекций, но вы можете их создать!"
                        extra={
                            <Button type="primary" onClick={() => setIsModalOpen(true)}>Создать коллекцию</Button>
                        }
                    />
                </Flex>
            }
        </>;
    }

    return <ConfigProvider locale={ruRU} theme={{
        components: { Layout: { headerBg: '#00000000' } },
        algorithm: darkTheme ? theme.darkAlgorithm : undefined,
    }}>
        <AntApp>
            <Layout>
                {tokenAuth !== null && tokenAuth !== undefined && tokenAuth !== '' && <Layout.Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0px 10px 0px 0px' }}>
                    <Button type='text' style={{ height: 60, padding: 10, }} className='header-right' onClick={() => onClickLogin({ key: 'fileManager' })}>
                        <img height='40px' width='40px' src={'./favicon.svg'} />
                        <h1>S3 File Manager</h1>
                    </Button>
                    <Space className='header-left'>
                        <Button type="primary" icon={<SearchOutlined />} onClick={() => setOpenSearchCollections(true)}>Поиск</Button>
                        {
                            buckets.length > 0 && !showControlPanel && <>
                                {currentBucket !== null && ['', <Tag color='purple'>Чтение и запись</Tag>, <Tag color='orange'>Только чтение</Tag>, <Tag color='magenta'>Только запись</Tag>][currentBucket.access_type_id - 1]}
                                <Select prefix="Коллекция" style={{ width: '200px' }} value={currentBucket.id} onChange={(id) => handleBucket(id)} options={getCollectionItems()} />
                                <Tooltip title='Создать коллекцию'>
                                    <Button icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} />
                                </Tooltip>
                                {currentBucket !== null && currentBucket.type === 'owner' && <Tooltip title='История'><Button icon={<HistoryOutlined />} onClick={() => setOpenHistory(true)} /></Tooltip>}
                                <Tooltip title='Управление коллекцией'>
                                    <Button icon={<SettingOutlined />} onClick={() => setOpenCollection(true)} />
                                </Tooltip>
                                <FloatButton id='upload-button' type='primary' badge={{ count: currentCountUploading, overflowCount: 9999 }} icon={<UploadOutlined />} onClick={() => setOpenUploader(true)} tooltip='Загрузки' />
                            </>
                        }
                        <Dropdown trigger={['click']} menu={{ items, onClick: onClickLogin }}>
                            <Button type="text" shape="circle">
                                <Avatar size={34} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                            </Button>
                        </Dropdown>
                    </Space>
                    <Logs open={openLogs} setOpen={setOpenLogs} token={tokenAuth} />
                    {currentBucket !== null && <History collection_id={currentBucket.id} open={openHistory} setOpen={setOpenHistory} />}
                    <Drawer size='large' open={openCollection} onClose={() => setOpenCollection(false)}>
                        {openCollection && <CollectionPage collection={currentBucket} setCurrentCollection={setCurrentBucket} getCollections={getBuckets} open={openCollection} setOpen={setOpenCollection} />}
                    </Drawer>
                    <Drawer title='Профиль' size='large' open={openProfile} onClose={() => setOpenProfile(false)}>
                        {openProfile && <ProfilePage token={tokenAuth} />}
                    </Drawer>
                    <Drawer title='Группы' styles={{ body: { padding: 0 } }} size={1080} open={showControlPanel} onClose={() => setShowControlPanel(false)}>
                        {showControlPanel && <ControlPanel getCollections={getBuckets} />}
                    </Drawer>
                    <Drawer title='Поиск коллекций' size={1080} open={openSearchCollections} onClose={() => setOpenSearchCollections(false)}>
                        {openSearchCollections && <CollectionsSearch getCollections={getBuckets} />}
                    </Drawer>
                </Layout.Header>}
                <Layout.Content>
                    <Card className='main-card' style={{ margin: '0 10px', body: { padding: 0 } }}>
                        {page}
                    </Card>
                    <Uploader open={openUploader} setOpen={setOpenUploader} url={url} collection_id={currentBucket !== null ? currentBucket.id : null} path={currentPath} token={tokenAuth} updateCollection={updateCollection} setCurrentCountUploading={setCurrentCountUploading} />
                </Layout.Content>
                <Layout.Footer style={{ padding: '10px 50px', textAlign: 'center', color: 'grey' }}>S3 File Manager © 2025 Created by Denis Mazur</Layout.Footer>
            </Layout>
        </AntApp>
    </ConfigProvider>
}

export default App
