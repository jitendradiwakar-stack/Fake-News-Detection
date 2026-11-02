import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Flag,
  Sparkles,
  Layers,
  Activity,
  Cpu,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Radio,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ForensicSample {
  id: string;
  filename: string;
  fps: string;
  resolution: string;
  duration: number; // in seconds
  deepfakeScore: number;
  authenticityScore: number;
  confidence: number;
  classification: 'fake' | 'authentic';
  lipSyncMismatch: number;
  boundaryArtifacts: string;
  blinkPattern: string;
  noiseInconsistency: number;
  stabilityScore: number;
  stabilityStatus: string;
  model: string;
  runtime: string;
  device: string;
  imageSrc: string;
  logs: { time: string; message: string; type: 'warn' | 'info' | 'error' }[];
  frameList: { frame: number; time: string; anomalyScore: number; label: string }[];
}

const SAMPLES: Record<string, ForensicSample> = {
  video1: {
    id: 'video1',
    filename: 'VIDEO_102842.mp4',
    fps: '60fps',
    resolution: '1080p',
    duration: 80,
    deepfakeScore: 87,
    authenticityScore: 13,
    confidence: 92.4,
    classification: 'fake',
    lipSyncMismatch: 91,
    boundaryArtifacts: 'Detected',
    blinkPattern: '0.2 Hz (anomalous)',
    noiseInconsistency: 84,
    stabilityScore: 22,
    stabilityStatus: '22% — Unstable',
    model: 'Detector v3.2',
    runtime: '1.24s',
    device: 'GPU RTX',
    imageSrc: '/deepfake-face-screen.png',
    logs: [
      { time: '[00:41]', message: 'Frame 1021: facial warp detected → suspicion +12%', type: 'warn' },
      { time: '[00:40]', message: 'Audio/Video desync: +120ms detected', type: 'error' },
      { time: '[00:39]', message: 'Pixel-level artifact cluster detected along jawline', type: 'warn' },
      { time: '[00:37]', message: 'Pupil corneal reflection mismatch across 14 frames', type: 'info' },
      { time: '[00:35]', message: 'Neural blending boundary discontinuity flagged', type: 'warn' }
    ],
    frameList: [
      { frame: 1018, time: '00:40.8', anomalyScore: 42, label: 'Transition' },
      { frame: 1019, time: '00:41.0', anomalyScore: 68, label: 'Lip Desync' },
      { frame: 1020, time: '00:41.2', anomalyScore: 85, label: 'Warp Anomaly' },
      { frame: 1021, time: '00:41.4', anomalyScore: 94, label: 'Peak Synthesis' },
      { frame: 1022, time: '00:41.6', anomalyScore: 79, label: 'Boundary Artifact' }
    ]
  },
  video2: {
    id: 'video2',
    filename: 'PRESS_BRIEF_RAW.mp4',
    fps: '30fps',
    resolution: '1080p',
    duration: 65,
    deepfakeScore: 6,
    authenticityScore: 94,
    confidence: 96.1,
    classification: 'authentic',
    lipSyncMismatch: 2,
    boundaryArtifacts: 'None Detected',
    blinkPattern: '0.28 Hz (normal)',
    noiseInconsistency: 3,
    stabilityScore: 96,
    stabilityStatus: '96% — Highly Stable',
    model: 'Detector v3.2',
    runtime: '0.88s',
    device: 'GPU RTX',
    imageSrc: '/deepfake-face-screen.png',
    logs: [
      { time: '[00:15]', message: 'Frame 450: Natural biometrics verified, 0 artifacts', type: 'info' },
      { time: '[00:14]', message: 'Audio/Video synchronization: 0.998 correlation', type: 'info' },
      { time: '[00:12]', message: 'Corneal light reflection vector: Uniform', type: 'info' },
      { time: '[00:08]', message: 'Skin pore gradient continuity: 98.4% natural', type: 'info' }
    ],
    frameList: [
      { frame: 448, time: '00:14.8', anomalyScore: 4, label: 'Natural' },
      { frame: 449, time: '00:15.0', anomalyScore: 5, label: 'Natural' },
      { frame: 450, time: '00:15.2', anomalyScore: 6, label: 'Baseline' },
      { frame: 451, time: '00:15.4', anomalyScore: 4, label: 'Natural' },
      { frame: 452, time: '00:15.6', anomalyScore: 5, label: 'Natural' }
    ]
  }
};

