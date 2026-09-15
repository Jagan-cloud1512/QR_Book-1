import React from 'react';
import {
  Grid,
  QrCode,
  Layers,
  Plus,
  Shield,
  HelpCircle,
  Database,
  BookOpen
} from 'lucide-react';

export type TabType = 'inventory' | 'import' | 'qr';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAddBookModal: () => void;
  username: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddBookModal,
  username
}) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'inventory', label: 'Inventory Management', icon: <Layers className="w-5 h-5" /> },
    { id: 'import', label: 'Import & Shelf Config', icon: <Grid className="w-5 h-5" /> },
    { id: 'qr', label: 'QR Tools & Printable', icon: <QrCode className="w-5 h-5" /> }
  ];

  return (
    <aside className="w-64 h-full py-6 px-4 border-r border-white/10 bg-black flex flex-col justify-between shrink-0">
      <div>
        {/* User Role / Session Badge */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-9 h-9 rounded bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Library System</h1>
            <p className="text-xs font-mono text-emerald-400">user_{username}</p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="mb-6">
          <button
            onClick={onOpenAddBookModal}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs py-2.5 px-4 rounded shadow transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>ADD BOOK RECORD</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 px-3 mb-1">
            System Modules
          </h2>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs transition-all ${
                  isActive
                    ? 'bg-neutral-900 border border-emerald-500/40 text-emerald-400 font-bold shadow-sm'
                    : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Security Badges */}
      <div className="pt-4 border-t border-white/10 flex flex-col gap-2 text-xs text-neutral-500">
        <div className="flex items-center gap-2 px-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span className="text-[11px]">bcrypt Auth Active</span>
        </div>
        <div className="flex items-center gap-2 px-2">
          <HelpCircle className="w-4 h-4 text-neutral-500" />
          <span className="text-[11px]">Real-time Firestore</span>
        </div>
      </div>
    </aside>
  );
};
