import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  query,
  where,
  getCountFromServer,
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
  weekOrders?: number;
  monthOrders?: number;
  activeOrders?: number;
}

const ADMIN_STATS_CACHE_KEY = 'admin_stats_cache_v1';
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

function getCachedAdminStats(): AdminStats | null {
  try {
    const cached = localStorage.getItem(ADMIN_STATS_CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_DURATION) {
      return data;
    }
    
    localStorage.removeItem(ADMIN_STATS_CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

function setCachedAdminStats(data: AdminStats) {
  try {
    localStorage.setItem(ADMIN_STATS_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

async function fetchAdminStats(): Promise<AdminStats> {
  const cached = getCachedAdminStats();
  if (cached) {
    return cached;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = Timestamp.fromDate(today);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekTimestamp = Timestamp.fromDate(weekAgo);

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthTimestamp = Timestamp.fromDate(monthAgo);

  const [cartsCount, workersCount, ordersCount, todayOrdersCount, weekOrdersCount, monthOrdersCount, activeOrdersCount] = await Promise.all([
    getCountFromServer(query(collection(db, 'carts'), where('active', '==', true))),
    getCountFromServer(query(collection(db, 'workers'), where('active', '==', true))),
    getCountFromServer(collection(db, 'orders')),
    getCountFromServer(query(collection(db, 'orders'), where('createdAt', '>=', todayTimestamp))),
    getCountFromServer(query(collection(db, 'orders'), where('createdAt', '>=', weekTimestamp))),
    getCountFromServer(query(collection(db, 'orders'), where('createdAt', '>=', monthTimestamp))),
    getCountFromServer(query(collection(db, 'orders'), where('status', 'in', ['pending', 'ready']))),
  ]);

  const stats = {
    totalCarts: cartsCount.data().count,
    totalWorkers: workersCount.data().count,
    totalOrders: ordersCount.data().count,
    todayOrders: todayOrdersCount.data().count,
    weekOrders: weekOrdersCount.data().count,
    monthOrders: monthOrdersCount.data().count,
    activeOrders: activeOrdersCount.data().count,
  };

  setCachedAdminStats(stats);
  return stats;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    staleTime: CACHE_DURATION,
    gcTime: 1000 * 60 * 10,
  });
}

// ─── Role-based filtered queries ────────────────────────────────────────────────

async function fetchFilteredCarts(cartId: string | null, isSuperAdmin: boolean): Promise<Cart[]> {
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
  
  // Filter based on role: superadmin sees all, admin sees only their carts
  const filteredCarts = isSuperAdmin ? carts : carts.filter(cart => cart.cartId === cartId);
  filteredCarts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return filteredCarts;
}

async function fetchFilteredWorkers(cartId: string | null, isSuperAdmin: boolean): Promise<Worker[]> {
  const workersSnapshot = await getDocs(collection(db, 'workers'));
  const workers: Worker[] = workersSnapshot.docs.map((d) => {
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
  
  // Filter based on role: superadmin sees all, admin sees only their workers
  const filteredWorkers = isSuperAdmin ? workers : workers.filter(worker => worker.cartId === cartId);
  return filteredWorkers;
}

function getRoleBasedCacheKey(cartId: string | null, isSuperAdmin: boolean): string {
  return `role_stats_cache_v1_${isSuperAdmin ? 'super' : cartId}`;
}

function getCachedRoleStats(cartId: string | null, isSuperAdmin: boolean): AdminStats | null {
  try {
    const cacheKey = getRoleBasedCacheKey(cartId, isSuperAdmin);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_DURATION) {
      return data;
    }
    
    localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

function setCachedRoleStats(cartId: string | null, isSuperAdmin: boolean, data: AdminStats) {
  try {
    const cacheKey = getRoleBasedCacheKey(cartId, isSuperAdmin);
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

async function fetchFilteredStats(cartId: string | null, isSuperAdmin: boolean): Promise<AdminStats> {
  const cached = getCachedRoleStats(cartId, isSuperAdmin);
  if (cached) {
    return cached;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = Timestamp.fromDate(today);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekTimestamp = Timestamp.fromDate(weekAgo);

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthTimestamp = Timestamp.fromDate(monthAgo);

  let stats: AdminStats;

  if (isSuperAdmin) {
    const [cartsCount, workersCount, ordersCount, todayOrdersCount, weekOrdersCount, monthOrdersCount, activeOrdersCount] = await Promise.all([
      getCountFromServer(query(collection(db, 'carts'), where('active', '==', true))),
      getCountFromServer(query(collection(db, 'workers'), where('active', '==', true))),
      getCountFromServer(collection(db, 'orders')),
      getCountFromServer(query(collection(db, 'orders'), where('createdAt', '>=', todayTimestamp))),
      getCountFromServer(query(collection(db, 'orders'), where('createdAt', '>=', weekTimestamp))),
      getCountFromServer(query(collection(db, 'orders'), where('createdAt', '>=', monthTimestamp))),
      getCountFromServer(query(collection(db, 'orders'), where('status', 'in', ['pending', 'ready']))),
    ]);

    stats = {
      totalCarts: cartsCount.data().count,
      totalWorkers: workersCount.data().count,
      totalOrders: ordersCount.data().count,
      todayOrders: todayOrdersCount.data().count,
      weekOrders: weekOrdersCount.data().count,
      monthOrders: monthOrdersCount.data().count,
      activeOrders: activeOrdersCount.data().count,
    };
  } else {
    const [workersCount, ordersCount, todayOrdersCount, weekOrdersCount, monthOrdersCount, activeOrdersCount] = await Promise.all([
      getCountFromServer(query(collection(db, 'workers'), where('active', '==', true), where('cartId', '==', cartId))),
      getCountFromServer(query(collection(db, 'orders'), where('cartId', '==', cartId))),
      getCountFromServer(query(collection(db, 'orders'), where('cartId', '==', cartId), where('createdAt', '>=', todayTimestamp))),
      getCountFromServer(query(collection(db, 'orders'), where('cartId', '==', cartId), where('createdAt', '>=', weekTimestamp))),
      getCountFromServer(query(collection(db, 'orders'), where('cartId', '==', cartId), where('createdAt', '>=', monthTimestamp))),
      getCountFromServer(query(collection(db, 'orders'), where('cartId', '==', cartId), where('status', 'in', ['pending', 'ready']))),
    ]);

    stats = {
      totalCarts: 1,
      totalWorkers: workersCount.data().count,
      totalOrders: ordersCount.data().count,
      todayOrders: todayOrdersCount.data().count,
      weekOrders: weekOrdersCount.data().count,
      monthOrders: monthOrdersCount.data().count,
      activeOrders: activeOrdersCount.data().count,
    };
  }

  setCachedRoleStats(cartId, isSuperAdmin, stats);
  return stats;
}

export function useRoleBasedCarts(cartId: string | null, isSuperAdmin: boolean) {
  return useQuery({
    queryKey: ['role-based-carts', cartId, isSuperAdmin],
    queryFn: () => fetchFilteredCarts(cartId, isSuperAdmin),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!cartId || isSuperAdmin,
  });
}

export function useRoleBasedWorkers(cartId: string | null, isSuperAdmin: boolean) {
  return useQuery({
    queryKey: ['role-based-workers', cartId, isSuperAdmin],
    queryFn: () => fetchFilteredWorkers(cartId, isSuperAdmin),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!cartId || isSuperAdmin,
  });
}

export function useRoleBasedStats(cartId: string | null, isSuperAdmin: boolean) {
  return useQuery({
    queryKey: ['role-based-stats', cartId, isSuperAdmin],
    queryFn: () => fetchFilteredStats(cartId, isSuperAdmin),
    staleTime: CACHE_DURATION,
    gcTime: 1000 * 60 * 10,
    enabled: !!cartId || isSuperAdmin,
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
    gcTime: 1000 * 60 * 10,
  });
}

export function useCreateCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { businessName: string; location: string; cartId: string; displayName: string; settings?: { instagramHandle?: string; placeId?: string; websiteUrl?: string; } }) => {
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
      queryClient.invalidateQueries({ queryKey: ['role-based-carts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-carts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['role-based-stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['role-based-carts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-carts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['role-based-stats'] });
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
    gcTime: 1000 * 60 * 10,
  });
}

interface CreateWorkerResponse {
  success: boolean;
  uid: string;
  email: string;
  password: string;
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
      role: 'admin' | 'worker' | 'superadmin';
    }) => {
      const createWorkerFunction = httpsCallable(functions, 'createWorker');
      const result = await createWorkerFunction({
        email: input.email,
        password: input.password,
        workerName: input.workerName,
        cartId: input.cartId,
        cartName: input.cartName,
        role: input.role,
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
      queryClient.invalidateQueries({ queryKey: ['role-based-workers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-workers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['role-based-stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['role-based-workers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-workers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['role-based-stats'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

// ─── Update Worker (Safe Mode) ───────────────────────────────────────────────────

interface UpdateWorkerData {
  role?: 'admin' | 'worker' | 'superadmin';
  workerName?: string;
  cartId?: string;
  cartName?: string;
  active?: boolean;
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workerId, data }: { workerId: string; data: UpdateWorkerData }) => {
      // Only allow updating safe fields - uid and email are excluded
      const updateData: {
        role?: 'admin' | 'worker' | 'superadmin';
        workerName?: string;
        cartId?: string;
        cartName?: string;
        active?: boolean;
      } = {};
      
      if (data.role !== undefined) updateData.role = data.role;
      if (data.workerName !== undefined) updateData.workerName = data.workerName;
      if (data.cartId !== undefined) updateData.cartId = data.cartId;
      if (data.cartName !== undefined) updateData.cartName = data.cartName;
      if (data.active !== undefined) updateData.active = data.active;

      await updateDoc(doc(db, 'workers', workerId), updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-based-workers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-workers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['role-based-stats'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

// ─── Update Cart (Safe Mode) ─────────────────────────────────────────────────────

interface UpdateCartData {
  businessName?: string;
  location?: string;
  displayName?: string;
  settings?: {
    instagramHandle?: string;
    placeId?: string;
    websiteUrl?: string;
  };
  active?: boolean;
}

export function useUpdateCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId: docId, data }: { cartId: string; data: UpdateCartData }) => {
      // Only allow updating safe fields - cartId is excluded
      const updateData: {
        businessName?: string;
        location?: string;
        displayName?: string;
        settings?: {
          instagramHandle?: string;
          placeId?: string;
          websiteUrl?: string;
        };
        active?: boolean;
      } = {};
      
      if (data.businessName !== undefined) updateData.businessName = data.businessName;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.displayName !== undefined) updateData.displayName = data.displayName;
      if (data.settings !== undefined) updateData.settings = data.settings;
      if (data.active !== undefined) updateData.active = data.active;

      await updateDoc(doc(db, 'carts', docId), updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-based-carts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-carts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['role-based-stats'] });
    },
  });
}
