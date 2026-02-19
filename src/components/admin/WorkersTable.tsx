import type { Worker } from '../../types/admin';
import { useAuthStore } from '../../stores/authStore';
import { Edit } from 'lucide-react';

interface WorkersTableProps {
  workers: Worker[];
  onDelete: (id: string, email: string) => void;
  onEdit?: (worker: Worker) => void;
}

export default function WorkersTable({ workers, onDelete, onEdit }: WorkersTableProps) {
  const { cartId: userCartId, isSuperAdmin, user } = useAuthStore();

  // Admins can delete workers assigned to their cart, superadmins can delete any worker
  // But no one can delete their own account
  const canDeleteWorker = (worker: Worker) => {
    const isOwnAccount = user?.email === worker.email;
    if (isOwnAccount) return false; // Cannot delete own account
    
    return isSuperAdmin || worker.cartId === userCartId;
  };

  // Only superadmins can edit workers
  const canEditWorker = () => {
    return isSuperAdmin;
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg overflow-hidden min-w-[90vw] md:min-w-[70vw]">
      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <table className="min-w-full divide-y divide-zinc-700">
          <thead className="bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Assigned Cart
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-zinc-900 divide-y divide-zinc-700">
            {workers.map((worker) => (
              <tr key={worker.uid} className="hover:bg-zinc-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{worker.workerName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap ">
                  <div className="text-sm font-medium text-white">{worker.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{worker.cartName}</div>
                  <div className="text-xs text-zinc-500">{worker.cartId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {worker.active ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400">Active</span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-zinc-700 text-zinc-400">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                  {worker.createdAt.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex justify-end space-x-2">
                    {canEditWorker() && onEdit && (
                      <button
                        onClick={() => onEdit(worker)}
                        className="text-blue-400 hover:text-blue-300"
                        title="Edit worker"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDeleteWorker(worker) ? (
                      <button
                        onClick={() => onDelete(worker.uid, worker.email)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete worker"
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card View */}
      <div className="sm:hidden">
        <div className="divide-y divide-zinc-700">
          {workers.map((worker) => (
            <div key={worker.uid} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white">{worker.workerName}</h3>
                  <p className="text-xs text-zinc-500">{worker.email}</p>
                  <p className="text-xs text-zinc-500 mt-1">Created: {worker.createdAt.toLocaleDateString()}</p>
                </div>
                {worker.active ? (
                  <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400">Active</span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full bg-zinc-700 text-zinc-400">Inactive</span>
                )}
              </div>
              <div className="mb-3">
                <p className="text-xs text-zinc-500 mb-1">Assigned Cart</p>
                <p className="text-sm text-white">{worker.cartName}</p>
                <p className="text-xs text-zinc-500">{worker.cartId}</p>
              </div>
              <div className="flex justify-end space-x-2">
                {canEditWorker() && onEdit && (
                  <button
                    onClick={() => onEdit(worker)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                    title="Edit worker"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {canDeleteWorker(worker) ? (
                  <button
                    onClick={() => onDelete(worker.uid, worker.email)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                ) : (
                  <span className="text-zinc-600 text-sm">-</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
