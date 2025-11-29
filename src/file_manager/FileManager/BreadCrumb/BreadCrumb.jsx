import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useFileNavigation } from "../../contexts/FileNavigationContext";
import { useTranslation } from "../../contexts/TranslationProvider";
import "./BreadCrumb.scss";
import {
  HomeOutlined,
  EllipsisOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Dropdown, Menu, Button, Tooltip } from "antd";

const BreadCrumb = ({ collapsibleNav, isNavigationPaneOpen, setNavigationPaneOpen }) => {
  const [folders, setFolders] = useState([]);
  const [hiddenFolders, setHiddenFolders] = useState([]);
  const [hiddenFoldersWidth, setHiddenFoldersWidth] = useState([]);

  const { currentPath, setCurrentPath, onFolderChange } = useFileNavigation();
  const t = useTranslation();

  useEffect(() => {
    setFolders(() => {
      let path = "";
      return currentPath?.split("/").map((item) => {
        return {
          name: item || t("home"),
          path: item === "" ? item : (path += `/${item}`),
        };
      });
    });
    setHiddenFolders([]);
    setHiddenFoldersWidth([]);
  }, [currentPath, t]);

  const switchPath = (path) => {
    setCurrentPath(path);
    onFolderChange?.(path);
  };

  const hiddenMenu = (
    <Menu
      items={hiddenFolders.map((folder, index) => ({
        key: index,
        label: (
          <span
            onClick={() => switchPath(folder.path)}
            style={{ cursor: "pointer" }}
          >
            {folder.name}
          </span>
        ),
      }))}
    />
  );

  const breadcrumb_items = [];
  folders.map((folder, index) => {
    const isRoot = index === 0;
    const showMore = hiddenFolders?.length > 0 && isRoot;
    breadcrumb_items.push({
      key: index,
      onClick: () => switchPath(folder.path),
      title: (folders.length - 1 !== index ? <a>
        {isRoot && <HomeOutlined style={{ marginRight: 4 }} />}
        <span>{folder.name}</span>
      </a> : <>
        {isRoot && <HomeOutlined style={{ marginRight: 4 }} />}
        {folder.name}
      </>
      )
    });
    // < Breadcrumb.Item key = { index } >
    //   <span
    //     style={{ cursor: "pointer" }}
    //     onClick={() => switchPath(folder.path)}
    //   >
    //     {isRoot ? <HomeOutlined /> : null} {folder.name}
    //   </span>

    {/* --- Кнопка "ещё" для скрытых папок --- */ }
    // {
    //   showMore && (
    //     <Dropdown overlay={hiddenMenu} placement="bottomLeft">
    //       <Button
    //         type="text"
    //         icon={<EllipsisOutlined />}
    //         title={t("showMoreFolder")}
    //       />
    //     </Dropdown>
    //   )
    // }
    //   </Breadcrumb.Item >
  });

  return (
    <div className="bread-crumb-container" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* --- Кнопка сворачивания навигации --- */}
      {collapsibleNav && (
        <>
          <Tooltip
            title={
              isNavigationPaneOpen
                ? t("collapseNavigationPane")
                : t("expandNavigationPane")
            }
          >
            <Button
              type="text"
              icon={
                isNavigationPaneOpen ? (
                  <MenuFoldOutlined />
                ) : (
                  <MenuUnfoldOutlined />
                )
              }
              onClick={() => setNavigationPaneOpen((prev) => !prev)}
            />
          </Tooltip>
        </>
      )}

      {/* --- Breadcrumb --- */}
      <Breadcrumb items={breadcrumb_items} className="breadcrumb-file-path" ></Breadcrumb>
    </div>
  );
};

BreadCrumb.displayName = "BreadCrumb";

BreadCrumb.propTypes = {
  isNavigationPaneOpen: PropTypes.bool.isRequired,
  setNavigationPaneOpen: PropTypes.func.isRequired,
};

export default BreadCrumb;
