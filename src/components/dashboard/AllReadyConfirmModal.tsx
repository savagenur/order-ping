import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AllReadyConfirmModalProps {
  show: boolean;
  pendingCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AllReadyConfirmModal({
  show,
  pendingCount,
  onConfirm,
  onCancel
}: AllReadyConfirmModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200 z-60">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Mark All Orders as Ready
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to mark all {pendingCount} pending orders as ready? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium"
            >
              Mark All Ready
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
