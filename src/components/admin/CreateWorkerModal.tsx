import type { WorkerInput, Cart } from '../../types/admin';
import { useAuthStore } from '../../stores/authStore';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Create New Worker</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Worker Name *
            </label>
            <input
              type="text"
              required
              value={formData.workerName}
              onChange={(e) => onChange({ ...formData, workerName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => onChange({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="worker@yourbusiness.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => onChange({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Minimum 6 characters"
            />
            <p className="text-xs text-gray-500 mt-1">Worker will use this to login</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Cart *
            </label>
            <select
              required
              value={formData.cartId}
              onChange={onCartSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => onChange({ ...formData, role: e.target.value as 'admin' | 'worker' | 'superadmin' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="worker">Worker</option>
              {isSuperAdmin && <option value="admin">Admin</option>}
              {isSuperAdmin && <option value="superadmin">Super Admin</option>}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {isSuperAdmin ? 'Admin users can manage workers and settings' : 'Workers can process orders and manage queue'}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Creating...' : 'Create Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
