import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface QRCodeModalProps {
  show: boolean;
  cartName: string;
  cartId: string;
  onClose: () => void;
}

export default function QRCodeModal({ 
  show, 
  cartName, 
  cartId, 
  onClose 
}: QRCodeModalProps) {
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrError, setQrError] = useState(false);
  const navigate = useNavigate();

  const getQRCodeUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/queue?cart=${cartId}`;
  };

  const downloadQRCode = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(getQRCodeUrl())}`;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `${cartId}-qr-code.png`;
    link.click();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Your QR Code</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="text-center">
          <p className="text-sm text-zinc-400 mb-4">{cartName}</p>
          <div className="bg-zinc-800/50 border border-zinc-700 p-4 rounded-lg inline-block relative w-75 h-75">
            {!qrLoaded && !qrError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <svg className="w-8 h-8 animate-spin text-zinc-600" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                  <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="text-xs text-zinc-600 mt-2 uppercase tracking-wider">Loading QR</span>
              </div>
            )}
            {qrError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-zinc-600 text-sm">Failed to load QR</span>
                <button
                  onClick={() => {
                    setQrError(false);
                    setQrLoaded(false);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 underline mt-2"
                >
                  Retry
                </button>
              </div>
            )}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getQRCodeUrl())}`}
              alt="QR Code"
              className={`w-full h-full object-contain ${qrLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
              onLoad={() => setQrLoaded(true)}
              onError={() => {
                setQrError(true);
                setQrLoaded(false);
              }}
            />
          </div>
          <a 
            href={getQRCodeUrl()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 underline mt-4 mb-4 block break-all"
          >
            {getQRCodeUrl()}
          </a>
          <div className="space-y-3">
            <button
              onClick={downloadQRCode}
              className="w-full px-4 py-2 bg-linear-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              Download QR Code
            </button>
            <button
              onClick={() => navigate(`/queue?cart=${cartId}`)}
              className="w-full px-4 py-2 bg-zinc-700 text-white font-semibold rounded-xl hover:bg-zinc-600 transition-colors duration-300"
            >
              View Queue Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
