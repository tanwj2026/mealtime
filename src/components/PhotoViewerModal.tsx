import React from 'react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Scanned Food Photo',
}) => {
  const [scale, setScale] = React.useState(1);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setScale(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div 
        className="bg-stone-900 rounded-3xl border border-stone-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-white"
        role="dialog"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-stone-100">{title}</h3>
            <p className="text-[11px] text-stone-400">Pinch or use zoom controls to inspect shelves</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-stone-400 w-12 text-center font-mono">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
              title="Reset zoom"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 ml-2 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image viewport */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60">
          <div className="transition-transform duration-150 origin-center">
            <img
              src={imageUrl}
              alt="Scanned visual source"
              style={{ transform: `scale(${scale})` }}
              className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-2xl transition-transform"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
