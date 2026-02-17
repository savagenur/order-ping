export interface Cart {
  id: string;
  businessName: string;
  location: string;
  displayName: string;
  cartId: string;
  createdAt: Date;
  createdBy: string;
  active: boolean;
}

export interface CartInput {
  businessName: string;
  location: string;
}

export interface Worker {
  uid: string;
  email: string;
  cartId: string;
  cartName: string;
  createdAt: Date;
  active: boolean;
}

export interface WorkerInput {
  email: string;
  password: string;
  cartId: string;
  cartName: string;
}