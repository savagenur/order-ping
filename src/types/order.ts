export interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  phoneNumber: string;
  orderDetails?: string;
  status: 'pending' | 'ready' | 'completed';
  cartId: string;
  cartName: string;
  createdAt: Date;
  readyAt?: Date;
  completedAt?: Date;
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