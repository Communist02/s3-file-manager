import { useState, useEffect } from 'react'
import './App.css'
import FileManager from './file_manager/FileManager/FileManager'
import { getAllFilesAPI } from './api/getAllFilesAPI'
import { downloadFile } from './api/downloadFileAPI'
import { deleteAPI } from './api/deleteAPI'
import { copyItemAPI, moveItemAPI } from "./api/fileTransferAPI";
import { renameAPI } from "./api/renameAPI";
import { createFolderAPI } from "./api/createFolderAPI";


function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);

  useEffect(() => { getFiles(); }, []);

  const getFiles = async () => {
    setIsLoading(true);
    const response = await getAllFilesAPI();
    if (response.status === 200) {
      if (response.data != '[]') setFiles(JSON.parse(response.data));
      else {
        setFiles([{}]);
      };
    }
    setIsLoading(false);
  };

  // Refresh Files
  const handleRefresh = () => {
    getFiles();
  };

  const handleDownload = async (files) => {
    await downloadFile(files);
  };

  // File Upload Handlers
  const handleFileUploading = (file, parentFolder) => {
    console.log(file)
    // console.log(parentFolder)
    return { path: parentFolder !== null ? parentFolder.path : '/' };
  };

  const handleFileUploaded = async (response) => {
    console.log(response)
    // const uploadedFile = JSON.parse(response);
    // setFiles((prev) => [...prev, uploadedFile]);
    await getFiles()
  };

  const handleError = (error, file) => {
    console.error(error);
  };

  // Delete File/Folder
  const handleDelete = async (files) => {
    setIsLoading(true);
    const response = await deleteAPI(files);
    if (response.status === 200) {
      await getFiles();
    } else {
      setIsLoading(false);
    }
  };

  const handleRename = async (file, newName) => {
    setIsLoading(true);
    await renameAPI(file.isDirectory ? file.path + '/' : file.path, newName);
    await getFiles();
  };

  // Create Folder
  const handleCreateFolder = async (name, parentFolder) => {
    setIsLoading(true);
    const response = await createFolderAPI(name, parentFolder !== null ? parentFolder.path : '/');
    if (response.status === 200 || response.status === 201) {
      getFiles()
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
      const response = await copyItemAPI(copiedFiles, destinationFolder !== null ? destinationFolder.path : '/');
    } else {
      const response = await moveItemAPI(copiedFiles, destinationFolder !== null ? destinationFolder.path : '/');
    }
    await getFiles();
  };

  return (
    <>
      <div className='header'>
        <h1>S3 File Manager</h1>
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
