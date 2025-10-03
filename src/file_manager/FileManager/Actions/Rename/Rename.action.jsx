import { useEffect, useRef, useState } from "react";
import { Tooltip, Modal, Input } from "antd";
import { IoWarningOutline } from "react-icons/io5";
import { useDetectOutsideClick } from "../../../hooks/useDetectOutsideClick";
// import Modal from "../../../components/Modal/Modal";
import { getFileExtension } from "../../../utils/getFileExtension";
import NameInput from "../../../components/NameInput/NameInput";
import ErrorTooltip from "../../../components/ErrorTooltip/ErrorTooltip";
import { useFileNavigation } from "../../../contexts/FileNavigationContext";
import { useLayout } from "../../../contexts/LayoutContext";
import { validateApiCallback } from "../../../utils/validateApiCallback";
import { useTranslation } from "../../../contexts/TranslationProvider";

const maxNameLength = 220;

const RenameAction = ({ filesViewRef, file, onRename, triggerAction }) => {
  const [renameFile, setRenameFile] = useState(file?.name);
  const [renameFileWarning, setRenameFileWarning] = useState(false);
  const [fileRenameError, setFileRenameError] = useState(false);
  const [renameErrorMessage, setRenameErrorMessage] = useState("");
  const [errorXPlacement, setErrorXPlacement] = useState("right");
  const [errorYPlacement, setErrorYPlacement] = useState("bottom");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentPathFiles, setCurrentPathFiles } = useFileNavigation();
  const { activeLayout } = useLayout();
  const t = useTranslation();

  const warningModalRef = useRef(null);
  // const outsideClick = useDetectOutsideClick((e) => {
  //   if (!warningModalRef.current?.contains(e.target)) {
  //     e.preventDefault();
  //     e.stopPropagation();
  //   }
  // });

  const handleValidateFolderRename = (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      outsideClick.setIsClicked(true);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
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
    }

    const invalidCharsRegex = /[\\/:*?"<>|]/;
    if (invalidCharsRegex.test(e.key)) {
      e.preventDefault();
      setRenameErrorMessage(t("invalidFileName"));
      setFileRenameError(true);
    } else {
      setFileRenameError(false);
    }
  };

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

  // const focusName = () => {
  //   outsideClick.ref?.current?.focus();

  //   if (file.isDirectory) {
  //     outsideClick.ref?.current?.select();
  //   } else {
  //     const fileExtension = getFileExtension(file.name);
  //     const fileNameLength = file.name.length - fileExtension.length - 1;
  //     outsideClick.ref?.current?.setSelectionRange(0, fileNameLength);
  //   }
  // };

  // useEffect(() => {
  // if (!isModalOpen) {
  //   setIsModalOpen(true);
  // }
  // focusName();

  // // Dynamic Error Message Placement based on available space
  // if (outsideClick.ref?.current) {
  //   const errorMessageWidth = 292 + 8 + 8 + 5; // 8px padding on left and right + additional 5px for gap
  //   const errorMessageHeight = 56 + 20 + 10 + 2; // 20px :before height
  //   const filesContainer = filesViewRef.current;
  //   const filesContainerRect = filesContainer.getBoundingClientRect();
  //   const renameInputContainer = outsideClick.ref.current;
  //   const renameInputContainerRect = renameInputContainer.getBoundingClientRect();

  //   const rightAvailableSpace = filesContainerRect.right - renameInputContainerRect.left;
  //   rightAvailableSpace > errorMessageWidth
  //     ? setErrorXPlacement("right")
  //     : setErrorXPlacement("left");

  //   const bottomAvailableSpace =
  //     filesContainerRect.bottom -
  //     (renameInputContainerRect.top + renameInputContainer.clientHeight);
  //   bottomAvailableSpace > errorMessageHeight
  //     ? setErrorYPlacement("bottom")
  //     : setErrorYPlacement("top");
  // }
  // }, []);

  // useEffect(() => {
  //   if (outsideClick.isClicked) {
  //     handleFileRenaming(false);
  //   }
  //   focusName();
  // }, [outsideClick.isClicked]);

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
      {/* <NameInput
        nameInputRef={outsideClick.ref}
        maxLength={maxNameLength}
        value={renameFile}
        onChange={(e) => {
          setRenameFile(e.target.value);
          setFileRenameError(false);
        }}
        onKeyDown={handleValidateFolderRename}
        onClick={(e) => e.stopPropagation()}
        {...(activeLayout === "list" && { rows: 1 })}
      /> */}

      <Modal
        centered
        title={t('rename')}
        open={true}
        onOk={
          () => {
            handleFileRenaming(true);
            setIsModalOpen(false);
          }
        }
        onCancel={
          () => {
            handleFileRenaming(false);
            setIsModalOpen(false);
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
