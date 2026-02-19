import type { Worker } from '../../types/admin';
import { useAuthStore } from '../../stores/authStore';

interface WorkersTableProps {
  workers: Worker[];
  onDelete: (id: string, email: string) => void;
}

export default function WorkersTable({ workers, onDelete }: WorkersTableProps) {
  const { cartId: userCartId, isSuperAdmin, user } = useAuthStore();

  // Admins can delete workers assigned to their cart, superadmins can delete any worker
  // But no one can delete their own account
  const canDeleteWorker = (worker: Worker) => {
    const isOwnAccount = user?.email === worker.email;
    if (isOwnAccount) return false; // Cannot delete own account
    
    return isSuperAdmin || worker.cartId === userCartId;
  };
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden min-w-[90vw] md:min-w-[70vw]">
      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Cart
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workers.map((worker) => (
              <tr key={worker.uid} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{worker.workerName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap ">
                  <div className="text-sm font-medium text-gray-900">{worker.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{worker.cartName}</div>
                  <div className="text-xs text-gray-500">{worker.cartId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {worker.active ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {worker.createdAt.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  {canDeleteWorker(worker) ? (
                    <button
                      onClick={() => onDelete(worker.uid, worker.email)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card View */}
      <div className="sm:hidden">
        <div className="divide-y divide-gray-200">
          {workers.map((worker) => (
            <div key={worker.uid} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{worker.workerName}</h3>
                  <p className="text-xs text-gray-500">{worker.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Created: {worker.createdAt.toLocaleDateString()}</p>
                </div>
                {worker.active ? (
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>
                )}
              </div>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Assigned Cart</p>
                <p className="text-sm text-gray-900">{worker.cartName}</p>
                <p className="text-xs text-gray-500">{worker.cartId}</p>
              </div>
              <div className="flex justify-end">
                {canDeleteWorker(worker) ? (
                  <button
                    onClick={() => onDelete(worker.uid, worker.email)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                ) : (
                  <span className="text-gray-400 text-sm">-</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
