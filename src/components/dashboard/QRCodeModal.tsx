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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Your QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">{cartName}</p>
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getQRCodeUrl())}`}
              alt="QR Code"
              className="w-64 h-64"
            />
          </div>
          <p className="text-xs text-gray-500 mt-4 mb-4">
            {getQRCodeUrl()}
          </p>
          <button
            onClick={downloadQRCode}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Download QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
