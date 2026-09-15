import React from 'react';
import { Library, User, LogOut, Database, Search, Moon, Sun, Settings } from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  currentUser: UserAccount;
  onLogout: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  isFirebaseActive: boolean;
  onOpenFirebaseConfig: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  searchTerm,
  onSearchChange,
  isFirebaseActive,
  onOpenFirebaseConfig
}) => {
  const initials = currentUser.username.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3.5 border-b border-white/10 glass bg-[#050505]/80">
      {/* Left: Brand & System Badge */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center font-bold text-black text-xs shadow-sm">
          QR
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-white flex items-center">
          BIBLIO-SYNC <span className="text-xs font-normal text-neutral-400 ml-2">v2.4.0</span>
        </h1>
      </div>

      {/* Center: Search Trigger Input */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Book ID or Title..."
            className="w-full pl-10 pr-4 py-1.5 text-xs rounded-full border border-white/10 bg-neutral-900/80 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right: Active Session & User Badge */}
      <div className="flex items-center gap-5">
        {/* Firebase Config Button */}
        <button
          onClick={onOpenFirebaseConfig}
          title="Configure Firebase Credentials"
          className={`px-2.5 py-1 rounded text-[11px] font-mono border flex items-center gap-1.5 transition-all ${
            isFirebaseActive
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
          }`}
        >
          <Database className="w-3 h-3" />
          <span>{isFirebaseActive ? 'FIRESTORE ONLINE' : 'LOCAL STORAGE'}</span>
          <Settings className="w-3 h-3 opacity-60" />
        </button>

        {/* User Active Session */}
        <div className="text-right hidden sm:block">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">Active Session</div>
          <div className="text-xs font-mono font-medium text-emerald-400">user_{currentUser.username}</div>
        </div>

        {/* User Avatar Pill */}
        <div className="w-9 h-9 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white shadow-inner">
          {initials}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-1.5 rounded border border-white/10 hover:bg-red-500/20 hover:border-red-500/40 text-neutral-400 hover:text-red-400 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
