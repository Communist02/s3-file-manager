import { useRef, useState } from "react";
import "./CustomUploader.css";

interface CustomUploaderProps {
    url: string;
    token: string;
    collection_id: number;
    path: string;
    dirMode: boolean;
    beforeUpload: (file: any) => boolean;
    onChange: (file: any, collection_id: number) => void;
    onCreateXhr: (uid: any, xhr: any) => void;
    onError: (file: any) => void;
    onProgress: () => void;
    onSuccess: () => void;
    children: any[],
}

export default function CustomUploader({
    url,
    path,
    token,
    collection_id,
    dirMode,
    beforeUpload,
    onChange,
    onCreateXhr,
    onProgress,
    onSuccess,
    onError,
    children
}: CustomUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const currentUid = useRef(0);

    const handleFiles = (files: any[]) => {
        [...files].forEach((file) => {
            file.uid = currentUid.current++;
            uploadFile(file);
        });
    };

    const traverseDirectory = (entry: any, path = "") =>
        new Promise((resolve) => {
            const files: any[] = [];

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


    const uploadFile = (file: any) => {
        if (beforeUpload(file) === false) return;

        let filePath = path + '/';
        const action = `${url}/collections/${collection_id}/upload/${filePath}`;
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
                        uid: file.uid,
                        name: file.name,
                        size: file.size,
                        status: 'uploading',
                        percent: percent ?? 0,
                        // response: xhr.response
                    },

                    collection_id
                );
            }
        };

        xhr.onload = () => {
            if (xhr.status < 200 || xhr.status >= 300) {
                onError(file);
            } else {
                onSuccess(xhr.response, file);
                onChange(
                    {
                        uid: file.uid,
                        name: file.name,
                        size: file.size,
                        status: 'done',
                        percent: 100,
                        // response: xhr.response
                    },
                    collection_id
                );
            }
        };

        xhr.onerror = () => {
            onError(file);
        };

        xhr.open('POST', action, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);

        return {
            abort() {
                xhr.abort();
            }
        };
    };

    const handleDrop = async (e: any) => {
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