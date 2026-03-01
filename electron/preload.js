// electron/preload.js
import { contextBridge, ipcRenderer } from 'electron';
import fs from 'fs';
import path from 'path';

contextBridge.exposeInMainWorld('electronAPI', {
  getScreenshots: (folderPath) => {
    const fullPath = path.resolve(folderPath);
    if (!fs.existsSync(fullPath)) return [];

    return fs.readdirSync(fullPath)
      .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
      .map(file => {
        const filePath = path.join(fullPath, file);
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(file).toLowerCase().slice(1);

        // Convert the buffer to a Base64 Data URL
        const base64 = buffer.toString('base64');
        return {
          name: file,
          fullPath: filePath,
          // Use this string as the <img> src
          url: `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${base64}`
        };
      });
  },
  saveFile: (folderPath, fileName, buffer) => {
    const fullPath = path.resolve(folderPath);
    if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
    const filePath = path.join(fullPath, fileName);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return filePath;
  },
  deleteFile: (filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  },
  readFileAsBuffer: (filePath) => {
    return fs.readFileSync(filePath);
  }
});