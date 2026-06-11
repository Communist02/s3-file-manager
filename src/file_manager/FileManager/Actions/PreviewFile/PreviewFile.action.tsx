import { useRef, useState } from "react";
// @ts-ignore
import { getFileExtension } from "../../../utils/getFileExtension";
// @ts-ignore
import { useSelection } from "../../../contexts/SelectionContext";
import { getDataSize } from "../../../utils/getDataSize";
// @ts-ignore
import { useTranslation } from "../../../contexts/TranslationProvider";
// @ts-ignore
import { validateApiCallback } from "../../../utils/validateApiCallback";
import { Typography, Image, Modal, Button, Tag, Space, Spin } from "antd";
import { getIconForFile, } from 'vscode-icons-js';

const imageExtensions = ["jpg", "jpeg", "png", 'gif', 'webp', 'avif'];
const videoExtensions = ["mp4", "mov", "avi", 'webm', 'av1', '3gp'];
const audioExtensions = ["mp3", "wav", "m4a", 'ogg', 'flac'];
const textExtensions = ['txt', 'text', 'asc', 'ascii', 'log', 'logs', 'err', 'error', 'warn', 'warning', 'info', 'debug', 'trace', 'audit', 'history', 'session', 'cache', 'tmp', 'temp', 'swp', 'swo', 'swn', 'pid', 'lock', 'lck', 'state', 'status', 'md', 'markdown', 'rst', 'rest', 'adoc', 'asciidoc', 'tex', 'latex', 'bib', 'wiki', 'creole', 'pod', 'pm', 'textile', 'org', 'fountain', 'rdoc', 'json', 'jsonl', 'ndjson', 'yaml', 'yml', 'toml', 'csv', 'tsv', 'psv', 'dsv', 'ini', 'cfg', 'conf', 'properties', 'env', 'reg', 'inf', 'manifest', 'key'];
const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'pyw', 'pyi', 'pyc', 'pyd', 'rb', 'rbi', 'php', 'php3', 'php4', 'php5', 'phps', 'phpt', 'phtml', 'java', 'class', 'kt', 'kts', 'scala', 'sc', 'groovy', 'gy', 'go', 'rs', 'swift', 'm', 'mm', 'h', 'hh', 'c', 'cc', 'cpp', 'cxx', 'hpp', 'hxx', 'cs', 'vb', 'fs', 'fsx', 'fsi', 'd', 'pas', 'pp', 'lpr', 'lpi', 'pl', 'pm', 't', 'r', 'R', 'Rmd', 'Rnw', 'jl', 'ex', 'exs', 'erl', 'hrl', 'clj', 'cljs', 'cljc', 'edn', 'lua', 'sql', 'ps1', 'psm1', 'psd1', 'sh', 'bash', 'zsh', 'fish', 'csh', 'ksh', 'bat', 'cmd', 'awk', 'sed', 'nim', 'v', 'zig', 'drawio'];

const docExtensions: string[] = [];
if (navigator.userAgent.toLowerCase().includes('firefox')) {
  docExtensions.push('pdf');
}

interface PreviewFileActionProps {
  filePreviewPath: string;
  filePreviewComponent: any;
  onDownload: () => void;
  open: boolean;
  setShow: () => void;
}

const PreviewFileAction = ({ filePreviewPath, onDownload, setShow, open }: PreviewFileActionProps) => {
  const { selectedFiles }: { selectedFiles: any[] } = useSelection();
  const [extension, setExtension] = useState('');
  const [filePath, setFilePath] = useState('');
  const [content, setContent] = useState('');
  const t = useTranslation();
  const prevOpenRef = useRef(open);
  const [file, setFile] = useState<any>(null)

  if (open && !prevOpenRef.current) {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      const ext = getFileExtension(selectedFiles[0].name)?.toLowerCase()
      setExtension(ext);
      const filePth = [filePreviewPath.slice(0, filePreviewPath.indexOf('?')), encodeURIComponent(selectedFiles[0].path), filePreviewPath.slice(filePreviewPath.indexOf('?'))].join('');
      setFilePath(filePth);

      if (textExtensions.includes(ext) || codeExtensions.includes(ext)) {
        fetch(filePth)
          .then((res) => res.text())
          .then((data) => setContent(data))
          .catch((err) => console.error('Ошибка загрузки:', err));
      }
    }
  }
  prevOpenRef.current = open;

  const handleDownload = () => {
    validateApiCallback(onDownload, "onDownload", selectedFiles);
  };

  if (imageExtensions.includes(extension)) {
    return <Image style={{ display: 'none' }} preview={{ open: open, onOpenChange: setShow }} src={filePath} alt={"Preview Unavailable"} />;
  } else if (videoExtensions.includes(extension)) {
    return <Image style={{ display: 'none' }}
      preview={{
        open: open, onOpenChange: setShow, imageRender: () => (
          open && <video style={{ maxHeight: '90%', maxWidth: '90%' }} src={filePath} controls autoPlay />
        ),
        actionsRender: () => null,
      }}
      alt={"Preview Unavailable"}
    />
  } else if (audioExtensions.includes(extension)) {
    return <Image style={{ display: 'none' }}
      preview={{
        visible: open, onOpenChange: setShow, imageRender: () => (
          open && <audio style={{ width: "90%", maxWidth: 768 }} src={filePath} controls autoPlay />
        ),
        toolbarRender: () => null,
      }}
      alt={"Preview Unavailable"}
    />
  } else if (docExtensions.includes(extension)) {
    return <Image style={{ display: 'none' }}
      preview={{
        open: open,
        onOpenChange: setShow,
        imageRender: () => (
          open && <embed
            src={filePath}
            width={'90%'}
            height={'90%'}
            type="application/pdf"
            title="PDF document"
          />
        ),
        actionsRender: () => null,
      }}
      alt={"Preview Unavailable"}
    />
  } else if ((textExtensions.includes(extension) || codeExtensions.includes(extension)) && file?.size < 1048576) {
    return <Modal
      width="60%"
      centered
      open={open}
      onCancel={setShow}
      footer={open && [
        content !== '' ?
          <Typography.Paragraph>
            <pre style={{ whiteSpace: 'pre-wrap', overflow: 'auto', height: 'calc(80vh - 70px)', margin: 5, textAlign: 'left' }}>
              {content}
            </pre>
          </Typography.Paragraph>
          : <Spin description="Loading..." size="large" />
      ]}
    >
      {open && file && <Space align="start">
        <img src={'/icons/' + getIconForFile(file.name)} height={64} width={64} />
        {file.name}
        {file.size && <Tag>{getDataSize(file.size)}</Tag>}
      </Space>}
    </Modal>
  } else {
    return <Modal
      title={t("previewUnavailable")}
      centered
      open={open}
      onCancel={setShow}
      footer={[
        open && <Button key={'preview-download'} onClick={handleDownload} type="primary">
          {t("download")}
        </Button>
      ]}
    >
      {open && file && <Space align="start">
        <img src={'/icons/' + getIconForFile(file.name)} height={64} width={64} />
        {file.name}
        {file.size && <Tag>{getDataSize(file.size)}</Tag>}
      </Space>}
    </Modal>
  }
};

export default PreviewFileAction;