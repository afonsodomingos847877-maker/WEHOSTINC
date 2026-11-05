'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Users } from 'lucide-react';

interface Contact {
  email: string;
  name?: string;
}

interface ContactPickerProps {
  contacts: Contact[];
  value: string;
  onSelect: (email: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function ContactPicker({ contacts, value, onSelect, open, setOpen }: ContactPickerProps) {
  const [filter, setFilter] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = contacts.filter(c => {
    const q = filter.toLowerCase();
    return c.email.toLowerCase().includes(q) || (c.name ?? '').toLowerCase().includes(q);
  });

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setFilter('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, setOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) {
        onSelect(filtered[activeIndex].email);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }, [filtered, activeIndex, onSelect, setOpen]);

  const getInitials = (contact: Contact) => {
    if (contact.name) {
      return contact.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    }
    return contact.email[0].toUpperCase();
  };

  if (!open) return null;

  return (
    <div ref={containerRef} className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <Users className="w-4 h-4 text-purple-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-600 flex-1">Selecionar Contacto</span>
        <button
          onClick={() => setOpen(false)}
          className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Search input */}
      <div className="px-3 py-2 border-b border-gray-100">
        <input
          ref={inputRef}
          type="text"
          value={filter}
          onChange={e => { setFilter(e.target.value); setActiveIndex(0); }}
          onKeyDown={handleKeyDown}
          placeholder="Pesquisar contactos..."
          className="w-full text-sm bg-gray-100 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400"
        />
      </div>

      {/* Contact list */}
      <ul ref={listRef} className="max-h-56 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <li className="px-4 py-3 text-sm text-gray-400 text-center">Nenhum contacto encontrado</li>
        ) : (
          filtered.map((contact, i) => (
            <li
              key={contact.email}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => { onSelect(contact.email); setOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                i === activeIndex ? 'bg-purple-50' : 'hover:bg-gray-50'
              }`}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{getInitials(contact)}</span>
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                {contact.name && (
                  <p className="text-sm font-medium text-gray-800 truncate">{contact.name}</p>
                )}
                <p className={`truncate ${contact.name ? 'text-xs text-gray-500' : 'text-sm text-gray-700'}`}>
                  {contact.email}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* Footer hint */}
      {filtered.length > 0 && (
        <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 flex gap-3 text-xs text-gray-400">
          <span>↑↓ navegar</span>
          <span>Enter selecionar</span>
          <span>Esc fechar</span>
        </div>
      )}
    </div>
  );
}
