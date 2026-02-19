import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, X, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScreenshotFile {
  id: string;
  name: string;
  url: string;
}

const Screenshots: React.FC = () => {
  const [files, setFiles] = useState<ScreenshotFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((fileList: FileList) => {
    const newFiles: ScreenshotFile[] = Array.from(fileList)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        url: URL.createObjectURL(f),
      }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length) {
      const dt = new DataTransfer();
      imageFiles.forEach((f) => dt.items.add(f));
      addFiles(dt.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8" onPaste={handlePaste}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Screenshot Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">{files.length} images uploaded</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
          <FolderOpen className="h-4 w-4" />
          {files.length} files
        </div>
      </div>

      {/* Upload area */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Drop images here or click to upload</p>
        <p className="mt-1 text-xs text-muted-foreground">Supports paste from clipboard · PNG, JPG, WebP</p>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </label>

      {/* Grid */}
      {files.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {files.map((file) => (
            <div key={file.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
              <div className="aspect-square">
                <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-xs text-muted-foreground">{file.name}</p>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <div className="mt-12 flex flex-col items-center text-center">
          <ImageIcon className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No screenshots uploaded yet</p>
        </div>
      )}
    </div>
  );
};

export default Screenshots;
