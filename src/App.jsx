import { useState, useRef } from 'react'
import './App.css'
import FileManager from './file_manager/FileManager/FileManager'
import AuthPage from './auth/AuthPage'
import { getAllFilesAPI, downloadFile, deleteAPI, copyItemAPI, moveItemAPI, renameAPI, createFolderAPI, getBucketsAPI } from './api/api'
import ControlPanel from './control_panel/ControlPanel';
import { Button, Avatar, Dropdown, Select, Result, Flex, Space, Tag, ConfigProvider, App as AntApp } from 'antd';
import { LogoutOutlined, GroupOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { url } from "./url";
import ruRU from 'antd/locale/ru_RU';
import '@ant-design/v5-patch-for-react-19';
import Uploader from './uploader/Uploader'

function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [buckets, setBuckets] = useState([]);
    const [currentBucket, setCurrentBucket] = useState('');
    const [tokenAuth, setTokenAuth] = useState('');
    const [username, setUsername] = useState('');
    const [showControlPanel, setShowControlPanel] = useState(false);
    const pageControl = useRef(1);
    const copyCollection = useRef('');
    const [openUploader, setOpenUploader] = useState(false);
    const [currentPath, setCurrentPath] = useState('');

    const getFiles = async (bucket, token) => {
        setIsLoading(true);
        const response = await getAllFilesAPI(bucket, token);
        setIsLoading(false);
        if (response.status === 200) {
            if (response.data.length > 0) {
                setFiles(response.data);
            } else {
                setFiles([{}]);
            };
        }
    };

    async function updateCollection(collection_id) {
        if (collection_id === currentBucket.id) {
            const response = await getAllFilesAPI(currentBucket.name, tokenAuth);
            if (response.status === 200) {
                if (response.data.length > 0) {
                    setFiles(response.data);
                } else {
                    setFiles([{}]);
                };
            }
        }
    };

    const getBuckets = async (token) => {
        let result = [];
        setIsLoading(true);
        const response = await getBucketsAPI(token);
        setIsLoading(false);
        if (response.status === 200) {
            result = response.data;
            if (response.data.length > 0) {
                if (currentBucket === '') {
                    setCurrentBucket(result[0]);
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
        getFiles(currentBucket.name, tokenAuth);
    };

    const handleDownload = async (files) => {
        await downloadFile(files, currentBucket.name, tokenAuth);
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
        await getFiles(currentBucket.name, tokenAuth);
    };

    const handleError = (error, file) => {
        console.error(error);
    };

    // Delete File/Folder
    const handleDelete = async (files) => {
        setIsLoading(true);
        const response = await deleteAPI(currentBucket.name, files, tokenAuth);
        setIsLoading(false);
        if (response.status === 200) {
            await getFiles(currentBucket.name, tokenAuth);
        } else if (response.status === 500) {
            window.alert("Ошибка сервера. Обратитесь в службу поддержки!")
        }
    };

    const handleRename = async (file, newName) => {
        setIsLoading(true);
        await renameAPI(file.isDirectory ? file.path + '/' : file.path, newName, currentBucket.name, tokenAuth);
        await getFiles(currentBucket.name, tokenAuth);
    };

    // Create Folder
    const handleCreateFolder = async (name, parentFolder) => {
        setIsLoading(true);
        const response = await createFolderAPI(name, parentFolder !== null ? parentFolder.path : '/', currentBucket.name, tokenAuth);
        if (response.status === 200 || response.status === 201) {
            getFiles(currentBucket.name, tokenAuth);
        } else {
            console.error(response.data);
        }
        setIsLoading(false);
    };

    function handleCopy(files) {
        copyCollection.current = currentBucket;
    }

    function handleFolderChange(path) {
        setCurrentPath(path);
        console.log(path);
    }

    const handlePaste = async (copiedItems, destinationFolder, operationType) => {
        setIsLoading(true);
        let copiedFiles = [];
        for (const file of copiedItems) {
            if (file.isDirectory) {
                copiedFiles.push(file.path + '/');
            } else {
                copiedFiles.push(file.path);
            }
        }
        if (operationType === "copy") {
            const response = await copyItemAPI(copyCollection.current.id, copiedFiles, currentBucket.id, destinationFolder !== null ? destinationFolder.path : '/', tokenAuth);
            if (response.status === 403) {
                window.alert("Нет прав доступа!")
            }
            // } else {
            //     console.error(response);
            // }
        } else {
            const response = await moveItemAPI(copiedFiles, destinationFolder !== null ? destinationFolder.path : '/');
        }
        await getFiles(currentBucket.name, tokenAuth);
    };

    const handleBucket = async (id) => {
        const collection = buckets.find(item => item.id === id);
        setCurrentBucket(collection);
        document.querySelector('.breadcrumb > div:nth-child(3) > span:nth-child(1)').click();
        await getFiles(collection.name, tokenAuth);
    }

    const outAccount = () => {
        localStorage.setItem('token', '')
        localStorage.setItem('login', '')
        setShowControlPanel(false);
        setTokenAuth('');
        setBuckets([]);
        setCurrentBucket('');
        setFiles([{}]);
    }

    function showCtrlPanel() {
        setShowControlPanel(!showControlPanel);
    }

    function getCollectionItems() {
        const personItems = [];
        const accessItems = [];
        const groupItems = [];
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
            }
        }

        const result = [];
        if (personItems.length > 0) {
            result.push({ label: 'Персональные', options: personItems });
        }
        if (accessItems.length > 0) {
            result.push({ label: 'Получен доступ', options: accessItems });
        }
        if (groupItems.length > 0) {
            result.push({ label: 'Групповые', options: groupItems });
        }

        return result;
    }

    const items = [
        // {
        //     key: '1',
        //     label: 'Панель управления',
        //     icon: <SettingOutlined />,
        // },
        // {
        //     type: 'divider',
        // },
        {
            key: '2',
            label: 'Профиль',
            icon: <UserOutlined />,
        },
        {
            key: '3',
            label: 'Коллекции',
            icon: <GroupOutlined />,
        },
        {
            key: '4',
            label: 'Группы',
            icon: <TeamOutlined />,
        },
        {
            type: 'divider',
        },
        {
            key: '5',
            label: 'Выход',
            icon: <LogoutOutlined />,
        },
    ];

    function onClickLogin(e) {
        switch (e.key) {
            case '1':
                pageControl.current = '1';
                setShowControlPanel(!showControlPanel);
                break;
            case '2':
                pageControl.current = '1';
                setShowControlPanel(!showControlPanel);
                break;
            case '3':
                pageControl.current = '2';
                setShowControlPanel(!showControlPanel);
                break;
            case '4':
                pageControl.current = '3';
                setShowControlPanel(!showControlPanel);
                break;
            case '5':
                outAccount();
                break;
        }
    }

    async function auth(token, username) {
        setTokenAuth(token);
        setUsername(username);
        const buckets = await getBuckets(token);
        setBuckets(buckets);
        if (buckets.length > 0) {
            setCurrentBucket(buckets[0]);
            await getFiles(buckets[0].name, token);
        }
    }

    let page = 'auth';
    if (!(tokenAuth !== null && tokenAuth !== undefined && tokenAuth !== '')) {
        page = 'auth';
    } else if (showControlPanel) {
        page = 'controlPanel';
    } else {
        page = 'fileManager';
    }

    const permissions = [
        { create: true, upload: true, move: false, copy: true, rename: true, download: true, delete: true }, // owner
        { create: true, upload: true, move: false, copy: true, rename: true, download: true, delete: true }, // readwrite
        { create: false, upload: false, move: false, copy: false, rename: false, download: true, delete: false }, // readonly
        { create: true, upload: true, move: false, copy: false, rename: false, download: false, delete: false }, // writeonly
    ]

    switch (page) {
        case 'auth':
            page = <AuthPage authEvent={auth}></AuthPage>;
            break;
        case 'fileManager':
            page = <>
                <div className='header'>
                    <div className='header-right'>
                        <img height='40px' width='40px' src={'./favicon.svg'} />
                        <h1>S3 File Manager</h1>
                    </div>
                    <Space className='header-left'>
                        {
                            buckets.length > 0 && <>
                                {['', <Tag color='purple'>Чтение и запись</Tag>, <Tag color='orange'>Только чтение</Tag>, <Tag color='magenta'>Только запись</Tag>][currentBucket.access_type_id - 1]}
                                <Button id='upload-button' type="primary" onClick={() => setOpenUploader(true)}>Загрузки</Button>
                                <Select prefix="Коллекция" style={{ width: '200px' }} value={currentBucket.id} onChange={handleBucket} options={getCollectionItems()} />
                            </>
                        }
                        <Dropdown menu={{ items, onClick: onClickLogin }}>
                            <Button type="text" shape="circle">
                                <Avatar size={40} style={{ backgroundColor: 'SteelBlue' }}>{username}</Avatar>
                            </Button>
                        </Dropdown>
                    </Space>
                </div>
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
                        filePreviewPath={url + '/download?preview=true&bucket=' + currentBucket.name + '&token=' + tokenAuth + '&file='}
                        primaryColor='#1677ff'
                        permissions={currentBucket !== '' ? permissions[currentBucket.access_type_id - 1] : permissions[0]}
                        onFolderChange={handleFolderChange}
                    /> :
                    <Flex style={{ height: 'calc(100vh - 140px)' }} justify="center" align="center">
                        <Result
                            title="У вас нет доступных коллекций, но вы можете их создать!"
                            extra={
                                <Button
                                    onClick={
                                        () => {
                                            pageControl.current = '2';
                                            setShowControlPanel(!showControlPanel);
                                        }
                                    }
                                    type="primary">
                                    Перейти к созданию
                                </Button>
                            }
                        />
                    </Flex>
                }
            </>;
            break;
        case 'controlPanel':
            page = <ControlPanel page={pageControl.current} username={username} outAccount={outAccount} showCtrlPanel={showCtrlPanel} collections={buckets} token={tokenAuth} getCollections={getBuckets} />;
            break;

    }

    return <ConfigProvider locale={ruRU}>
        <AntApp>
            {page}
            <Uploader open={openUploader} setOpen={setOpenUploader} url={url + '/upload'} collection_id={currentBucket.id} path={currentPath} token={tokenAuth} updateCollection={updateCollection} />
        </AntApp>
    </ConfigProvider>
}

export default App
