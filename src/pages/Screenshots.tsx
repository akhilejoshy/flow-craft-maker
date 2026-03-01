import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, X, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScreenshotFile {
  id: string;
  name: string;
  url: string;      // This holds the Base64 data
  fullPath: string; // This holds the disk path for deletion
}

const Screenshots: React.FC = () => {
  const [files, setFiles] = useState<ScreenshotFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const folderPath = 'screenshots';
  const [selectedImage, setSelectedImage] = useState<typeof files[0] | null>(null);
  const loadFiles = useCallback(() => {
    // 1. Get Base64 data from preload
    const filesFromDisk = (window as any).electronAPI.getScreenshots(folderPath);

    const formatted = filesFromDisk.map((f: any) => ({
      id: crypto.randomUUID(),
      name: f.name,
      url: f.url,           // Base64 string from preload
      fullPath: f.fullPath  // Real path for fs.unlink
    }));

    setFiles(formatted);
  }, [folderPath]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const addFiles = useCallback(async (fileList: FileList) => {
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      if (!f.type.startsWith('image/')) continue;

      const arrayBuffer = await f.arrayBuffer();
      // Use a unique name to avoid cache issues
      const fileName = `${Date.now()}-${f.name}`;
      (window as any).electronAPI.saveFile(folderPath, fileName, arrayBuffer);
    }
    loadFiles();
  }, [loadFiles]);

  const removeFile = (id: string, fullPath: string) => {
    const success = (window as any).electronAPI.deleteFile(fullPath);
    if (success) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          const dt = new DataTransfer();
          dt.items.add(file);
          addFiles(dt.files);
        }
      }
    }
  };

  const [zoomScale, setZoomScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // To keep image centered or panned

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Reset everything when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [selectedImage]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomSpeed = 0.030;
      const delta = -e.deltaY * zoomSpeed;
      setScale(prev => Math.min(Math.max(prev + delta, 1), 5));
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Only intercept if Ctrl is pressed (Trackpad pinch or Ctrl+Scroll)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // Now this will work!

        const zoomSpeed = 0.005; // Reduced speed for smoother scaling
        const delta = -e.deltaY * zoomSpeed;

        setScale(prev => {
          const newScale = Math.min(Math.max(prev + delta, 1), 5);
          // If we've snapped back to 1, reset position too
          if (newScale === 1) setPosition({ x: 0, y: 0 });
          return newScale;
        });
      }
    };

    // { passive: false } is the key fix here
    container.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [selectedImage]); // Re-attach when modal opens/changes

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      // Calculate start point relative to current position
      setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale === 1) return;

    // Move the image based on mouse delta
    setPosition({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Close the modal on Escape key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // ONLY ONE useEffect needed to load files on mount


  return (
    <div className="mx-auto max-w-5xl px-6 py-8" onPaste={handlePaste}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Screenshot Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">{files.length} images</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
          <FolderOpen className="h-4 w-4" />
          {files.length} files
        </div>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Drop images or paste here</p>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </label>

      {files.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {files.map((file) => (
            <div key={file.id} onClick={() => setSelectedImage(file)} className="group relative cursor-zoom-in overflow-hidden rounded-lg border border-border bg-card transition-all hover:ring-2 hover:ring-primary/50">
              <div className="aspect-video overflow-hidden">
                <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-xs text-muted-foreground">{file.name}</p>
              </div>
              <button
                onClick={() => removeFile(file.id, file.fullPath)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          ref={containerRef} // Attach the ref here
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md select-none overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => setSelectedImage(null)}
        >
          {/* UI Elements (Close button, scale indicator, etc.) */}
          <div className="absolute top-6 right-6 z-[70] flex items-center gap-3">
            <div className="bg-background/50 border px-3 py-1 rounded-full text-xs font-mono">
              {Math.round(scale * 100)}%
            </div>
            <button onClick={() => setSelectedImage(null)} className="p-2 rounded-full bg-muted">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* The Sliding/Zooming Container */}
          <div
            className={cn(
              "relative transition-transform duration-75 ease-out",
              scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            )}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              draggable={false}
              className="block h-auto max-h-[85vh] w-auto shadow-2xl rounded-sm"
            />
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="mt-12 flex flex-col items-center text-center">
          <ImageIcon className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No screenshots found</p>
        </div>
      )}
    </div>
  );
};

export default Screenshots;