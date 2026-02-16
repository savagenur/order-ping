import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase'; 

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