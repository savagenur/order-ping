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
          <div className="bg-zinc-800/50 border border-zinc-700 p-4 rounded-lg inline-block">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getQRCodeUrl())}`}
              alt="QR Code"
              className="w-64 h-64"
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
          <button
            onClick={downloadQRCode}
            className="w-full px-4 py-2 bg-linear-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
          >
            Download QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
