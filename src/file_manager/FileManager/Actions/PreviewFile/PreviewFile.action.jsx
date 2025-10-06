import React, { useEffect, useMemo, useState } from "react";
import { getFileExtension } from "../../../utils/getFileExtension";
import { useSelection } from "../../../contexts/SelectionContext";
import { getDataSize } from "../../../utils/getDataSize";
import { useTranslation } from "../../../contexts/TranslationProvider";
import "./PreviewFile.action.scss";
import { validateApiCallback } from "../../../utils/validateApiCallback";
import { Typography, Image, Card, Modal, Button, Tag, Space } from "antd";
import { getIconForFile,  } from 'vscode-icons-js';

const imageExtensions = ["jpg", "jpeg", "png", 'gif', 'svg', 'webp', 'avif'];
const videoExtensions = ["mp4", "mov", "avi", 'webm', 'av1', '3gp'];
const audioExtensions = ["mp3", "wav", "m4a", 'ogg'];
const textExtensions = ['txt', 'text', 'asc', 'ascii', 'log', 'logs', 'err', 'error', 'warn', 'warning', 'info', 'debug', 'trace', 'audit', 'history', 'session', 'cache', 'tmp', 'temp', 'swp', 'swo', 'swn', 'pid', 'lock', 'lck', 'state', 'status', 'md', 'markdown', 'rst', 'rest', 'adoc', 'asciidoc', 'tex', 'latex', 'bib', 'wiki', 'creole', 'pod', 'pm', 'textile', 'org', 'fountain', 'rdoc', 'json', 'jsonl', 'ndjson', 'yaml', 'yml', 'toml', 'csv', 'tsv', 'psv', 'dsv', 'ini', 'cfg', 'conf', 'properties', 'env', 'reg', 'inf', 'manifest'];
const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'pyw', 'pyi', 'pyc', 'pyd', 'rb', 'rbi', 'php', 'php3', 'php4', 'php5', 'phps', 'phpt', 'phtml', 'java', 'class', 'jar', 'kt', 'kts', 'scala', 'sc', 'groovy', 'gy', 'go', 'rs', 'swift', 'm', 'mm', 'h', 'hh', 'c', 'cc', 'cpp', 'cxx', 'hpp', 'hxx', 'cs', 'vb', 'fs', 'fsx', 'fsi', 'd', 'pas', 'pp', 'lpr', 'lpi', 'pl', 'pm', 't', 'r', 'R', 'Rmd', 'Rnw', 'jl', 'ex', 'exs', 'erl', 'hrl', 'clj', 'cljs', 'cljc', 'edn', 'lua', 'sql', 'ps1', 'psm1', 'psd1', 'sh', 'bash', 'zsh', 'fish', 'csh', 'ksh', 'bat', 'cmd', 'awk', 'sed', 'nim', 'v', 'zig'];

let docExtensions = ['fdghgf'];
if (navigator.userAgent.toLowerCase().includes('firefox')) {
  docExtensions = ['pdf']
}

