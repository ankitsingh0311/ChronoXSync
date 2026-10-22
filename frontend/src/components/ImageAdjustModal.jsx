import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn, ZoomOut, RotateCw, RefreshCw, Check, X,
  Move, Loader2, Circle, Square, FlipHorizontal
} from 'lucide-react';

export default function ImageAdjustModal({
  isOpen,
  imageSrc,
  onClose,
  onConfirm,
  isUploading = false,
  title = "Adjust Profile Photo"
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cropShape, setCropShape] = useState('circle'); // 'circle' | 'square'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const viewportRef = useRef(null);
  const imageRef = useRef(null);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });

  // Reset state when opening new image
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      setIsFlipped(false);
    }
  }, [isOpen, imageSrc]);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImgNaturalSize({ width: naturalWidth, height: naturalHeight });
  };

  // Drag handling
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(0.8, prev + delta), 3.5));
  };

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset to initial
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setIsFlipped(false);
  };

  // Generate cropped output canvas
  const handleApplyCrop = () => {
    if (!imageRef.current) return;

    const cropBoxSize = 260; // diameter / size of visible crop box in px
    const outputSize = 512; // output image resolution 512x512

    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Fill neutral background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, outputSize, outputSize);

    // Coordinate translation: place center of crop at center of output canvas
    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);

    // Apply rotation & flip
    ctx.rotate((rotation * Math.PI) / 180);
    if (isFlipped) {
      ctx.scale(-1, 1);
    }

    // Scale ratio between output size and viewport crop size
    const scaleFactor = outputSize / cropBoxSize;
    ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

    // Apply pan offset (taking rotation into account)
    let rad = (-rotation * Math.PI) / 180;
    let cos = Math.cos(rad);
    let sin = Math.sin(rad);
    let unrotatedPanX = pan.x * cos - pan.y * sin;
    let unrotatedPanY = pan.x * sin + pan.y * cos;

    if (isFlipped) {
      unrotatedPanX = -unrotatedPanX;
    }

    ctx.translate(unrotatedPanX, unrotatedPanY);

    // Draw the image centered
    const img = imageRef.current;
    let renderW = cropBoxSize;
    let renderH = cropBoxSize;

    if (imgNaturalSize.width && imgNaturalSize.height) {
      const aspect = imgNaturalSize.width / imgNaturalSize.height;
      if (aspect >= 1) {
        renderH = cropBoxSize;
        renderW = cropBoxSize * aspect;
      } else {
        renderW = cropBoxSize;
        renderH = cropBoxSize / aspect;
      }
    }

    ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onConfirm(file);
      },
      'image/jpeg',
      0.92
    );
  };

  if (!isOpen || !imageSrc) return null;

  const CROP_BOX_SIZE = 260; // Dimensions of visible circular crop window

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-card, #131b2e)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text-primary, #f8fafc)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
              {title}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
              Drag to reposition • Scroll or slider to zoom
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #94a3b8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Crop Viewport */}
        <div
          ref={viewportRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          style={{
            position: 'relative',
            width: '100%',
            height: '340px',
            background: '#090d16',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          {/* Scaled & Transformed Image */}
          <div
            style={{
              position: 'absolute',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg) ${isFlipped ? 'scaleX(-1)' : ''}`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.08s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop Source"
              onLoad={handleImageLoad}
              crossOrigin="anonymous"
              style={{
                maxWidth: 'none',
                height: imgNaturalSize.width >= imgNaturalSize.height ? `${CROP_BOX_SIZE}px` : 'auto',
                width: imgNaturalSize.width < imgNaturalSize.height ? `${CROP_BOX_SIZE}px` : 'auto',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Mask Overlay (Dark outside, transparent inside crop circle) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* The Crop Hole */}
            <div
              style={{
                width: `${CROP_BOX_SIZE}px`,
                height: `${CROP_BOX_SIZE}px`,
                borderRadius: cropShape === 'circle' ? '50%' : '12px',
                border: '2px solid rgba(16, 185, 129, 0.85)',
                boxShadow: '0 0 0 9999px rgba(5, 10, 20, 0.72)',
                position: 'relative',
              }}
            >
              {/* Subtle Grid / Crosshair indicator */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '1px dashed rgba(255, 255, 255, 0.25)',
                  borderRadius: cropShape === 'circle' ? '50%' : '12px',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Hint Overlay Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              color: '#e2e8f0',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Move size={12} style={{ color: '#10b981' }} /> Drag to move • Scroll to zoom
          </div>
        </div>

        {/* Controls Section */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.8, z - 0.15))}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                borderRadius: '8px',
                padding: '6px',
                color: 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="0.8"
              max="3.5"
              step="0.02"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{
                flex: 1,
                accentColor: '#10b981',
                cursor: 'pointer',
              }}
            />

            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3.5, z + 0.15))}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                borderRadius: '8px',
                padding: '6px',
                color: 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>

            <span
              style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#10b981',
                minWidth: '42px',
                textAlign: 'right',
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Quick Adjustment Buttons (Rotate, Flip, Reset, Shape) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleRotate}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Rotate 90 degrees"
              >
                <RotateCw size={14} /> Rotate
              </button>

              <button
                type="button"
                onClick={() => setIsFlipped((f) => !f)}
                style={{
                  background: isFlipped ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${isFlipped ? '#10b981' : 'var(--border-subtle, rgba(255,255,255,0.1))'}`,
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: isFlipped ? '#10b981' : 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Flip Horizontal"
              >
                <FlipHorizontal size={14} /> Flip
              </button>

              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Reset Position and Zoom"
              >
                <RefreshCw size={13} /> Reset
              </button>
            </div>

            {/* Shape Toggle */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setCropShape('circle')}
                style={{
                  background: cropShape === 'circle' ? '#10b981' : 'transparent',
                  color: cropShape === 'circle' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                  border: 'none',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Circular Crop"
              >
                <Circle size={14} />
              </button>
              <button
                type="button"
                onClick={() => setCropShape('square')}
                style={{
                  background: cropShape === 'square' ? '#10b981' : 'transparent',
                  color: cropShape === 'square' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                  border: 'none',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Square Crop"
              >
                <Square size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
              color: 'var(--text-secondary, #94a3b8)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isUploading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isUploading}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isUploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
            }}
          >
            {isUploading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check size={15} /> Save & Set Photo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
