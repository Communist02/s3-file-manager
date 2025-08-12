import React, { useEffect, useMemo, useState } from "react";
import { getFileExtension } from "../../../utils/getFileExtension";
import Loader from "../../../components/Loader/Loader";
import { useSelection } from "../../../contexts/SelectionContext";
import Button from "../../../components/Button/Button";
import { getDataSize } from "../../../utils/getDataSize";
import { MdOutlineFileDownload } from "react-icons/md";
import { useFileIcons } from "../../../hooks/useFileIcons";
import { FaRegFileAlt } from "react-icons/fa";
import { useTranslation } from "../../../contexts/TranslationProvider";
import "./PreviewFile.action.scss";
import { validateApiCallback } from "../../../utils/validateApiCallback";
import { Typography, Image } from "antd";
import { element } from "prop-types";

const imageExtensions = ["jpg", "jpeg", "png", 'gif', 'svg', 'webp', 'avif'];
const videoExtensions = ["mp4", "mov", "avi", 'webm', 'av1', '3gp'];
const audioExtensions = ["mp3", "wav", "m4a", 'ogg'];
const textExtensions = ['txt', 'text', 'asc', 'ascii', 'log', 'logs', 'err', 'error', 'warn', 'warning', 'info', 'debug', 'trace', 'audit', 'history', 'session', 'cache', 'tmp', 'temp', 'swp', 'swo', 'swn', 'pid', 'lock', 'lck', 'state', 'status', 'md', 'markdown', 'rst', 'rest', 'adoc', 'asciidoc', 'tex', 'latex', 'bib', 'wiki', 'creole', 'pod', 'pm', 'textile', 'org', 'fountain', 'rdoc', 'json', 'jsonl', 'ndjson', 'yaml', 'yml', 'toml', 'csv', 'tsv', 'psv', 'dsv', 'ini', 'cfg', 'conf', 'properties', 'env', 'reg', 'inf', 'manifest'];
const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'pyw', 'pyi', 'pyc', 'pyd', 'rb', 'rbi', 'php', 'php3', 'php4', 'php5', 'phps', 'phpt', 'phtml', 'java', 'class', 'jar', 'kt', 'kts', 'scala', 'sc', 'groovy', 'gy', 'go', 'rs', 'swift', 'm', 'mm', 'h', 'hh', 'c', 'cc', 'cpp', 'cxx', 'hpp', 'hxx', 'cs', 'vb', 'fs', 'fsx', 'fsi', 'd', 'pas', 'pp', 'lpr', 'lpi', 'pl', 'pm', 't', 'r', 'R', 'Rmd', 'Rnw', 'jl', 'ex', 'exs', 'erl', 'hrl', 'clj', 'cljs', 'cljc', 'edn', 'lua', 'sql', 'ps1', 'psm1', 'psd1', 'sh', 'bash', 'zsh', 'fish', 'csh', 'ksh', 'bat', 'cmd', 'awk', 'sed', 'nim', 'v', 'zig'];
const docExtensions = ['pdf'];

const PreviewFileAction = ({ filePreviewPath, filePreviewComponent, onDownload }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { selectedFiles } = useSelection();
  const fileIcons = useFileIcons(73);
  const extension = getFileExtension(selectedFiles[0].name)?.toLowerCase();
  const filePath = `${filePreviewPath}${selectedFiles[0].path}`;
  const [content, setContent] = useState('');
  const t = useTranslation();

  // Custom file preview component
  const customPreview = useMemo(
    () => filePreviewComponent?.(selectedFiles[0]),
    [filePreviewComponent]
  );

  const handleImageLoad = () => {
    setIsLoading(false); // Loading is complete
    setHasError(false); // No error
  };

  const handleImageError = () => {
    setIsLoading(false); // Loading is complete
    setHasError(true); // Error occurred
  };

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

  let click;
  if (imageExtensions.includes(extension)) {
    const element = document.getElementsByClassName('fm-modal')[0];
    if (element !== undefined) {
      const svg = document.querySelector('.close-icon');
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      click = () => svg.dispatchEvent(clickEvent);
      element.close();
    }
  }

  return (
    <section className={`file-previewer ${extension === "pdf" ? "pdf-previewer" : ""}`}>
      {hasError ||
        (![
          ...imageExtensions,
          ...videoExtensions,
          ...audioExtensions,
          ...textExtensions,
          ...codeExtensions,
          ...docExtensions,
        ].includes(extension) && (
            <div style={{ margin: 10 }} className="preview-error">
              <span className="error-icon">{fileIcons[extension] ?? <FaRegFileAlt size={73} />}</span>
              <span className="error-msg">{t("previewUnavailable")}</span>
              <div className="file-info">
                <span className="file-name">{selectedFiles[0].name}</span>
                {selectedFiles[0].size && <span>-</span>}
                <span className="file-size">{getDataSize(selectedFiles[0].size)}</span>
              </div>
              <Button onClick={handleDownload} padding="0.45rem .9rem">
                <div className="download-btn">
                  <MdOutlineFileDownload size={18} />
                  <span>{t("download")}</span>
                </div>
              </Button>
            </div>
          ))}
      {imageExtensions.includes(extension) && (
        <>
          <div className="image-preview"></div>
          <Loader isLoading={isLoading} />
          <Image style={{ display: 'none' }} preview={{ visible: true, onVisibleChange: click }} onLoad={handleImageLoad} onError={handleImageError} className={`photo-popup-image ${isLoading ? "img-loading" : ""}`} src={filePath} alt={"Preview Unavailable"} />
        </>
      )}
      {videoExtensions.includes(extension) && (
        <video src={filePath} className="video-preview" controls autoPlay />
      )}
      {audioExtensions.includes(extension) && (
        <audio src={filePath} controls autoPlay className="audio-preview" />
      )}
      {docExtensions.includes(extension) && (
        <>
          <object
            data={filePath}
            width={window.innerWidth}
            height={window.innerHeight - 100}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`photo-popup-iframe ${isLoading ? "img-loading" : ""}`}
          />
        </>
      )}
      {(textExtensions.includes(extension) || codeExtensions.includes(extension)) && (
        <>
          {content !== '' ?
            <Typography.Paragraph>
              <pre style={{ whiteSpace: 'pre-wrap', overflow: 'auto', height: 'calc(100vh - 124px)', margin: '10px' }}>
                {content}
              </pre>
            </Typography.Paragraph>
            : <p>{t('loading')}</p>}
        </>
      )}
    </section>
  );
};

export default PreviewFileAction;
