import { useEffect, useRef, useState } from 'react';
import { searchPlaces, shorten, Suggestion } from '../lib/geo';

interface Props {
  placeholder: string;
  value: string;
  onSelect: (s: Suggestion) => void;
}

export default function AddressSearch({ placeholder, value, onSelect }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      setResults(await searchPlaces(q));
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <input
        className="input"
        placeholder={placeholder}
        value={open ? q : value ? shorten(value) : q}
        onFocus={() => {
          setOpen(true);
          setQ('');
        }}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
      />
      {open && (q.trim().length >= 3 || loading) && (
        <div className="absolute z-[1000] mt-2 w-full max-h-64 overflow-auto bg-white rounded-2xl border border-slate-100 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)] p-1.5 text-sm">
          {loading && <div className="px-3 py-2 text-slate-400">Searching…</div>}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-slate-400">No matches</div>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              className="block w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50"
              onClick={() => {
                onSelect(r);
                setOpen(false);
                setQ('');
              }}
            >
              {shorten(r.label)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
