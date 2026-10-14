import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AttendanceSession } from '../../types';
import { Copy, Check, ExternalLink, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { isSessionExpired } from '../../lib/validation';

interface QRGeneratorModalProps {
  session: AttendanceSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRGeneratorModal: React.FC<QRGeneratorModalProps> = ({
  session,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!session) return null;

  const origin = window.location.origin;
  const checkInUrl = `${origin}/check-in?token=${encodeURIComponent(session.session_token)}`;
  const isExpired = isSessionExpired(session.expires_at);

  const copyToken = () => {
    navigator.clipboard.writeText(session.session_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(checkInUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session QR Code & Trainee Check-In"
      description={`${session.centre_name || 'Training Centre'} • ${session.batch_name}`}
      maxWidth="md"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Status Indicator */}
        <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Valid until:{' '}
            {new Date(session.expires_at).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {isExpired ? (
            <span className="flex items-center gap-1 text-red-600 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" /> Expired
            </span>
          ) : (
            <span className="flex items-center gap-1 text-teal-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Active Session
            </span>
          )}
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-md flex items-center justify-center">
          <QRCodeSVG
            value={checkInUrl}
            size={220}
            level="H"
            includeMargin={true}
            fgColor="#0B1528"
          />
        </div>

        {/* Token Monospace Display */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Session Code (Manual Entry)
            </p>
            <p className="text-lg font-mono font-bold text-slate-900 tracking-wider">
              {session.session_token}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copyToken}>
            {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
          Trainees scan this QR code using their smartphone camera or enter the manual token on
          the Trainee Check-In portal.
        </p>

        {/* Direct Link Simulation for Evaluators */}
        <div className="w-full pt-2 flex flex-col sm:flex-row gap-2">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => window.open(checkInUrl, '_blank')}
            icon={<ExternalLink className="w-4 h-4" />}
          >
            Launch Trainee View
          </Button>
          <Button variant="outline" onClick={copyLink}>
            Copy Check-In Link
          </Button>
        </div>
      </div>
    </Modal>
  );
};

