import { useRef } from "react";
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
}) => {
  const { currentPathFiles } = useFileNavigation();
  const filesViewRef = useRef(null);
  const { activeLayout } = useLayout();
  const t = useTranslation();

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
  } = useFileList(onRefresh, enableFilePreview, triggerAction, permissions);

  const contextMenuRef = useDetectOutsideClick(() => setVisible(false));
  const viewElement = document.getElementsByClassName('files')[0];
  function getItem(value) {
    let index;
    if (activeLayout === "list") {
      index = value.index;
    } else {
      index = value.columnIndex + value.rowIndex * ~~(viewElement.offsetWidth / 140);
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
      {activeLayout === "list" && <FilesHeader unselectFiles={unselectFiles} />}

      {currentPathFiles?.length > 0 ? (
        activeLayout === "list" ?
          <FixedSizeList
            className="virtual-list"
            height={window.outerHeight}
            itemCount={currentPathFiles.length}
            itemSize={43}
          // width={300}
          >
            {getItem}
          </FixedSizeList> :
          <FixedSizeGrid
            className="virtual-grid"
            columnCount={~~(viewElement.offsetWidth / 140)}
            columnWidth={140}
            height={viewElement.offsetHeight}
            width={viewElement.offsetWidth}
            itemCount={currentPathFiles.length}
            rowHeight={118}
            rowCount={currentPathFiles.length / ~~(viewElement.offsetWidth / 140)}
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
