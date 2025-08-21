import { useState, useEffect, useRef } from 'react'
import './App.css'
import FileManager from './file_manager/FileManager/FileManager'
import { getAllFilesAPI, downloadFile, deleteAPI, copyItemAPI, moveItemAPI, renameAPI, createFolderAPI, getBucketsAPI, authAPI, checkTokenAPI } from './api/api'
import ControlPanel from './control_panel/ControlPanel';
import { Button, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { Avatar, Dropdown, Select, Result, Flex } from 'antd';
import { SettingOutlined, LogoutOutlined, GroupOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { url } from "./url";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [buckets, setBuckets] = useState([]);
  const [currentBucket, setCurrentBucket] = useState('');
  const [tokenAuth, setTokenAuth] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showControlPanel, setShowControlPanel] = useState(false);
  const pageControl = useRef(1);

  useEffect(() => {
    const fun = async () => {
      const token = await checkTokenAPI(localStorage.getItem('token'));
      const login = localStorage.getItem('login');
      setTokenAuth(token);
      setUsername(login);
      if (token !== null) {
        const buckets = await getBuckets(token);
        if (buckets.length > 0) {
          setCurrentBucket(buckets[0]);
          await getFiles(buckets[0].name, token);
        }
      }
    }
    fun();
  }, []);

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

  const getBuckets = async (token) => {
    let result = [];
    setIsLoading(true);
    const response = await getBucketsAPI(token);
    setIsLoading(false);
    if (response.status === 200) {
      result = response.data;
      if (response.data.length > 0) {
        if (currentBucket === '') {
          setCurrentBucket(result[0])
        }
      }
    } else if (response.status === 500) {
      window.alert("Ошибка сервера. Обратитесь в службу поддержки!")
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
    console.log(file)
    return { bucket: currentBucket.name, path: parentFolder !== null ? parentFolder.path : '/', token: tokenAuth };
  };

  const handleFileUploaded = async (response) => {
    console.log(response)
    // const uploadedFile = JSON.parse(response);
    // setFiles((prev) => [...prev, uploadedFile]);
    await getFiles(currentBucket.name, tokenAuth)
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
      const response = await copyItemAPI(currentBucket.name, copiedFiles, destinationFolder !== null ? destinationFolder.path : '/', tokenAuth);
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

  const auth = async (event) => {
    event.preventDefault();
    const response = await authAPI(username, password);
    if (response.status === 200) {
      const token = response.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('login', response.data.login);
      if (token !== null && token !== '') {
        setTokenAuth(token);
        setUsername(response.data.login);
        const buckets = await getBuckets(token);
        setBuckets(buckets);
        if (buckets.length > 0) {
          setCurrentBucket(buckets[0]);
          await getFiles(buckets[0].name, token);
        }
      }
    } else if (response.status === 401) {
      window.alert("Неверно введен логин или пароль!")
    } else if (response.status === 500) {
      window.alert("Ошибка сервера. Обратитесь в службу поддержки!")
    }
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
    {
      key: '1',
      label: 'Панель управления',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
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
        pageControl.current = '3';
        setShowControlPanel(!showControlPanel);
        break;
      case '3':
        pageControl.current = '1';
        setShowControlPanel(!showControlPanel);
        break;
      case '4':
        pageControl.current = '2';
        setShowControlPanel(!showControlPanel);
        break;
      case '5':
        outAccount();
        break;
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
      return (
        <div className='auth-page'>
          <div className="auth-container">
            <div className="auth-header">
              <h2>Вход в систему</h2>
            </div>

            <form onSubmit={auth}>
              <div className="form-group">
                <label htmlFor="username">Имя пользователя</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  placeholder="Введите ваш логин"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)} // Обновляем состояние при вводе
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Пароль</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  placeholder="Введите ваш пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} // Обновляем состояние при вводе
                />
              </div>

              <button type="submit" className="auth-button">Войти</button>
            </form>
          </div>
        </div>
      );
    case 'fileManager':
      return (
        <>
          <div className='header'>
            <h1>S3 File Manager</h1>
            <div className='header-left'>
              {buckets.length > 0 && <Select style={{ width: '200px' }} value={currentBucket.id} onChange={handleBucket} options={getCollectionItems()} />}
              <Dropdown menu={{ items, onClick: onClickLogin }}>
                <Button type="text" shape="circle">
                  <Avatar size={40} style={{ backgroundColor: 'SteelBlue' }}>{username}</Avatar>
                </Button>
              </Dropdown>
            </div>
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
              onPaste={handlePaste}
              onRename={handleRename}
              onFileUploading={handleFileUploading}
              onFileUploaded={handleFileUploaded}
              onCreateFolder={handleCreateFolder}
              fileUploadConfig={{ url: url, method: 'PUT' }}
              defaultNavExpanded={!window.matchMedia('(pointer:coarse)').matches}
              collapsibleNav={true}
              filePreviewPath={url + '/download?bucket=' + currentBucket.name + '&token=' + tokenAuth + '&file='}
              primaryColor='SteelBlue'
              permissions={currentBucket !== '' ? permissions[currentBucket.access_type_id - 1] : permissions[0]}
            /> :
            <Flex style={{ height: 'calc(100vh - 140px)' }} justify="center" align="center">
              <Result
                title="У вас нет доступных коллекций! Можете создать их в панели управления!"
                extra={
                  <Button onClick={() => setShowControlPanel(!showControlPanel)} type="primary">
                    Перейти в панель управления
                  </Button>
                }
              />
            </Flex>
          }
        </>
      );
    case 'controlPanel':
      return (
        <ConfigProvider locale={ruRU}>
          <ControlPanel page={pageControl.current} username={username} outAccount={outAccount} showCtrlPanel={showCtrlPanel} collections={buckets} token={tokenAuth} getCollections={getBuckets} />
        </ConfigProvider>
      );
  }
}

export default App
