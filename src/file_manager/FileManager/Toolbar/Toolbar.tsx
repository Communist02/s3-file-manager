// @ts-ignore
import { useFileNavigation } from "../../contexts/FileNavigationContext";
// @ts-ignore
import { useSelection } from "../../contexts/SelectionContext";
// @ts-ignore
import { useClipBoard } from "../../contexts/ClipboardContext";
// @ts-ignore
import { useLayout } from "../../contexts/LayoutContext";
// @ts-ignore
import { validateApiCallback } from "../../utils/validateApiCallback";
// @ts-ignore
import { useTranslation } from "../../contexts/TranslationProvider";
import "./Toolbar.scss";
import { Button } from "antd";
import { CloseOutlined, CopyOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, FolderAddOutlined, ImportOutlined, SyncOutlined } from '@ant-design/icons'
import type { ButtonType } from "antd/es/button";

interface ToolbarProps {
  onLayoutChange: (value: string) => void;
  onRefresh: () => void;
  triggerAction: any;
  permissions: any;
}

interface toolbarLeftItemsProps {
  icon: any;
  text: string;
  type: ButtonType;
  permission: boolean | undefined;
  onClick: () => void;
}

const Toolbar = ({ onRefresh, triggerAction, permissions }: ToolbarProps) => {
  const { currentFolder } = useFileNavigation();
  const { selectedFiles, setSelectedFiles, handleDownload } = useSelection();
  const { clipBoard, handleCutCopy, handlePasting } = useClipBoard();
  // const { activeLayout, setActiveLayout } = useLayout();
  const t = useTranslation();

  // Toolbar Items
  const toolbarLeftItems: toolbarLeftItemsProps[] = [
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
      type: 'default',
      permission: permissions.create,
      onClick: () => triggerAction.show("createFolder"),
    },
  ];

  const toolbarRightItems = [
    {
      icon: <SyncOutlined />,
      type: 'default',
      title: t("refresh"),
      onClick: () => {
        validateApiCallback(onRefresh, "onRefresh");
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
            iconPlacement="end"
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
          {/* <Segmented
            value={activeLayout}
            options={[
              { value: 'list', icon: <BarsOutlined /> },
              { value: 'grid', icon: <AppstoreOutlined /> },
            ]}
            onChange={(value) => {
              setActiveLayout(value);
              onLayoutChange(value)
            }}
          /> */}
          {toolbarRightItems.map((item, index) => (
            <div key={index} className="toolbar-left-items">
              <Button icon={item.icon} className="item-action icon-only" title={item.title} onClick={item.onClick} />
              {index !== toolbarRightItems.length - 1 && <div className="item-separator"></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Toolbar.displayName = "Toolbar";

export default Toolbar;
