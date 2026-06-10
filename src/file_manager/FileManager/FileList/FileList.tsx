import { useRef, useState, useEffect } from "react";
// @ts-ignore
import { useFileNavigation } from "../../contexts/FileNavigationContext";
// @ts-ignore
import { useLayout } from "../../contexts/LayoutContext";
// @ts-ignore
import ContextMenu from "../../components/ContextMenu/ContextMenu";
// @ts-ignore
import { useDetectOutsideClick } from "../../hooks/useDetectOutsideClick";
// @ts-ignore
import useFileList from "./useFileList";
// @ts-ignore
import { useSelection } from "../../contexts/SelectionContext";
// @ts-ignore
import FilesHeader from "./FilesHeader";
// @ts-ignore
import { useTranslation } from "../../contexts/TranslationProvider";
import "./FileList.scss";
// @ts-ignore
import CreateFolderAction from "../Actions/CreateFolder/CreateFolder.action";
// @ts-ignore
import { duplicateNameHandler } from "../../utils/duplicateNameHandler";
import { Button, Input, Space, Table, type InputRef, type TableColumnType, type TableProps } from "antd";

import { getDataSize } from "../../utils/getDataSize";
import { formatDate } from "../../utils/formatDate";
import { getIconForFile, getIconForFolder } from 'vscode-icons-js';
import type { FilterDropdownProps } from "antd/es/table/interface";
import { SearchOutlined } from '@ant-design/icons';
// @ts-ignore
import Highlighter from 'react-highlight-words';

interface File {
  name: string;
  path: string;
  updatedAt: string;
  size: number;
  isDirectory: boolean;
}

type DataIndex = keyof File;

interface FileListProps {
  onCreateFolder: () => void;
  onRename: () => void;
  onFileOpen: (file: File | null) => void;
  onRefresh: () => void;
  enableFilePreview: boolean;
  triggerAction: any;
  onShowProperties: () => void;
  permissions: any;
}

