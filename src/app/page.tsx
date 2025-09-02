'use client';
import { useEffect, useState } from 'react';
import ThumbnailSidebar from '@/components/ThumbnailSidebar';
import PageCanvas from '@/components/PageCanvas';
import { PAGES } from '@/lib/pages';

export default function Home() {
  const [activeId, setActiveId] = useState<string>(PAGES[0].id);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle initial state after hydration
  useEffect(() => {
    setIsHydrated(true);
    
    // Check URL hash first
    const hash = window.location.hash.replace('#', '');
    const hashExists = PAGES.some(p => p.id === hash);
    if (hashExists) {
      setActiveId(hash);
      return;
    }
    
    // Check localStorage
    const saved = localStorage.getItem('activePageId');
    if (saved && PAGES.some(p => p.id === saved)) {
      setActiveId(saved);
    }
  }, []);

  // Save to localStorage when activeId changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('activePageId', activeId);
    }
  }, [activeId, isHydrated]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const idx = PAGES.findIndex(p => p.id === activeId);
        const next = e.key === 'ArrowUp' 
          ? (idx - 1 + PAGES.length) % PAGES.length 
          : (idx + 1) % PAGES.length;
        setActiveId(PAGES[next].id);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId]);

  // Only render after hydration to prevent SSR mismatches
  if (!isHydrated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ThumbnailSidebar activeId={activeId} onSelect={setActiveId} />
      <PageCanvas activeId={activeId} />
    </div>
  );
}
