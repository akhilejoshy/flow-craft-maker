import { BrowserWindow, ipcMain, shell, screen, dialog, Menu, powerMonitor } from 'electron';
import path from 'path';


let win = null;

export function createMainWindow(currentDir) {
    if (win) return;
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const WIDTH = 825
    const HEIGHT = 720
    const xPos = screenWidth - WIDTH - 10;
    const yPos = screenHeight - HEIGHT - 50;
    win = new BrowserWindow({
        width: WIDTH,
        height: HEIGHT,
        x: xPos,
        y: yPos,
        frame: true,
        titleBarStyle: 'default',
        // maximizable: false,
        // resizable: false,
        webPreferences: {
            preload: path.join(currentDir, 'preload.js'),
            contextIsolation: true,
            sandbox: false,
            nodeIntegration: false,
        },
    });

    win.on('close', (event) => {
        win.destroy();
    });



    const startUrl = process.env.ELECTRON_START_URL;
    if (startUrl) {
        win.loadURL(startUrl);
        win.webContents.openDevTools({ mode: 'detach' });
    } else {
        const htmlPath = path.join(currentDir, '..', 'dist', 'index.html');
        win.loadFile(htmlPath);
    }


    win.webContents.on('context-menu', (event, params) => {
        const menu = Menu.buildFromTemplate([
            {
                label: 'Inspect',
                click: () => {
                    win.webContents.openDevTools({ mode: 'detach' });
                },
            },
        ]);
        menu.popup({ window: win });
    });


    return win;
}

export function getMainWindow() {
    return win;
}
