import { useState, useRef } from "react";
// @ts-ignore
import { duplicateNameHandler } from "../../../utils/duplicateNameHandler";
// @ts-ignore
import { useFileNavigation } from "../../../contexts/FileNavigationContext";
// @ts-ignore
import { validateApiCallback } from "../../../utils/validateApiCallback";
// @ts-ignore
import { useTranslation } from "../../../contexts/TranslationProvider";
import { Tooltip, Modal, Input } from "antd";

interface CreateFolderActionProps {
  file: any;
  onCreateFolder: () => void;
  triggerAction: any;
  open: boolean;
}

const CreateFolderAction = ({ file, onCreateFolder, triggerAction, open }: CreateFolderActionProps) => {
  const [folderName, setFolderName] = useState(file.name);
  const [folderNameError, setFolderNameError] = useState(false);
  const [folderErrorMessage, setFolderErrorMessage] = useState("");
  const { currentFolder, currentPathFiles, setCurrentPathFiles } = useFileNavigation();
  const t = useTranslation();
  const prevOpenRef = useRef(open);
  const timeoutRef = useRef<number | null>(null);

  if (open && !prevOpenRef.current) {
    setFolderName(file.name);
    setFolderNameError(false);
    setFolderErrorMessage("");
  }
  prevOpenRef.current = open;

  // Folder name change handler function
  const handleFolderNameChange = (e: any) => {
    const value = e.target.value;
    const reg = /[\\/:*?"<>|]/;
    if (!reg.test(value)) {
      setFolderName(value);
      setFolderNameError(false);
    } else {
      setErrorWithAutoHide(t("invalidFileName"));
    }
  };

  // Auto hide error message after 5 seconds
  const setErrorWithAutoHide = (message: string) => {
    // Очищаем предыдущий таймер
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setFolderErrorMessage(message);
    setFolderNameError(true);

    // Устанавливаем новый таймер
    timeoutRef.current = setTimeout(() => {
      setFolderNameError(false);
      setFolderErrorMessage("");
      timeoutRef.current = null;
    }, 5000);
  };

  // Функция для очистки ошибки
  const clearError = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setFolderNameError(false);
    setFolderErrorMessage("");
  };

  function handleFolderCreating() {
    let newFolderName = folderName.trim();
    const syncedCurrPathFiles = currentPathFiles.filter((f: any) => !(!!f.key && f.key === file.key));

    const alreadyExists = syncedCurrPathFiles.find((f: any) => {
      return f.name.toLowerCase() === newFolderName.toLowerCase();
    });

    if (alreadyExists) {
      setFolderErrorMessage(t("folderExists", { renameFile: newFolderName }));
      setFolderNameError(true);
      return;
    }

    if (newFolderName === "") {
      newFolderName = duplicateNameHandler("New Folder", true, syncedCurrPathFiles);
    }

    validateApiCallback(onCreateFolder, "onCreateFolder", newFolderName, currentFolder);
    setCurrentPathFiles((prev: any) => prev.filter((f: any) => f.key !== file.key));
    triggerAction.close();
    clearError();
  }

  return (
    <Modal
      centered
      title={t('newFolder')}
      open={open}
      onOk={handleFolderCreating}
      onCancel={
        () => {
          setCurrentPathFiles((prev: any) => prev.filter((f: any) => f.key !== file.key));
          triggerAction.close();
          clearError();
        }
      }
    >
      {open && <Tooltip
        open={folderNameError}
        title={folderErrorMessage}
        placement="bottomLeft"
      >
        <Input
          value={folderName}
          autoFocus
          onPressEnter={handleFolderCreating}
          onChange={
            (e) => {
              handleFolderNameChange(e);
            }
          } />
      </Tooltip>}
    </Modal>
  );
};

export default CreateFolderAction;