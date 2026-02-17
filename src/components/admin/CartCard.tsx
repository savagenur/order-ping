import type { Cart } from '../../types/admin';

interface CartCardProps {
  cart: Cart;
  onDelete: (id: string, name: string) => void;
}

export default function CartCard({ cart, onDelete }: CartCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {cart.businessName}
          </h3>
          <p className="text-sm text-gray-600">{cart.location}</p>
        </div>
        {cart.active && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Active
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div>
          <p className="text-xs text-gray-500">Cart ID</p>
          <p className="text-sm font-mono text-gray-900">{cart.cartId}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Display Name</p>
          <p className="text-sm text-gray-900">{cart.displayName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Queue URL</p>
          <p className="text-xs text-indigo-600 break-all">
            {window.location.origin}/queue?cart={cart.cartId}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => window.open(`/queue?cart=${cart.cartId}`, '_blank')}
          className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition"
        >
          View QR
        </button>
        <button
          onClick={() => onDelete(cart.id, cart.displayName)}
          className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition"
        >
          Delete
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Created {cart.createdAt.toLocaleDateString()}
      </p>
    </div>
  );
}
