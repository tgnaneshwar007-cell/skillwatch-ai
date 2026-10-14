import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useToast } from '../../context/ToastContext';
import {
  runRealAIVisionInference,
  submitHumanVerdict,
  InferenceResult,
} from '../../services/aiVision';
import {
  Sparkles,
  Camera,
  Upload,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShieldCheck,
  Eye,
  RefreshCw,
  Loader2,
  FileCheck,
  XCircle,
} from 'lucide-react';

interface AIVisionScannerProps {
  centreId: string;
  centreName: string;
  expectedAttendance?: number;
  onAlertTriggered?: (title: string, explanation: string) => void;
}

export const AIVisionScanner: React.FC<AIVisionScannerProps> = ({
  centreId,
  centreName,
  expectedAttendance = 24,
  onAlertTriggered,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isInferring, setIsInferring] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);
  const [humanReviewStatus, setHumanReviewStatus] = useState<string | null>(null);

  // Sample default test images
  const sampleImages = [
    {
      label: 'Classroom Batch Session',
      url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'Computer Lab Training',
      url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const handleSelectSample = (url: string) => {
    setImageUrl(url);
    setInferenceResult(null);
    setHumanReviewStatus(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setInferenceResult(null);
      setHumanReviewStatus(null);
    };
    reader.readAsDataURL(file);
  };

  const executeInference = async () => {
    if (!imageRef.current) return;

    try {
      setIsInferring(true);
      const img = imageRef.current;

      const result = await runRealAIVisionInference(img, {
        centreId,
        centreName,
        expectedAttendance,
        imageUrl: imageUrl || '',
        minConfidence: 0.4,
      });

      setInferenceResult(result);
      drawBoundingBoxes(img, result.detections);

      if (result.analysis.discrepancy_detected) {
        showToast(
          'warning',
          'AI Discrepancy Detected',
          `Detected headcount (${result.personCount}) differs significantly from expected check-ins (${expectedAttendance}).`
        );
        onAlertTriggered?.(
          `AI Headcount Discrepancy: ${centreName}`,
          `Real-time computer vision inference detected ${result.personCount} physical attendees vs ${expectedAttendance} registered session check-ins.`
        );
      } else {
        showToast(
          'success',
          'Model Inference Complete',
          `Detected ${result.personCount} persons in ${result.inferenceTimeMs}ms.`
        );
      }
    } catch (err: any) {
      console.error('Vision inference failed:', err);
      showToast('error', 'AI Inference Failed', err.message);
    } finally {
      setIsInferring(false);
    }
  };

  const drawBoundingBoxes = (img: HTMLImageElement, detections: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const det of detections) {
      const [x, y, w, h] = det.bbox;
      const isPerson = det.class === 'person';

      // Colors: Cyan for person, Amber for equipment, Indigo for others
      ctx.strokeStyle = isPerson ? '#00F2FE' : '#F59E0B';
      ctx.lineWidth = Math.max(2, Math.round(canvas.width / 300));

      ctx.strokeRect(x, y, w, h);

      // Label background
      ctx.fillStyle = isPerson ? 'rgba(0, 242, 254, 0.85)' : 'rgba(245, 158, 11, 0.85)';
      const label = `${det.class} ${Math.round(det.score * 100)}%`;
      const fontSize = Math.max(12, Math.round(canvas.width / 50));
      ctx.font = `bold ${fontSize}px sans-serif`;
      const textWidth = ctx.measureText(label).width;

      ctx.fillRect(x, Math.max(0, y - fontSize - 6), textWidth + 8, fontSize + 6);

      // Label text
      ctx.fillStyle = '#070D18';
      ctx.fillText(label, x + 4, Math.max(fontSize, y - 4));
    }
  };

  const handleVerdict = async (verdict: 'approved' | 'rejected' | 'reassessed') => {
    if (!inferenceResult) return;
    await submitHumanVerdict(
      inferenceResult.analysis.id,
      verdict,
      `Reviewed by authorized official at ${new Date().toLocaleTimeString('en-IN')}`
    );
    setHumanReviewStatus(verdict);
    showToast('info', 'Human Verdict Saved', `Marked as ${verdict}.`);
  };

  return (
    <Card className="border-cyan-900/40 bg-navy-950/90 text-slate-200 overflow-hidden shadow-2xl backdrop-blur-md">
      <CardHeader
        title={
          <div className="flex items-center gap-2 text-white">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span className="font-bold tracking-tight">
              Real Computer Vision AI — Classroom & Infrastructure Inspection
            </span>
            <Badge variant="teal" size="sm" className="bg-cyan-950 text-cyan-300 border-cyan-800">
              Live TensorFlow.js Engine
            </Badge>
          </div>
        }
        subtitle="Genuine neural network inference running locally on classroom footage. Zero mock detection."
      />
      <CardContent className="space-y-5 p-5">
        {/* Source Image Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-navy-900/80 p-3 rounded-xl border border-navy-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Test Images:</span>
            {sampleImages.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(s.url)}
                className="px-2.5 py-1 rounded-lg border border-navy-700 bg-navy-800 hover:bg-navy-700 text-cyan-300 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload className="w-3.5 h-3.5 text-cyan-400" />}
              className="border-navy-700 bg-navy-800 text-slate-200 hover:bg-navy-700"
            >
              Upload Classroom Photo
            </Button>
          </div>
        </div>

        {/* Visualizer Canvas & Image */}
        {imageUrl ? (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-navy-800 bg-black flex items-center justify-center max-h-[420px]">
              <img
                ref={imageRef}
                src={imageUrl}
                crossOrigin="anonymous"
                alt="Classroom Inspection Source"
                className="max-h-[420px] w-auto object-contain select-none"
                onLoad={() => {
                  if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                  }
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none object-contain"
              />
            </div>

            {/* Run Button */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="primary"
                onClick={executeInference}
                isLoading={isInferring}
                icon={<Sparkles className="w-4 h-4 text-cyan-300" />}
                className="bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-bold px-6 shadow-lg shadow-cyan-600/30"
              >
                Execute Real Model Inference
              </Button>

              {inferenceResult && (
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span>Runtime: <strong className="text-cyan-400">{inferenceResult.inferenceTimeMs}ms</strong></span>
                  <span>Engine: <strong className="text-slate-200">MobileNetV2</strong></span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            onClick={() => handleSelectSample(sampleImages[0].url)}
            className="p-10 text-center border-2 border-dashed border-navy-800 rounded-2xl hover:border-cyan-600/50 cursor-pointer transition-colors bg-navy-900/40"
          >
            <Camera className="w-10 h-10 text-cyan-500/70 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300">
              Select a sample or upload a facility photo to run neural inference
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Click to load standard classroom inspection image
            </p>
          </div>
        )}

        {/* Real Detections Breakdown */}
        {inferenceResult && (
          <div className="space-y-4 pt-4 border-t border-navy-800 animate-in fade-in-50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Headcount */}
              <div className="p-3.5 rounded-xl bg-navy-900/90 border border-navy-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Physical Headcount
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold text-cyan-400">
                      {inferenceResult.personCount}
                    </span>
                    <span className="text-xs text-slate-400">Persons</span>
                  </div>
                </div>
                <Users className="w-6 h-6 text-cyan-400/80" />
              </div>

              {/* Attendance Discrepancy */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  inferenceResult.analysis.discrepancy_detected
                    ? 'bg-red-950/30 border-red-800/80'
                    : 'bg-teal-950/30 border-teal-800/80'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Attendance Audit
                  </span>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">
                    {inferenceResult.analysis.discrepancy_detected
                      ? 'Proxy / Deficit Discrepancy'
                      : 'Physical Count Verified'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Expected: {expectedAttendance} | Seen: {inferenceResult.personCount}
                  </p>
                </div>
                {inferenceResult.analysis.discrepancy_detected ? (
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-teal-400" />
                )}
              </div>

              {/* Detected Equipment */}
              <div className="p-3.5 rounded-xl bg-navy-900/90 border border-navy-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Infrastructure Detected
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {Object.entries(inferenceResult.equipmentCounts).length > 0 ? (
                    Object.entries(inferenceResult.equipmentCounts).map(([item, count]) => (
                      <span
                        key={item}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-navy-800 text-amber-300 border border-navy-700 capitalize"
                      >
                        {item}: {count}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500">None detected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Individual Detections Pill List */}
            <div className="p-3 bg-navy-900/50 rounded-xl border border-navy-800/70">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Tensor Tetections (Confidence $\ge$ 40%):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {inferenceResult.detections.map((det, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-800/90 border border-navy-700 text-slate-300"
                  >
                    <strong className={det.class === 'person' ? 'text-cyan-400' : 'text-amber-400'}>
                      {det.class}
                    </strong>
                    : {Math.round(det.score * 100)}%
                  </span>
                ))}
              </div>
            </div>

            {/* Human in the loop decision */}
            <div className="p-3.5 rounded-xl bg-navy-900/90 border border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-slate-200">
                  Human-in-the-Loop Review (Rule 7 Requirement)
                </p>
                <p className="text-[11px] text-slate-400">
                  AI predictions must be reviewed by an authorized officer before issuing formal sanctions.
                </p>
              </div>

              {humanReviewStatus ? (
                <span className="px-3 py-1.5 rounded-lg bg-teal-950/60 border border-teal-800 text-teal-300 font-bold uppercase text-[11px]">
                  Verdict: {humanReviewStatus}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="teal"
                    size="sm"
                    onClick={() => handleVerdict('approved')}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Confirm & Save
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleVerdict('rejected')}
                    icon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Dismiss False Positive
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

