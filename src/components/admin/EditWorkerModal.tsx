import { X } from 'lucide-react';
import type { Worker, Cart } from '../../types/admin';
import { useAuthStore } from '../../stores/authStore';

interface EditWorkerModalProps {
  show: boolean;
  worker: Worker | null;
  carts: Cart[];
  onClose: () => void;
  onSubmit: (data: {
    role: 'admin' | 'worker' | 'superadmin';
    workerName: string;
    cartId: string;
    cartName: string;
    active: boolean;
  }) => void;
  submitting: boolean;
}

export default function EditWorkerModal({
  show,
  worker,
  carts,
  onClose,
  onSubmit,
  submitting,
}: EditWorkerModalProps) {
  const { isSuperAdmin } = useAuthStore();
  
  if (!show || !worker) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    const role = formData.get('role') as 'admin' | 'worker' | 'superadmin';
    const workerName = formData.get('workerName') as string;
    const cartId = formData.get('cartId') as string;
    const active = formData.get('active') === 'true';
    
    const selectedCart = carts.find(cart => cart.cartId === cartId);
    const cartName = selectedCart?.displayName || worker.cartName;

    onSubmit({
      role,
      workerName,
      cartId,
      cartName,
      active,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Edit Worker</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Read-only fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={worker.uid}
                disabled
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-500 cursor-not-allowed"
                readOnly
              />
              <p className="text-xs text-zinc-500 mt-1">User ID cannot be changed</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={worker.email}
                disabled
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-500 cursor-not-allowed"
                readOnly
              />
              <p className="text-xs text-zinc-500 mt-1">Email cannot be changed</p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                name="workerName"
                defaultValue={worker.workerName}
                required
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Role
              </label>
              <select
                name="role"
                defaultValue={worker.role}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
                {isSuperAdmin && <option value="superadmin">Super Admin</option>}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Assigned Cart
            </label>
            <select
              name="cartId"
              defaultValue={worker.cartId}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
            >
              {carts.map((cart) => (
                <option key={cart.cartId} value={cart.cartId}>
                  {cart.displayName} ({cart.cartId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="active"
                defaultChecked={worker.active}
                value="true"
                className="w-4 h-4 text-blue-500 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-zinc-300">Active</span>
            </label>
            <p className="text-xs text-zinc-500 mt-1">Inactive workers cannot log in</p>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-zinc-800 pt-6">
            <h3 className="text-lg font-medium text-red-400 mb-4">Danger Zone</h3>
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
              <p className="text-sm text-red-300 mb-2">
                Sensitive actions that can affect worker access:
              </p>
              <ul className="text-xs text-red-400 space-y-1">
                <li>• Changing role to "worker" removes admin privileges</li>
                <li>• Deactivating account prevents login</li>
                <li>• Reassigning carts affects order management access</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-300 border border-zinc-600 rounded-md hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
