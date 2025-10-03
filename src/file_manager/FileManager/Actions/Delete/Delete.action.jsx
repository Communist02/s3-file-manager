import React, { useEffect, useState } from "react";
import { Button, Modal } from 'antd';
import { useSelection } from "../../../contexts/SelectionContext";
import { useTranslation } from "../../../contexts/TranslationProvider";
import "./Delete.action.scss";

const DeleteAction = ({ triggerAction, onDelete }) => {
  const [deleteMsg, setDeleteMsg] = useState("");
  const { selectedFiles, setSelectedFiles } = useSelection();
  const t = useTranslation();

  useEffect(() => {
    setDeleteMsg(() => {
      if (selectedFiles.length === 1) {
        return t("deleteItemConfirm", { fileName: selectedFiles[0].name });
      } else if (selectedFiles.length > 1) {
        return t("deleteItemsConfirm", { count: selectedFiles.length });
      }
    });
  }, [t]);

  const handleDeleting = () => {
    onDelete(selectedFiles);
    setSelectedFiles([]);
    triggerAction.close();
  };

  return (
    <Modal centered title={t("delete")} open={triggerAction.isActive} onCancel={triggerAction.close} okType='danger' okText={t("delete")} onOk={handleDeleting}>
      {deleteMsg}
    </Modal>
  );
};

export default DeleteAction;
