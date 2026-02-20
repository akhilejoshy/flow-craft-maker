import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMainWindow } from './mainWindow.js';

const __filename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(__filename);


app.setName('Workflow');
app.setAppUserModelId('Workflow');


app.whenReady().then(() => {
    createMainWindow(currentDir);
    app.applicationMenu = null;
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow(currentDir);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});