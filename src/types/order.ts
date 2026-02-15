export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  orderDetails?: string;
  status: 'pending' | 'ready' | 'completed';
  createdAt: Date;
  readyAt?: Date;
  completedAt?: Date;
}

export interface OrderInput {
  customerName: string;
  phoneNumber: string;
  orderDetails?: string;
}