import { useState } from 'react';
import type { Cart } from '../../types/admin';
import { useAuthStore } from '../../stores/authStore';
import { Edit } from 'lucide-react';
import QRCodeModal from '../dashboard/QRCodeModal';

interface CartCardProps {
  cart: Cart;
  onDelete: (id: string, name: string) => void;
  onEdit?: (cart: Cart) => void;
}

export default function CartCard({ cart, onDelete, onEdit }: CartCardProps) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { cartId: userCartId, isSuperAdmin } = useAuthStore();


  // Superadmins can edit any cart, admins can only edit their own cart
  const canDelete = isSuperAdmin;
  const canEdit = isSuperAdmin || cart.cartId === userCartId;
  

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {cart.businessName}
          </h3>
          <p className="text-sm text-zinc-400">{cart.location}</p>
        </div>
        {cart.active && (
          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
            Active
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div>
          <p className="text-xs text-zinc-500">Cart ID</p>
          <p className="text-sm font-mono text-white">{cart.cartId}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Display Name</p>
          <p className="text-sm text-white">{cart.displayName}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Queue URL</p>
          <p className="text-xs text-blue-400 break-all">
            {window.location.origin}/queue?cart={cart.cartId}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowQRModal(true)}
          className="flex-1 px-3 py-2 text-sm bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition"
        >
          View QR
        </button>
        {canEdit && onEdit && (
          <button
            onClick={() => onEdit(cart)}
            className="px-3 py-2 text-sm bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition"
            title="Edit cart"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-2 text-sm bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition"
          >
            Delete
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-500 mt-4">
        Created {cart.createdAt.toLocaleDateString()}
      </p>

      <QRCodeModal
        show={showQRModal}
        cartName={cart.businessName}
        cartId={cart.cartId}
        onClose={() => setShowQRModal(false)}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Delete Cart</h3>
              <p className="text-sm text-zinc-400 mb-6">
                Are you sure you want to delete <span className="font-semibold text-white">{cart.displayName}</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 text-sm bg-zinc-800 text-zinc-300 rounded-md hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(cart.id, cart.displayName);
                    setShowDeleteModal(false);
                  }}
                  className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
