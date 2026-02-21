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
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Loading QR...</span>
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
              className={`w-full h-full object-contain ${qrLoaded ? 'opacity-100' : 'opacity-0'}`}
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
              className="w-full px-4 py-4 bg-blue-600 text-white font-semibold rounded-xl active:bg-blue-700 cursor-pointer"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              Download QR Code
            </button>
            <button
              onClick={() => navigate(`/queue?cart=${cartId}`)}
              className="w-full px-4 py-4 bg-zinc-700 text-white font-semibold rounded-xl active:bg-zinc-600 cursor-pointer"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              View Queue Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
