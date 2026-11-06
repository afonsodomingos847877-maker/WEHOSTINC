'use client';

import { useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/;

// Extrai o endereço de "Nome <email@x.com>" ou devolve o próprio texto
function extractAddress(raw: string): string {
  const s = raw.trim().replace(/^["']|["']$/g, '');
  const angle = s.match(/<([^>]+)>/);
  return (angle ? angle[1] : s).trim().toLowerCase();
}

export function splitRecipients(value: string): string[] {
  if (!value) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  value
    .split(/[,;\n]+|\s+(?=[^\s]+@)/)
    .map(extractAddress)
    .filter(Boolean)
    .forEach((e) => {
      if (!seen.has(e)) {
        seen.add(e);
        out.push(e);
      }
    });
  return out;
}

export function isValidRecipient(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/** Normaliza para "a@x.com, b@y.com" (sem duplicados) */
export function normalizeRecipients(value: string): string {
  return splitRecipients(value).join(', ');
}

/** Devolve a lista de endereços inválidos */
export function findInvalidRecipients(value: string): string[] {
  return splitRecipients(value).filter((e) => !isValidRecipient(e));
}

interface RecipientInputProps {
  value: string;
  onChange: (value: string) => void;
  contacts?: { email: string; name: string }[];
  placeholder?: string;
  excludeEmails?: string[];
}

/**
 * Campo de destinatários estilo Outlook/Gmail: cada e-mail vira um "chip".
 * Adicione com Enter, vírgula, ponto e vírgula, espaço, Tab ou ao sair do campo.
 * Suporta colar vários e-mails de uma vez e sugestões dos contactos conhecidos.
 */
export default function RecipientInput({
  value,
  onChange,
  contacts = [],
  placeholder = 'email@exemplo.com',
  excludeEmails = [],
}: RecipientInputProps) {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const recipients = useMemo(() => splitRecipients(value), [value]);

  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    const excluded = new Set([...recipients, ...excludeEmails.map((e) => e.toLowerCase())]);
    return contacts
      .filter((c) => !excluded.has(c.email.toLowerCase()))
      .filter((c) => c.email.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q))
      .slice(0, 6);
  }, [draft, contacts, recipients, excludeEmails]);

  const commit = (text: string) => {
    const added = splitRecipients(text);
    if (added.length === 0) {
      setDraft('');
      return;
    }
    onChange(normalizeRecipients([...recipients, ...added].join(',')));
    setDraft('');
    setActiveIdx(0);
  };

  const remove = (email: string) => {
    onChange(recipients.filter((r) => r !== email).join(', '));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setActiveIdx((i) => (e.key === 'ArrowDown' ? (i + 1) % suggestions.length : (i - 1 + suggestions.length) % suggestions.length));
      return;
    }
    if (e.key === 'Enter' || e.key === ',' || e.key === ';' || (e.key === 'Tab' && draft.trim())) {
      if (!draft.trim()) {
        if (e.key === 'Enter') e.preventDefault(); // não submeter o formulário
        return;
      }
      e.preventDefault();
      const pick = suggestions[activeIdx];
      // Usar a sugestão apenas se o texto digitado ainda não for um e-mail completo
      if (pick && !isValidRecipient(draft.trim().toLowerCase())) {
        commit(pick.email);
      } else {
        commit(draft);
      }
      return;
    }
    if (e.key === ' ' && draft.includes('@')) {
      e.preventDefault();
      commit(draft);
      return;
    }
    if (e.key === 'Backspace' && !draft && recipients.length > 0) {
      e.preventDefault();
      remove(recipients[recipients.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (/[,;\n\s]/.test(text.trim()) || text.includes('@')) {
      e.preventDefault();
      commit(`${draft}${text}`);
    }
  };

  return (
    <div className="relative">
      <div
        onClick={() => inputRef.current?.focus()}
        className={`w-full min-h-[34px] px-2 py-1 bg-gray-50 border rounded-xl flex flex-wrap items-center gap-1 cursor-text transition ${
          focused ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-gray-200'
        }`}
      >
        {recipients.map((email) => {
          const valid = isValidRecipient(email);
          return (
            <span
              key={email}
              title={valid ? email : 'Endereço de e-mail inválido'}
              className={`inline-flex items-center gap-1 max-w-full pl-2 pr-1 py-0.5 rounded-lg text-[11px] font-semibold border ${
                valid
                  ? 'bg-white text-gray-800 border-gray-200'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}
            >
              <span className="truncate">{email}</span>
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  remove(email);
                }}
                className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
                aria-label={`Remover ${email}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setActiveIdx(0);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            // pequeno atraso para permitir clicar numa sugestão
            setTimeout(() => {
              const pending = inputRef.current?.value || '';
              if (pending.trim()) commit(pending);
            }, 150);
          }}
          placeholder={recipients.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-xs font-bold text-gray-900 py-1 px-1 font-sans"
          autoComplete="off"
        />
      </div>

      {focused && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((c, idx) => (
            <button
              key={c.email}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                commit(c.email);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs flex flex-col cursor-pointer ${
                idx === activeIdx ? 'bg-primary-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="font-semibold text-gray-900 truncate">{c.name || c.email}</span>
              {c.name && c.name !== c.email && <span className="text-[10px] text-gray-500 truncate">{c.email}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
