import React, { useState } from 'react';
import { Search, Minus, Trash2, Plus, Users, Bookmark, AlertCircle, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';
import { BookRecord, BookStatus } from '../types';
import {
  decrementBookQty,
  zeroOutBookQty,
  releaseReservation,
  deleteSingleBook,
  reserveOrQueueBook
} from '../services/firebase';

interface ModuleInventoryProps {
  username: string;
  books: BookRecord[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onOpenAddBookModal: () => void;
}

export const ModuleInventory: React.FC<ModuleInventoryProps> = ({
  username,
  books,
  searchTerm,
  onSearchChange,
  onOpenAddBookModal
}) => {
  const [reservingBookId, setReservingBookId] = useState<string | null>(null);
  const [simulatedUserId, setSimulatedUserId] = useState(`UID_${Math.floor(1000 + Math.random() * 9000)}`);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Live filtering
  const filteredBooks = books.filter((b) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return b.bookId.toLowerCase().includes(term) || b.title.toLowerCase().includes(term);
  });

  const handleDecrement = async (bookId: string) => {
    await decrementBookQty(username, bookId);
  };

  const handleZeroOut = async (bookId: string) => {
    await zeroOutBookQty(username, bookId);
  };

  const handleRelease = async (bookId: string) => {
    await releaseReservation(username, bookId);
  };

  const handleDelete = async (bookId: string) => {
    if (confirm(`Are you sure you want to delete book ${bookId}?`)) {
      await deleteSingleBook(username, bookId);
    }
  };

  const handleSimulateReservation = async (bookId: string) => {
    if (!simulatedUserId.trim()) return;
    const res = await reserveOrQueueBook(username, bookId, simulatedUserId.trim());
    setFeedbackMsg(res.actionTaken);
    setReservingBookId(null);
    // Refresh random ID for next simulation
    setSimulatedUserId(`UID_${Math.floor(1000 + Math.random() * 9000)}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="glass rounded-xl overflow-hidden border border-white/10 shadow-xl">
      {/* Header & Quick Search */}
      <div className="p-5 border-b border-white/10 bg-black/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-light text-white flex items-center gap-2">
            <span>Real-Time Inventory</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 code-font">
              {filteredBooks.length} Items
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Monitoring dynamic collection: <span className="code-font text-emerald-400">user_{username}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Quick Search Bar */}
          <div className="flex items-center bg-neutral-900 border border-white/10 rounded-full px-3.5 py-1.5 w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Book ID or Title..."
              className="bg-transparent border-none text-xs text-white outline-none w-full placeholder-neutral-500"
            />
          </div>

          <button
            onClick={onOpenAddBookModal}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD BOOK</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 font-mono">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{feedbackMsg}</span>
        </div>
      )}

      {/* Responsive Inventory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-[10px] uppercase tracking-wider text-neutral-400">
              <th className="p-4 font-semibold">Book ID</th>
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Location</th>
              <th className="p-4 font-semibold text-center">Qty</th>
              <th className="p-4 font-semibold">Reserved By</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-neutral-500">
                  <p className="font-semibold text-sm">No book records found</p>
                  <p className="text-xs mt-1">Upload a spreadsheet in Module 1 or click "Add Book" above.</p>
                </td>
              </tr>
            ) : (
              filteredBooks.map((book) => {
                const isOut = book.qty === 0;

                return (
                  <tr
                    key={book.bookId}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    {/* Book ID */}
                    <td className="p-4 code-font text-xs text-emerald-400 font-medium">
                      {book.bookId}
                    </td>

                    {/* Title */}
                    <td className="p-4 font-medium text-white max-w-xs truncate">
                      {book.title}
                    </td>

                    {/* Location */}
                    <td className="p-4 text-neutral-400 code-font">
                      {book.section ? `${book.section} · ` : ''}R{String(book.row).padStart(2, '0')}-C{book.col}
                    </td>

                    {/* Quantity */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block code-font font-bold px-2 py-0.5 rounded ${
                          isOut
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-neutral-800 text-white border border-white/10'
                        }`}
                      >
                        {String(book.qty).padStart(2, '0')}
                      </span>
                    </td>

                    {/* Reserved By / Queue */}
                    <td className="p-4">
                      {book.reservedBy ? (
                        <div className="flex flex-col">
                          <span className="text-amber-400 text-xs font-bold code-font">{book.reservedBy}</span>
                          {book.queue && book.queue.length > 0 && (
                            <span className="text-[9px] text-neutral-400">
                              Queue: {book.queue.length} others waiting
                            </span>
                          )}
                        </div>
                      ) : book.queue && book.queue.length > 0 ? (
                        <div className="flex flex-col text-amber-400 code-font">
                          <span className="text-xs">Queue: [{book.queue.join(', ')}]</span>
                        </div>
                      ) : (
                        <span className="text-xs italic opacity-40 text-neutral-400">None</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 text-[10px]">
                      {book.status === 'Available' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-bold">
                          Available
                        </span>
                      )}
                      {book.status === 'Reserved' && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-bold">
                          Reserved
                        </span>
                      )}
                      {book.status === 'Out of Stock' && (
                        <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 uppercase font-bold">
                          Out of Stock
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* -1 Qty */}
                        <button
                          onClick={() => handleDecrement(book.bookId)}
                          disabled={isOut}
                          title="Decrement quantity by 1"
                          className="w-8 h-8 rounded border border-white/10 hover:bg-white/10 text-white text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          -1
                        </button>

                        {/* Zero Out */}
                        <button
                          onClick={() => handleZeroOut(book.bookId)}
                          disabled={isOut}
                          title="Set quantity to 0 (Out of Stock)"
                          className="px-2 h-8 rounded border border-red-500/50 text-red-500 hover:bg-red-500/10 text-[10px] font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ZERO
                        </button>

                        {/* Release / Clear Reservation */}
                        {book.reservedBy && (
                          <button
                            onClick={() => handleRelease(book.bookId)}
                            title="Release active reservation"
                            className="px-2 h-8 rounded border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 text-[10px] font-bold transition-colors"
                          >
                            RELEASE
                          </button>
                        )}

                        {/* Quick Simulate Mobile Reserve */}
                        <button
                          onClick={() =>
                            reservingBookId === book.bookId
                              ? setReservingBookId(null)
                              : setReservingBookId(book.bookId)
                          }
                          title="Simulate mobile reservation"
                          className="px-2 h-8 rounded border border-white/10 hover:bg-emerald-600 hover:text-black text-neutral-300 text-[10px] font-bold transition-colors"
                        >
                          RESERVE
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(book.bookId)}
                          title="Delete book"
                          className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Inline Reserve Simulator Popup */}
                      {reservingBookId === book.bookId && (
                        <div className="mt-2 p-2.5 bg-neutral-900 rounded border border-white/10 text-left flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-neutral-400 whitespace-nowrap">
                            App User ID:
                          </span>
                          <input
                            type="text"
                            value={simulatedUserId}
                            onChange={(e) => setSimulatedUserId(e.target.value)}
                            className="px-2 py-1 text-xs rounded border border-white/10 bg-black code-font text-emerald-400 w-28 focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            onClick={() => handleSimulateReservation(book.bookId)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-[10px] rounded transition-colors flex items-center gap-1"
                          >
                            <span>CONFIRM</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
