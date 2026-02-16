const InvalidQRCode = () => {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="sm:max-w-xl max-w-[90vw] max-h-[90vh] p-8 bg-white rounded-lg shadow-xl text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Invalid QR Code
        </h2>
        <p className="text-gray-700 mb-5">
          This QR code is not valid. Please scan a valid OrderPing QR code from
          a food cart.
        </p>
        <img className="mx-auto max-w-[90%] justify-center" src="./src/assets/undraw_server-error_syuz.svg" alt="Invalid QR Code" />
      </div>
    </div>
  );
};

export default InvalidQRCode;
