import { useState, useEffect } from 'react'
import './App.css'
import FileManager from './file_manager/FileManager/FileManager'
import { getAllFilesAPI } from './api/getAllFilesAPI'
import { downloadFile } from './api/downloadFileAPI'
import { deleteAPI } from './api/deleteAPI'
import { copyItemAPI, moveItemAPI } from "./api/fileTransferAPI";
import { renameAPI } from "./api/renameAPI";
import { createFolderAPI } from "./api/createFolderAPI";
import { getBucketsAPI } from "./api/getBucketsAPI";


function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [buckets, setBuckets] = useState([]);
  const [currentBucket, setCurrentBucket] = useState('');

  useEffect(() => {
    const fun = async () => {
      const buckets = await getBuckets();
      setCurrentBucket(buckets[0]);
      await getFiles(buckets[0]);
    }
    fun();
  }, []);

  const getFiles = async (bucket) => {
    setIsLoading(true);
    const response = await getAllFilesAPI(bucket);
    if (response.status === 200) {
      if (response.data != '[]') {
        setFiles(JSON.parse(response.data));
      } else {
        setFiles([{}]);
      };
    }
    setIsLoading(false);
  };

  const getBuckets = async () => {
    setIsLoading(true);
    let result = [''];
    const response = await getBucketsAPI();
    if (response.status === 200) {
      if (response.data != '[]') {
        result = JSON.parse(response.data);
      }
    }
    setBuckets(result);
    setIsLoading(false);
    return result;
  }

  // Refresh Files
  const handleRefresh = () => {
    getFiles(currentBucket);
  };

  const handleDownload = async (files) => {
    await downloadFile(files, currentBucket);
  };

  // File Upload Handlers
  const handleFileUploading = (file, parentFolder) => {
    console.log(file)
    // console.log(parentFolder)
    return { bucket: currentBucket, path: parentFolder !== null ? parentFolder.path : '/' };
  };

  const handleFileUploaded = async (response) => {
    console.log(response)
    // const uploadedFile = JSON.parse(response);
    // setFiles((prev) => [...prev, uploadedFile]);
    await getFiles(currentBucket)
  };

  const handleError = (error, file) => {
    console.error(error);
  };

  // Delete File/Folder
  const handleDelete = async (files) => {
    setIsLoading(true);
    const response = await deleteAPI(currentBucket, files);
    if (response.status === 200) {
      await getFiles(currentBucket);
    } else {
      setIsLoading(false);
    }
  };

  const handleRename = async (file, newName) => {
    setIsLoading(true);
    await renameAPI(file.isDirectory ? file.path + '/' : file.path, newName, currentBucket);
    await getFiles(currentBucket);
  };

  // Create Folder
  const handleCreateFolder = async (name, parentFolder) => {
    setIsLoading(true);
    const response = await createFolderAPI(name, parentFolder !== null ? parentFolder.path : '/', currentBucket);
    if (response.status === 200 || response.status === 201) {
      getFiles(currentBucket)
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
      const response = await copyItemAPI(currentBucket, copiedFiles, destinationFolder !== null ? destinationFolder.path : '/');
    } else {
      const response = await moveItemAPI(copiedFiles, destinationFolder !== null ? destinationFolder.path : '/');
    }
    await getFiles(currentBucket);
  };

  const handleBucket = async (e) => {
    setCurrentBucket(e.target.value);
    await getFiles(e.target.value);
  }

  function SelectList({ items, value }) {
    return (
      <select value={value} className='select-bucket' onChange={handleBucket} >
        {items.map((item, index) => (
          <option key={index} value={item}>
            {item}
          </option>
        ))}
      </select>
    );
  }

  return (
    <>
      <div className='header'>
        <h1>S3 File Manager</h1>
        <div className='header-left'>
          <SelectList items={buckets} value={currentBucket} />
        </div>
      </div>
      <FileManager
        files={files}
        language='ru'
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onError={handleError}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onPaste={handlePaste}
        onRename={handleRename}
        onFileUploading={handleFileUploading}
        onFileUploaded={handleFileUploaded}
        onCreateFolder={handleCreateFolder}
        fileUploadConfig={{ url: 'http://127.0.0.1:8000', method: 'PUT' }}
        defaultNavExpanded={!window.matchMedia('(pointer:coarse)').matches}
        collapsibleNav={true}
        filePreviewPath={'http://127.0.0.1:8000/download?file='}
        primaryColor='SteelBlue'
        permissions={{ create: true, upload: true, move: false, copy: true, rename: true, download: true, delete: true }}
      />
    </>
  )
}

export default App
