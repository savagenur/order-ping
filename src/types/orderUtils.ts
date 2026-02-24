import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase'; 

/**
 * Get the highest order number for today (most recent in sequence)
 * @param cartId - The cart ID to get order number for
 * @returns The highest order number (0 if no orders exist)
 */
export async function getLastCreatedOrderNumber(cartId: string): Promise<number> {
  try {
    // Get start and end of today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Query orders created today for this cart, ordered by order number (highest first), limit to 1
    const q = query(
      collection(db, 'orders'),
      where('cartId', '==', cartId),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
      where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('orderNumber', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    
    // Get the most recent order (first in the ordered results)
    if (!snapshot.empty) {
      const lastOrder = snapshot.docs[0].data();
      return lastOrder.orderNumber || 0;
    }

    return 0;
  } catch (error) {
    console.error('Error getting last created order number:', error);
    return 0;
  }
}

/**
 * Get the last order number for today (highest existing order number)
 * @param cartId - The cart ID to get order number for
 * @returns The last order number (0 if no orders exist)
 */
export async function getLastOrderNumber(cartId: string): Promise<number> {
  try {
    // Get start and end of today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Query orders created today for this cart
    const q = query(
      collection(db, 'orders'),
      where('cartId', '==', cartId),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
      where('createdAt', '<=', Timestamp.fromDate(endOfDay))
    );

    const snapshot = await getDocs(q);
    
    // Find highest order number
    let maxOrderNumber = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.orderNumber && data.orderNumber > maxOrderNumber) {
        maxOrderNumber = data.orderNumber;
      }
    });

    // Return last number (0 if no orders exist)
    return maxOrderNumber;
  } catch (error) {
    console.error('Error getting last order number:', error);
    return 0;
  }
}

/**
 * Get the next order number for today (resets daily)
 * @param cartId - The cart ID to get order number for
 * @returns The next order number (1, 2, 3, etc.)
 */
export async function getNextOrderNumber(cartId: string): Promise<number> {
  try {
    // Get start and end of today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Query orders created today for this cart
    const q = query(
      collection(db, 'orders'),
      where('cartId', '==', cartId),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
      where('createdAt', '<=', Timestamp.fromDate(endOfDay))
    );

    const snapshot = await getDocs(q);
    
    // Find highest order number
    let maxOrderNumber = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.orderNumber && data.orderNumber > maxOrderNumber) {
        maxOrderNumber = data.orderNumber;
      }
    });

    // Return next number
    return maxOrderNumber + 1;
  } catch (error) {
    console.error('Error getting next order number:', error);
    // Fallback to timestamp-based number if error
    return Math.floor(Date.now() / 1000) % 1000;
  }
}