const FileList = ({
  onCreateFolder,
  // onRename,
  onFileOpen,
  onRefresh,
  enableFilePreview,
  triggerAction,
  permissions,
  onShowProperties
}: FileListProps) => {
  const { currentPathFiles, currentPath, setCurrentPath, onFolderChange }: { currentPathFiles: File[], currentPath: string, setCurrentPath: (path: string) => void, onFolderChange: (path: string) => void } = useFileNavigation();
  const filesViewRef = useRef(null);
  const { activeLayout } = useLayout();
  // const t = useTranslation();
  const [size, setSize] = useState({ x: 0, y: 0 });
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);
  const [lastSelectedKey, setLastSelectedKey] = useState<string | null>(null);
  const { selectedFiles, setSelectedFiles }: { selectedFiles: File[], setSelectedFiles: (files: File[]) => void } = useSelection();

  const {
    emptySelecCtxItems,
    selecCtxItems,
    handleContextMenu,
    unselectFiles,
    visible,
    setVisible,
    clickPosition,
  } = useFileList(onRefresh, enableFilePreview, triggerAction, permissions, onFileOpen, onShowProperties);

  useEffect(() => {
    const element = document.querySelector('.files');
    if (!element) {
      return;
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (activeLayout) {
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

  const contextMenuRef = useDetectOutsideClick((event: any) => {
    setVisible(false);
    const isTableClick = event.target.closest('.ant-table');
    const isFiles = event.target.closest('.files');

    if (!isTableClick && isFiles) {
      setSelectedFiles([]);
      setLastSelectedKey(null);
    }
  });

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm'],
    dataIndex: DataIndex,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<File> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Поиск по имени файла`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText((selectedKeys as string[])[0]);
              setSearchedColumn(dataIndex);
            }}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Поиск
          </Button>
          <Button
            onClick={() => {
              clearFilters && clearFilters();
              setSearchText('');
              confirm({ closeDropdown: false });
              setSearchedColumn(dataIndex);
            }}
            size="small"
            style={{ width: 90 }}
          >
            Очистить
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    render: (text: string) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const columns: TableProps<File>['columns'] = [
    {
      title: '',
      dataIndex: 'icon',
      render: (_: number, record: File) => {
        return <div>
          {record.isDirectory ? (
            <img style={{ padding: 0, margin: 0 }} src={'/icons/' + getIconForFolder(record.name)} width={23} height={23} />
          ) : (
            <img style={{ padding: 0, margin: 0 }} src={'/icons/' + getIconForFile(record.name)} width={23} height={23} />
          )}
        </div>;
      },
      width: 30,
    },
    {
      title: 'Имя',
      dataIndex: 'name',
      ...getColumnSearchProps('name'),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Изменено',
      dataIndex: 'updatedAt',
      width: 135,
      sorter: (a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt),
      render: (value: number | string | Date) => {
        return formatDate(value);
      }
    },
    {
      title: 'Размер',
      dataIndex: 'size',
      width: 100,
      sorter: (a, b) => a.size - b.size,
      render: (value: number) => {
        return getDataSize(value);
      }
    },
  ];

  const rowSelection: TableProps<File>['rowSelection'] = {
    selectedRowKeys: selectedFiles.map(item => item.path),
    columnWidth: 30,
    type: 'checkbox',
    onChange: (_, selectedRows) => {
      setSelectedFiles(selectedRows);
    },
  };

  const handleRowClick = (record: File, e: any) => {
    const selectedRowKeys: string[] = selectedFiles.map(item => item.path);
    const key = record.path;
    let rowKeys = [];

    if (e.ctrlKey) {
      // Ctrl — переключение текущей строки
      if (selectedRowKeys.includes(key)) {
        rowKeys = selectedRowKeys.filter(k => k !== key);
      } else {
        rowKeys = [...selectedRowKeys, key];
      }
    }
    else if (e.shiftKey && lastSelectedKey) {
      // Shift — выделение диапазона
      const keys = currentPathFiles.map(item => item.path);
      const start = keys.indexOf(lastSelectedKey);
      const end = keys.indexOf(key);
      const range = keys.slice(Math.min(start, end), Math.max(start, end) + 1);
      rowKeys = [...new Set([...selectedRowKeys, ...range])];
    }
    else {
      // Обычный клик — одиночный выбор
      rowKeys = [key];
    }
    setSelectedFiles(currentPathFiles.filter(k => rowKeys.includes(k.path)))
    setLastSelectedKey(key);
  };

  const handleLeftClick = (record: File) => {
    const selectedRowKeys: string[] = selectedFiles.map(item => item.path);
    const key = record.path;
    let rowKeys = [];

    if (selectedRowKeys.includes(key)) {
      rowKeys = selectedRowKeys;
    } else {
      rowKeys = [key];
    }
    setSelectedFiles(currentPathFiles.filter(k => rowKeys.includes(k.path)))
    setLastSelectedKey(key);
  };

  const handleFile = (file: File) => {
    onFileOpen(file);
    if (file.isDirectory) {
      setLastSelectedKey(null);
      setCurrentPath(file.path);
      onFolderChange?.(file.path);
      setSelectedFiles([]);
    } else if (selectedFiles.length === 1) {
      enableFilePreview && triggerAction.show("previewFile");
    }
  };

  return (
    <div
      ref={filesViewRef}
      className={`files ${activeLayout}`}
      onContextMenu={handleContextMenu}
      onClick={unselectFiles}
    >
      <CreateFolderAction
        open={triggerAction.actionType === "createFolder"}
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
      <Table
        rowSelection={rowSelection}
        rowKey={'path'}
        pagination={false}
        virtual
        size="small"
        columns={columns}
        dataSource={currentPathFiles}
        scroll={{ y: size.y - 40 }}
        onRow={(record) => ({
          onClick: (e) => handleRowClick(record, e),
          onDoubleClick: () => handleFile(record),
          onContextMenu: () => handleLeftClick(record),
        })}
      // rowClassName={(record) =>
      //   selectedRowKeys.includes(record.path) ? 'ant-table-row-selected' : ''
      // }
      />

      <ContextMenu
        filesViewRef={filesViewRef}
        contextMenuRef={contextMenuRef.ref}
        menuItems={selectedFiles.length > 0 ? selecCtxItems : emptySelecCtxItems}
        visible={visible}
        setVisible={setVisible}
        clickPosition={clickPosition}
      />
    </div>
  );
};

FileList.displayName = "FileList";

export default FileList;