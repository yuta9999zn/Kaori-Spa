'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import CommandPalette from './CommandPalette';

export default function SearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-brand-cream bg-brand-ivory px-3 py-2 text-xs text-brand-textmuted hover:border-brand-gold transition"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Tìm…</span>
        <kbd className="hidden lg:inline-block bg-white border border-brand-cream rounded px-1.5 text-[10px] font-mono">⌘K</kbd>
      </button>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}
