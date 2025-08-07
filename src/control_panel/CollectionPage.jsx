import { useState, useRef, useEffect } from 'react';
import { Button, Flex } from 'antd';

function CollectionPage({ index, collections }) {
    if (index !== -1) {
        console.log(collections[index]);
        return (
            <>
                <Flex vertical gap="small" style={{ width: '100%' }}>
                    <Button color="danger" variant="outlined">Удалить {collections[index].name}</Button>
                    <p>{collections[index].name}</p>
                </Flex>
            </>
        );
    } else {
        return (
            <p>Выберите коллекцию</p>
        );
    }
}

export default CollectionPage;
