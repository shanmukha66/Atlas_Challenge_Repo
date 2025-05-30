'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="w-full h-screen flex items-center justify-center">Loading map...</div>
});

export default function ClientPage() {
  return (
    <main className="min-h-screen">
      <Map />
    </main>
  );
} 