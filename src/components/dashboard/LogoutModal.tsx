interface LogoutModalProps {
  show: boolean;
  cartName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutModal({ 
  show, 
  cartName, 
  onConfirm, 
  onCancel 
}: LogoutModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200 z-60">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4">
            <svg
              className="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            Confirm Logout
          </h3>
          <p className="text-sm text-zinc-400 mb-6">
            Are you sure you want to log out of <strong className="text-white">{cartName}</strong>?
            You will need to sign in again to manage orders.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-md hover:bg-zinc-700 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
