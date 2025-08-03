import { useState, useEffect } from 'react';


function ControlPanel(outAccount, showCtrlPanel) {
    return (
        <div className='control-panel'>
            <div className='header'>
                <h1>Панель управления</h1>
                <div className='header-left'>
                    <button onClick={outAccount}>Выход</button>
                    <button onClick={showCtrlPanel}>Закрыть панель управления</button>
                </div>
            </div>
        </div>
    );
}

export default ControlPanel;