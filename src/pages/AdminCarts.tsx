import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { Cart, CartInput } from '../types/admin';
import { Plus } from 'lucide-react';
import AdminHeader from '../components/admin/AdminHeader';
import CartCard from '../components/admin/CartCard';
import CreateCartModal from '../components/admin/CreateCartModal';

export default function AdminCarts() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<CartInput>({
    businessName: '',
    location: '',
  });
  const [cartIdPreview, setCartIdPreview] = useState('');
  const [cartIdError, setCartIdError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCarts();
  }, []);

  useEffect(() => {
    // Generate cart ID preview as user types
    if (formData.businessName || formData.location) {
      const generated = generateCartId(formData.businessName, formData.location);
      setCartIdPreview(generated);
      checkCartIdAvailability(generated);
    } else {
      setCartIdPreview('');
      setCartIdError('');
    }
  }, [formData.businessName, formData.location]);

  const generateCartId = (businessName: string, location: string): string => {
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
  };

  const checkCartIdAvailability = async (cartId: string) => {
    if (!cartId) {
      setCartIdError('');
      return;
    }

    try {
      const cartsSnapshot = await getDocs(collection(db, 'carts'));
      const exists = cartsSnapshot.docs.some((doc) => doc.data().cartId === cartId);

      if (exists) {
        setCartIdError('⚠️ A cart with this ID already exists');
      } else {
        setCartIdError('');
      }
    } catch (error) {
      console.error('Error checking cart ID:', error);
    }
  };

  const loadCarts = async () => {
    try {
      const cartsSnapshot = await getDocs(collection(db, 'carts'));
      const cartsData: Cart[] = [];

      cartsSnapshot.forEach((doc) => {
        const data = doc.data();
        cartsData.push({
          id: doc.id,
          businessName: data.businessName,
          location: data.location,
          displayName: data.displayName,
          cartId: data.cartId,
          createdAt: data.createdAt?.toDate(),
          createdBy: data.createdBy,
          active: data.active ?? true,
        });
      });

      cartsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setCarts(cartsData);
    } catch (error) {
      console.error('Error loading carts:', error);
      alert('Failed to load carts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCart = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName.trim() || !formData.location.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (cartIdError) {
      alert('Please fix the errors before creating the cart');
      return;
    }

    setSubmitting(true);

    try {
      const cartId = cartIdPreview;
      const displayName = `${formData.businessName} ${formData.location}`;
      const currentUser = auth.currentUser;

      await addDoc(collection(db, 'carts'), {
        businessName: formData.businessName,
        location: formData.location,
        displayName: displayName,
        cartId: cartId,
        createdAt: Timestamp.now(),
        createdBy: currentUser?.email || 'admin',
        active: true,
      });

      alert('Cart created successfully!');
      setShowCreateModal(false);
      setFormData({ businessName: '', location: '' });
      loadCarts();
    } catch (error) {
      console.error('Error creating cart:', error);
      alert('Failed to create cart');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCart = async (cartId: string, cartName: string) => {
    if (!confirm(`Are you sure you want to delete "${cartName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'carts', cartId));
      alert('Cart deleted successfully');
      loadCarts();
    } catch (error) {
      console.error('Error deleting cart:', error);
      alert('Failed to delete cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading carts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        title="Manage Carts"
        subtitle={`${carts.length} cart${carts.length !== 1 ? 's' : ''} total`}
        actionButton={{
          text: 'Cart',
          onClick: () => setShowCreateModal(true),
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Carts List */}
        {carts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No carts</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new cart.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                + Create New Cart
              </button>
            </div>
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
        submitting={submitting}
        cartIdPreview={cartIdPreview}
        cartIdError={cartIdError}
      />
    </div>
  );
}