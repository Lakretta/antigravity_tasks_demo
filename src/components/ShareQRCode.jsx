import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function ShareQRCode() {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [currentUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const domain = currentUrl ? new URL(currentUrl).hostname : 'localhost';
  const qrCodeUrl = currentUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`
    : '';

  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        marginTop: 'auto',
        width: '100%',
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '100%' }}>
        <span style={{ 
          fontSize: '13px', 
          fontWeight: '600', 
          color: 'var(--color-brand)',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '0.2px'
        }}>
          Open on Mobile
        </span>
        <span style={{ 
          fontSize: '11px', 
          color: 'var(--text-secondary)', 
          textAlign: 'center',
          lineHeight: '1.4',
          fontFamily: 'var(--font-sans)',
          maxWidth: '220px'
        }}>
          Scan the QR code to access this task manager on your mobile device.
        </span>
      </div>

      {qrCodeUrl && (
        <div style={{
          backgroundColor: 'white',
          padding: '8px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: hovered ? 'scale(1.03)' : 'scale(1)'
        }}>
          <img 
            src={qrCodeUrl} 
            alt="QR Code" 
            style={{ 
              width: '120px', 
              height: '120px', 
              display: 'block' 
            }} 
          />
        </div>
      )}

      <button
        onClick={handleCopy}
        onMouseEnter={() => setButtonHovered(true)}
        onMouseLeave={() => setButtonHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '11px',
          fontWeight: '500',
          color: buttonHovered ? 'var(--color-brand)' : 'var(--text-secondary)',
          backgroundColor: buttonHovered ? 'var(--color-brand-light)' : 'var(--bg-secondary)',
          border: `1px solid ${buttonHovered ? 'var(--color-brand)' : 'var(--border-color)'}`,
          borderRadius: '6px',
          padding: '6px 12px',
          cursor: 'pointer',
          width: '100%',
          maxWidth: '160px',
          fontFamily: 'var(--font-sans)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {copied ? (
          <>
            <Check size={13} color="var(--color-success)" />
            <span style={{ color: 'var(--color-success)' }}>Copied!</span>
          </>
        ) : (
          <>
            <Copy size={13} />
            <span>{domain}</span>
          </>
        )}
      </button>
    </div>
  );
}
