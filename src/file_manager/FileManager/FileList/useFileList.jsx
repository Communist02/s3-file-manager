import { BsScissors } from "react-icons/bs";
import { useClipBoard } from "../../contexts/ClipboardContext";
import { useEffect, useState } from "react";
import { useSelection } from "../../contexts/SelectionContext";
import { useLayout } from "../../contexts/LayoutContext";
import { useFileNavigation } from "../../contexts/FileNavigationContext";
import { duplicateNameHandler } from "../../utils/duplicateNameHandler";
import { validateApiCallback } from "../../utils/validateApiCallback";
import { useTranslation } from "../../contexts/TranslationProvider";
import { AppstoreOutlined, BarsOutlined, CopyOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, FileOutlined, FolderAddOutlined, FolderOpenOutlined, ImportOutlined, InfoCircleOutlined, SelectOutlined, SyncOutlined, UploadOutlined } from '@ant-design/icons'

const useFileList = (onRefresh, enableFilePreview, triggerAction, permissions, onFileOpen, onShowProperties) => {
  const [selectedFileIndexes, setSelectedFileIndexes] = useState([]);
  const [visible, setVisible] = useState(false);
  const [isSelectionCtx, setIsSelectionCtx] = useState(false);
  const [clickPosition, setClickPosition] = useState({ clickX: 0, clickY: 0 });
  const [lastSelectedFile, setLastSelectedFile] = useState(null);

  const { clipBoard, setClipBoard, handleCutCopy, handlePasting } = useClipBoard();
  const { selectedFiles, setSelectedFiles, handleDownload } = useSelection();
  const { currentPath, setCurrentPath, currentPathFiles, setCurrentPathFiles, onFolderChange } =
    useFileNavigation();
  const { activeLayout, setActiveLayout } = useLayout();
  const t = useTranslation();
  const { currentFolder } = useFileNavigation();

  // Context Menu
  const handleFileOpen = () => {
    onFileOpen(lastSelectedFile);
    if (lastSelectedFile.isDirectory) {
      setCurrentPath(lastSelectedFile.path);
      onFolderChange?.(lastSelectedFile.path);
      setSelectedFileIndexes([]);
      setSelectedFiles([]);
    } else {
      enableFilePreview && triggerAction.show("previewFile");
    }
    setVisible(false);
  };

  const handleMoveOrCopyItems = (isMoving) => {
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
    onShowProperties(lastSelectedFile);
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
    document.getElementById('upload-button').click();
    // triggerAction.show("uploadFile");
  };

  const handleselectAllFiles = () => {
    setSelectedFiles(currentPathFiles);
    setVisible(false);
  };

  const emptySelecCtxItems = [
    {
      title: t("view"),
      icon: activeLayout === "grid" ? <AppstoreOutlined /> : <BarsOutlined />,
      onClick: () => { },
      children: [
        {
          title: t("grid"),
          icon: <AppstoreOutlined />,
          selected: activeLayout === "grid",
          onClick: () => {
            setActiveLayout("grid");
            setVisible(false);
          },
        },
        {
          title: t("list"),
          icon: <BarsOutlined />,
          selected: activeLayout === "list",
          onClick: () => {
            setActiveLayout("list");
            setVisible(false);
          },
        },
      ],
    },
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

  const handleFolderCreating = () => {
    setCurrentPathFiles((prev) => {
      return [
        ...prev,
        {
          name: duplicateNameHandler("New Folder", true, prev),
          isDirectory: true,
          path: currentPath,
          isEditing: true,
          key: new Date().valueOf(),
        },
      ];
    });
  };

  const handleItemRenaming = () => {
    setCurrentPathFiles((prev) => {
      if (prev[selectedFileIndexes.at(-1)]) {
        prev[selectedFileIndexes.at(-1)].isEditing = true;
      } else {
        triggerAction.close();
      }
      return prev;
    });

    setSelectedFileIndexes([]);
    setSelectedFiles([]);
  };

  const unselectFiles = () => {
    if (selectedFileIndexes.length > 0) {
      setSelectedFileIndexes([]);
      setSelectedFiles((prev) => (prev.length > 0 ? [] : prev));
    }
  };

  const handleContextMenu = (e, isSelection = false) => {
    e.preventDefault();
    if (e.which = 3) {
      setClickPosition({ clickX: e.clientX, clickY: e.clientY });
      setIsSelectionCtx(isSelection);
      !isSelection && unselectFiles();
      setVisible(true);
    }
  };

  useEffect(() => {
    if (triggerAction.isActive) {
      switch (triggerAction.actionType) {
        case "createFolder":
          handleFolderCreating();
          break;
        case "rename":
          handleItemRenaming();
          break;
      }
    }
  }, [triggerAction.isActive]);

  useEffect(() => {
    setSelectedFileIndexes([]);
    setSelectedFiles([]);
  }, [currentPath]);

  useEffect(() => {
    if (selectedFiles.length > 0) {
      setSelectedFileIndexes(() => {
        return selectedFiles.map((selectedFile) => {
          return currentPathFiles.findIndex((f) => f.path === selectedFile.path);
        });
      });
    } else {
      setSelectedFileIndexes([]);
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
    selectedFileIndexes,
    clickPosition,
    isSelectionCtx,
  };
};

export default useFileList;
