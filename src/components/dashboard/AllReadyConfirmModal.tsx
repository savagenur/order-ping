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
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl max-w-sm w-full p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/20 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            Mark All Orders as Ready
          </h3>
          <p className="text-sm text-zinc-400 mb-6">
            Are you sure you want to mark all {pendingCount} pending orders as ready? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-4 bg-zinc-800 text-zinc-300 rounded-xl font-semibold cursor-pointer"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-4 bg-emerald-600 text-white rounded-xl font-semibold cursor-pointer active:bg-emerald-700"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              Mark All Ready
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
