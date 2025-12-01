/**
 * CertificateViewer Component
 * 
 * Displays SSL/TLS certificate information for the current site.
 */

import React from 'react';
import { 
  Shield, ShieldCheck, ShieldAlert, ShieldX, 
  Lock, Calendar, Building2, Globe, Key, 
  CheckCircle2, XCircle, AlertTriangle, X,
  FileKey, Server
} from 'lucide-react';

export interface CertificateInfo {
  isSecure: boolean;
  issuer: {
    commonName: string;
    organization?: string;
    country?: string;
  };
  subject: {
    commonName: string;
    organization?: string;
    country?: string;
  };
  validFrom: Date;
  validTo: Date;
  fingerprint: string;
  serialNumber: string;
  protocol: string;
  keyExchange?: string;
  cipher?: string;
}

interface CertificateViewerProps {
  url: string;
  certificate?: CertificateInfo;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const isExpiringSoon = (date: Date): boolean => {
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return date.getTime() - Date.now() < thirtyDays;
};

const isExpired = (date: Date): boolean => {
  return date.getTime() < Date.now();
};

export const CertificateViewer: React.FC<CertificateViewerProps> = ({
  url,
  certificate,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const isHttps = url.startsWith('https://');
  const hostname = isHttps ? new URL(url).hostname : '';

  // Mock certificate for demo (in real implementation, this would come from Electron)
  const cert: CertificateInfo = certificate || {
    isSecure: isHttps,
    issuer: {
      commonName: 'DigiCert TLS RSA SHA256 2020 CA1',
      organization: 'DigiCert Inc',
      country: 'US',
    },
    subject: {
      commonName: hostname || 'example.com',
      organization: hostname?.includes('google') ? 'Google LLC' : undefined,
      country: 'US',
    },
    validFrom: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
    validTo: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
    fingerprint: 'SHA-256: A1:B2:C3:D4:E5:F6:...',
    serialNumber: '0A:1B:2C:3D:4E:5F:6A:7B',
    protocol: 'TLS 1.3',
    keyExchange: 'X25519',
    cipher: 'AES_256_GCM',
  };

  const expired = isExpired(cert.validTo);
  const expiringSoon = !expired && isExpiringSoon(cert.validTo);

  const getSecurityStatus = () => {
    if (!isHttps) {
      return { icon: ShieldX, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Not Secure' };
    }
    if (expired) {
      return { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Certificate Expired' };
    }
    if (expiringSoon) {
      return { icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Expiring Soon' };
    }
    return { icon: ShieldCheck, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Secure Connection' };
  };

  const status = getSecurityStatus();
  const StatusIcon = status.icon;

  return (
    <div className="absolute top-full left-0 mt-2 w-96 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden font-sans">
      {/* Header */}
      <div className={`px-4 py-3 ${status.bg} border-b border-white/10 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-5 h-5 ${status.color}`} />
          <div>
            <h3 className={`text-sm font-medium ${status.color}`}>{status.label}</h3>
            <p className="text-xs text-zinc-400 truncate max-w-[250px]">{hostname || url}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {!isHttps ? (
        /* Not Secure Warning */
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-medium">Connection is not secure</p>
              <p className="text-xs text-zinc-400 mt-1">
                This site does not use HTTPS. Information you submit could be visible to others.
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            You should not enter sensitive information (like passwords or credit cards) on this site.
          </p>
        </div>
      ) : (
        /* Certificate Details */
        <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
          {/* Connection Security */}
          <Section title="Connection">
            <InfoRow 
              icon={<Lock size={14} />} 
              label="Protocol" 
              value={cert.protocol} 
            />
            {cert.keyExchange && (
              <InfoRow 
                icon={<Key size={14} />} 
                label="Key Exchange" 
                value={cert.keyExchange} 
              />
            )}
            {cert.cipher && (
              <InfoRow 
                icon={<Shield size={14} />} 
                label="Cipher" 
                value={cert.cipher} 
              />
            )}
          </Section>

          {/* Certificate Info */}
          <Section title="Certificate">
            <InfoRow 
              icon={<Globe size={14} />} 
              label="Issued To" 
              value={cert.subject.commonName} 
            />
            {cert.subject.organization && (
              <InfoRow 
                icon={<Building2 size={14} />} 
                label="Organization" 
                value={cert.subject.organization} 
              />
            )}
            <InfoRow 
              icon={<Building2 size={14} />} 
              label="Issued By" 
              value={cert.issuer.commonName} 
            />
          </Section>

          {/* Validity Period */}
          <Section title="Validity">
            <InfoRow 
              icon={<Calendar size={14} />} 
              label="Valid From" 
              value={formatDate(cert.validFrom)} 
            />
            <InfoRow 
              icon={<Calendar size={14} />} 
              label="Valid Until" 
              value={formatDate(cert.validTo)}
              status={expired ? 'error' : expiringSoon ? 'warning' : 'success'}
            />
          </Section>

          {/* Fingerprint */}
          <Section title="Fingerprint">
            <div className="font-mono text-[10px] text-zinc-400 bg-zinc-800/50 p-2 rounded break-all">
              {cert.fingerprint}
            </div>
          </Section>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 bg-zinc-900/50">
        <p className="text-[10px] text-zinc-500 text-center">
          {isHttps 
            ? 'Your connection to this site is encrypted and secure.'
            : 'Consider using HTTPS version of this site if available.'
          }
        </p>
      </div>
    </div>
  );
};

// Helper Components
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{title}</h4>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const InfoRow: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  status?: 'success' | 'warning' | 'error';
}> = ({ icon, label, value, status }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="text-zinc-500">{icon}</span>
    <span className="text-zinc-400">{label}:</span>
    <span className={`text-zinc-200 truncate ${
      status === 'error' ? 'text-red-400' : 
      status === 'warning' ? 'text-amber-400' : 
      status === 'success' ? 'text-green-400' : ''
    }`}>
      {value}
    </span>
    {status === 'success' && <CheckCircle2 size={12} className="text-green-400 shrink-0" />}
    {status === 'warning' && <AlertTriangle size={12} className="text-amber-400 shrink-0" />}
    {status === 'error' && <XCircle size={12} className="text-red-400 shrink-0" />}
  </div>
);

export default CertificateViewer;
