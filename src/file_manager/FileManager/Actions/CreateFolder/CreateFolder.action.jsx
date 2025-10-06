import { useEffect, useState } from "react";
import { duplicateNameHandler } from "../../../utils/duplicateNameHandler";
import { useFileNavigation } from "../../../contexts/FileNavigationContext";
import { validateApiCallback } from "../../../utils/validateApiCallback";
import { useTranslation } from "../../../contexts/TranslationProvider";
import { Tooltip, Modal, Input } from "antd";

const maxNameLength = 220;

const CreateFolderAction = ({ filesViewRef, file, onCreateFolder, triggerAction }) => {
  const [folderName, setFolderName] = useState(file.name);
  const [folderNameError, setFolderNameError] = useState(false);
  const [folderErrorMessage, setFolderErrorMessage] = useState("");
  const [errorXPlacement, setErrorXPlacement] = useState("right");
  const [errorYPlacement, setErrorYPlacement] = useState("bottom");
  const { currentFolder, currentPathFiles, setCurrentPathFiles } = useFileNavigation();
  const t = useTranslation();

  // Folder name change handler function
  const handleFolderNameChange = (e) => {
    setFolderName(e.target.value);
    setFolderNameError(false);
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

  // Folder name text selection upon visible
  // useEffect(() => {
  //   outsideClick.ref.current?.focus();
  //   outsideClick.ref.current?.select();

  //   // Dynamic Error Message Placement based on available space
  //   if (outsideClick.ref?.current) {
  //     const errorMessageWidth = 292 + 8 + 8 + 5; // 8px padding on left and right + additional 5px for gap
  //     const errorMessageHeight = 56 + 20 + 10 + 2; // 20px :before height
  //     const filesContainer = filesViewRef.current;
  //     const filesContainerRect = filesContainer.getBoundingClientRect();
  //     const nameInputContainer = outsideClick.ref.current;
  //     const nameInputContainerRect = nameInputContainer.getBoundingClientRect();

  //     const rightAvailableSpace = filesContainerRect.right - nameInputContainerRect.left;
  //     rightAvailableSpace > errorMessageWidth
  //       ? setErrorXPlacement("right")
  //       : setErrorXPlacement("left");

  //     const bottomAvailableSpace =
  //       filesContainerRect.bottom - (nameInputContainerRect.top + nameInputContainer.clientHeight);
  //     bottomAvailableSpace > errorMessageHeight
  //       ? setErrorYPlacement("bottom")
  //       : setErrorYPlacement("top");
  //   }
  // }, []);
  //

  // useEffect(() => {
  //   if (outsideClick.isClicked) {
  //     handleFolderCreating();
  //   }
  // }, [outsideClick.isClicked]);

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
    // <>
    //   <NameInput
    //     nameInputRef={outsideClick.ref}
    //     maxLength={maxNameLength}
    //     value={folderName}
    //     onChange={handleFolderNameChange}
    //     onKeyDown={handleValidateFolderName}
    //     onClick={(e) => e.stopPropagation()}
    //     {...(activeLayout === "list" && { rows: 1 })}
    //   />
    //   {folderNameError && (
    //     <ErrorTooltip
    //       message={folderErrorMessage}
    //       xPlacement={errorXPlacement}
    //       yPlacement={errorYPlacement}
    //     />
    //   )}
    // </>
  );
};

export default CreateFolderAction;