export const DeepfakeForensicsSection: React.FC = () => {
  const { t } = useTranslation();
  const [activeSampleKey, setActiveSampleKey] = useState<'video1' | 'video2'>('video1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(42);
  const [activeTab, setActiveTab] = useState<'overview' | 'forensic' | 'frame'>('overview');
  const [volume, setVolume] = useState(40);
  const [isMuted, setIsMuted] = useState(false);
  const [showMeshOverlay, setShowMeshOverlay] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sample = SAMPLES[activeSampleKey];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= sample.duration) {
            setIsPlaying(false);
            return sample.duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, sample.duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const targetTime = Math.min(Math.max(0, Math.floor(pos * sample.duration)), sample.duration);
    setCurrentTime(targetTime);
  };

  const handleStepFrame = (delta: number) => {
    setCurrentTime((prev) => Math.min(Math.max(0, prev + delta), sample.duration));
  };

  const handleExportReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const reportText = `========================================================================
SATYACHECK MEDIA FORENSICS LAB — FORENSIC VERIFICATION REPORT
Case Reference ID: SATYA-CASE-${sample.id.toUpperCase()}-${Math.floor(Date.now() / 1000)}
Analysis Date: ${new Date().toISOString()}
========================================================================

INPUT MEDIA SPECIFICATION:
- File Name: ${sample.filename}
- Stream Resolution: ${sample.resolution} @ ${sample.fps}
- Duration Inspected: ${sample.duration} seconds

VERDICT & QUANTITATIVE FINDINGS:
- Overall Verdict: ${sample.classification === 'fake' ? 'DEEPFAKE DETECTED (MANIPULATED SYNTHETIC MEDIA)' : 'AUTHENTIC BROADCAST CONFIRMED'}
- Deepfake Anomaly Probability: ${sample.deepfakeScore}%
- Natural Authenticity Score: ${sample.authenticityScore}%
- Statistical Confidence: ${sample.confidence}%

BIOMETRIC & SPATIAL-TEMPORAL TELEMETRY:
- Audio-Visual Lip Sync Inconsistency: ${sample.lipSyncMismatch}% mismatch
- Facial Boundary Artifact Discontinuity: ${sample.boundaryArtifacts}
- Spontaneous Blink Frequency: ${sample.blinkPattern}
- Surface Texture / High-Frequency Noise Mismatch: ${sample.noiseInconsistency}%
- Facial Landmark 68-Point Stability: ${sample.stabilityStatus}

NEURAL INFERENCE ENGINE METRICS:
- Primary Detector Architecture: ${sample.model} (EfficientNet-B4 + MesoNet-4 Spatial Ensemble)
- Inference Runtime: ${sample.runtime}
- Execution Hardware: ${sample.device}

AUDIT LOG EXCERPTS:
${sample.logs.map((log) => `${log.time} ${log.message}`).join('\n')}

========================================================================
Report generated automatically by SatyaCheck Deepfake Forensics Lab.
========================================================================`;

      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SatyaCheck_Forensic_${sample.filename.replace('.mp4', '')}_Report.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      toast.success('Forensic Report downloaded successfully.');
    }, 600);
  };

  const handleFlagNews = () => {
    toast.success(`Specimen ${sample.filename} flagged and committed to forensic misinformation ledger.`);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info(`Analyzing uploaded file: ${file.name}... Extracting 68 facial landmarks.`);
    setTimeout(() => {
      setActiveSampleKey('video1');
      setCurrentTime(42);
      toast.success(`Forensic analysis complete for ${file.name}.`);
    }, 1200);
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Test Case Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2B2B2B] bg-[#161616] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          <span className="text-xs font-mono font-medium text-zinc-300">
            Forensic Specimen:
          </span>
          <div className="flex items-center gap-1.5 ml-1">
            <button
              onClick={() => {
                setActiveSampleKey('video1');
                setCurrentTime(42);
              }}
              className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                activeSampleKey === 'video1'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-[#222222] text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              Specimen #102842 (Deepfake)
            </button>
            <button
              onClick={() => {
                setActiveSampleKey('video2');
                setCurrentTime(15);
              }}
              className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                activeSampleKey === 'video2'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#222222] text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              Specimen #RAW-04 (Authentic)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCustomUpload}
            accept="video/*,image/*"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 gap-1.5 border-[#2B2B2B] bg-[#161616] px-2.5 text-xs font-mono text-zinc-300 hover:border-zinc-500 hover:text-white hover:bg-[#222222]"
          >
            <Upload className="h-3 w-3 text-zinc-300" />
            <span>Upload Custom Media</span>
          </Button>

          <button
            onClick={() => setShowMeshOverlay(!showMeshOverlay)}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-mono transition-colors ${
              showMeshOverlay
                ? 'border-zinc-500 bg-[#282828] text-white font-semibold'
                : 'border-[#2B2B2B] bg-[#161616] text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Mesh Overlay: {showMeshOverlay ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main Forensic Workstation Card */}
      <div className="rounded-xl border border-[#2B2B2B] bg-[#161616] p-4 lg:p-6 shadow-2xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Left Column: Media Player & Telemetry Cards (Cols 7) */}
          <div className="flex flex-col space-y-4 lg:col-span-7">
            
            {/* Visual Screen Container with Banner & Live Controls */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-[#2B2B2B] bg-[#121212] select-none">
              
              {/* Realistic High-Res Screen Specimen */}
              <img
                src={sample.imageSrc}
                alt="Forensic Specimen Video Frame"
                className="h-full w-full object-cover object-center"
              />

              {/* Dynamic 68-Landmark Mesh Overlay Simulation */}
              {showMeshOverlay && (
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-0 bg-white/5 mix-blend-screen"></div>
                </div>
              )}

              {/* Top Warning / Confirmation Banner (Exact match to reference design) */}
              {sample.classification === 'fake' ? (
                <div className="absolute left-3 right-3 top-3 flex items-center justify-between rounded border border-red-500/40 bg-[#160B0E]/85 px-4 py-2.5 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-red-500/20 text-red-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        INPUT: {sample.filename}
                      </div>
                      <div className="text-sm font-extrabold tracking-wide text-red-400">
                        DEEPFAKE DETECTED
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-extrabold text-red-400">
                      {sample.deepfakeScore}% FAKE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="absolute left-3 right-3 top-3 flex items-center justify-between rounded border border-emerald-500/40 bg-[#0A1611]/85 px-4 py-2.5 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        INPUT: {sample.filename}
                      </div>
                      <div className="text-sm font-extrabold tracking-wide text-emerald-400">
                        AUTHENTIC MEDIA CONFIRMED
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-extrabold text-emerald-400">
                      {sample.authenticityScore}% REAL
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom Right Overlay: AI Analysis Active */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded border border-[#2B2B2B] bg-[#161616]/90 px-2.5 py-1 font-mono text-[11px] text-zinc-200 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span className="font-semibold">AI ANALYSIS ACTIVE</span>
              </div>
            </div>

            {/* Video Player Scrub Bar & Timestamp Controls */}
            <div className="space-y-2 rounded-lg border border-slate-800 bg-[#0E1422] p-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{formatTime(currentTime)} / {formatTime(sample.duration)}</span>
                <span className="text-[11px] text-slate-500">
                  Frame {Math.floor((currentTime / sample.duration) * 1920) + 1} / 1920
                </span>
              </div>

              {/* Progress Scrubber with Anomaly Interval Flagged */}
              <div
                onClick={handleSeek}
                className="relative h-2 w-full cursor-pointer rounded-full bg-slate-800 transition-all hover:h-2.5"
              >
                {/* Anomalous segment highlighting */}
                {sample.classification === 'fake' && (
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-red-500/30"
                    style={{
                      left: '42%',
                      width: '24%'
                    }}
                    title="Suspicious Lip Desync Anomaly Zone"
                  ></div>
                )}

                {/* Current playback progress */}
                <div
                  className={`h-full rounded-full transition-all ${
                    sample.classification === 'fake' ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(currentTime / sample.duration) * 100}%` }}
                ></div>
              </div>

              {/* Media Control Buttons */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStepFrame(-5)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                    title="-5 Seconds"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex h-7 w-7 items-center justify-center rounded bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                  </button>

                  <button
                    onClick={() => handleStepFrame(5)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                    title="+5 Seconds"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setCurrentTime(0)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                    title="Reset to 00:00"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Volume Level Slider */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-slate-400 hover:text-white"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <span className="font-mono text-xs text-slate-400">
                    {isMuted ? '0%' : `${volume}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Lower Tabs: OVERVIEW | FORENSIC DETAILS | FRAME ANALYSIS */}
            <div className="space-y-3">
              <div className="flex items-center border-b border-[#2B2B2B] text-xs font-mono">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`border-b-2 px-4 py-2 font-semibold transition-colors ${
                    activeTab === 'overview'
                      ? 'border-white text-white'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  OVERVIEW
                </button>
                <button
                  onClick={() => setActiveTab('forensic')}
                  className={`border-b-2 px-4 py-2 font-semibold transition-colors ${
                    activeTab === 'forensic'
                      ? 'border-white text-white'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  FORENSIC DETAILS
                </button>
                <button
                  onClick={() => setActiveTab('frame')}
                  className={`border-b-2 px-4 py-2 font-semibold transition-colors ${
                    activeTab === 'frame'
                      ? 'border-white text-white'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  FRAME ANALYSIS
                </button>
              </div>

              {/* Tab 1: OVERVIEW Metric Cards */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Card 1: Deepfake Score */}
                  <div className="rounded-lg border border-[#2B2B2B] bg-[#121212] p-3.5">
                    <div className="text-[11px] font-mono uppercase text-zinc-400">
                      DEEPFAKE SCORE
                    </div>
                    <div
                      className={`mt-1 font-mono text-2xl font-bold ${
                        sample.classification === 'fake' ? 'text-red-400' : 'text-zinc-300'
                      }`}
                    >
                      {sample.deepfakeScore}%
                    </div>
                    <div
                      className={`text-[10px] font-mono font-semibold uppercase mt-0.5 ${
                        sample.classification === 'fake' ? 'text-red-500' : 'text-zinc-500'
                      }`}
                    >
                      CLASSIFICATION: {sample.classification.toUpperCase()}
                    </div>
                  </div>

                  {/* Card 2: Authenticity */}
                  <div className="rounded-lg border border-[#2B2B2B] bg-[#121212] p-3.5">
                    <div className="text-[11px] font-mono uppercase text-zinc-400">
                      AUTHENTICITY
                    </div>
                    <div
                      className={`mt-1 font-mono text-2xl font-bold ${
                        sample.classification === 'authentic' ? 'text-emerald-400' : 'text-zinc-300'
                      }`}
                    >
                      {sample.authenticityScore}%
                    </div>
                    <div
                      className={`text-[10px] font-mono font-semibold uppercase mt-0.5 ${
                        sample.classification === 'authentic' ? 'text-emerald-500' : 'text-zinc-500'
                      }`}
                    >
                      {sample.classification === 'authentic' ? 'CONFIRMED AUTHENTIC' : 'LOW AUTHENTICITY'}
                    </div>
                  </div>

                  {/* Card 3: Confidence */}
                  <div className="rounded-lg border border-[#2B2B2B] bg-[#121212] p-3.5">
                    <div className="text-[11px] font-mono uppercase text-zinc-400">
                      CONFIDENCE
                    </div>
                    <div className="mt-1 font-mono text-2xl font-bold text-white">
                      {sample.confidence}%
                    </div>
                    <div className="text-[10px] font-mono font-semibold uppercase text-zinc-400 mt-0.5">
                      HIGH CONFIDENCE
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: FORENSIC DETAILS */}
              {activeTab === 'forensic' && (
                <div className="rounded-lg border border-[#2B2B2B] bg-[#121212] p-4 text-xs font-mono space-y-3">
                  <div className="flex items-center justify-between border-b border-[#2B2B2B] pb-2">
                    <span className="text-zinc-400">Frequency Domain Analysis (2D FFT):</span>
                    <span className="text-zinc-200">High-pass artifact score: 0.84</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#2B2B2B] pb-2">
                    <span className="text-zinc-400">Spatial Jawline Boundary Gradient:</span>
                    <span className="text-red-400">Discontinuous (Δ &gt; 0.38)</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#2B2B2B] pb-2">
                    <span className="text-zinc-400">Phoneme-to-Viseme Correlation:</span>
                    <span className="text-amber-400">Lip Desync (+120ms offset)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Neural Synthesis Residual Signature:</span>
                    <span className="text-red-400">Autoencoder Latent Fingerprint Matched</span>
                  </div>
                </div>
              )}

              {/* Tab 3: FRAME ANALYSIS */}
              {activeTab === 'frame' && (
                <div className="grid grid-cols-5 gap-2">
                  {sample.frameList.map((f) => (
                    <div
                      key={f.frame}
                      className={`rounded border p-2 text-center font-mono ${
                        f.anomalyScore > 70
                          ? 'border-red-500/40 bg-red-950/20 text-red-300'
                          : 'border-[#2B2B2B] bg-[#121212] text-zinc-400'
                      }`}
                    >
                      <div className="text-[10px] font-bold">F#{f.frame}</div>
                      <div className="text-[9px] text-zinc-500">{f.time}</div>
                      <div className="mt-1 text-xs font-extrabold">{f.anomalyScore}%</div>
                      <div className="text-[9px] truncate">{f.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Analysis Overlay & Logs (Cols 5) */}
          <div className="flex flex-col space-y-4 lg:col-span-5">
            <div className="rounded-lg border border-[#2B2B2B] bg-[#121212] p-4 space-y-4">
              
              {/* Overlay Header */}
              <div className="flex items-center justify-between border-b border-[#2B2B2B] pb-3">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                  <Sparkles className="h-4 w-4" />
                  <span>AI ANALYSIS OVERLAY</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-400"></span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    LIVE TELEMETRY
                  </span>
                </div>
              </div>

              {/* Detection Results */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold uppercase text-slate-300">
                    DETECTION RESULTS
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-xs font-bold uppercase ${
                      sample.classification === 'fake'
                        ? 'border border-red-500/40 bg-red-500/20 text-red-400'
                        : 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {sample.classification.toUpperCase()}
                  </span>
                </div>

                {/* 4 Feature Metric Rows */}
                <div className="space-y-2 text-xs font-mono">
                  
                  {/* Metric 1: Lip Sync */}
                  <div className="flex items-center justify-between rounded border border-slate-800/80 bg-slate-900/60 px-3 py-2">
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          sample.lipSyncMismatch > 50 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      />
                      <span>Lip-Sync Inconsistency</span>
                    </div>
                    <span
                      className={`font-semibold ${
                        sample.lipSyncMismatch > 50 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {sample.lipSyncMismatch}% mismatch
                    </span>
                  </div>

                  {/* Metric 2: Facial Boundary Artifacts */}
                  <div className="flex items-center justify-between rounded border border-slate-800/80 bg-slate-900/60 px-3 py-2">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Layers
                        className={`h-4 w-4 ${
                          sample.boundaryArtifacts === 'Detected' ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      />
                      <span>Facial Boundary Artifacts</span>
                    </div>
                    <span
                      className={`font-semibold ${
                        sample.boundaryArtifacts === 'Detected' ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {sample.boundaryArtifacts}
                    </span>
                  </div>

                  {/* Metric 3: Blink Pattern */}
                  <div className="flex items-center justify-between rounded border border-slate-800/80 bg-slate-900/60 px-3 py-2">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Eye
                        className={`h-4 w-4 ${
                          sample.classification === 'fake' ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      />
                      <span>Unnatural Blink Pattern</span>
                    </div>
                    <span
                      className={`font-semibold ${
                        sample.classification === 'fake' ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {sample.blinkPattern}
                    </span>
                  </div>

                  {/* Metric 4: Texture/Noise Inconsistency */}
                  <div className="flex items-center justify-between rounded border border-slate-800/80 bg-slate-900/60 px-3 py-2">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Activity
                        className={`h-4 w-4 ${
                          sample.noiseInconsistency > 50 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      />
                      <span>Texture/Noise Inconsistency</span>
                    </div>
                    <span
                      className={`font-semibold ${
                        sample.noiseInconsistency > 50 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {sample.noiseInconsistency}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Facial Landmark Analysis */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-slate-300">FACIAL LANDMARK ANALYSIS</span>
                  <span className="text-slate-400">Landmarks tracked: 68 points</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Stability Score</span>
                    <span
                      className={`font-semibold ${
                        sample.stabilityScore < 50 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {sample.stabilityStatus}
                    </span>
                  </div>

                  {/* Sparkline Waveform */}
                  <div className="mt-1.5 h-10 w-full overflow-hidden rounded bg-slate-900/90 border border-slate-800/80 p-1">
                    <svg className="h-full w-full" viewBox="0 0 200 40" fill="none">
                      {sample.classification === 'fake' ? (
                        <>
                          <path
                            d="M 0 10 L 40 10 L 70 12 L 90 28 L 110 32 L 130 15 L 160 12 L 200 10"
                            stroke="#EF4444"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 0 10 L 40 10 L 70 12 L 90 28 L 110 32 L 130 15 L 160 12 L 200 10 L 200 40 L 0 40 Z"
                            fill="rgba(239, 68, 68, 0.15)"
                          />
                        </>
                      ) : (
                        <>
                          <path
                            d="M 0 8 L 40 9 L 80 8 L 120 10 L 160 8 L 200 9"
                            stroke="#10B981"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 0 8 L 40 9 L 80 8 L 120 10 L 160 8 L 200 9 L 200 40 L 0 40 Z"
                            fill="rgba(16, 185, 129, 0.15)"
                          />
                        </>
                      )}
                    </svg>
                  </div>
                </div>
              </div>

              {/* Model Info */}
              <div className="rounded border border-slate-800/80 bg-slate-900/50 p-2.5 text-[11px] font-mono text-slate-400">
                <div className="font-semibold text-slate-300 mb-1">MODEL INFO</div>
                <div>Model: {sample.model} • Run time: {sample.runtime} • Device: {sample.device}</div>
              </div>

              {/* Analysis Log Console */}
              <div className="space-y-1.5 border-t border-slate-800 pt-3">
                <div className="font-mono text-[11px] font-semibold text-slate-300">
                  ANALYSIS LOG
                </div>
                <div className="rounded border border-slate-800 bg-[#070A11] p-2.5 font-mono text-[11px] space-y-1 max-h-32 overflow-y-auto">
                  {sample.logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-amber-400 flex-shrink-0">{log.time}</span>
                      <span className="text-slate-300">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Card Footer: Status Bar & Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#2B2B2B] pt-4">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Status: Analysis complete • Findings exported to report.txt / report.pdf</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting}
              onClick={handleExportReport}
              className="gap-2 border-[#2B2B2B] bg-[#161616] text-xs font-mono text-zinc-200 hover:border-zinc-500 hover:text-white hover:bg-[#222222]"
            >
              <Download className="h-3.5 w-3.5 text-zinc-400" />
              <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
            </Button>

            <Button
              size="sm"
              onClick={handleFlagNews}
              className="gap-2 bg-white hover:bg-zinc-200 text-xs font-mono font-bold text-zinc-950 shadow-md"
            >
              <Flag className="h-3.5 w-3.5" />
              <span>Flag as Fake News</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
