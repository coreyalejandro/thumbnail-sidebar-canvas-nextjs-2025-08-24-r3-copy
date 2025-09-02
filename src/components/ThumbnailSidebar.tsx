'use client';
import { PAGES } from '@/lib/pages';
import SlideFrame from '@/components/SlideFrame';
import { cn } from '@/lib/cn';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ThumbnailSidebar({
  activeId,
  onSelect
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [rightDocked, setRightDocked] = useState<boolean>(false);
  const [yOffset, setYOffset] = useState<number>(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startOffset = useRef(0);

  // Handle initial state after hydration
  useEffect(() => {
    setIsHydrated(true);
    
    // Load saved dock side
    const savedDockSide = localStorage.getItem('dockSide');
    if (savedDockSide === 'right') {
      setRightDocked(true);
    }
    
    // Load saved Y offset
    const savedY = localStorage.getItem('dockY');
    if (savedY) {
      setYOffset(Number(savedY) || 0);
    }
  }, []);

  // Save dock side to localStorage (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('dockSide', rightDocked ? 'right' : 'left');
    }
  }, [rightDocked, isHydrated]);

  // Save Y offset to localStorage (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('dockY', String(yOffset));
    }
  }, [yOffset, isHydrated]);

  // Pointer event handlers
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dy = e.clientY - startY.current;
      setYOffset(Math.max(-200, Math.min(200, startOffset.current + dy)));
    };

    const onUp = () => {
      dragging.current = false;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return (
    <div 
      className={cn(
        'fixed z-50 top-1/2 -translate-y-1/2',
        rightDocked ? 'right-6' : 'left-6'
      )}
      style={{ transform: `translateY(calc(-50% + ${yOffset}px))` }}
      role='navigation'
      aria-label='Thumbnail page navigator'
    >
      <div className='card p-3 backdrop-blur-md bg-black/40 border-white/10 shadow-glow'>
        <div className='flex items-center justify-between gap-2 pb-2'>
          <button 
            className='btn cursor-grab select-none'
            onPointerDown={(e) => {
              dragging.current = true;
              startY.current = e.clientY;
              startOffset.current = yOffset;
            }}
            aria-label='Drag sidebar vertically'
          >
            ▤
          </button>
          <button 
            className='btn'
            onClick={() => setRightDocked(s => !s)}
            aria-label={rightDocked ? 'Dock left' : 'Dock right'}
          >
            {rightDocked ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
        <div className='grid gap-2 max-h-[70vh] overflow-auto pr-1 scrollbar-thin'>
          {PAGES.map(p => {
            const selected = p.id === activeId;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={cn(
                  'relative text-left rounded-2xl border overflow-hidden hover:brightness-110 transition',
                  selected ? 'ring-2 ring-white/30 border-white/40' : 'border-white/10'
                )}
                aria-current={selected}
                aria-label={`Open ${p.title}`}
                title={`${p.title}${p.subtitle ? ' — ' + p.subtitle : ''}`}
              >
                <SlideFrame variant='thumb'>
                  {p.render()}
                </SlideFrame>
                <div className='absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs'>
                  <div className='truncate'>{p.title}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
