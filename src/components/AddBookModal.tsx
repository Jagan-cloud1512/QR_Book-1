import React, { useState } from 'react';
import { X, Plus, BookOpen, Save } from 'lucide-react';
import { BookRecord } from '../types';
import { saveSingleBook } from '../services/firebase';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onBookAdded: () => void;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  username,
  onBookAdded
}) => {
  const [bookId, setBookId] = useState(`LIB-${Math.floor(1000 + Math.random() * 9000)}`);
  const [title, setTitle] = useState('');
  const [section, setSection] = useState('Section A');
  const [qty, setQty] = useState<number | string>(1);
  const [row, setRow] = useState<number | string>(1);
  const [col, setCol] = useState<string | number>('1-2');

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId.trim() || !title.trim()) return;

    setSaving(true);
    const qtyNum = Math.max(0, Number(qty) || 0);

    const newBook: BookRecord = {
      bookId: bookId.trim(),
      title: title.trim(),
      qty: qtyNum,
      section: section.trim() || 'Section A',
      row: row,
      col: col,
      reservedBy: null,
      queue: [],
      status: qtyNum > 0 ? 'Available' : 'Out of Stock'
    };

    await saveSingleBook(username, newBook);
    setSaving(false);
    onBookAdded();
    onClose();

    // Reset ID for next insertion
    setBookId(`LIB-${Math.floor(1000 + Math.random() * 9000)}`);
    setTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass bg-[#111111] rounded-xl border border-white/10 shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white">Add New Book Record</h3>
              <p className="text-xs text-neutral-400">Inserts document into collection <code className="code-font text-emerald-400">user_{username}</code></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          <div>
            <label className="block font-bold text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Book ID</label>
            <input
              type="text"
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded border border-white/10 bg-neutral-900 code-font text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Book Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Operating System Concepts"
              required
              className="w-full px-3.5 py-2 rounded border border-white/10 bg-neutral-900 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Initial Qty</label>
              <input
                type="number"
                min="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded border border-white/10 bg-neutral-900 code-font text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Section</label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="Section A"
                required
                className="w-full px-3.5 py-2 rounded border border-white/10 bg-neutral-900 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Row</label>
              <input
                type="text"
                value={row}
                onChange={(e) => setRow(e.target.value)}
                placeholder="1"
                required
                className="w-full px-3.5 py-2 rounded border border-white/10 bg-neutral-900 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Column</label>
              <input
                type="text"
                value={col}
                onChange={(e) => setCol(e.target.value)}
                placeholder="e.g. 1-4"
                required
                className="w-full px-3.5 py-2 rounded border border-white/10 bg-neutral-900 code-font text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-white/10 text-xs font-mono text-neutral-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
