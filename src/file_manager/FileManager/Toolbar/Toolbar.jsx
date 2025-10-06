import { useState } from "react";
import { BsGridFill } from "react-icons/bs";
import { FaListUl, FaRegPaste } from "react-icons/fa6";
import LayoutToggler from "./LayoutToggler";
import { useFileNavigation } from "../../contexts/FileNavigationContext";
import { useSelection } from "../../contexts/SelectionContext";
import { useClipBoard } from "../../contexts/ClipboardContext";
import { useLayout } from "../../contexts/LayoutContext";
import { validateApiCallback } from "../../utils/validateApiCallback";
import { useTranslation } from "../../contexts/TranslationProvider";
import "./Toolbar.scss";
import { Button } from "antd";
import { AppstoreOutlined, BarsOutlined, CloseOutlined, CopyOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, FolderAddOutlined, ImportOutlined, SyncOutlined } from '@ant-design/icons'

const Toolbar = ({ onLayoutChange, onRefresh, triggerAction, permissions }) => {
  const [showToggleViewMenu, setShowToggleViewMenu] = useState(false);
  const { currentFolder } = useFileNavigation();
  const { selectedFiles, setSelectedFiles, handleDownload } = useSelection();
  const { clipBoard, setClipBoard, handleCutCopy, handlePasting } = useClipBoard();
  const { activeLayout } = useLayout();
  const t = useTranslation();

  // Toolbar Items
  const toolbarLeftItems = [
    {
      icon: <ImportOutlined />,
      text: t("paste"),
      type: 'primary',
      permission: !!clipBoard,
      onClick: handleFilePasting,
    },
    {
      icon: <FolderAddOutlined />,
      text: t("newFolder"),
      type: '',
      permission: permissions.create,
      onClick: () => triggerAction.show("createFolder"),
    },
    // {
    //   icon: <MdOutlineFileUpload size={18} />,
    //   text: t("upload"),
    //   type: '',
    //   permission: permissions.upload,
    //   // onClick: () => triggerAction.show("uploadFile"),
    //   onClick: () => document.getElementById('upload-button').click(),
    // },
  ];

  const toolbarRightItems = [
    {
      icon: activeLayout === "grid" ? <AppstoreOutlined /> : <BarsOutlined />,
      title: t("changeView"),
      onClick: () => setShowToggleViewMenu((prev) => !prev),
    },
    {
      icon: <SyncOutlined />,
      title: t("refresh"),
      onClick: () => {
        validateApiCallback(onRefresh, "onRefresh");
        setClipBoard(null);
      },
    },
  ];

  function handleFilePasting() {
    handlePasting(currentFolder);
  }

  const handleDownloadItems = () => {
    handleDownload();
    setSelectedFiles([]);
  };

  // Selected File/Folder Actions
  if (selectedFiles.length > 0) {
    return (
      <div className="toolbar file-selected">
        <div className="file-action-container">
          <div>
            {clipBoard?.files?.length > 0 && (
              <Button
                type='primary'
                icon={<ImportOutlined />}
                className="item-action file-action"
                onClick={handleFilePasting}
              // disabled={!clipBoard}
              >
                {t("paste")}
              </Button>
            )}
            {/* {permissions.move && (
              <Button icon={<BsScissors size={18} />} className="item-action file-action" onClick={() => handleCutCopy(true)}>
                {t("cut")}
              </Button>
            )} */}
            {permissions.copy && (
              <Button icon={<CopyOutlined />} className="item-action file-action" onClick={() => handleCutCopy(false)}>
                {t("copy")}
              </Button>
            )}
            {selectedFiles.length === 1 && permissions.rename && (
              <Button
                icon={<EditOutlined />}
                className="item-action file-action"
                onClick={() => triggerAction.show("rename")}
              >
                {t("rename")}
              </Button>
            )}
            {permissions.download && (
              <Button icon={<DownloadOutlined />} className="item-action file-action" onClick={handleDownloadItems}>
                {t("download")}
              </Button>
            )}
            {permissions.delete && (
              <Button
                icon={<DeleteOutlined />}
                className="item-action file-action"
                onClick={() => triggerAction.show("delete")}
              >
                {t("delete")}
              </Button>
            )}
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            iconPosition="end"
            className="item-action file-action"
            title={t("clearSelection")}
            onClick={() => setSelectedFiles([])}
          >
            <span>
              {selectedFiles.length}{" "}
              {t(selectedFiles.length > 1 ? "itemsSelected" : "itemSelected")}
            </span>
          </Button>
        </div>
      </div>
    );
  }
  //

  return (
    <div className="toolbar">
      <div className="fm-toolbar">
        <div>
          {toolbarLeftItems
            .filter((item) => item.permission)
            .map((item, index) => (
              <Button type={item.type} icon={item.icon} className="item-action" key={index} onClick={item.onClick}>
                {item.text}
              </Button>
            ))}
        </div>
        <div>
          {toolbarRightItems.map((item, index) => (
            <div key={index} className="toolbar-left-items">
              <Button icon={item.icon} className="item-action icon-only" title={item.title} onClick={item.onClick} />
              {index !== toolbarRightItems.length - 1 && <div className="item-separator"></div>}
            </div>
          ))}

          {showToggleViewMenu && (
            <LayoutToggler
              setShowToggleViewMenu={setShowToggleViewMenu}
              onLayoutChange={onLayoutChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

Toolbar.displayName = "Toolbar";

export default Toolbar;
