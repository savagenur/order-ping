import { Timestamp } from 'firebase/firestore';

export interface Order {
  id: string;
  orderNumber: number | string; // Support both numeric and alphanumeric (Square payments)
  customerName: string;
  phoneNumber: string;
  orderDetails?: string;
  color?: string;
  status: 'pending' | 'ready' | 'completed' | 'declined' | 'expired';
  cartId: string;
  cartName: string;
  source?: 'manual' | 'square'; // Track order source
  paymentId?: string; // Square payment ID
  amount?: number; // Payment amount in cents
  paymentStatus?: string; // Raw payment status from Square (UPPERCASE: FAILED, CANCELED, COMPLETED, etc.)
  expireAt?: Date | Timestamp; // TTL field for auto-deletion of declined orders
  userId?: string;
  selectedUserIds?: string[]; // Track all users who selected/pinned this order
  createdAt: Date | Timestamp;
  readyAt?: Date | Timestamp;
  completedAt?: Date | Timestamp;
  completedBy?: string;
  // New multi-subscriber fields
  notificationSubscribers?: NotificationSubscriber[];
  isSubscribed?: boolean;
  subscribedCount?: number;
  // Legacy field for backward compatibility
  notificationToken?: string;
  subscribedAt?: Date | Timestamp;
}

export interface NotificationSubscriber {
  fcmToken: string;
  subscribedAt: Date | Timestamp;
  subscribedBy?: string;
}

export interface OrderInput {
  customerName: string;
  phoneNumber: string;
  orderDetails?: string;
}

export interface Cart {
  id: string;
  name: string;
  displayName: string;
}