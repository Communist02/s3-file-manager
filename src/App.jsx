import { useState, useRef } from 'react'
import './App.css'
import FileManager from './file_manager/FileManager/FileManager'
import AuthPage from './auth/AuthPage'
import { getAllFilesAPI, downloadFile, deleteAPI, copyItemAPI, moveItemAPI, renameAPI, createFolderAPI, getBucketsAPI, createCollection } from './api/api'
import ControlPanel from './control_panel/ControlPanel';
import { Button, Avatar, Dropdown, Select, Result, Flex, Space, Tag, ConfigProvider, App as AntApp, theme, Layout, Card, Drawer, Divider, message, Modal, Input, FloatButton } from 'antd';
import { LogoutOutlined, TeamOutlined, UserOutlined, HistoryOutlined, UploadOutlined, SunOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons';
import { url } from "./url";
import ruRU from 'antd/locale/ru_RU';
import '@ant-design/v5-patch-for-react-19';
import Uploader from './uploader/Uploader'
import Logs from './logsView/Logs'
import History from './historyView/History'
import CollectionPage from './control_panel/CollectionPage'
import ProfilePage from './control_panel/ProfilePage'

function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [buckets, setBuckets] = useState([]);
    const [currentBucket, setCurrentBucket] = useState('');
    const [tokenAuth, setTokenAuth] = useState('');
    const [username, setUsername] = useState('');
    const [showControlPanel, setShowControlPanel] = useState(false);
    const copyCollection = useRef('');
    const [openUploader, setOpenUploader] = useState(false);
    const [openLogs, setOpenLogs] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [openCollection, setOpenCollection] = useState(false);
    const [openHistory, setOpenHistory] = useState(false);
    const [currentPath, setCurrentPath] = useState('');
    const [darkTheme, setDarkTheme] = useState(localStorage.getItem('darkTheme') === 'true');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [currentCountUploading, setCurrentCountUploading] = useState(0);

    const getFiles = async (collection, token) => {
        setIsLoading(true);
        const response = await getAllFilesAPI(collection.id, token);
        setIsLoading(false);
        if (response.status === 200) {
            if (response.data.length > 0) {
                setFiles(response.data);
            } else {
                setFiles([{}]);
            };
        }
    };

    async function updateCollection(collection_id, path = '') {
        if (collection_id === currentBucket.id) {
            const response = await getAllFilesAPI(currentBucket.id, tokenAuth, path);
            if (response.status === 200) {
                if (response.data.length > 0) {
                    setFiles(response.data);
                } else {
                    setFiles([{}]);
                };
            }
        }
    };

    const getBuckets = async (token, clear = false) => {
        let result = [];
        setIsLoading(true);
        const response = await getBucketsAPI(token);
        setIsLoading(false);
        if (response.status === 200) {
            result = response.data;
            if (response.data.length > 0) {
                if (currentBucket === '' || clear) {
                    setCurrentBucket(result[0]);
                }
                if (clear) {
                    getFiles(result[0], token);
                }
            }
        } else if (response.status === 500) {
            window.alert("Ошибка сервера. Обратитесь в службу поддержки!");
        }
        setBuckets(result);
        return result;
    }

    // Refresh Files
    const handleRefresh = () => {
        getFiles(currentBucket, tokenAuth);
    };

    const handleDownload = async (files) => {
        await downloadFile(files, currentBucket.id, tokenAuth);
    };

    // File Upload Handlers
    const handleFileUploading = (file, parentFolder) => {
        console.log(file);
        return { bucket: currentBucket.name, path: parentFolder !== null ? parentFolder.path : '/', token: tokenAuth };
    };

    const handleFileUploaded = async (response) => {
        console.log(response);
        // const uploadedFile = JSON.parse(response);
        // setFiles((prev) => [...prev, uploadedFile]);
        await getFiles(currentBucket, tokenAuth);
    };

    const handleError = (error, file) => {
        console.error(error);
    };

    // Delete File/Folder
    const handleDelete = async (files) => {
        setIsLoading(true);
        const response = await deleteAPI(currentBucket.id, files, tokenAuth);
        setIsLoading(false);
        if (response.status === 200) {
            await getFiles(currentBucket, tokenAuth);
            message.success(`Успешно удалено!`);
        } else if (response.status === 500) {
            window.alert("Ошибка сервера. Обратитесь в службу поддержки!");
        }
    };

    const handleRename = async (file, newName) => {
        setIsLoading(true);
        await renameAPI(file.isDirectory ? file.path + '/' : file.path, newName, currentBucket.id, tokenAuth);
        await getFiles(currentBucket, tokenAuth);
    };

    // Create Folder
    const handleCreateFolder = async (name, parentFolder) => {
        setIsLoading(true);
        const response = await createFolderAPI(name, parentFolder !== null ? parentFolder.path : '/', currentBucket.id, tokenAuth);
        if (response.status === 200 || response.status === 201) {
            getFiles(currentBucket, tokenAuth);
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

    function handleFolderChange(path) {
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
        if (operationType === "copy") {
            setIsLoading(true);
            const response = await copyItemAPI(copyCollection.current.id, copiedFiles, currentBucket.id, destinationFolder !== null ? destinationFolder.path : '/', tokenAuth);
            setIsLoading(false);
            if (response.status === 200) {
                message.success('Файлы успешно скопированы!');
                await getFiles(currentBucket, tokenAuth);
            } else if (response.status === 403) {
                message.error('Нет прав на копирование!');
            }
        }
    };

    const handleBucket = async (id, collections = null) => {
        let collection;
        if (collections !== null) {
            collection = collections.find(item => item.id === id);
        } else {
            collection = buckets.find(item => item.id === id);
        }
        try {
            document.querySelector('.breadcrumb > div:nth-child(3) > span:nth-child(1)').click();
        } catch (error) {
            console.error(error);
        }
        setCurrentBucket(collection);
        await getFiles(collection, tokenAuth);
    }

    const outAccount = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('login');
        setShowControlPanel(false);
        setTokenAuth('');
        setBuckets([]);
        setCurrentBucket('');
        setFiles([{}]);
    }

    function showCtrlPanel() {
        setShowControlPanel(!showControlPanel);
    }

    const handleOk = async () => {
        let response = await createCollection(newCollectionName, tokenAuth);
        if (response.status === 200) {
            setIsModalOpen(false);
            message.success('Коллекция успешно создана!');
            const collections = await getBuckets(tokenAuth);
            setNewCollectionName('');
            await handleBucket(response.data, collections);
        } else if (response.status === 406) {
            message.error('Имя может содержать только латинские буквы и цифры!');
        } else {
            message.error('Произошла ошибка! ' + response);
        }
    };

    function getCollectionItems() {
        const personItems = [];
        const accessItems = [];
        const groupItems = [];
        const accessToAllItems = [];
        const collections = buckets;

        for (let i = 0; i < collections.length; i++) {
            const item = {
                label: collections[i].name || collection[i].id,
                value: collections[i].id,
            };

            switch (collections[i].type) {
                case 'person': personItems.push(item); break;
                case 'access': accessItems.push(item); break;
                case 'group': groupItems.push(item); break;
                case 'access_to_all': accessToAllItems.push(item); break;
            }
        }

        const result = [];
        if (personItems.length > 0) {
            result.push({ label: 'Вы владелец', options: personItems });
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
                localStorage.setItem('darkTheme', !darkTheme);
                setDarkTheme(!darkTheme);
                break;
            case 'exit':
                outAccount();
                break;
        }
    }

    async function auth(token, username) {
        setTokenAuth(token);
        setUsername(username);
        const buckets = await getBuckets(token, true);
        setBuckets(buckets);
    }

    let page = 'auth';
    if (!(tokenAuth !== null && tokenAuth !== undefined && tokenAuth !== '')) {
        page = 'auth';
    } else {
        page = 'fileManager';
    }

    const permissions = [
        { create: true, upload: true, move: false, copy: true, rename: true, download: true, delete: true }, // owner
        { create: true, upload: true, move: false, copy: true, rename: true, download: true, delete: true }, // readwrite
        { create: false, upload: false, move: false, copy: true, rename: false, download: true, delete: false }, // readonly
        { create: true, upload: true, move: false, copy: false, rename: false, download: false, delete: false }, // writeonly
    ]

    switch (page) {
        case 'auth':
            page = <AuthPage authEvent={auth} />;
            break;
        case 'fileManager':
            page = <>
                <Modal
                    title="Создание коллекции"
                    open={isModalOpen}
                    onOk={handleOk}
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
                        onFileUploading={handleFileUploading}
                        onFileUploaded={handleFileUploaded}
                        onCreateFolder={handleCreateFolder}
                        fileUploadConfig={{ url: url, method: 'PUT' }}
                        defaultNavExpanded={!window.matchMedia('(pointer:coarse)').matches}
                        collapsibleNav={true}
                        filePreviewPath={url + `/collections/${currentBucket.id}/file/${tokenAuth}?preview=true`}
                        primaryColor='#1677ff'
                        permissions={currentBucket !== '' ? permissions[currentBucket.access_type_id - 1] : permissions[0]}
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
            break;
    }

    return <ConfigProvider locale={ruRU} theme={{
        components: { Layout: { headerBg: '#00000000' } },
        algorithm: darkTheme && theme.darkAlgorithm,
    }}>
        <AntApp>
            <Layout>
                {tokenAuth !== null && tokenAuth !== undefined && tokenAuth !== '' && <Layout.Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}>
                    <Button type='text' style={{ height: 60, padding: 0, }} className='header-right' onClick={() => onClickLogin({ key: 'fileManager' })}>
                        <img height='40px' width='40px' src={'./favicon.svg'} />
                        <h1>S3 File Manager</h1>
                    </Button>
                    <Space className='header-left'>
                        {
                            buckets.length > 0 && !showControlPanel && <>
                                <FloatButton id='upload-button' type='primary' badge={{ count: currentCountUploading }} icon={<UploadOutlined />} onClick={() => setOpenUploader(true)} tooltip='Загрузки' />
                                {['', <Tag color='purple'>Чтение и запись</Tag>, <Tag color='orange'>Только чтение</Tag>, <Tag color='magenta'>Только запись</Tag>][currentBucket.access_type_id - 1]}
                                <Select prefix="Коллекция" style={{ width: '200px' }} value={currentBucket.id} onChange={(id) => handleBucket(id)} options={getCollectionItems()} popupRender={(menu) => (
                                    <>
                                        {menu}
                                        <Divider style={{ margin: '8px 0' }} />
                                        <Flex vertical gap={3} style={{ width: '100%' }}>
                                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} >
                                                Создать коллекцию
                                            </Button>
                                            <Button icon={<HistoryOutlined />} onClick={() => setOpenHistory(true)}>История</Button>
                                            <Button icon={<SettingOutlined />} onClick={() => setOpenCollection(true)}>Управление</Button>
                                        </Flex>
                                    </>
                                )} />
                            </>
                        }
                        <Dropdown trigger={['click']} menu={{ items, onClick: onClickLogin }}>
                            <Button type="text" shape="circle">
                                <Avatar size={40} style={{ backgroundColor: '#1677ff' }}>{username}</Avatar>
                            </Button>
                        </Dropdown>
                    </Space>
                    <Logs open={openLogs} setOpen={setOpenLogs} token={tokenAuth} />
                    <History collection_id={currentBucket.id} token={tokenAuth} open={openHistory} setOpen={setOpenHistory} />
                    <Drawer size='large' open={openCollection} onClose={() => setOpenCollection(false)}>
                        {openCollection && <CollectionPage collection={currentBucket} setCurrentCollection={setCurrentBucket} token={tokenAuth} getCollections={getBuckets} open={openCollection} setOpen={setOpenCollection} />}
                    </Drawer>
                    <Drawer title='Профиль' size='large' open={openProfile} onClose={() => setOpenProfile(false)}>
                        <ProfilePage token={tokenAuth} />
                    </Drawer>
                    <Drawer title='Группы' styles={{ body: { padding: 0 } }} width={1080} open={showControlPanel} onClose={() => setShowControlPanel(false)}>
                        {showControlPanel && <ControlPanel token={tokenAuth} getCollections={getBuckets} />}
                    </Drawer>
                </Layout.Header>}
                <Layout.Content>
                    <Card className='main-card' style={{ margin: '0 10px', body: { padding: 0 } }}>
                        {page}
                    </Card>
                    <Uploader open={openUploader} setOpen={setOpenUploader} url={url} collection_id={currentBucket.id} path={currentPath} token={tokenAuth} updateCollection={updateCollection} setCurrentCountUploading={setCurrentCountUploading} />
                </Layout.Content>
                <Layout.Footer style={{ padding: '10px 50px', textAlign: 'center', color: 'grey' }}>S3 File Manager © 2025 Created by Denis Mazur</Layout.Footer>
            </Layout>
        </AntApp>
    </ConfigProvider>
}

export default App
