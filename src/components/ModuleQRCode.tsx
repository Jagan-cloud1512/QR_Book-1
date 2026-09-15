import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Printer, RefreshCw, Check, Sparkles, Table } from 'lucide-react';
import { QRCodePayload } from '../types';

interface ModuleQRCodeProps {
  username: string;
}

export const ModuleQRCode: React.FC<ModuleQRCodeProps> = ({ username }) => {
  const tableName = `user_${username}`;
  const [qrGenerated, setQrGenerated] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const payload: QRCodePayload = {
    tableName,
    action: 'sync_inventory',
    generatedAt: new Date().toISOString()
  };

  const payloadString = JSON.stringify(payload);

  const generateQRCode = async () => {
    try {
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, payloadString, {
          width: 220,
          margin: 2,
          color: {
            dark: '#10B981',
            light: '#050505'
          }
        });
      }
      const url = await QRCode.toDataURL(payloadString, {
        width: 600,
        margin: 2,
        color: {
          dark: '#10B981',
          light: '#050505'
        }
      });
      setDataUrl(url);
      setQrGenerated(true);
    } catch (err) {
      console.error('Error generating QR Code:', err);
    }
  };

  useEffect(() => {
    generateQRCode();
  }, [username]);

  // Download PNG
  const handleDownloadPNG = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${tableName}_QR_Code.png`;
    a.click();
  };

  // Download SVG
  const handleDownloadSVG = async () => {
    try {
      const svgStr = await QRCode.toString(payloadString, {
        type: 'svg',
        width: 600,
        margin: 2,
        color: {
          dark: '#10B981',
          light: '#050505'
        }
      });
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_QR_Code.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating SVG:', err);
    }
  };

  // Print Card
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BIBLIO-SYNC System QR Code - ${tableName}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; text-align: center; background: #050505; color: #e5e5e5; }
            .card { max-width: 400px; margin: 0 auto; background: #111; border: 1px solid #333; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h1 { color: #fff; margin-top: 0; font-size: 24px; }
            .badge { display: inline-block; background: rgba(16,185,129,0.1); color: #10B981; font-weight: bold; padding: 4px 12px; border-radius: 999px; font-size: 14px; margin-bottom: 20px; font-family: monospace; border: 1px solid rgba(16,185,129,0.3); }
            img { width: 240px; height: 240px; }
            .footer { margin-top: 20px; color: #888; font-size: 12px; border-top: 1px solid #222; padding-top: 16px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>BIBLIO-SYNC Inventory System</h1>
            <div class="badge">Table: ${tableName}</div>
            <div><img src="${dataUrl}" alt="QR Code" /></div>
            <p>Scan to sync mobile app with this shelf database collection.</p>
            <div class="footer">Encodes JSON payload: ${payloadString}</div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-xl border border-white/10 shadow-xl overflow-hidden relative">
      {/* Decorative Blur */}
      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-medium text-white">QR Code Table Generator</h3>
            <p className="text-xs text-neutral-400">
              Generates system-encoded QR payload for mobile syncing & reservation queue mapping.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded text-xs code-font font-bold text-emerald-400">
          <Table className="w-3.5 h-3.5" />
          <span>Active Collection: {tableName}</span>
        </div>
      </div>

      <div className="p-6 flex flex-col md:flex-row items-center justify-around gap-6 z-10 relative">
        {/* Printable Card Frame Preview */}
        <div className="bg-neutral-900 border border-white/10 p-6 rounded-xl shadow-xl flex flex-col items-center text-center max-w-xs w-full group">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white tracking-widest uppercase">
              BIBLIO-SYNC CARD
            </span>
          </div>

          <div className="bg-black p-3 rounded-lg border border-white/10 shadow-inner my-2">
            <canvas ref={canvasRef} className="block mx-auto" />
          </div>

          <p className="text-xs font-mono text-neutral-300 mt-2">
            Reference: <span className="text-emerald-400 font-bold">{tableName}</span>
          </p>
          <p className="text-[10px] text-neutral-500 mt-0.5">Scan with mobile app simulator to pair</p>
        </div>

        {/* Info & Action Controls */}
        <div className="flex-1 max-w-md flex flex-col gap-4">
          <div className="bg-black/60 p-4 rounded border border-white/10 text-xs">
            <p className="font-bold text-neutral-300 mb-1">Encoded JSON Payload Structure:</p>
            <div className="relative group">
              <pre className="code-font bg-neutral-950 text-emerald-400 p-3 rounded overflow-x-auto text-[11px] border border-white/5">
                {JSON.stringify(payload, null, 2)}
              </pre>
              <button
                onClick={handleCopyJSON}
                className="absolute top-2 right-2 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-mono px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : 'COPY'}
              </button>
            </div>
          </div>

          <button
            onClick={generateQRCode}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs py-3 px-4 rounded shadow transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>GENERATE / REFRESH QR CODE</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadPNG}
              className="flex-1 bg-neutral-900 border border-white/10 hover:bg-white/5 text-neutral-200 font-mono text-xs py-2.5 rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>PNG</span>
            </button>

            <button
              onClick={handleDownloadSVG}
              className="flex-1 bg-neutral-900 border border-white/10 hover:bg-white/5 text-neutral-200 font-mono text-xs py-2.5 rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>SVG</span>
            </button>

            <button
              onClick={handlePrint}
              title="Print QR Card"
              className="px-4 bg-neutral-900 border border-white/10 hover:bg-white/5 text-neutral-200 font-mono text-xs py-2.5 rounded transition-colors flex items-center justify-center"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
