import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { submitTraineeCheckIn, CheckInResponse } from '../services/attendance';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  Keyboard,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Building2,
  Calendar,
} from 'lucide-react';

export const CheckInPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>(tokenFromUrl ? 'manual' : 'scan');
  const [sessionToken, setSessionToken] = useState(tokenFromUrl);
  const [traineeId, setTraineeId] = useState('');
  const [traineeName, setTraineeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResponse | null>(null);

  // Scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  useEffect(() => {
    if (tokenFromUrl) {
      setSessionToken(tokenFromUrl);
      setActiveTab('manual');
    }
  }, [tokenFromUrl]);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      setScannerActive(true);
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          // Parse scanned URL or token
          handleScanSuccess(decodedText);
        },
        () => {
          // Scanning frame tick (ignore frame errors)
        }
      );
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError(
        'Unable to access camera. Please ensure camera permissions are granted, or enter the session token manually below.'
      );
      setScannerActive(false);
      setActiveTab('manual');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scannerActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      setScannerActive(false);
    }
  };

  const handleScanSuccess = async (scannedText: string) => {
    await stopScanner();

    let extractedToken = scannedText.trim();
    // Check if scanned value is a full URL containing `token=`
    if (scannedText.includes('token=')) {
      try {
        const urlObj = new URL(scannedText);
        const tok = urlObj.searchParams.get('token');
        if (tok) extractedToken = tok;
      } catch {
        // use raw
      }
    }

    setSessionToken(extractedToken);
    setActiveTab('manual');
    showToast('info', 'QR Code Scanned', `Token ${extractedToken} detected. Confirm check-in.`);
  };

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken.trim()) {
      showToast('warning', 'Session token is required');
      return;
    }
    if (!traineeId.trim()) {
      showToast('warning', 'Trainee ID is required');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const resp = await submitTraineeCheckIn({
        session_token: sessionToken.trim(),
        trainee_id: traineeId.trim(),
        trainee_name: traineeName.trim() || 'Trainee',
        verification_method: activeTab === 'scan' ? 'qr_scan' : 'manual_token',
      });

      setResult(resp);
      if (resp.success) {
        showToast('success', 'Attendance Recorded', resp.message);
      } else {
        showToast('error', 'Check-In Rejected', resp.message);
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Check-in validation service error.',
        error_code: 'VALIDATION_ERROR',
      });
      showToast('error', 'Validation Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSessionToken('');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trainee Attendance Check-In</h1>
        <p className="text-xs text-slate-500 mt-1">
          Scan the classroom session QR code or enter your token to verify presence
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-200/80 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setActiveTab('scan');
            startScanner();
          }}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'scan' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Camera Scanner</span>
        </button>
        <button
          type="button"
          onClick={() => {
            stopScanner();
            setActiveTab('manual');
          }}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'manual' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          <span>Manual Token Entry</span>
        </button>
      </div>

      {/* Result Alert Cards */}
      {result && (
        <Card
          className={`p-5 animate-in zoom-in-95 border-2 ${
            result.success
              ? 'bg-teal-50/70 border-teal-500 text-teal-950'
              : 'bg-red-50/80 border-red-500 text-red-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle2 className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-sm">
                {result.success ? 'Attendance Verified Successfully' : 'Check-In Rejected'}
              </h3>
              <p className="text-xs leading-relaxed opacity-90">{result.message}</p>

              {result.success && result.record && (
                <div className="mt-3 pt-3 border-t border-teal-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-700">Trainee</span>
                    <p className="font-semibold">{result.record.trainee_name}</p>
                    <p className="font-mono text-[11px] text-teal-800">{result.record.trainee_id}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-700">Verified At</span>
                    <p className="font-semibold">
                      {new Date(result.record.checked_in_at).toLocaleTimeString('en-IN')}
                    </p>
                    <p className="text-[11px] text-teal-800">{result.batch_name}</p>
                  </div>
                </div>
              )}

              {result.error_code && (
                <div className="mt-2 pt-2 border-t border-red-200 text-[11px] font-mono text-red-700">
                  Rule Trigger: {result.error_code}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-current/15 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="bg-white/80"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Check-In Another Trainee
            </Button>
          </div>
        </Card>
      )}

      {/* Camera View Area */}
      {activeTab === 'scan' && (
        <Card className="overflow-hidden">
          <CardHeader
            title="Scan Classroom QR Code"
            subtitle="Point camera at the session QR projected on the classroom screen"
          />
          <CardContent className="space-y-4">
            <div
              id={scannerContainerId}
              className="w-full bg-slate-900 rounded-xl overflow-hidden min-h-[260px] flex items-center justify-center text-slate-400 text-xs"
            >
              {!scannerActive && (
                <div className="text-center p-6 space-y-3">
                  <Camera className="w-10 h-10 mx-auto text-slate-500" />
                  <p>Click below to initialize your device camera</p>
                  <Button variant="primary" size="sm" onClick={startScanner}>
                    Start Camera
                  </Button>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Check-In Form (Manual & Confirmation) */}
      <Card>
        <CardHeader
          title="Trainee Identity & Verification"
          subtitle="All submissions are validated against MSDE enrolment records"
        />
        <CardContent>
          <form onSubmit={handleSubmitCheckIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Session Code / Token
              </label>
              <input
                type="text"
                required
                value={sessionToken}
                onChange={e => setSessionToken(e.target.value)}
                placeholder="e.g. SKILL-JAI-SOL-2026"
                className="w-full font-mono text-sm tracking-wider uppercase px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Found beneath the projected QR code or provided by the centre instructor.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  National Skill ID / Roll No.
                </label>
                <input
                  type="text"
                  required
                  value={traineeId}
                  onChange={e => setTraineeId(e.target.value)}
                  placeholder="e.g. TR-RJ-2026-902"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trainee Full Name
                </label>
                <input
                  type="text"
                  required
                  value={traineeName}
                  onChange={e => setTraineeName(e.target.value)}
                  placeholder="e.g. Priyansh Rathore"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isSubmitting}
              icon={<UserCheck className="w-4 h-4" />}
            >
              Verify & Record Attendance
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Disclaimer as requested by Section 10 */}
      <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-700" />
          MSDE Integrity Notice
        </p>
        <p>
          QR codes verify session authorization and do not replace biometric attendance (AEBAS).
          Duplicate check-ins, scans after session expiry, and suspicious geolocations are
          automatically flagged by the compliance rule engine.
        </p>
      </div>
    </div>
  );
};

