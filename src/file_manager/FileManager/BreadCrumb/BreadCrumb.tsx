import { useEffect, useState } from "react";
// @ts-ignore
import { useFileNavigation } from "../../contexts/FileNavigationContext";
// @ts-ignore
import { useTranslation } from "../../contexts/TranslationProvider";
import "./BreadCrumb.scss";
import {
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Button } from "antd";

interface BreadCrumbProps {
  collapsibleNav: boolean;
  isNavigationPaneOpen: boolean;
  setNavigationPaneOpen: (value: any) => void;
}

const BreadCrumb = ({ collapsibleNav, isNavigationPaneOpen, setNavigationPaneOpen }: BreadCrumbProps) => {
  const [folders, setFolders] = useState([]);

  const { currentPath, setCurrentPath, onFolderChange } = useFileNavigation();
  const t = useTranslation();

  useEffect(() => {
    setFolders(() => {
      let path = "";
      return currentPath?.split("/").map((item: string) => {
        return {
          name: item || t("home"),
          path: item === "" ? item : (path += `/${item}`),
        };
      });
    });
  }, [currentPath, t]);

  const switchPath = (path: string) => {
    setCurrentPath(path);
    onFolderChange?.(path);
  };

  const breadcrumb_items: {}[] = [];
  folders.map((folder: { path: string, name: string }, index) => {
    const isRoot = index === 0;
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
  });

  return (
    <div className="bread-crumb-container" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* --- Кнопка сворачивания навигации --- */}
      {collapsibleNav && (
        <>
          <Button
            title={isNavigationPaneOpen
              ? t("collapseNavigationPane")
              : t("expandNavigationPane")}
            type="text"
            icon={
              isNavigationPaneOpen ? (
                <MenuFoldOutlined />
              ) : (
                <MenuUnfoldOutlined />
              )
            }
            onClick={() => setNavigationPaneOpen((prev: boolean) => !prev)}
          />
        </>
      )}

      {/* --- Breadcrumb --- */}
      <Breadcrumb items={breadcrumb_items} className="breadcrumb-file-path" ></Breadcrumb>
    </div>
  );
};

BreadCrumb.displayName = "BreadCrumb";

export default BreadCrumb;
