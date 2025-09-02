'use client';
import { PAGES } from '@/lib/pages';
import SlideFrame from '@/components/SlideFrame';
import { useEffect, useMemo } from 'react';

export default function PageCanvas({ activeId }: { activeId: string }) {
  const page = useMemo(() => PAGES.find(p => p.id === activeId) ?? PAGES[0], [activeId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = new URL(window.location.href);
    u.hash = `#${page.id}`;
    history.replaceState(null, '', u.toString());
  }, [page.id]);

  return (
    <SlideFrame variant='full'>
      {page.render()}
    </SlideFrame>
  );
}
