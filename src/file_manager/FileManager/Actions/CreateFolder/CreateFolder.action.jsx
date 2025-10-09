import { useEffect, useState } from "react";
import { duplicateNameHandler } from "../../../utils/duplicateNameHandler";
import { useFileNavigation } from "../../../contexts/FileNavigationContext";
import { validateApiCallback } from "../../../utils/validateApiCallback";
import { useTranslation } from "../../../contexts/TranslationProvider";
import { Tooltip, Modal, Input } from "antd";

const CreateFolderAction = ({ filesViewRef, file, onCreateFolder, triggerAction }) => {
  const [folderName, setFolderName] = useState(file.name);
  const [folderNameError, setFolderNameError] = useState(false);
  const [folderErrorMessage, setFolderErrorMessage] = useState("");
  const { currentFolder, currentPathFiles, setCurrentPathFiles } = useFileNavigation();
  const t = useTranslation();

  // Folder name change handler function
  const handleFolderNameChange = (e) => {
    const value = e.target.value;
    const reg = /[\\/:*?"<>|]/;
    if (!reg.test(value)) {
      setFolderName(value);
      setFolderNameError(false);
    } else {
      setFolderErrorMessage(t("invalidFileName"));
      setFolderNameError(true);
    }
  };
  //

  // Validate folder name and call "onCreateFolder" function
  const handleValidateFolderName = (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      handleFolderCreating();
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      triggerAction.close();
      setCurrentPathFiles((prev) => prev.filter((f) => f.key !== file.key));
      return;
    }

    const invalidCharsRegex = /[\\/:*?"<>|]/;
    if (invalidCharsRegex.test(e.key)) {
      e.preventDefault();
      setFolderErrorMessage(t("invalidFileName"));
      setFolderNameError(true);
    } else {
      setFolderNameError(false);
      setFolderErrorMessage("");
    }
  };

  // Auto hide error message after 7 seconds
  useEffect(() => {
    if (folderNameError) {
      const autoHideError = setTimeout(() => {
        setFolderNameError(false);
        setFolderErrorMessage("");
      }, 7000);

      return () => clearTimeout(autoHideError);
    }
  }, [folderNameError]);
  //

  function handleFolderCreating() {
    let newFolderName = folderName.trim();
    const syncedCurrPathFiles = currentPathFiles.filter((f) => !(!!f.key && f.key === file.key));

    const alreadyExists = syncedCurrPathFiles.find((f) => {
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
    setCurrentPathFiles((prev) => prev.filter((f) => f.key !== file.key));
    triggerAction.close();
  }
  //

  return (
    <>
      {folderName}
      <Modal
        centered
        title={t('newFolder')}
        open={true}
        onOk={
          () => {
            handleFolderCreating();
          }
        }
        onCancel={
          () => {
            setCurrentPathFiles((prev) => prev.filter((f) => f.key !== file.key));
            triggerAction.close();
          }
        }
      >
        <Tooltip
          open={folderNameError}
          title={folderErrorMessage}
          placement="bottomLeft"
        >
          <Input
            value={folderName}
            onChange={
              (e) => {
                handleFolderNameChange(e);
              }
            } />
        </Tooltip>
      </Modal>
    </>
  );
};

export default CreateFolderAction;
