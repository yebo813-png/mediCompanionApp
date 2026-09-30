import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Eraser,
  RotateCcw,
  Download,
  Sparkles,
  Save,
  CheckCircle2,
  FileText,
  Palette,
  Sliders,
  Layers,
} from 'lucide-react';
import { Patient } from '../types';
import { MedSwitchApi, PracticeStore } from '../services/api';

interface DigitalPenCanvasProps {
  currentPatient: Patient | null;
  onApplyTranscribedNotes: (text: string, structured: any) => void;
}

export const DigitalPenCanvas: React.FC<DigitalPenCanvasProps> = ({
  currentPatient,
  onApplyTranscribedNotes,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#0f172a'); // default deep ink
  const [penSize, setPenSize] = useState(2.5);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [paperStyle, setPaperStyle] = useState<'rx-pad' | 'ruled' | 'grid' | 'blank'>('rx-pad');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedResult, setTranscribedResult] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Setup canvas resolution and background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI canvas
    const width = 850;
    const height = 950;
    canvas.width = width;
    canvas.height = height;

    renderBackground(ctx, width, height, paperStyle);
  }, [paperStyle]);

  const renderBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    style: 'rx-pad' | 'ruled' | 'grid' | 'blank'
  ) => {
    // Paper base
    ctx.fillStyle = '#fefdfb';
    ctx.fillRect(0, 0, width, height);

    if (style === 'rx-pad') {
      // Header banner for prescription pad
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, width, 120);

      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, 120);
      ctx.lineTo(width - 20, 120);
      ctx.stroke();

      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('DR. THABO NDLOVU | PRACTICE NO: 0548921 | HPCSA: MP 0694821', 30, 40);

      ctx.fillStyle = '#475569';
      ctx.font = '12px sans-serif';
      ctx.fillText('Rosebank Medical Centre, 14 Hood Ave, Rosebank • Tel: +27 11 880 2000', 30, 60);

      ctx.fillStyle = '#0f172a';
      ctx.font = '12px monospace';
      ctx.fillText(
        `Patient: ${currentPatient?.fullName || 'Patient'}   |   DOB: ${currentPatient?.dob || 'Unknown'}   |   Date: ${new Date().toLocaleDateString()}`,
        30,
        95
      );

      // Medical Rx Symbol
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 36px serif';
      ctx.fillText('℞', 35, 175);

      // Ruled faint lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.8;
      for (let y = 180; y < height - 80; y += 38) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(width - 30, y);
        ctx.stroke();
      }

      // Bottom doctor signature line
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width - 280, height - 60);
      ctx.lineTo(width - 30, height - 60);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText("Doctor's Official Signature (HPCSA)", width - 260, height - 42);
    } else if (style === 'ruled') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.8;
      for (let y = 60; y < height - 20; y += 34) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(width - 30, y);
        ctx.stroke();
      }
    } else if (style === 'grid') {
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 0.8;
      for (let x = 20; x < width; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 20; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save history for undo
    setHistory((prev) => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);

    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);

    if (tool === 'eraser') {
      ctx.strokeStyle = '#fefdfb';
      ctx.lineWidth = 24;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)'; // translucent yellow
      ctx.lineWidth = 18;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
    } else {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lastState = history[history.length - 1];
    ctx.putImageData(lastState, 0, 0);
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderBackground(ctx, canvas.width, canvas.height, paperStyle);
    setHistory([]);
    setTranscribedResult(null);
  };

  // AI OCR: transcribes doctor's handwritten notes into structured JSON
  const handleTranscribeHandwriting = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsTranscribing(true);
    setTranscribedResult(null);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const res = await MedSwitchApi.transcribeHandwriting(dataUrl);

      if (res.success && res.data) {
        setTranscribedResult(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Handwritten_Rx_${currentPatient?.fullName || 'Patient'}_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  const handleSaveToPatientRecord = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    PracticeStore.addAuditLog(
      'HANDWRITTEN_NOTE_SAVED',
      `Saved stylus pen chart for ${currentPatient?.fullName || 'Patient'}`
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-900/30">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Doctor Stylus & Pen Charting</h2>
                <span className="text-[10px] uppercase font-bold bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full">
                  Touch & Stylus Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                For clinicians who prefer handwriting on screen • Built-in Gemini AI handwriting transcription (OCR)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            <button
              onClick={handleTranscribeHandwriting}
              disabled={isTranscribing}
              className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isTranscribing ? 'Transcribing...' : 'AI Transcribe to Text'}</span>
            </button>

            <button
              onClick={handleSaveToPatientRecord}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save to Patient EHR</span>
            </button>

            <button
              onClick={handleDownloadImage}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Handwritten digital chart successfully encrypted and attached to {currentPatient?.fullName}'s file!</span>
          </div>
        )}
      </div>

      {/* Stylus Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Tool selector */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setTool('pen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
              tool === 'pen' ? 'bg-cyan-600 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Pen</span>
          </button>

          <button
            onClick={() => setTool('highlighter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
              tool === 'highlighter' ? 'bg-yellow-600 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded bg-yellow-400" />
            <span>Highlighter</span>
          </button>

          <button
            onClick={() => setTool('eraser')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
              tool === 'eraser' ? 'bg-rose-700 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Eraser</span>
          </button>
        </div>

        {/* Ink Colors */}
        <div className="flex items-center space-x-1.5 border-l border-r border-slate-800 px-3">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Ink Color:</span>
          {[
            { color: '#0f172a', name: 'Ink Black' },
            { color: '#0369a1', name: 'Clinical Blue' },
            { color: '#b91c1c', name: 'Critical Red' },
            { color: '#047857', name: 'Anatomy Green' },
          ].map((c) => (
            <button
              key={c.color}
              onClick={() => {
                setPenColor(c.color);
                setTool('pen');
              }}
              style={{ backgroundColor: c.color }}
              title={c.name}
              className={`w-6 h-6 rounded-full border-2 transition ${
                penColor === c.color && tool === 'pen' ? 'border-white scale-110' : 'border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Stroke thickness */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Tip:</span>
          {[1.5, 2.5, 4.5, 7].map((s) => (
            <button
              key={s}
              onClick={() => setPenSize(s)}
              className={`px-2 py-1 rounded text-xs transition ${
                penSize === s ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {s === 1.5 ? 'Fine' : s === 2.5 ? 'Med' : s === 4.5 ? 'Bold' : 'Marker'}
            </button>
          ))}
        </div>

        {/* Paper style selector & Undo/Clear */}
        <div className="flex items-center space-x-2">
          <select
            value={paperStyle}
            onChange={(e) => setPaperStyle(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
          >
            <option value="rx-pad">Official Rx Pad</option>
            <option value="ruled">Ruled Notes</option>
            <option value="grid">Clinical Graph Grid</option>
            <option value="blank">Blank Slate</option>
          </select>

          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
            title="Undo stroke"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-slate-800"
          >
            Clear Page
          </button>
        </div>
      </div>

      {/* AI Transcribed Results Banner */}
      {transcribedResult && (
        <div className="bg-gradient-to-r from-slate-900 to-cyan-950 border border-cyan-800/80 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Transcribed Handwriting (Gemini 3.8 Flash OCR)</h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
                {(transcribedResult.confidenceScore * 100).toFixed(0)}% Confidence
              </span>
            </div>

            <button
              onClick={() => onApplyTranscribedNotes(transcribedResult.transcribedText, transcribedResult.structuredSummary)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
            >
              Transfer to SOAP Chart
            </button>
          </div>

          <div className="text-xs text-slate-200 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 font-serif leading-relaxed">
            "{transcribedResult.transcribedText}"
          </div>

          {transcribedResult.structuredSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
              <div className="p-2.5 bg-slate-800/40 rounded-lg">
                <span className="text-cyan-400 font-semibold block text-[11px]">History & Symptoms:</span>
                <span className="text-slate-300 text-[11px]">{transcribedResult.structuredSummary.history}</span>
              </div>
              <div className="p-2.5 bg-slate-800/40 rounded-lg">
                <span className="text-teal-400 font-semibold block text-[11px]">Clinical Exam:</span>
                <span className="text-slate-300 text-[11px]">{transcribedResult.structuredSummary.examination}</span>
              </div>
              <div className="p-2.5 bg-slate-800/40 rounded-lg">
                <span className="text-amber-400 font-semibold block text-[11px]">Prescription (Rx):</span>
                <span className="text-slate-300 text-[11px]">{transcribedResult.structuredSummary.rx}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stylus Canvas Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex justify-center shadow-inner overflow-x-auto">
        <div className="shadow-2xl rounded-xl overflow-hidden border border-slate-400/20 bg-white">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="cursor-crosshair touch-none"
            style={{ width: '100%', maxWidth: '850px', height: 'auto', display: 'block' }}
          />
        </div>
      </div>
    </div>
  );
};
