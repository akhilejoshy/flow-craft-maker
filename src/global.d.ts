// src/global.d.ts
export { };

declare global {
  interface Window {
    electronAPI: {
      getScreenshots: (folderPath: string) => { name: string; fullPath: string; url: string; }[];
      readFileAsBuffer: (filePath: string) => ArrayBuffer;
      saveFile: (folderPath: string, fileName: string, buffer: Buffer | ArrayBuffer) => string;
      deleteFile: (filePath: string) => boolean;
    };
  }
}