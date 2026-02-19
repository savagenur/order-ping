import { useState, useMemo } from 'react';
import type { CartInput } from '../types/admin';
import { useRoleBasedCarts, useCreateCart, useDeleteCart } from '../hooks/useAdminQueries';
import { useAuthStore } from '../stores/authStore';
import { Plus } from 'lucide-react';
import AdminHeader from '../components/admin/AdminHeader';
import CartCard from '../components/admin/CartCard';
import CreateCartModal from '../components/admin/CreateCartModal';

function generateCartId(businessName: string, location: string): string {
  const slug = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const namePart = slug(businessName);
  const locationPart = slug(location);

  if (!namePart && !locationPart) return '';
  if (!namePart) return locationPart;
  if (!locationPart) return namePart;

  return `${namePart}-${locationPart}`;
}

export default function AdminCarts() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { cartId, isSuperAdmin, role } = useAuthStore();
  const [formData, setFormData] = useState<CartInput>({
    businessName: '',
    location: '',
    displayName: '',
    settings: {
      instagramHandle: '',
      googleMapsLink: '',
      websiteUrl: '',
    },
  });

  // TanStack Query - role-based carts list (cached 5 min)
  const { data: carts = [], isLoading } = useRoleBasedCarts(cartId, isSuperAdmin);
  const createCart = useCreateCart();
  const deleteCart = useDeleteCart();

  // Derived state - no useEffect needed
  const cartIdPreview = useMemo(
    () => generateCartId(formData.businessName, formData.location),
    [formData.businessName, formData.location],
  );

  const cartIdError = useMemo(() => {
    if (!cartIdPreview) return '';
    const exists = carts.some((c) => c.cartId === cartIdPreview);
    return exists ? '⚠️ A cart with this ID already exists' : '';
  }, [cartIdPreview, carts]);

  // Redirect workers away from admin pages
  if (role === 'worker') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-zinc-400">Workers cannot access admin management pages.</p>
        </div>
      </div>
    );
  }

  const handleCreateCart = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName.trim() || !formData.location.trim() || !formData.displayName.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (cartIdError) {
      alert('Please fix the errors before creating the cart');
      return;
    }

    try {
      await createCart.mutateAsync({
        businessName: formData.businessName,
        location: formData.location,
        cartId: cartIdPreview,
        displayName: formData.displayName,
        settings: formData.settings,
      });

      alert('Cart created successfully!');
      setShowCreateModal(false);
      setFormData({ 
        businessName: '', 
        location: '', 
        displayName: '',
        settings: {
          instagramHandle: '',
          googleMapsLink: '',
          websiteUrl: '',
        },
      });
    } catch (error) {
      console.error('Error creating cart:', error);
      alert('Failed to create cart');
    }
  };

  const handleDeleteCart = async (cartId: string, cartName: string) => {
    if (!confirm(`Are you sure you want to delete "${cartName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCart.mutateAsync(cartId);
      alert('Cart deleted successfully');
    } catch (error) {
      console.error('Error deleting cart:', error);
      alert('Failed to delete cart');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-zinc-500">Loading carts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <AdminHeader
        title="Manage Carts"
        subtitle={`${carts.length} cart${carts.length !== 1 ? 's' : ''} total`}
        actionButton={isSuperAdmin ? {
          text: 'Cart',
          onClick: () => setShowCreateModal(true),
          icon: <Plus className="w-4 h-4" />,
        } : undefined}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Carts List */}
        {carts.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white">No carts</h3>
            <p className="mt-1 text-sm text-zinc-400">Get started by creating a new cart.</p>
            {isSuperAdmin && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                  + Create New Cart
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carts.map((cart) => (
              <CartCard
                key={cart.id}
                cart={cart}
                onDelete={handleDeleteCart}
              />
            ))}
          </div>
        )}
      </div>

      <CreateCartModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCart}
        formData={formData}
        onChange={setFormData}
        submitting={createCart.isPending}
        cartIdPreview={cartIdPreview}
        cartIdError={cartIdError}
      />
    </div>
  );
}