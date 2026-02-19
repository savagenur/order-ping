import type { WorkerInput, Cart } from '../../types/admin';
import { useAuthStore } from '../../stores/authStore';
import { X } from 'lucide-react';

interface CreateWorkerModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: WorkerInput;
  onChange: (data: WorkerInput) => void;
  submitting: boolean;
  carts: Cart[];
  onCartSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function CreateWorkerModal({
  show,
  onClose,
  onSubmit,
  formData,
  onChange,
  submitting,
  carts,
  onCartSelect,
}: CreateWorkerModalProps) {
  const { isSuperAdmin } = useAuthStore();
  
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Create New Worker</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Worker Name *
            </label>
            <input
              type="text"
              required
              value={formData.workerName}
              onChange={(e) => onChange({ ...formData, workerName: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => onChange({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              placeholder="worker@yourbusiness.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => onChange({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              placeholder="Minimum 6 characters"
            />
            <p className="text-xs text-zinc-500 mt-1">Worker will use this to login</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Assign to Cart *
            </label>
            <select
              required
              value={formData.cartId}
              onChange={onCartSelect}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select a cart...</option>
              {carts.map((cart) => (
                <option key={cart.id} value={cart.cartId}>
                  {cart.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Role *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => onChange({ ...formData, role: e.target.value as 'admin' | 'worker' | 'superadmin' })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="worker">Worker</option>
              {isSuperAdmin && <option value="admin">Admin</option>}
              {isSuperAdmin && <option value="superadmin">Super Admin</option>}
            </select>
            <p className="text-xs text-zinc-500 mt-1">
              {isSuperAdmin ? 'Admin users can manage workers and settings' : 'Workers can process orders and manage queue'}
            </p>
          </div>

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
              {submitting ? 'Creating...' : 'Create Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
