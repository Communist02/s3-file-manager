import { useRef, useState, useEffect } from "react";
import FileItem from "./FileItem";
import { useFileNavigation } from "../../contexts/FileNavigationContext";
import { useLayout } from "../../contexts/LayoutContext";
import ContextMenu from "../../components/ContextMenu/ContextMenu";
import { useDetectOutsideClick } from "../../hooks/useDetectOutsideClick";
import useFileList from "./useFileList";
import FilesHeader from "./FilesHeader";
import { useTranslation } from "../../contexts/TranslationProvider";
import "./FileList.scss";
import { List, Grid } from 'react-window';
import CreateFolderAction from "../Actions/CreateFolder/CreateFolder.action";
import RenameAction from "../Actions/Rename/Rename.action";
import { duplicateNameHandler } from "../../utils/duplicateNameHandler";

const FileList = ({
  onCreateFolder,
  onRename,
  onFileOpen,
  onRefresh,
  enableFilePreview,
  triggerAction,
  permissions,
  onShowProperties
}) => {
  const { currentPathFiles, sortConfig, setSortConfig, currentPath } = useFileNavigation();
  const filesViewRef = useRef(null);
  const { activeLayout } = useLayout();
  const t = useTranslation();
  const [size, setSize] = useState({ x: 0, y: 0 })

  const {
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
    lastSelectedFile
  } = useFileList(onRefresh, enableFilePreview, triggerAction, permissions, onFileOpen, onShowProperties);

  useEffect(() => {
    const element = document.querySelector('.files');
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (activeLayout !== "list") {
          const { width, height } = entry.contentRect;
          setSize({ x: width, y: height });
        }
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeLayout]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const contextMenuRef = useDetectOutsideClick(() => setVisible(false));

  function getItem(value) {
    let index;
    if (activeLayout === "list") {
      index = value.index;
    } else {
      index = value.columnIndex + value.rowIndex * ~~(size.x / 140);
      if (index >= value.currentPathFiles.length) {
        return;
      }
    }
    const file = value.currentPathFiles[index];
    return <div style={value.style}>
      <FileItem
        key={index}
        index={index}
        file={file}
        onCreateFolder={onCreateFolder}
        onRename={onRename}
        onFileOpen={onFileOpen}
        enableFilePreview={enableFilePreview}
        triggerAction={triggerAction}
        filesViewRef={filesViewRef}
        selectedFileIndexes={selectedFileIndexes}
        handleContextMenu={handleContextMenu}
        setVisible={setVisible}
        setLastSelectedFile={setLastSelectedFile}
        draggable={permissions.move}
      />
    </div>
  }

  return (
    <div
      ref={filesViewRef}
      className={`files ${activeLayout}`}
      onContextMenu={handleContextMenu}
      onClick={unselectFiles}
    >
      {
        activeLayout === "list" &&
        <FilesHeader
          onSort={handleSort}
          sortConfig={sortConfig}
          unselectFiles={unselectFiles}
        />
      }

      <div className={`rename-file-container ${activeLayout}`}>
        {triggerAction.actionType === "createFolder" && (
          <CreateFolderAction
            filesViewRef={filesViewRef}
            file={{
              name: duplicateNameHandler("New Folder", true, currentPathFiles),
              isDirectory: true,
              path: currentPath,
              isEditing: true,
              key: new Date().valueOf(),
            }}
            onCreateFolder={onCreateFolder}
            triggerAction={triggerAction}
          />
        )}
        {/* {console.log(lastSelectedFile)}
        {triggerAction.actionType === "rename" && (
          <RenameAction
            filesViewRef={filesViewRef}
            file={currentPathFiles[selectedFileIndexes.at(-1)]}
            onRename={onRename}
            triggerAction={triggerAction}
          />
        )} */}
      </div>

      {currentPathFiles?.length > 0 ? (
        activeLayout === "list" ?
          <List
            className="virtual-list"
            rowComponent={getItem}
            // height={window.outerHeight}
            rowCount={currentPathFiles.length}
            rowHeight={34}
            rowProps={{ currentPathFiles }}
          // width={300}
          /> :
          <Grid
            className="virtual-grid"
            columnCount={~~(size.x / 140)}
            columnWidth={140}
            // height={size.y}
            // width={size.x}
            // itemCount={currentPathFiles.length}
            rowHeight={100}
            rowCount={Math.ceil(currentPathFiles.length / ~~(size.x / 140))}
            cellComponent={getItem}
            cellProps={{ currentPathFiles }}
          />
      ) : (
        <div className="empty-folder">{t("folderEmpty")}</div>
      )}

      <ContextMenu
        filesViewRef={filesViewRef}
        contextMenuRef={contextMenuRef.ref}
        menuItems={isSelectionCtx ? selecCtxItems : emptySelecCtxItems}
        visible={visible}
        setVisible={setVisible}
        clickPosition={clickPosition}
      />
    </div>
  );
};

FileList.displayName = "FileList";

export default FileList;
