import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Link } from 'react-router-dom';
import { db,functions } from '../lib/firebase';
import type { Worker, WorkerInput } from '../types/admin';
import type { Cart } from '../types/admin';

interface CreateWorkerResponse {
  success: boolean;
  uid: string;
  error?: string;
}

export default function AdminWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<WorkerInput>({
    email: '',
    password: '',
    cartId: '',
    cartName: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load carts
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
      setCarts(cartsData.filter((cart) => cart.active));

      // Load workers
      const workersSnapshot = await getDocs(collection(db, 'workers'));
      const workersData: Worker[] = [];
      workersSnapshot.forEach((doc) => {
        const data = doc.data();
        workersData.push({
          uid: doc.id,
          email: data.email,
          cartId: data.cartId,
          cartName: data.cartName,
          createdAt: data.createdAt?.toDate(),
          active: data.active ?? true,
        });
      });
      setWorkers(workersData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.cartId) {
      alert('Please fill in all fields');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      // Call Cloud Function to create worker
      const createWorkerFunction = httpsCallable(functions, 'createWorker');
      const result = await createWorkerFunction({
        email: formData.email,
        password: formData.password,
        cartId: formData.cartId,
        cartName: formData.cartName,
      });

      const data = result.data as CreateWorkerResponse;

      if (data.success) {
        // Add worker to Firestore
        await addDoc(collection(db, 'workers'), {
          uid: data.uid,
          email: formData.email,
          cartId: formData.cartId,
          cartName: formData.cartName,
          createdAt: Timestamp.now(),
          active: true,
        });

        alert(`Worker created successfully!\n\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nShare these credentials with the worker.`);
        setShowCreateModal(false);
        setFormData({ email: '', password: '', cartId: '', cartName: '' });
        loadData();
      } else {
        throw new Error(data.error || 'Failed to create worker');
      }
    } catch (error: unknown) {
      console.error('Error creating worker:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to create worker: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCartSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCartId = e.target.value;
    const selectedCart = carts.find((cart) => cart.cartId === selectedCartId);

    setFormData({
      ...formData,
      cartId: selectedCartId,
      cartName: selectedCart?.displayName || '',
    });
  };

  const handleDeleteWorker = async (workerId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete worker "${email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'workers', workerId));
      alert('Worker deleted from database. Note: Firebase Auth account still exists.');
      loadData();
    } catch (error) {
      console.error('Error deleting worker:', error);
      alert('Failed to delete worker');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading workers...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Manage Workers</h1>
              <p className="text-sm text-gray-600">{workers.length} worker{workers.length !== 1 ? 's' : ''} total</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={carts.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              + Create New Worker
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {carts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No carts available</h3>
            <p className="mt-1 text-sm text-gray-500">Create a cart first before adding workers.</p>
            <div className="mt-6">
              <Link
                to="/admin/carts"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition inline-block"
              >
                Go to Carts
              </Link>
            </div>
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No workers</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a worker account.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                + Create New Worker
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                      <button
                        onClick={() => handleDeleteWorker(worker.uid, worker.email)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Worker Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create New Worker</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  onChange={handleCartSelect}
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
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? 'Creating...' : 'Create Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}