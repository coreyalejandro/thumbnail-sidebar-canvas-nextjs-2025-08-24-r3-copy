'use client';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { Move, Maximize2, Minimize2 } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

export default function SlideFrame({
  children,
  variant = 'full',
  className
}: {
  children: ReactNode;
  variant?: 'full' | 'thumb';
  className?: string;
}) {
  const baseW = 1280, baseH = 800;
  
  // State for movable and resizable functionality
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [size, setSize] = useState<Size>({ width: 800, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const frameRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number }>({ x: 0, y: 0, startX: 0, startY: 0 });
  const resizeStartRef = useRef<{ x: number; y: number; startWidth: number; startHeight: number }>({ x: 0, y: 0, startWidth: 0, startHeight: 0 });

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
    
    // Load saved position and size from localStorage
    const savedPosition = localStorage.getItem('slideFrame-position');
    const savedSize = localStorage.getItem('slideFrame-size');
    
    if (savedPosition) {
      try {
        setPosition(JSON.parse(savedPosition));
      } catch (e) {
        console.warn('Failed to parse saved position');
      }
    }
    
    if (savedSize) {
      try {
        setSize(JSON.parse(savedSize));
      } catch (e) {
        console.warn('Failed to parse saved size');
      }
    }
  }, []);

  // Save position and size to localStorage
  useEffect(() => {
    if (isHydrated && variant === 'full') {
      localStorage.setItem('slideFrame-position', JSON.stringify(position));
    }
  }, [position, isHydrated, variant]);

  useEffect(() => {
    if (isHydrated && variant === 'full') {
      localStorage.setItem('slideFrame-size', JSON.stringify(size));
    }
  }, [size, isHydrated, variant]);

  // Handle mouse events for dragging
  useEffect(() => {
    if (variant !== 'full') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        setPosition({
          x: dragStartRef.current.startX + deltaX,
          y: dragStartRef.current.startY + deltaY
        });
      }
      
      if (isResizing) {
        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;
        setSize({
          width: Math.max(300, resizeStartRef.current.startWidth + deltaX),
          height: Math.max(200, resizeStartRef.current.startHeight + deltaY)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isDragging ? 'grabbing' : 'nw-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, variant]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: position.x,
      startY: position.y
    };
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startWidth: size.width,
      startHeight: size.height
    };
  };

  const resetPosition = () => {
    setPosition({ x: 0, y: 0 });
    setSize({ width: 800, height: 500 });
  };

  if (variant === 'thumb') {
    const thumbW = 200, thumbH = 125;
    const scale = Math.min(thumbW / baseW, thumbH / baseH);
    return (
      <div 
        className={cn(
          'relative overflow-hidden rounded-2xl border border-[color:var(--ring)] bg-black/20',
          className
        )} 
        style={{ width: thumbW, height: thumbH }} 
        aria-hidden
      >
        <div 
          className='origin-top-left' 
          style={{ 
            width: baseW, 
            height: baseH, 
            transform: `scale(${scale})` 
          }}
        >
          <div className='w-[1280px] h-[800px]'>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Full variant with drag and resize functionality
  return (
    <div className={cn('w-full h-full flex items-center justify-center relative', className)}>
      <div 
        ref={frameRef}
        className='relative bg-black/20 rounded-3xl border border-[color:var(--ring)] shadow-glow overflow-hidden group'
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging || isResizing ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {/* Drag Handle */}
        <div 
          className='absolute top-2 left-2 right-2 h-8 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex items-center justify-between px-3 z-10'
          onMouseDown={handleDragStart}
        >
          <div className='flex items-center gap-2 text-xs text-white/60'>
            <Move size={14} />
            <span>Drag to move</span>
          </div>
          <button 
            onClick={resetPosition}
            className='p-1 hover:bg-white/10 rounded transition-colors'
            title='Reset position and size'
          >
            <Minimize2 size={12} />
          </button>
        </div>

        {/* Content Container */}
        <div className='absolute inset-0 overflow-hidden'>
          <div 
            className='w-[1280px] h-[800px] origin-top-left'
            style={{
              transform: `scale(${Math.min(size.width / baseW, size.height / baseH)})`
            }}
          >
            <div className='w-[1280px] h-[800px]'>
              {children}
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div 
          className='absolute bottom-2 right-2 w-6 h-6 bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-nw-resize flex items-center justify-center z-10'
          onMouseDown={handleResizeStart}
          title='Drag to resize'
        >
          <Maximize2 size={12} className='text-white/60' />
        </div>

        {/* Corner indicators */}
        <div className='absolute top-2 left-2 w-2 h-2 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity' />
        <div className='absolute top-2 right-2 w-2 h-2 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity' />
        <div className='absolute bottom-2 left-2 w-2 h-2 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity' />
      </div>
    </div>
  );
}
