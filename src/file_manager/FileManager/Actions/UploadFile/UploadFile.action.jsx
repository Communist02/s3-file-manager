import { useRef, useState } from "react";
import { Button }  from "antd";
import { AiOutlineCloudUpload } from "react-icons/ai";
import UploadItem from "./UploadItem";
import Loader from "../../../components/Loader/Loader";
import { useFileNavigation } from "../../../contexts/FileNavigationContext";
import { getFileExtension } from "../../../utils/getFileExtension";
import { getDataSize } from "../../../utils/getDataSize";
import { useFiles } from "../../../contexts/FilesContext";
import { useTranslation } from "../../../contexts/TranslationProvider";
import "./UploadFile.action.scss";
import { useFilesPersist } from "../../../contexts/FilesPersistContext";

const UploadFileAction = ({
  fileUploadConfig,
  maxFileSize,
  acceptedFileTypes,
  onFileUploading,
  onFileUploaded,
}) => {
  const {
    files,
    setFiles,
    updateFile,
    removeFile,
    resetFiles,
    addFiles
  } = useFilesPersist();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState({});
  const { currentFolder, currentPathFiles } = useFileNavigation();
  const { onError } = useFiles();
  const fileInputRef = useRef(null);
  const t = useTranslation();

  // To open choose file if the "Choose File" button is focused and Enter key is pressed
  const handleChooseFileKeyDown = (e) => {
    if (e.key === "Enter") {
      fileInputRef.current.click();
    }
  };

  const checkFileError = (file) => {
    if (acceptedFileTypes) {
      const extError = !acceptedFileTypes.includes(getFileExtension(file.name));
      if (extError) return t("fileTypeNotAllowed");
    }

    // const fileExists = currentPathFiles.some(
    //   (item) => item.name.toLowerCase() === file.name.toLowerCase() && !item.isDirectory
    // );
    // if (fileExists) return t("fileAlreadyExist");

    const sizeError = maxFileSize && file.size > maxFileSize;
    if (sizeError) return `${t("maxUploadSize")} ${getDataSize(maxFileSize, 0)}.`;
  };

  const setSelectedFiles = (selectedFiles) => {
    // selectedFiles = selectedFiles.filter(
    //   (item) =>
    //     !files.some((fileData) => fileData.file.name.toLowerCase() === item.name.toLowerCase())
    // );

    if (selectedFiles.length > 0) {
      const newFiles = selectedFiles.map((file) => {
        const appendData = onFileUploading(file, currentFolder);
        const error = checkFileError(file);
        error && onError({ type: "upload", message: error }, file);
        return {
          file,
          appendData,
          error: error || null,
          restored: false,
          removed: false,
          uploaded: false,
          uploading: false,
          canceled: false,
          hidden: false,
          uploadProgress: 0,
        };
      });
      addFiles(newFiles);
    }
  };

  // const traverseFileTree = (item) => {
  //   return new Promise((resolve) => {
  //     if (item.isFile) {
  //       item.file((file) => resolve([file]));
  //     } else if (item.isDirectory) {
  //       const dirReader = item.createReader();
  //       const entries = [];

  //       const readEntries = () => {
  //         dirReader.readEntries(async (results) => {
  //           if (!results.length) {
  //             const nestedFiles = await Promise.all(
  //               entries.map((entry) => traverseFileTree(entry))
  //             );
  //             resolve(nestedFiles.flat());
  //           } else {
  //             entries.push(...results);
  //             readEntries();
  //           }
  //         });
  //       };

  //       readEntries();
  //     } else {
  //       resolve([]);
  //     }
  //   });
  // };

  // Todo: Also validate allowed file extensions on drop
  // const handleDrop = (e) => {
  //   e.preventDefault();
  //   setIsDragging(false);
  //   const droppedItems = Array.from(e.dataTransfer.items);
  //   const filePromises = [];

  //   droppedItems.forEach((item) => {
  //     const entry = item.webkitGetAsEntry?.();
  //     if (entry) {
  //       filePromises.push(traverseFileTree(entry));
  //     }
  //   });

  //   Promise.all(filePromises).then((nestedFiles) => {
  //     const flatFiles = nestedFiles.flat();
  //     setSelectedFiles(flatFiles);
  //   });
  // };

  const handleChooseFile = (e) => {
    const choosenFiles = Array.from(e.target.files);
    setSelectedFiles(choosenFiles);
  };

  const handleChooseFolder = (e) => {
    const choosenFiles = Array.from(e.target.files);
    setSelectedFiles(choosenFiles);
  };

  const handleFileRemove = (index) => {
    removeFile(index);
  };

  return (
    <div className={`fm-upload-file ${files.length > 0 ? "file-selcted" : ""}`}>
      <div className="select-files">
        <div
          className={`draggable-file-input ${isDragging ? "dragging" : ""}`}
          // onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
        >
          <div className="input-text">
            <AiOutlineCloudUpload size={30} />
            <span>{t("dragFileToUpload")}</span>
          </div>
        </div>
        <div className="btn-choose-file">
          <Button type="primary" onKeyDown={handleChooseFileKeyDown}>
            <label htmlFor="chooseFile">{t("chooseFile")}</label>
            <input
              ref={fileInputRef}
              type="file"
              id="chooseFile"
              className="choose-file-input"
              onChange={handleChooseFile}
              multiple
              accept={acceptedFileTypes}
            />
          </Button>

          <Button type="primary">
            <label htmlFor="chooseFolder">{t("chooseFolder")}</label>
            <input
              ref={fileInputRef}
              type="file"
              id="chooseFolder"
              className="choose-file-input"
              onChange={handleChooseFolder}
              accept={acceptedFileTypes}
              webkitdirectory="true"
            />
          </Button>
        </div>
      </div>
      {files.length > 0 && (
        <div className="files-progress">
          <div className="heading">
            {Object.values(isUploading).some((fileUploading) => fileUploading) ? (
              <>
                <h2>{t("uploading")}</h2>
                <Loader loading={true} className="upload-loading" />
              </>
            ) : (
              <h2>{t("completed")}</h2>
            )}
          </div>
          <ul>
            {files.map((fileData, index) =>
              !fileData.hidden ? (
                <UploadItem
                  key={index}
                  index={index}
                  fileData={fileData}
                  fileUploadConfig={fileUploadConfig}
                  onFileUploaded={onFileUploaded}
                />
              ) : null
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadFileAction;
