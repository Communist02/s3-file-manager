import { Descriptions, Typography } from 'antd';



interface FilePropertiesProps {
    properties: {};
}

// Функция для форматирования размера файла
const formatFileSize = (bytes: number | any) => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function FileProperties({ properties }: FilePropertiesProps) {
    const items: Record<string, any>[] = [];

    let name = '';
    let content: any;
    for (let [key, value] of Object.entries(properties)) {
        switch (key) {
            case 'size':
            case 'sum_size': {
                value = formatFileSize(value);
            }
        }
        name = key;
        content = value;

        switch (key) {
            case 'collection_id':
            case 'other':
                continue;
            case 'other_text':
                continue;
            case 'size':
                name = 'Размер';
                break;
            case 'path':
                name = 'Путь';
                break;
            case 'name':
                name = 'Имя';
                break;
            case 'format':
                name = 'Формат';
                break;
            case 'last_modified':
                name = 'Изменено';
                const formatter = Intl.DateTimeFormat('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                content = formatter.format(Date.parse(value as string));
                break;
            case 'sum_size':
                name = 'Суммарный размер';
                break;
            case 'count_dir':
                name = 'Кол-во директорий';
                break;
            case 'count_files':
                name = 'Кол-во файлов';
                break;
        }
        items.push({
            key: key,
            label: name,
            children: typeof value === 'object' ? <Typography><pre style={{ margin: 0 }}>{JSON.stringify(content, null, 4)}</pre></Typography> : content,
        })
    }

    return <Descriptions bordered size={'small'} column={1} items={items} />;
}

export default FileProperties;
