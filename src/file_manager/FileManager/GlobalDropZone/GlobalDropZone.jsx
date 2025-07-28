import { useEffect, useState, useRef } from "react";
import "./GlobalDropZone.css";
import { useFilesPersist } from "../../contexts/FilesPersistContext";
import { getFileExtension } from "../../utils/getFileExtension";
import { getDataSize } from "../../utils/getDataSize";
import { useFileNavigation } from "../../contexts/FileNavigationContext";
import { useTranslation } from "../../contexts/TranslationProvider";

const traverseFileTree = (item) => {
  return new Promise((resolve) => {
    if (item.isFile) {
      item.file((file) => resolve([file]));
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      const entries = [];

      const readEntries = () => {
        dirReader.readEntries(async (results) => {
          if (!results.length) {
            const nested = await Promise.all(entries.map(traverseFileTree));
            resolve(nested.flat());
          } else {
            entries.push(...results);
            readEntries();
          }
        });
      };

      readEntries();
    } else {
      resolve([]);
    }
  });
};

const GlobalDropZone = ({ onFileUploading, acceptedFileTypes, maxFileSize, triggerAction }) => {
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const { currentFolder } = useFileNavigation();
  const { addFiles } = useFilesPersist();
  const t = useTranslation();

  const checkFileError = (file) => {
    if (acceptedFileTypes) {
      const extError = !acceptedFileTypes.includes(getFileExtension(file.name));
      if (extError) return t("fileTypeNotAllowed");
    }

    const sizeError = maxFileSize && file.size > maxFileSize;
    if (sizeError) return `${t("maxUploadSize")} ${getDataSize(maxFileSize, 0)}.`;
  };

  const onFilesDrop = (files) => {
    setSelectedFiles(files);
    triggerAction.show("uploadFile");
  }

  const setSelectedFiles = (selectedFiles) => {
    if (selectedFiles.length > 0) {
      const newFiles = selectedFiles.map((file) => {
        const appendData = onFileUploading(file, currentFolder);
        const error = checkFileError(file);
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

  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current++;
      setDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) setDragging(false);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);

      const items = Array.from(e.dataTransfer.items);
      const filePromises = items
        .map((item) => item.webkitGetAsEntry?.())
        .filter(Boolean)
        .map((entry) => traverseFileTree(entry));

      const nestedFiles = await Promise.all(filePromises);
      const flatFiles = nestedFiles.flat();

      onFilesDrop(flatFiles); // отправляем в UploadFileAction или аналог
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onFilesDrop]);

  return (
    dragging && (
      <div className="global-drop-overlay">
        {/* <p>📁 {t("dragAndDropFilesHere")}</p> */}
      </div>
    )
  );
};

export default GlobalDropZone;
