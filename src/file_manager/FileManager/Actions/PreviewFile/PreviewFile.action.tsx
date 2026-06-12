import { useEffect, useRef, useState } from "react";
import { getFileExtension } from "../../../utils/getFileExtension";
// @ts-ignore
import { useSelection } from "../../../contexts/SelectionContext";
import { getDataSize } from "../../../utils/getDataSize";
// @ts-ignore
import { useTranslation } from "../../../contexts/TranslationProvider";
// @ts-ignore
import { validateApiCallback } from "../../../utils/validateApiCallback";
import { Image, Modal, Button, Tag, Space, Spin } from "antd";
const { Prism: SyntaxHighlighter } = await import('react-syntax-highlighter');
import { getIconForFile, } from 'vscode-icons-js';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './PreviewFile.css';

const imageExtensions = ["jpg", "jpeg", "png", 'gif', 'webp', 'avif'];
const videoExtensions = ["mp4", "mov", "avi", 'webm', 'av1', '3gp'];
const audioExtensions = ["mp3", "wav", "m4a", 'ogg', 'flac'];

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
  const [file, setFile] = useState<any>(null);

  useEffect(() => {
    if (!open) {
      setContent('');
      setFilePath('');
      setExtension('');
      setFile(null);
    }
  }, [open]);

  if (open && !prevOpenRef.current) {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      const ext = getFileExtension(selectedFiles[0].name)?.toLowerCase()
      setExtension(ext);
      const filePth = [filePreviewPath.slice(0, filePreviewPath.indexOf('?')), encodeURIComponent(selectedFiles[0].path), filePreviewPath.slice(filePreviewPath.indexOf('?'))].join('');
      setFilePath(filePth);

      if (selectedFiles[0].size < 1048576) {
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
        open: open, onOpenChange: setShow, imageRender: () => (
          open && <audio style={{ width: "90%", maxWidth: 768 }} src={filePath} controls autoPlay />
        ),
        actionsRender: () => null,
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
  } else if (file?.size < 1048576) {
    return <Modal
      width="80%"
      className="code-modal"
      centered
      open={open}
      onCancel={setShow}
      footer={null}
    >
      {open && file && <Space style={{ marginLeft: 20 }} align="start">
        <img src={'/icons/' + getIconForFile(file.name)} height={64} width={64} />
        <Space align="start" vertical>
          {file.name}
          <Space>
            <Button key={'preview-download'} onClick={handleDownload} type="primary">
              {t("download")}
            </Button>
            {file.size && <Tag>{getDataSize(file.size)}</Tag>}
          </Space>
        </Space>
      </Space>}
      {open && [
        content !== '' ?
          <div key='code' style={{ overflow: 'auto', maxHeight: 'calc(80vh - 70px)', marginTop: 5, textAlign: 'left' }}>
            <SyntaxHighlighter style={localStorage.getItem('darkTheme') === 'true' ? oneDark : oneLight} className={'code-block'} key='code' showLineNumbers language={extension}>
              {content}
            </SyntaxHighlighter>
          </div>
          : <Spin key="loading-spin" description="Loading..." size="large" />
      ]}
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