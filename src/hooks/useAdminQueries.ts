import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../lib/firebase';
import type { Cart, Worker } from '../types/admin';

// ─── Admin Dashboard Stats ───────────────────────────────────────────────────

interface AdminStats {
  totalCarts: number;
  totalWorkers: number;
  totalOrders: number;
  todayOrders: number;
}

async function fetchAdminStats(): Promise<AdminStats> {
  const [cartsSnapshot, workersSnapshot, ordersSnapshot] = await Promise.all([
    getDocs(collection(db, 'carts')),
    getDocs(collection(db, 'workers')),
    getDocs(collection(db, 'orders')),
  ]);

  const activeCarts = cartsSnapshot.docs.filter((d) => d.data().active !== false);
  const activeWorkers = workersSnapshot.docs.filter((d) => d.data().active !== false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayCount = 0;
  ordersSnapshot.forEach((d) => {
    const createdAt = d.data().createdAt?.toDate();
    if (createdAt && createdAt >= today) todayCount++;
  });

  return {
    totalCarts: activeCarts.length,
    totalWorkers: activeWorkers.length,
    totalOrders: ordersSnapshot.size,
    todayOrders: todayCount,
  };
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    staleTime: 1000 * 60 * 2,
  });
}

// ─── Admin Carts ─────────────────────────────────────────────────────────────

async function fetchCarts(): Promise<Cart[]> {
  const cartsSnapshot = await getDocs(collection(db, 'carts'));
  const carts: Cart[] = cartsSnapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      businessName: data.businessName,
      location: data.location,
      displayName: data.displayName,
      cartId: data.cartId,
      settings: data.settings || {},
      createdAt: data.createdAt?.toDate(),
      createdBy: data.createdBy,
      active: data.active ?? true,
    };
  });
  carts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return carts;
}

export function useAdminCarts() {
  return useQuery({
    queryKey: ['admin-carts'],
    queryFn: fetchCarts,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { businessName: string; location: string; cartId: string; displayName: string; settings?: { instagramHandle?: string; googleMapsLink?: string; websiteUrl?: string; } }) => {
      const currentUser = auth.currentUser;
      await addDoc(collection(db, 'carts'), {
        businessName: input.businessName,
        location: input.location,
        displayName: input.displayName,
        cartId: input.cartId,
        settings: input.settings || {},
        createdAt: Timestamp.now(),
        createdBy: currentUser?.email || 'admin',
        active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-carts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useDeleteCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartDocId: string) => {
      await deleteDoc(doc(db, 'carts', cartDocId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-carts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

// ─── Admin Workers ───────────────────────────────────────────────────────────

async function fetchAdminWorkers(): Promise<Worker[]> {
  const workersSnapshot = await getDocs(collection(db, 'workers'));
  return workersSnapshot.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      email: data.email,
      workerName: data.workerName || '',
      cartId: data.cartId,
      cartName: data.cartName,
      role: data.role || 'worker',
      createdAt: data.createdAt?.toDate(),
      active: data.active ?? true,
    };
  });
}

export function useAdminWorkers() {
  return useQuery({
    queryKey: ['admin-workers'],
    queryFn: fetchAdminWorkers,
    staleTime: 1000 * 60 * 5,
  });
}

interface CreateWorkerResponse {
  success: boolean;
  uid: string;
  error?: string;
}

export function useCreateWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      email: string;
      password: string;
      workerName: string;
      cartId: string;
      cartName: string;
      role: 'admin' | 'worker';
    }) => {
      const createWorkerFunction = httpsCallable(functions, 'createWorker');
      const result = await createWorkerFunction({
        email: input.email,
        password: input.password,
        workerName: input.workerName,
        cartId: input.cartId,
        cartName: input.cartName,
      });

      const data = result.data as CreateWorkerResponse;

      if (!data.success) {
        throw new Error(data.error || 'Failed to create worker');
      }

      // Add worker to Firestore
      await addDoc(collection(db, 'workers'), {
        uid: data.uid,
        email: input.email,
        workerName: input.workerName,
        cartId: input.cartId,
        cartName: input.cartName,
        role: input.role,
        createdAt: Timestamp.now(),
        active: true,
      });

      return { uid: data.uid, email: input.email, password: input.password };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useDeleteWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workerDocId: string) => {
      await deleteDoc(doc(db, 'workers', workerDocId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}
