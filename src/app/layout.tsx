import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Website Wireframes Course - Interactive Learning Platform',
  description: 'Learn website wireframing through interactive lessons and hands-on practice'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
