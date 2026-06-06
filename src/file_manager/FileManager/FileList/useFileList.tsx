import { BsScissors } from "react-icons/bs";
// @ts-ignore
import { useClipBoard } from "../../contexts/ClipboardContext";
import { useEffect, useState } from "react";
// @ts-ignore
import { useSelection } from "../../contexts/SelectionContext";
// @ts-ignore
import { useLayout } from "../../contexts/LayoutContext";
// @ts-ignore
import { useFileNavigation } from "../../contexts/FileNavigationContext";
// @ts-ignore
// import { duplicateNameHandler } from "../../utils/duplicateNameHandler";
// @ts-ignore
import { validateApiCallback } from "../../utils/validateApiCallback";
// @ts-ignore
import { useTranslation } from "../../contexts/TranslationProvider";
import { CopyOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, FileOutlined, FolderAddOutlined, FolderOpenOutlined, ImportOutlined, InfoCircleOutlined, SelectOutlined, SyncOutlined, UploadOutlined } from '@ant-design/icons'

interface File {
  name: string;
  path: string;
  updatedAt: string;
  size: number;
  isDirectory: boolean;
}

const useFileList = (onRefresh: () => void, enableFilePreview: boolean, triggerAction: any, permissions: any, onFileOpen: (file: File | null) => void, onShowProperties: (file: File | null) => void) => {
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const [isSelectionCtx, setIsSelectionCtx] = useState(false);
  const [clickPosition, setClickPosition] = useState({ clickX: 0, clickY: 0 });
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);

  const { clipBoard, setClipBoard, handleCutCopy, handlePasting } = useClipBoard();
  const { selectedFiles, setSelectedFiles, handleDownload } = useSelection();
  const { currentPath, setCurrentPath, currentPathFiles, onFolderChange } =
    useFileNavigation();
  // const { activeLayout, setActiveLayout } = useLayout();
  const t = useTranslation();
  const { currentFolder } = useFileNavigation();

  // Context Menu
  const handleFileOpen = () => {
    onFileOpen(lastSelectedFile);
    if (lastSelectedFile && lastSelectedFile.isDirectory) {
      setCurrentPath(lastSelectedFile.path);
      onFolderChange?.(lastSelectedFile.path);
      setSelectedFilePaths([]);
      setSelectedFiles([]);
    } else {
      enableFilePreview && triggerAction.show("previewFile");
    }
    setVisible(false);
  };

  const handleMoveOrCopyItems = (isMoving: boolean) => {
    handleCutCopy(isMoving);
    setVisible(false);
  };

  const handleFilePasting = () => {
    handlePasting(lastSelectedFile);
    setVisible(false);
  };

  function handleFilePastingNoSelect() {
    handlePasting(currentFolder);
    setVisible(false);
  }

  const handleRenaming = () => {
    setVisible(false);
    triggerAction.show("rename");
  };

  const handleDownloadItems = () => {
    handleDownload();
    setVisible(false);
  };

  const handleDelete = () => {
    setVisible(false);
    triggerAction.show("delete");
  };

  const handleRefresh = () => {
    setVisible(false);
    validateApiCallback(onRefresh, "onRefresh");
    setClipBoard(null);
  };

  const handleProperties = () => {
    onShowProperties(selectedFiles[0]);
    setVisible(false);
    // validateApiCallback(onRefresh, "onRefresh");
    // setClipBoard(null);
  };

  const handleCreateNewFolder = () => {
    triggerAction.show("createFolder");
    setVisible(false);
  };

  const handleUpload = () => {
    setVisible(false);
    const query = document.getElementById('upload-button');
    if (query !== null) {
      (query as HTMLSpanElement).click();
    }
    // triggerAction.show("uploadFile");
  };

  const handleselectAllFiles = () => {
    setSelectedFiles(currentPathFiles);
    setVisible(false);
  };

  const emptySelecCtxItems = [
    // {
    //   title: t("view"),
    //   icon: activeLayout === "grid" ? <AppstoreOutlined /> : <BarsOutlined />,
    //   onClick: () => { },
    //   children: [
    //     {
    //       title: t("grid"),
    //       icon: <AppstoreOutlined />,
    //       selected: activeLayout === "grid",
    //       onClick: () => {
    //         setActiveLayout("grid");
    //         setVisible(false);
    //       },
    //     },
    //     {
    //       title: t("list"),
    //       icon: <BarsOutlined />,
    //       selected: activeLayout === "list",
    //       onClick: () => {
    //         setActiveLayout("list");
    //         setVisible(false);
    //       },
    //     },
    //   ],
    // },
    {
      title: t("paste"),
      icon: <ImportOutlined />,
      onClick: handleFilePastingNoSelect,
      className: `${clipBoard ? "" : "disable-paste"}`,
      divider: true,
      hidden: (!permissions.move && !permissions.copy),
    },
    {
      title: t("refresh"),
      icon: <SyncOutlined />,
      onClick: handleRefresh,
      divider: true,
    },
    {
      title: t("newFolder"),
      icon: <FolderAddOutlined />,
      onClick: handleCreateNewFolder,
      divider: !permissions.upload,
      hidden: !permissions.create,
    },
    {
      title: t("upload"),
      icon: <UploadOutlined />,
      onClick: handleUpload,
      divider: true,
      hidden: !permissions.upload,
    },
    {
      title: t("selectAll"),
      icon: <SelectOutlined />,
      onClick: handleselectAllFiles,
    },
  ];

  const selecCtxItems = [
    {
      title: t("open"),
      icon: lastSelectedFile?.isDirectory ? <FolderOpenOutlined /> : <FileOutlined />,
      onClick: handleFileOpen,
      divider: true,
    },
    {
      title: t("cut"),
      icon: <BsScissors size={19} />,
      onClick: () => handleMoveOrCopyItems(true),
      divider: !lastSelectedFile?.isDirectory && !permissions.copy,
      hidden: !permissions.move,
    },
    {
      title: t("copy"),
      icon: <CopyOutlined />,
      onClick: () => handleMoveOrCopyItems(false),
      divider: !lastSelectedFile?.isDirectory,
      hidden: !permissions.copy,
    },
    {
      title: t("paste"),
      icon: <ImportOutlined />,
      onClick: handleFilePasting,
      className: `${clipBoard ? "" : "disable-paste"}`,
      divider: true,
      hidden: !lastSelectedFile?.isDirectory || (!permissions.move && !permissions.copy),
    },
    {
      title: t("rename"),
      icon: <EditOutlined />,
      onClick: handleRenaming,
      hidden: selectedFiles.length > 1 || !permissions.rename,
    },
    {
      title: t("download"),
      icon: <DownloadOutlined />,
      onClick: handleDownloadItems,
      hidden: !permissions.download,
    },
    {
      title: t("delete"),
      icon: <DeleteOutlined />,
      onClick: handleDelete,
      hidden: !permissions.delete,
    },
    {
      title: t("properties"),
      icon: <InfoCircleOutlined />,
      onClick: handleProperties,
      hidden: selectedFiles.length > 1,
    },
  ];
  //

  // const handleFolderCreating = () => {
  //   setCurrentPathFiles((prev) => {
  //     return [
  //       ...prev,
  //       {
  //         name: duplicateNameHandler("New Folder", true, prev),
  //         isDirectory: true,
  //         path: currentPath,
  //         isEditing: true,
  //         key: new Date().valueOf(),
  //       },
  //     ];
  //   });
  // };

  // const handleItemRenaming = () => {
  //   setCurrentPathFiles((prev) => {
  //     if (prev[selectedFilePaths.at(-1)]) {
  //       prev[selectedFilePaths.at(-1)].isEditing = true;
  //     } else {
  //       triggerAction.close();
  //     }
  //     return prev;
  //   });

  //   setSelectedFilePaths([]);
  //   setSelectedFiles([]);
  // };

  const unselectFiles = () => {
    if (selectedFilePaths.length > 0) {
      setSelectedFilePaths([]);
      // setSelectedFiles((prev) => (prev.length > 0 ? [] : prev));
    }
  };

  const handleContextMenu = (e: any, isSelection = false) => {
    e.preventDefault();
    if (e.which = 3) {
      setClickPosition({ clickX: e.clientX, clickY: e.clientY });
      setIsSelectionCtx(isSelection);
      !isSelection && unselectFiles();
      setVisible(true);
    }
  };

  // useEffect(() => {
  //   if (triggerAction.isActive) {
  //     switch (triggerAction.actionType) {
  //       // case "createFolder":
  //       //   handleFolderCreating();
  //       //   break;
  //       case "rename":
  //         handleItemRenaming();
  //         break;
  //     }
  //   }
  // }, [triggerAction.isActive]);

  useEffect(() => {
    setSelectedFilePaths([]);
    setSelectedFiles([]);
  }, [currentPath]);

  useEffect(() => {
    if (selectedFiles.length > 0) {
      setSelectedFilePaths(() => {
        return selectedFiles.map((selectedFile: File) => {
          return currentPathFiles.findIndex((f: File) => f.path === selectedFile.path);
        });
      });
    } else {
      setSelectedFilePaths([]);
    }
  }, [selectedFiles, currentPathFiles]);

  return {
    emptySelecCtxItems,
    selecCtxItems,
    handleContextMenu,
    unselectFiles,
    visible,
    setVisible,
    setLastSelectedFile,
    selectedFileIndexes: selectedFilePaths,
    clickPosition,
    isSelectionCtx,
  };
};

export default useFileList;
