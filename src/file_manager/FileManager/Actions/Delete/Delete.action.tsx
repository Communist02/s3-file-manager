import { useRef, useState } from "react";
import { Modal } from 'antd';
// @ts-ignore
import { useSelection } from "../../../contexts/SelectionContext";
// @ts-ignore
import { useTranslation } from "../../../contexts/TranslationProvider";
import "./Delete.action.scss";

interface DeleteActionProps {
  triggerAction: any;
  open: boolean;
  onDelete: (files: any[]) => void;
}

const DeleteAction = ({ triggerAction, onDelete, open }: DeleteActionProps) => {
  const [deleteMsg, setDeleteMsg] = useState("");
  const { selectedFiles, setSelectedFiles } = useSelection();
  const t = useTranslation();
  const prevOpenRef = useRef(open);

  if (open && !prevOpenRef.current) {
    if (selectedFiles.length === 1) {
      setDeleteMsg(t("deleteItemConfirm", { fileName: selectedFiles[0].name }));
    } else if (selectedFiles.length > 1) {
      setDeleteMsg(t("deleteItemsConfirm", { count: selectedFiles.length }));
    }
  }
  prevOpenRef.current = open;

  const handleDeleting = () => {
    onDelete(selectedFiles);
    setSelectedFiles([]);
    triggerAction.close();
  };

  return (
    <Modal centered title={t("delete")} open={open} onCancel={triggerAction.close} okType='danger' okText={t("delete")} onOk={handleDeleting}>
      {open && deleteMsg}
    </Modal>
  );
};

export default DeleteAction;
