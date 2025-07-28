import { AiOutlineClose } from "react-icons/ai";
import Progress from "../../../components/Progress/Progress";
import { getFileExtension } from "../../../utils/getFileExtension";
import { useFileIcons } from "../../../hooks/useFileIcons";
import { FaRegFile } from "react-icons/fa6";
import { useEffect, useRef } from "react";
import { getDataSize } from "../../../utils/getDataSize";
import { FaRegCheckCircle } from "react-icons/fa";
import { IoMdRefresh } from "react-icons/io";
import { useFiles } from "../../../contexts/FilesContext";
import { useTranslation } from "../../../contexts/TranslationProvider";
import { useFilesPersist } from "../../../contexts/FilesPersistContext";

const UploadItem = ({
  index,
  fileData,
  fileUploadConfig,
  onFileUploaded,
}) => {
  const { updateFile, removeFile } = useFilesPersist();
  const fileIcons = useFileIcons(33);
  const xhrRef = useRef();
  const { onError } = useFiles();
  const t = useTranslation();

  const handleUploadError = (xhr) => {
    const error = {
      type: "upload",
      message: t("uploadFail"),
      response: {
        status: xhr.status,
        statusText: xhr.statusText,
        data: xhr.response,
      },
    };

    updateFile(index, {
      uploadProgress: 0,
      uploading: false,
      error: error.message,
      uploaded: false,
    });

    onError(error, fileData.file);
  };

  const fileUpload = (fileData) => {
    if (!!fileData.error) return;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      updateFile(index, {
        uploading: true,
        uploadProgress: 0,
        error: null,
      });

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          updateFile(index, { uploadProgress: progress });
        }
      };

      xhr.onload = () => {
        updateFile(index, { uploading: false });
        if (xhr.status === 200 || xhr.status === 201) {
          updateFile(index, {
            uploaded: true,
            uploadProgress: 100,
          });
          onFileUploaded?.(xhr.response);
          resolve(xhr.response);
        } else {
          reject(xhr.statusText);
          handleUploadError(xhr);
        }
      };

      xhr.onerror = () => {
        reject(xhr.statusText);
        handleUploadError(xhr);
      };

      const method = fileUploadConfig?.method || "POST";
      xhr.open(method, fileUploadConfig?.url, true);
      const headers = fileUploadConfig?.headers;
      for (let key in headers) {
        xhr.setRequestHeader(key, headers[key]);
      }

      const formData = new FormData();
      const appendData = fileData?.appendData;
      for (let key in appendData) {
        appendData[key] && formData.append(key, appendData[key]);
      }
      formData.append("file", fileData.file);

      xhr.send(formData);
    });
  };

  useEffect(() => {
    if (!xhrRef.current && !fileData.uploaded && !fileData.uploading && !fileData.error) {
      fileUpload(fileData);
    }
  }, []);

  const handleAbortUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      updateFile(index, {
        uploading: false,
        canceled: true,
        uploadProgress: 0,
      });
    }
  };

  const handleRetry = () => {
    updateFile(index, {
      error: null,
      canceled: false,
      uploaded: false,
    });
    fileUpload({ ...fileData, error: null });
  };

  if (fileData.removed) return null;

  return (
    <li>
      <div className="file-icon">
        {fileIcons[getFileExtension(fileData.file?.name)] ?? <FaRegFile size={33} />}
      </div>
      <div className="file">
        <div className="file-details">
          <div className="file-info">
            <span className="file-name text-truncate" title={fileData.file?.name}>
              {fileData.file?.name}
            </span>
            <span className="file-size">{getDataSize(fileData.file?.size)}</span>
          </div>
          {fileData.uploaded ? (
            <FaRegCheckCircle title={t("uploaded")} className="upload-success" />
          ) : fileData.canceled || fileData.error ? (
            <IoMdRefresh className="retry-upload" title="Retry" onClick={handleRetry} />
          ) : (
            <div
              className="rm-file"
              title={fileData.error ? t("Remove") : t("abortUpload")}
              onClick={fileData.error ? () => removeFile(index) : handleAbortUpload}
            >
              <AiOutlineClose />
            </div>
          )}
        </div>
        <Progress
          percent={fileData.uploadProgress || 0}
          isCanceled={fileData.canceled}
          isCompleted={fileData.uploaded}
          error={fileData.error}
        />
      </div>
    </li>
  );
};

export default UploadItem;
