import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, User, Mail, ArrowRight, Library, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { loginUser, createAccount } from '../services/firebase';
import { UserAccount } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
  isFirebaseActive: boolean;
  onOpenFirebaseConfig: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  isFirebaseActive,
  onOpenFirebaseConfig
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setLoading(true);

    if (activeTab === 'login') {
      const res = await loginUser(username, password);
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message);
      }
    } else {
      if (password !== confirmPassword) {
        setLoading(false);
        setErrorMsg('Passwords do not match.');
        return;
      }
      const res = await createAccount(username, password);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Account created successfully! Logging you in...');
        setTimeout(async () => {
          const loginRes = await loginUser(username, password);
          if (loginRes.success && loginRes.user) {
            onLoginSuccess(loginRes.user);
          }
        }, 800);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await loginUser('admin_demo', 'password123');
    setLoading(false);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#050505] font-sans text-[#E5E5E5]">
      {/* Left Branding / Illustration Panel */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0a0a0a] items-center justify-center overflow-hidden border-r border-white/10">
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310B981' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        <div className="relative z-10 w-full h-full p-12 flex flex-col justify-between">
          {/* Top Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Library className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl text-white tracking-wider code-font">BIBLIO-SYNC</span>
          </div>

          {/* Center Graphic Artwork */}
          <div className="relative flex-grow flex items-center justify-center my-6">
            <div className="w-full max-w-md aspect-square rounded-xl shadow-2xl glass bg-[#111111] border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden group">
              {/* Glowing background circles */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex justify-between items-start z-10">
                <span className="px-3 py-1 rounded text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 tracking-wider uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Live Inventory Engine
                </span>
                <span className="text-xs text-neutral-400 code-font bg-black/40 px-2 py-1 rounded border border-white/10">
                  {isFirebaseActive ? 'Firestore Online' : 'Local Persistence'}
                </span>
              </div>

              {/* Central Abstract QR / Book Art */}
              <div className="my-auto text-center z-10 flex flex-col items-center">
                <div className="p-4 bg-black/60 rounded-xl border border-white/10 mb-4 shadow-xl">
                  <div className="w-24 h-24 bg-black rounded p-2 flex items-center justify-center shadow-inner border border-white/5">
                    {/* SVG Abstract QR Representation */}
                    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                      <rect width="100" height="100" fill="#050505" />
                      <path d="M10 10h30v30H10zM18 18h14v14H18z" fill="#10B981" />
                      <path d="M60 10h30v30H60zM68 18h14v14H68z" fill="#10B981" />
                      <path d="M10 60h30v30H10zM18 68h14v14H18z" fill="#10B981" />
                      <rect x="50" y="50" width="10" height="10" fill="#10B981" />
                      <rect x="70" y="50" width="20" height="10" fill="#10B981" />
                      <rect x="50" y="70" width="20" height="20" fill="#10B981" />
                      <rect x="80" y="80" width="10" height="10" fill="#10B981" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-white font-medium text-lg">QR Shelf Mapping & Sync</h3>
                <p className="text-neutral-400 text-xs mt-1 max-w-xs leading-relaxed">
                  Automated spreadsheet ingestion, custom shelf matrixing, and dynamic queue reservation.
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs code-font text-neutral-500 z-10">
                <span>FORMAT: .XLSX / .CSV</span>
                <span>CRYPT: bcryptjs</span>
              </div>
            </div>
          </div>

          {/* Bottom Headline */}
          <div className="max-w-md">
            <h1 className="text-2xl font-medium text-white mb-2">The Intelligent Archive.</h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Frictionless book discovery, real-time queue reservation, and shelf matrix management for modern institutions.
            </p>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-[#050505] relative">
        <div className="w-full max-w-md">
          {/* Mobile Header Logo */}
          <div className="lg:hidden flex justify-center items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Library className="w-5 h-5" />
            </div>
            <span className="font-bold text-2xl text-white code-font">BIBLIO-SYNC</span>
          </div>

          {/* Card Container */}
          <div className="glass bg-[#111111] rounded-xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Split Screen Tabs */}
            <div className="flex border-b border-white/10 bg-black/40">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-4 text-xs font-bold text-center border-b-2 tracking-widest uppercase transition-all ${
                  activeTab === 'login'
                    ? 'border-emerald-500 text-emerald-400 bg-white/5'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-4 text-xs font-bold text-center border-b-2 tracking-widest uppercase transition-all ${
                  activeTab === 'signup'
                    ? 'border-emerald-500 text-emerald-400 bg-white/5'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="p-8">
              {/* Alert Messages */}
              {errorMsg && (
                <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Username Input */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1.5 uppercase tracking-widest">
                    Username or Identifier
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. john_doe"
                      required
                      className="w-full pl-11 pr-4 py-2.5 rounded border border-white/10 bg-neutral-900 focus:border-emerald-500 text-sm text-white code-font outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1.5 uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-11 pr-11 py-2.5 rounded border border-white/10 bg-neutral-900 focus:border-emerald-500 text-sm text-white code-font outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (if Signup) */}
                {activeTab === 'signup' && (
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 mb-1.5 uppercase tracking-widest">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        required
                        className="w-full pl-11 pr-4 py-2.5 rounded border border-white/10 bg-neutral-900 focus:border-emerald-500 text-sm text-white code-font outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs py-3 rounded transition-all shadow flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : activeTab === 'login' ? (
                    <>
                      <span>LOGIN TO SYSTEM</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>CREATE ACCOUNT & SAVE HASH</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Divider & Action */}
              <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Want to test immediately?</span>
                  <button
                    type="button"
                    onClick={handleQuickDemo}
                    className="font-bold text-emerald-400 hover:underline flex items-center gap-1 code-font text-[11px]"
                  >
                    Quick Demo (admin_demo)
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                  <span>Firebase Connection:</span>
                  <button
                    type="button"
                    onClick={onOpenFirebaseConfig}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold code-font flex items-center gap-1 ${
                      isFirebaseActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {isFirebaseActive ? 'Firestore Online' : 'Local Persistence (Configure)'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice Footer */}
          <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-neutral-500 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Credentials secured with bcrypt password hashing.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
