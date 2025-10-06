import { useEffect, useRef, useState } from "react";
import { Tooltip, Modal, Input } from "antd";
import { IoWarningOutline } from "react-icons/io5";
import { getFileExtension } from "../../../utils/getFileExtension";
import { useFileNavigation } from "../../../contexts/FileNavigationContext";
import { validateApiCallback } from "../../../utils/validateApiCallback";
import { useTranslation } from "../../../contexts/TranslationProvider";

const maxNameLength = 220;

const RenameAction = ({ filesViewRef, file, onRename, triggerAction }) => {
  const [renameFile, setRenameFile] = useState(file?.name);
  const [renameFileWarning, setRenameFileWarning] = useState(false);
  const [fileRenameError, setFileRenameError] = useState(false);
  const { currentPathFiles, setCurrentPathFiles } = useFileNavigation();
  const t = useTranslation();

  const warningModalRef = useRef(null);

  // Auto hide error message after 5 seconds
  useEffect(() => {
    if (fileRenameError) {
      const autoHideError = setTimeout(() => {
        setFileRenameError(false);
        setRenameErrorMessage("");
      }, 5000);

      return () => clearTimeout(autoHideError);
    }
  }, [fileRenameError]);
  //

  function handleFileRenaming(isConfirmed, skipCheck = false) {
    if (renameFile === "" || renameFile === file.name || !isConfirmed) {
      setCurrentPathFiles((prev) =>
        prev.map((f) => {
          if (f.key === file.key) {
            f.isEditing = false;
          }
          return f;
        })
      );
      triggerAction.close();
      return;
    } else if (currentPathFiles.some((file) => file.name === renameFile)) {
      setFileRenameError(true);
      setRenameErrorMessage(t("folderExists", { renameFile }));
      return;
    } else if (!file.isDirectory && isConfirmed && !skipCheck) {
      const fileExtension = getFileExtension(file.name);
      const renameFileExtension = getFileExtension(renameFile);
      if (fileExtension !== renameFileExtension) {
        setRenameFileWarning(true);
        return;
      }
    }
    setFileRenameError(false);
    validateApiCallback(onRename, "onRename", file, renameFile);
    setCurrentPathFiles((prev) => prev.filter((f) => f.key !== file.key)); // Todo: Should only filter on success API call
    triggerAction.close();
  }

  function handleChange(e) {
    const value = e.target.value;
    const reg = /[\\/:*?"<>|]/;
    if (!reg.test(value)) {
      setRenameFile(e.target.value);
      setFileRenameError(false);
    } else {
      // setRenameErrorMessage(t("invalidFileName"));
      setFileRenameError(true);
    }
  };

  return (
    <>
      {renameFile}
      <Modal
        centered
        title={t('rename')}
        open={true}
        onOk={
          () => {
            handleFileRenaming(true);
          }
        }
        onCancel={
          () => {
            handleFileRenaming(false);
          }
        }
      >
        <Tooltip
          open={fileRenameError}
          title={t('invalidFileName')}
          placement="bottomLeft"
        >
          <Input
            value={renameFile}
            onChange={
              (e) => {
                handleChange(e);
              }
            } />
        </Tooltip>
      </Modal>

      {/* {fileRenameError && (
        <ErrorTooltip
          message={renameErrorMessage}
          xPlacement={errorXPlacement}
          yPlacement={errorYPlacement}
        />
      )} */}

      <Modal
        centered
        title={t("rename")}
        open={renameFileWarning}
        onOk={
          () => {
            setRenameFileWarning(false);
            handleFileRenaming(true, true);
          }
        }
        onCancel={
          () => {
            setCurrentPathFiles((prev) =>
              prev.map((f) => {
                if (f.key === file.key) {
                  f.isEditing = false;
                }
                return f;
              })
            );
            setRenameFileWarning(false);
            triggerAction.close();
          }
        }
      >
        <div className="fm-rename-folder-container" ref={warningModalRef}>
          <div className="fm-rename-folder-input">
            <div className="fm-rename-warning">
              <IoWarningOutline size={70} color="orange" />
              <div>{t("fileNameChangeWarning")}</div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RenameAction;
