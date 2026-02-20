import { Timestamp } from 'firebase/firestore';

export interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  phoneNumber: string;
  orderDetails?: string;
  color?: string;
  status: 'pending' | 'ready' | 'completed';
  cartId: string;
  cartName: string;
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