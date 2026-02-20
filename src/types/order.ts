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
  notificationToken?: string;
  isSubscribed?: boolean;
  subscribedAt?: Date | Timestamp;
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