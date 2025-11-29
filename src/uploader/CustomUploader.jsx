import { useState } from "react";
import "./CustomUploader.css";

export default function CustomUploader({
    url,
    path,
    token,
    collection_id,
    dirMode,
    beforeUpload = () => true,
    onChange = () => { },
    onCreateXhr = () => { },
    onProgress = () => { },
    onSuccess = () => { },
    onError = () => { },
    children
}) {
    const [dragActive, setDragActive] = useState(false);

    const handleFiles = (files) => {
        [...files].forEach((file) => {
            file.uid = crypto.randomUUID(); // UID как в Ant Upload
            uploadFile(file);
        });
    };

    const traverseDirectory = (entry, path = "") =>
        new Promise((resolve) => {
            const files = [];

            if (entry.isFile) {
                entry.file(file => {
                    // СОХРАНЯЕМ путь самостоятельно
                    file.fullPath = path + file.name;
                    resolve([file]);
                });
            } else if (entry.isDirectory) {
                const dirReader = entry.createReader();
                dirReader.readEntries(async (entries) => {

                    for (const ent of entries) {
                        const res = await traverseDirectory(
                            ent,
                            path + entry.name + "/"
                        );
                        files.push(...res);
                    }

                    resolve(files);
                });
            }
        });


    const uploadFile = (file) => {
        if (beforeUpload(file) === false) return;

        let filePath = path + '/';

        const action = `${url}/collections/${collection_id}/upload/${token}${filePath}`;

        const formData = new FormData();

        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        onCreateXhr(file.uid, xhr);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = (event.loaded / event.total) * 100;
                onProgress({ percent }, file);
                onChange(
                    {
                        file: {
                            uid: file.uid,
                            name: file.name,
                            size: file.size,
                            status: 'uploading',
                            percent: percent ?? 0,
                            // response: xhr.response
                        }
                    }
                );
            }
        };

        xhr.onload = () => {
            if (xhr.status < 200 || xhr.status >= 300) {
                onError(new Error('Upload failed'), file);
            } else {
                onSuccess(xhr.response, file);
                onChange(
                    {
                        file: {
                            uid: file.uid,
                            name: file.name,
                            size: file.size,
                            status: 'done',
                            percent: 100,
                            // response: xhr.response
                        }
                    }
                );
            }
        };

        xhr.onerror = () => {
            onError(new Error('Upload failed'), file);
        };

        xhr.open('POST', action, true);
        xhr.send(formData);

        return {
            abort() {
                xhr.abort();
            }
        };
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const items = e.dataTransfer.items;

        if (!items) return;

        const allFiles = [];

        for (const item of items) {
            const entry = item.webkitGetAsEntry?.();
            if (entry) {
                const files = await traverseDirectory(entry);
                allFiles.push(...files);
            }
        }

        if (allFiles.length) handleFiles(allFiles);
    };

    return (
        <>
            <input
                id="custom-file-input"
                type="file"
                multiple
                style={{ display: "none" }}
                {...(dirMode ? { webkitdirectory: 'true', directory: 'true' } : {})}
                onChange={(e) => handleFiles(e.target.files)}
            />
            <div
                className="drag-and-drop-uploader"
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                style={{
                    // border: "2px dashed #999",
                    // borderRadius: 8,
                    padding: 40,
                    textAlign: "center",
                    // // background: dragActive ? "#white" : "white",
                    cursor: "pointer"
                }}
                onClick={() => document.getElementById("custom-file-input").click()}
            >
                <input
                    id="file-input"
                    type="file"
                    style={{ display: "none" }}
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                />
                {children}
            </div>
        </>
    );
}