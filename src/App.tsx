import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { ModuleImportConfig } from './components/ModuleImportConfig';
import { ModuleQRCode } from './components/ModuleQRCode';
import { ModuleInventory } from './components/ModuleInventory';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { AddBookModal } from './components/AddBookModal';
import { UserAccount, ShelfMatrixMetadata, BookRecord } from './types';
import { initFirebase, isFirestoreActive, subscribeToInventory } from './services/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  const [isFirebaseActive, setIsFirebaseActive] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);

  // Firestore Inventory State
  const [shelfMatrix, setShelfMatrix] = useState<ShelfMatrixMetadata | null>(null);
  const [books, setBooks] = useState<BookRecord[]>([]);

  // Initialize Firebase on mount
  useEffect(() => {
    const { isReal } = initFirebase();
    setIsFirebaseActive(isReal);
  }, []);

  // Force dark class on document root
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Subscribe to real-time inventory updates whenever user logs in or switches
  useEffect(() => {
    if (!currentUser) return;

    const unsub = subscribeToInventory(currentUser.username, (data) => {
      setShelfMatrix(data.matrix);
      setBooks(data.books);
    });

    return () => {
      unsub();
    };
  }, [currentUser]);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    // Re-check firebase state
    setIsFirebaseActive(isFirestoreActive());
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShelfMatrix(null);
    setBooks([]);
  };

  const handleConfigUpdated = () => {
    setIsFirebaseActive(isFirestoreActive());
  };

  if (!currentUser) {
    return (
      <div className="bg-[#050505] text-[#e5e5e5] min-h-screen">
        <AuthScreen
          onLoginSuccess={handleLoginSuccess}
          isFirebaseActive={isFirebaseActive}
          onOpenFirebaseConfig={() => setIsFirebaseModalOpen(true)}
        />
        <FirebaseConfigModal
          isOpen={isFirebaseModalOpen}
          onClose={() => setIsFirebaseModalOpen(false)}
          isFirebaseActive={isFirebaseActive}
          onConfigUpdated={handleConfigUpdated}
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#050505] font-sans text-[#e5e5e5] transition-colors selection:bg-emerald-500 selection:text-black">
      {/* Sticky Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isFirebaseActive={isFirebaseActive}
        onOpenFirebaseConfig={() => setIsFirebaseModalOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenAddBookModal={() => setIsAddBookModalOpen(true)}
          username={currentUser.username}
        />

        {/* Scrollable Canvas Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#050505]">
          <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
            {/* Dashboard Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
              <div>
                <h2 className="text-2xl font-light tracking-tight text-white flex items-center gap-2">
                  <span>BIBLIO-SYNC</span>
                  <span className="text-xs text-neutral-400 font-normal">v2.4.0</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Monitoring dynamic collection:{' '}
                  <code className="code-font text-emerald-400 font-bold">
                    user_{currentUser.username}
                  </code>
                </p>
              </div>

              {/* Matrix Summary Pill */}
              {shelfMatrix && (
                <div className="px-3.5 py-1.5 rounded-full glass border border-white/10 shadow-sm text-xs font-semibold text-neutral-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="code-font text-xs">
                    MATRIX: {shelfMatrix.rows}R × {shelfMatrix.cols}C
                  </span>
                </div>
              )}
            </div>

            {/* Tab Views */}
            {activeTab === 'inventory' && (
              <ModuleInventory
                username={currentUser.username}
                books={books}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onOpenAddBookModal={() => setIsAddBookModalOpen(true)}
              />
            )}

            {activeTab === 'import' && (
              <ModuleImportConfig
                username={currentUser.username}
                currentMatrix={shelfMatrix}
                onImportCompleted={() => setActiveTab('inventory')}
              />
            )}

            {activeTab === 'qr' && <ModuleQRCode username={currentUser.username} />}
          </div>
        </main>
      </div>

      {/* Elegant Dark Footer Bar */}
      <footer className="px-6 py-2.5 border-t border-white/10 bg-black flex justify-between items-center text-[10px] text-neutral-400 z-30">
        <div className="flex items-center gap-4 tracking-wide font-mono">
          <span>
            STATUS: <span className="text-emerald-500 font-bold">ONLINE</span>
          </span>
          <span className="opacity-30">|</span>
          <span>DB: FIRESTORE INSTANCE ALPHA</span>
        </div>
        <div className="italic text-neutral-500 hidden sm:block">
          Credentials secured with bcrypt password hashing (Salt Rounds: 10)
        </div>
      </footer>

      {/* Modals */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        isFirebaseActive={isFirebaseActive}
        onConfigUpdated={handleConfigUpdated}
      />

      <AddBookModal
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
        username={currentUser.username}
        onBookAdded={() => {}}
      />
    </div>
  );
}
