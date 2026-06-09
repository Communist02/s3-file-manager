import { useEffect, useState } from "react";
import DeleteAction from "./Delete/Delete.action";
import PreviewFileAction from "./PreviewFile/PreviewFile.action";
import RenameAction from "./Rename/Rename.action";
import { useSelection } from "../../contexts/SelectionContext";
import { useShortcutHandler } from "../../hooks/useShortcutHandler";
import { useTranslation } from "../../contexts/TranslationProvider";

const Actions = ({
  fileUploadConfig,
  onFileUploading,
  onFileUploaded,
  onDelete,
  onDownload,
  onRefresh,
  onRename,
  maxFileSize,
  filePreviewPath,
  filePreviewComponent,
  acceptedFileTypes,
  triggerAction,
  permissions,
}) => {
  const [activeAction, setActiveAction] = useState(null);
  const { selectedFiles } = useSelection();
  const t = useTranslation();

  // Triggers all the keyboard shortcuts based actions
  useShortcutHandler(triggerAction, onRefresh, permissions);

  return <>
    <DeleteAction open={triggerAction.actionType === 'delete'} triggerAction={triggerAction} onDelete={onDelete} />
    <RenameAction open={triggerAction.actionType === 'rename'} onRename={onRename} triggerAction={triggerAction} />
    <PreviewFileAction
      open={triggerAction.actionType === 'previewFile'}
      filePreviewPath={filePreviewPath}
      filePreviewComponent={filePreviewComponent}
      onDownload={onDownload}
      show={triggerAction.isActive}
      setShow={triggerAction.close}
    />
  </>;
};

export default Actions;
