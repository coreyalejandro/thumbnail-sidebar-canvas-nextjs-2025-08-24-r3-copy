import { ReactNode } from 'react';
import OverviewSlide from '@/components/pages/OverviewSlide';
import AnalyticsSlide from '@/components/pages/AnalyticsSlide';
import GallerySlide from '@/components/pages/GallerySlide';
import DocsSlide from '@/components/pages/DocsSlide';

export type PageDef = {
  id: string;
  title: string;
  subtitle?: string;
  render: () => ReactNode;
};

export const PAGES: PageDef[] = [
  {
    id: 'wireframe-overview',
    title: 'Creating Wireframes for a Website Redesign',
    subtitle: 'Introduction to wireframing fundamentals',
    render: () => <OverviewSlide />
  },
  {
    id: 'project-goals',
    title: 'Understanding Project Goals and User Needs',
    subtitle: 'Research and analysis techniques',
    render: () => <AnalyticsSlide />
  },
  {
    id: 'information-architecture',
    title: 'Defining the Information Architecture',
    subtitle: 'Structure and navigation planning',
    render: () => <GallerySlide />
  },
  {
    id: 'sketching-concepts',
    title: 'Sketching Initial Wireframe Concepts',
    subtitle: 'From ideas to low-fidelity designs',
    render: () => <DocsSlide />
  }
]
