export default function CartNotConfigured() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md p-8 bg-white rounded-lg shadow text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          Cart Not Configured
        </h2>
        <p className="text-gray-700 mb-4">
          Your account is not associated with a cart. Please contact your
          administrator to set up your cart ID.
        </p>
      </div>
    </div>
  );
}
