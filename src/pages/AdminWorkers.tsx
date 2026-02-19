import { useState, useMemo } from 'react';
import type { WorkerInput } from '../types/admin';
import { useRoleBasedCarts, useRoleBasedWorkers, useCreateWorker, useDeleteWorker } from '../hooks/useAdminQueries';
import { useAuthStore } from '../stores/authStore';
import { Plus } from 'lucide-react';
import AdminHeader from '../components/admin/AdminHeader';
import WorkersTable from '../components/admin/WorkersTable';
import CreateWorkerModal from '../components/admin/CreateWorkerModal';
import DeleteWorkerModal from '../components/admin/DeleteWorkerModal';

export default function AdminWorkers() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<{id: string, email: string} | null>(null);
  const { cartId, isSuperAdmin, role } = useAuthStore();
  const [formData, setFormData] = useState<WorkerInput>({
    email: '',
    password: '',
    workerName: '',
    cartId: '',
    cartName: '',
    role: 'worker',
  });

  // TanStack Query - role-based cached data
  const { data: allCarts = [], isLoading: cartsLoading } = useRoleBasedCarts(cartId, isSuperAdmin);
  const { data: workers = [], isLoading: workersLoading } = useRoleBasedWorkers(cartId, isSuperAdmin);
  const createWorker = useCreateWorker();
  const deleteWorker = useDeleteWorker();

  // Only active carts for the dropdown
  const carts = useMemo(() => allCarts.filter((cart) => cart.active), [allCarts]);

  const loading = cartsLoading || workersLoading;

  // Redirect workers away from admin pages
  if (role === 'worker') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Workers cannot access admin management pages.</p>
        </div>
      </div>
    );
  }

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

    // Restrict role: Admin users can only create workers
    const workerRole = isSuperAdmin ? formData.role : 'worker';

    try {
      const result = await createWorker.mutateAsync({
        email: formData.email,
        password: formData.password,
        workerName: formData.workerName,
        cartId: formData.cartId,
        cartName: formData.cartName,
        role: workerRole,
      });

      alert(`Worker created successfully!\n\nEmail: ${result.email}\nPassword: ${result.password}\n\nShare these credentials with the worker.`);
      setShowCreateModal(false);
      setFormData({ 
        email: '', 
        password: '', 
        workerName: '', 
        cartId: '', 
        cartName: '',
        role: 'worker',
      });
    } catch (error: unknown) {
      console.error('Error creating worker:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to create worker: ${message}`);
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
    setWorkerToDelete({ id: workerId, email });
    setShowDeleteModal(true);
  };

  const confirmDeleteWorker = async () => {
    if (!workerToDelete) return;

    try {
      await deleteWorker.mutateAsync(workerToDelete.id);
      alert('Worker deleted from database. Note: Firebase Auth account still exists.');
    } catch (error) {
      console.error('Error deleting worker:', error);
      alert('Failed to delete worker');
    } finally {
      setShowDeleteModal(false);
      setWorkerToDelete(null);
    }
  };

  const cancelDeleteWorker = () => {
    setShowDeleteModal(false);
    setWorkerToDelete(null);
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
      <AdminHeader
        title="Manage Workers"
        subtitle={`${workers.length} worker${workers.length !== 1 ? 's' : ''} total`}
        actionButton={{
          text: 'Worker',
          onClick: () => setShowCreateModal(true),
          disabled: carts.length === 0,
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {carts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No carts available</h3>
            <p className="mt-1 text-sm text-gray-500">Create a cart first before adding workers.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Go to Carts
              </button>
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
          <WorkersTable
            workers={workers}
            onDelete={handleDeleteWorker}
          />
        )}
      </div>

      <CreateWorkerModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateWorker}
        formData={formData}
        onChange={setFormData}
        submitting={createWorker.isPending}
        carts={carts}
        onCartSelect={handleCartSelect}
      />

      <DeleteWorkerModal
        show={showDeleteModal}
        workerEmail={workerToDelete?.email || ''}
        onConfirm={confirmDeleteWorker}
        onCancel={cancelDeleteWorker}
      />
    </div>
  );
}