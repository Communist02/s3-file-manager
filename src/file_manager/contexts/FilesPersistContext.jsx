import { createContext, useContext, useState } from "react";

const FilesPersistContext = createContext();

export const FilesPersistProvider = ({ children }) => {
  const [files, setFiles] = useState([]);

  const updateFile = (index, newData) => {
    setFiles((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, ...newData } : item
      )
    );
  };

  const removeFile = (index) => {
    setFiles((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        removed: true,
      };

      // Если все файлы удалены — очистить всё
      if (updated.every((file) => file.removed)) {
        return [];
      }

      return updated;
    });
  };

  const resetFiles = () => {
    setFiles([]);
  };

  const addFiles = (newFiles = []) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  return (
    <FilesPersistContext.Provider
      value={{
        files,
        setFiles,
        updateFile,
        removeFile,
        resetFiles,
        addFiles,
      }}
    >
      {children}
    </FilesPersistContext.Provider>
  );
};

export const useFilesPersist = () => useContext(FilesPersistContext);