const PreviewFileAction = ({ filePreviewPath, filePreviewComponent, onDownload, setShow, show }) => {
  const { selectedFiles } = useSelection();
  const extension = getFileExtension(selectedFiles[0].name)?.toLowerCase();
  const filePath = [filePreviewPath.slice(0, filePreviewPath.indexOf('?')), selectedFiles[0].path, filePreviewPath.slice(filePreviewPath.indexOf('?'))].join('');
  const [content, setContent] = useState('');
  const t = useTranslation();

  // Custom file preview component
  const customPreview = useMemo(
    () => filePreviewComponent?.(selectedFiles[0]),
    [filePreviewComponent]
  );

  const handleDownload = () => {
    validateApiCallback(onDownload, "onDownload", selectedFiles);
    // window.location.href = filePath;
  };

  if (React.isValidElement(customPreview)) {
    return customPreview;
  }

  useEffect(() => {
    if (textExtensions.includes(extension) || codeExtensions.includes(extension)) { }
    fetch(filePath)
      .then((res) => res.text())
      .then((data) => setContent(data))
      .catch((err) => console.error('Ошибка загрузки:', err));
  }, [filePath]);

  // let click;
  // if (imageExtensions.includes(extension)) {
  //   const element = document.getElementsByClassName('fm-modal')[0];
  //   if (element !== undefined) {
  //     const svg = document.querySelector('.close-icon');
  //     const clickEvent = new MouseEvent('click', {
  //       bubbles: true,
  //       cancelable: true,
  //       view: window
  //     });
  //     click = () => svg.dispatchEvent(clickEvent);
  //     element.close();
  //   }
  // }

  return (
    <section className={`file-previewer ${extension === "pdf" ? "pdf-previewer" : ""}`}>
      {(![
        ...imageExtensions,
        ...videoExtensions,
        ...audioExtensions,
        ...textExtensions,
        ...codeExtensions,
        ...docExtensions,
      ].includes(extension) && (
          <Modal
            title={t("previewUnavailable")}
            centered
            open={true}
            onCancel={setShow}
            footer={[
              <Button onClick={handleDownload} type="primary">
                {t("download")}
              </Button>
            ]}
          >
            <Space align="start">
              <img src={'/icons/' + getIconForFile(selectedFiles[0].name)} height={64} width={64} />
              {selectedFiles[0].name}
              {selectedFiles[0].size && <Tag>{getDataSize(selectedFiles[0].size)}</Tag>}
            </Space>

          </Modal>
        ))}
      {imageExtensions.includes(extension) && (
        <>
          <div className="image-preview"></div>
          <Image style={{ display: 'none' }} preview={{ visible: show, onVisibleChange: setShow }} src={filePath} alt={"Preview Unavailable"} />
        </>
      )}
      {videoExtensions.includes(extension) && (
        <Image style={{ display: 'none' }}
          preview={{
            visible: show, onVisibleChange: setShow, imageRender: () => (
              <video width="70%" height='70%' src={filePath} controls autoPlay />
            ),
            toolbarRender: () => null,
          }}
          src={filePath}
          alt={"Preview Unavailable"}
        />
      )}
      {audioExtensions.includes(extension) && (
        <Image style={{ display: 'none' }}
          preview={{
            visible: show, onVisibleChange: setShow, imageRender: () => (
              <audio style={{ width: "90%", maxWidth: 768 }} src={filePath} controls autoPlay />
            ),
            toolbarRender: () => null,
          }}
          src={filePath}
          alt={"Preview Unavailable"}
        />
      )}
      {docExtensions.includes(extension) && (
        <Image style={{ display: 'none' }}
          preview={{
            visible: show, onVisibleChange: setShow, imageRender: () => (
              <embed
                src={filePath}
                width={'90%'}
                height={'90%'}
                type="application/pdf"
                title="PDF document"
              />
            ),
            toolbarRender: () => null,
          }}
          src={filePath}
          alt={"Preview Unavailable"}
        />
      )}
      {(textExtensions.includes(extension) || codeExtensions.includes(extension)) && (
        <Image style={{ display: 'none' }}
          preview={{
            visible: show, onVisibleChange: setShow, imageRender: () => (
              <Card style={{ width: "80%", height: '80%', maxWidth: 1080 }}>
                {content !== '' ?
                  <Typography.Paragraph>
                    <pre style={{ whiteSpace: 'pre-wrap', overflow: 'auto', height: 'calc(80vh - 25px)', margin: 5, textAlign: 'left' }}>
                      {content}
                    </pre>
                  </Typography.Paragraph>
                  : <p>{t('loading')}</p>}
              </Card>
            ),
            toolbarRender: () => null,
          }}
          src={filePath}
          alt={"Preview Unavailable"}
        />
      )}
    </section>
  );
};

export default PreviewFileAction;
