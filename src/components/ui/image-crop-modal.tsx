'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropModalProps {
  file: File;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropModal({ file, onConfirm, onCancel }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const CANVAS_SIZE = 300;

  // Load image
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      const minDim = Math.min(image.width, image.height);
      const initialZoom = CANVAS_SIZE / minDim;
      setZoom(initialZoom);
      setOffset({ x: 0, y: 0 });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clampOffset = useCallback((ox: number, oy: number) => {
    if (!img) return { x: ox, y: oy };
    const scaledW = img.width * zoom;
    const scaledH = img.height * zoom;
    const maxX = Math.max(0, (scaledW - CANVAS_SIZE) / 2);
    const maxY = Math.max(0, (scaledH - CANVAS_SIZE) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, [img, zoom]);

  const draw = useCallback(() => {
    if (!canvasRef.current || !img) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const scaledW = img.width * zoom;
    const scaledH = img.height * zoom;
    const x = (CANVAS_SIZE - scaledW) / 2 + offset.x;
    const y = (CANVAS_SIZE - scaledH) / 2 + offset.y;
    ctx.drawImage(img, x, y, scaledW, scaledH);
  }, [img, zoom, offset]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy));
  };
  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    dragStart.current = { mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging || !dragStart.current) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.mx;
    const dy = t.clientY - dragStart.current.my;
    setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy));
  };

  const handleZoom = (newZoom: number) => {
    setZoom(newZoom);
    setOffset(prev => clampOffset(prev.x, prev.y));
  };

  const handleConfirm = () => {
    if (!canvasRef.current || !img) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) onConfirm(blob);
    }, 'image/jpeg', 0.92);
  };

  const minZoom = img ? CANVAS_SIZE / Math.max(img.width, img.height) : 0.5;
  const maxZoom = img ? (CANVAS_SIZE / Math.min(img.width, img.height)) * 4 : 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Crop Image</h2>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-xs text-gray-400 mb-3 text-center">Drag to reposition · Use slider to zoom</p>
          <div
            className="mx-auto overflow-hidden rounded-xl border-2 border-[#103d2b] shadow-inner"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="block" />
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => handleZoom(Math.max(minZoom, zoom - 0.1))} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoom(Number(e.target.value))}
              className="flex-1 accent-[#103d2b]"
            />
            <button onClick={() => handleZoom(Math.min(maxZoom, zoom + 0.1))} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex gap-3 px-4 pb-4">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">
            Cancel
          </button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl bg-[#103d2b] text-white text-sm font-semibold flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            Use This Crop
          </button>
        </div>
      </div>
    </div>
  );
}
