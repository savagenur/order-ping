import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import type { Cart, CartInput } from '../types/admin';

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
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link to="/admin/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Manage Carts</h1>
              <p className="text-sm text-gray-600">{carts.length} cart{carts.length !== 1 ? 's' : ''} total</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              + Create New Cart
            </button>
          </div>
        </div>
      </div>

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
              <div key={cart.id} className="bg-white rounded-lg shadow p-6">
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
                    onClick={() => handleDeleteCart(cart.id, cart.displayName)}
                    className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-4">
                  Created {cart.createdAt.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Cart Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create New Cart</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCart} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Taco King"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Downtown"
                />
              </div>

              {cartIdPreview && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500 mb-1">Auto-generated Cart ID:</p>
                  <p className={`text-sm font-mono ${cartIdError ? 'text-red-600' : 'text-green-600'}`}>
                    {cartIdPreview}
                  </p>
                  {cartIdError && (
                    <p className="text-xs text-red-600 mt-1">{cartIdError}</p>
                  )}
                  {!cartIdError && cartIdPreview && (
                    <p className="text-xs text-green-600 mt-1">✓ Available</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Display Name: {formData.businessName} {formData.location}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !!cartIdError || !cartIdPreview}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? 'Creating...' : 'Create Cart'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}