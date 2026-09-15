import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Grid, Info, CheckCircle2, AlertCircle, Save, Download, Sparkles } from 'lucide-react';
import { saveShelfMatrix, saveBooksBatch } from '../services/firebase';
import { ShelfMatrixMetadata, BookRecord } from '../types';

interface ModuleImportConfigProps {
  username: string;
  currentMatrix: ShelfMatrixMetadata | null;
  onImportCompleted: () => void;
}

export const ModuleImportConfig: React.FC<ModuleImportConfigProps> = ({
  username,
  currentMatrix,
  onImportCompleted
}) => {
  const [rows, setRows] = useState<number | string>(currentMatrix?.rows || 4);
  const [cols, setCols] = useState<number | string>(currentMatrix?.cols || 6);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedBooks, setParsedBooks] = useState<BookRecord[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Sample Excel Template
  const handleDownloadSample = () => {
    const sampleData = [
      ['Book ID', 'Title', 'Qty', 'Section', 'Row', 'Column'],
      ['LIB-1001', 'Clean Architecture & Design', 4, 'Section A', 1, '1-3'],
      ['LIB-1002', 'Mastering TypeScript & React', 2, 'Section A', 2, '4'],
      ['LIB-1003', 'Database System Concepts', 0, 'Section B', 1, '1-2'],
      ['LIB-1004', 'Cloud Native Infrastructure', 3, 'Section B', 3, '5'],
      ['LIB-1005', 'Artificial Intelligence Primer', 1, 'Section C', 2, '1-4']
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, 'LibrisLink_Sample_Inventory.xlsx');
  };

  // Process File Upload
  const handleFileUpload = (file: File) => {
    setParsingError(null);
    setSaveSuccess(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rowsJson = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

        if (!rowsJson || rowsJson.length === 0) {
          setParsingError('The uploaded file contains no readable records.');
          return;
        }

        const mappedBooks: BookRecord[] = [];

        rowsJson.forEach((row, index) => {
          // Flexible key mapping
          const findVal = (keys: string[]) => {
            for (const key of Object.keys(row)) {
              if (keys.some((k) => key.toLowerCase().trim() === k.toLowerCase())) {
                return row[key];
              }
            }
            return null;
          };

          const rawId = findVal(['book id', 'bookid', 'id', 'isbn']) || `LIB-${1000 + index}`;
          const rawTitle = findVal(['title', 'book name', 'name']) || `Untitled Book #${index + 1}`;
          const rawQty = findVal(['qty', 'quantity', 'count', 'stock']) ?? 1;
          const rawSec = findVal(['section', 'shelf section', 'sec']) || 'Section A';
          const rawRow = findVal(['row', 'shelf row']) ?? 1;
          const rawCol = findVal(['column', 'col', 'columns']) ?? 1;

          const qtyNum = Math.max(0, parseInt(String(rawQty), 10) || 0);

          mappedBooks.push({
            bookId: String(rawId).trim(),
            title: String(rawTitle).trim(),
            qty: qtyNum,
            section: String(rawSec).trim(),
            row: rawRow,
            col: rawCol,
            reservedBy: null,
            queue: [],
            status: qtyNum > 0 ? 'Available' : 'Out of Stock'
          });
        });

        setParsedBooks(mappedBooks);
      } catch (err: any) {
        console.error('File parsing error:', err);
        setParsingError('Failed to parse file. Please upload a valid .xlsx, .xls, or .csv file.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    setParsingError(null);

    const matrixMetadata: ShelfMatrixMetadata = {
      rows: Number(rows) || 1,
      cols: Number(cols) || 1,
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Save Matrix Metadata
      await saveShelfMatrix(username, matrixMetadata);

      // 2. Batch save parsed books if any exist
      if (parsedBooks.length > 0) {
        await saveBooksBatch(username, parsedBooks);
      }

      setIsSaving(false);
      setSaveSuccess(
        `Successfully saved Shelf Matrix (${matrixMetadata.rows}x${matrixMetadata.cols}) ${
          parsedBooks.length > 0 ? `and imported ${parsedBooks.length} book records!` : '!'
        }`
      );
      onImportCompleted();
    } catch (err: any) {
      setIsSaving(false);
      setParsingError(`Failed to save to database: ${err.message || String(err)}`);
    }
  };

  return (
    <div className="glass rounded-xl border border-white/10 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-medium text-white">
              Excel Import & Shelf Matrix Configurator
            </h3>
            <p className="text-xs text-neutral-400">
              Upload spreadsheets (.xlsx, .xls, .csv) and establish physical shelf layout boundaries.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadSample}
          className="text-xs font-mono font-medium px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-300 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Sample Template</span>
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 cols: Excel Drag & Drop Zone */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            1. Spreadsheet Data Source
          </label>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/10 hover:border-emerald-500 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-black/40 hover:bg-emerald-500/5 transition-all cursor-pointer min-h-[220px] group relative"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0])}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />

            <div className="w-14 h-14 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-7 h-7" />
            </div>

            {fileName ? (
              <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>File Loaded: {fileName}</span>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-neutral-200">
                  Drop .xlsx, .xls, or .csv file here
                </p>
                <p className="text-xs text-neutral-500 mt-1">or click to browse from computer</p>
              </>
            )}

            <div className="mt-4 flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
              <span>Required Headers:</span>
              <span className="bg-neutral-900 border border-white/10 px-1.5 py-0.5 rounded text-neutral-300">
                Book ID, Title, Qty, Section, Row, Column
              </span>
            </div>
          </div>

          {/* Parsed File Preview summary */}
          {parsedBooks.length > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 text-xs text-emerald-300 flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">{parsedBooks.length} Books parsed</span>
              </div>
              <span className="text-[11px] opacity-80">e.g. {parsedBooks[0].title.slice(0, 25)}...</span>
            </div>
          )}
        </div>

        {/* Right 6 cols: Shelf Matrix Inputs & Config */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              2. Shelf Matrix Configuration
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                  Shelf Rows
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={rows}
                  onChange={(e) => setRows(e.target.value)}
                  placeholder="4"
                  className="w-full px-3.5 py-2 rounded border border-white/10 bg-neutral-900 text-white text-xs outline-none focus:border-emerald-500 transition-colors code-font"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                  Shelf Columns
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={cols}
                  onChange={(e) => setCols(e.target.value)}
                  placeholder="6"
                  className="w-full px-3.5 py-2 rounded border border-white/10 bg-neutral-900 text-white text-xs outline-none focus:border-emerald-500 transition-colors code-font"
                />
              </div>
            </div>

            {/* Live Matrix Preview Box */}
            <div className="bg-neutral-900/80 border border-white/10 rounded p-3.5 text-xs flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-0.5 code-font">
                  Matrix Layout: [{rows || 0}] Rows × [{cols || 0}] Cols
                </p>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  QR scanner reservations map directly to physical shelf coordinates in collection{' '}
                  <code className="code-font text-emerald-400 font-bold">user_{username}</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Feedback & Actions */}
          <div>
            {parsingError && (
              <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{parsingError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{saveSuccess}</span>
              </div>
            )}

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs py-3 rounded shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>SAVE MATRIX & IMPORT INVENTORY</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
