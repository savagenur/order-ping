export interface Cart {
  id: string;          // Firestore document ID
  businessName: string;
  location: string;
  displayName: string; // Имя, которое видят клиенты в очереди
  cartId: string;      // Уникальный "slug" для URL (например, 'pcc-tacos')
  
  // Добавь это:
  settings: {
    instagramHandle?: string;
    googleMapsLink?: string;
    websiteUrl?: string;
  };
  
  createdAt: Date;
  createdBy: string;
  active: boolean;
}

export interface CartInput {
  businessName: string;
  location: string;
  displayName: string;
  settings: {
    instagramHandle?: string;
    googleMapsLink?: string;
    websiteUrl?: string;
  };
}

export interface Worker {
  uid: string;
  email: string;
  workerName: string;
  cartId: string;
  cartName: string;
  role: 'admin' | 'worker';
  createdAt: Date;
  active: boolean;
}

export interface WorkerInput {
  email: string;
  password: string;
  workerName: string;
  cartId: string;
  cartName: string;
  role: 'admin' | 'worker'; // Определяет уровень доступа
}