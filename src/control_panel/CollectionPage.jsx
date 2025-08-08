import { useState, useRef, useEffect } from 'react';
import { Button, Flex, Modal, Select, Segmented } from 'antd';
import { removeCollection, getGroups, getOtherUsers, giveAccessUserToCollection } from '../api/api';

function CollectionPage({ index, collections, getCollections, token }) {
    const [isModalOpenRemove, setIsModalOpenRemove] = useState(false);
    const [isModalOpenAccess, setIsModalOpenAccess] = useState(false);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [accessId, setAccessId] = useState('');
    const [groupMode, setGroupMode] = useState(false);
    const showModalRemove = () => setIsModalOpenRemove(true);
    async function showModalAccess() {
        let response = await getOtherUsers(token);
        if (response.status === 200) {
            let usersOptions = [];
            const usersList = response.data;
            for (const user of usersList) {
                usersOptions.push({
                    label: user.login,
                    value: user.id,
                });
            }
            setUsers(usersOptions);
        }
        response = await getGroups(token);
        if (response.status === 200) {
            let groupsOptions = [];
            const groupsList = response.data;
            for (const group of groupsList) {
                groupsOptions.push({
                    label: group.title,
                    value: group.id,
                });
            }
            setGroups(groupsOptions);
        }
        setIsModalOpenAccess(true);
    }
    const handleCancelRemove = () => setIsModalOpenRemove(false);
    const handleCancelAccess = () => setIsModalOpenAccess(false);
    const handleOkRemove = async () => {
        await removeCollection(collections[index].name, token);
        await getCollections(token);
        setIsModalOpenRemove(false);
    };
    const handleOkAccess = async () => {
        if (!groupMode) {
            await giveAccessUserToCollection(collections[index].id, accessId, token);
        }
        setIsModalOpenAccess(false);
    };
    function handleChange(value) {
        setAccessId(value);
    }
    if (index !== -1 && index < collections.length) {
        const collection = collections[index]
        return (
            <>
                <Flex vertical gap="small" style={{ width: '100%' }}>
                    <Button color="danger" variant="outlined" onClick={showModalRemove}>Удалить коллекцию {collection.name}</Button>
                    <Button color="cyan" variant="solid" onClick={showModalAccess}>Предоставить доступ к коллекции</Button>
                    {/* <p>{collection.name}</p> */}
                </Flex>
                <Modal
                    title="Удаление коллекции"
                    open={isModalOpenRemove}
                    okType='danger'
                    okText='Удалить'
                    onOk={handleOkRemove}
                    onCancel={handleCancelRemove}
                >
                    <p>Вы действительно хотите удалить {collection.name} ?</p>
                </Modal>
                <Modal
                    title={"Предоставление доступа для коллекции " + collection.name}
                    open={isModalOpenAccess}
                    onOk={handleOkAccess}
                    onCancel={handleCancelAccess}
                    okButtonProps={{ disabled: accessId === '' }}
                >
                    <Segmented
                        options={['Для пользователя', 'Для группы']}
                        onChange={value => {
                            setAccessId('');
                            setGroupMode(value === 'Для группы');
                        }}
                    />
                    {groupMode ? <p>Группа</p> : <p>Пользователь</p>}
                    <Select
                        showSearch
                        value={accessId}
                        style={{ width: '100%' }}
                        placeholder="Выберите кому предоставить"
                        optionFilterProp="label"
                        onChange={handleChange}
                        // onSearch={onSearch}
                        options={groupMode ? groups : users}
                    />
                </Modal>
            </>
        );
    }
}

export default CollectionPage;
