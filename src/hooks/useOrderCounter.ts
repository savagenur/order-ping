import { doc, getDoc, setDoc, increment, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface OrderCounter {
  lastNumericOrder: number;
  updatedAt: Timestamp;
}

export async function getNextOrderNumber(cartId: string): Promise<number> {
  const counterRef = doc(db, 'orderCounters', cartId);
  
  try {
    // Get current counter
    const counterDoc = await getDoc(counterRef);
    
    if (counterDoc.exists()) {
      const counter = counterDoc.data() as OrderCounter;
      const nextNumber = counter.lastNumericOrder + 1;
      
      // Increment counter atomically
      await setDoc(counterRef, {
        lastNumericOrder: nextNumber,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      return nextNumber;
    } else {
      // First time - initialize with 1
      await setDoc(counterRef, {
        lastNumericOrder: 1,
        updatedAt: serverTimestamp(),
      });
      
      return 1;
    }
  } catch (error) {
    console.error('Error getting next order number:', error);
    throw error;
  }
}

export async function getCurrentOrderNumber(cartId: string): Promise<number> {
  const counterRef = doc(db, 'orderCounters', cartId);
  
  try {
    const counterDoc = await getDoc(counterRef);
    
    if (counterDoc.exists()) {
      const counter = counterDoc.data() as OrderCounter;
      return counter.lastNumericOrder;
    } else {
      // No counter yet - initialize with 0
      await setDoc(counterRef, {
        lastNumericOrder: 0,
        updatedAt: serverTimestamp(),
      });
      
      return 0;
    }
  } catch (error) {
    console.error('Error getting current order number:', error);
    throw error;
  }
}

// For use in mutations when creating manual orders
export function incrementOrderCounter(cartId: string) {
  const counterRef = doc(db, 'orderCounters', cartId);
  
  return setDoc(counterRef, {
    lastNumericOrder: increment(1),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
