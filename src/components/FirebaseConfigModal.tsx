import React, { useState } from 'react';
import { X, Database, CheckCircle, AlertTriangle, Key, Save } from 'lucide-react';
import { FirebaseConfigParams } from '../types';
import { getSavedFirebaseConfig, saveFirebaseConfig, initFirebase } from '../services/firebase';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirebaseActive: boolean;
  onConfigUpdated: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  isFirebaseActive,
  onConfigUpdated
}) => {
  const current = getSavedFirebaseConfig();
  const [apiKey, setApiKey] = useState(current.apiKey);
  const [authDomain, setAuthDomain] = useState(current.authDomain);
  const [projectId, setProjectId] = useState(current.projectId);
  const [storageBucket, setStorageBucket] = useState(current.storageBucket);
  const [messagingSenderId, setMessagingSenderId] = useState(current.messagingSenderId);
  const [appId, setAppId] = useState(current.appId);

  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    const newConfig: FirebaseConfigParams = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    saveFirebaseConfig(newConfig);
    const { isReal } = initFirebase(newConfig);

    if (isReal) {
      setMessage('Firebase credentials saved and Firestore initialized!');
    } else {
      setMessage('Saved! Note: Placeholders detected. App is running in Local Storage mode.');
    }

    onConfigUpdated();
    setTimeout(() => {
      setMessage(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass bg-[#111111] rounded-xl border border-white/10 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white">Firebase Firestore Setup</h3>
              <p className="text-xs text-neutral-400">Configure real-time Firebase JS SDK v10 parameters</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 text-xs">
          {/* Status Banner */}
          <div
            className={`p-3 rounded border flex items-center gap-2.5 ${
              isFirebaseActive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isFirebaseActive ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            )}
            <div>
              <p className="font-bold">
                {isFirebaseActive ? 'Firestore Online & Connected' : 'Local Storage Fallback Active'}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {isFirebaseActive
                  ? 'Real-time database queries & onSnapshot listeners are writing directly to Cloud Firestore.'
                  : 'You can use the system completely offline with Local Storage, or paste your Firebase JS SDK credentials below.'}
              </p>
            </div>
          </div>

          {message && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded code-font">
              {message}
            </div>
          )}

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block font-bold text-[10px] uppercase tracking-widest text-neutral-400 mb-1">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded border border-white/10 bg-neutral-900 code-font text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Project ID</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="my-libris-project"
                className="w-full px-3 py-2 rounded border border-white/10 bg-neutral-900 code-font text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Auth Domain</label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="my-project.firebaseapp.com"
                className="w-full px-3 py-2 rounded border border-white/10 bg-neutral-900 code-font text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Storage Bucket</label>
              <input
                type="text"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                placeholder="my-project.appspot.com"
                className="w-full px-3 py-2 rounded border border-white/10 bg-neutral-900 code-font text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-[10px] uppercase tracking-widest text-neutral-400 mb-1">App ID</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456:web:abcd..."
                className="w-full px-3 py-2 rounded border border-white/10 bg-neutral-900 code-font text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-white/10 text-xs font-mono text-neutral-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold shadow flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
