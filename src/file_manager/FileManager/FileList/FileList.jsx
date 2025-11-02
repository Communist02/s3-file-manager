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
import { FixedSizeList, FixedSizeGrid } from 'react-window';

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
  const { currentPathFiles, sortConfig, setSortConfig } = useFileNavigation();
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
      if (index >= currentPathFiles.length) {
        return;
      }
    }
    const file = currentPathFiles[index];
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

      {currentPathFiles?.length > 0 ? (
        activeLayout === "list" ?
          <FixedSizeList
            className="virtual-list"
            height={window.outerHeight}
            itemCount={currentPathFiles.length}
            itemSize={34}
          // width={300}
          >
            {getItem}
          </FixedSizeList> :
          <FixedSizeGrid
            className="virtual-grid"
            columnCount={~~(size.x / 140)}
            columnWidth={140}
            height={size.y}
            width={size.x}
            itemCount={currentPathFiles.length}
            rowHeight={100}
            rowCount={Math.ceil(currentPathFiles.length / ~~(size.x / 140))}
          >
            {getItem}
          </FixedSizeGrid>
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
