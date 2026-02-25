# Multi-Cart Order Tracking Implementation

## Overview
Implemented a persistent multi-order tracking system that allows users to track orders from multiple carts simultaneously using their local user ID (stored in localStorage).

## Key Features

### 1. **Persistent User Schema in Firestore**
- **Collection**: `users/{localUserId}`
- **New Field**: `trackedOrderIds: string[]`
- Stores an array of order IDs the user is actively tracking
- Syncs in real-time across all devices/tabs for the same user

### 2. **Zustand Store for Tracked Orders**
- **File**: `src/stores/trackedOrdersStore.ts`
- Manages tracked order IDs and their real-time data
- Uses Firestore `onSnapshot` with `where(documentId(), 'in', trackedOrderIds)` query
- Handles empty array case (Firestore throws error if 'in' array is empty)
- Supports batching for up to 30+ orders (Firestore 'in' limit is 10 per query)

### 3. **Real-time Multi-Order Listener**
- Subscribes to all tracked orders simultaneously
- Updates when any tracked order changes status (pending → ready → completed)
- Automatically filters out completed orders from display
- Handles batch queries for scalability

### 4. **Active Tracking Header (Queue Page)**
- **File**: `src/components/queue/ActiveTracking.tsx`
- **Location**: Pinned at top of Queue page
- **Features**:
  - Displays all tracked orders from `trackedOrderIds` array
  - Groups orders by cart name when tracking multiple carts
  - Shows order status (Preparing/Ready) with color coding
  - Displays order number, customer name, cart name, and color badge
  - Click to navigate to the order's cart
  - Persists across cart switches
  - Animated transitions using Framer Motion
  - Replaces single "My Order" pinned section

### 5. **MiniTracker Component (Global)**
- **File**: `src/components/MiniTracker.tsx`
- **Location**: Fixed/sticky at bottom of screen (global)
- **Features**:
  - Collapsible view (collapsed shows summary, expanded shows all orders)
  - Groups orders by cart name
  - Shows order status (Preparing/Ready) with color coding
  - Displays order number, customer name, and color badge
  - Remove button to stop tracking individual orders
  - Animated transitions using Framer Motion
  - Visible across all pages (except dashboard/admin)

### 6. **Multi-Cart Navigation**
- When user scans new QR code (`?cart=new-cart-id`):
  - App switches active menu view to new cart
  - **Does NOT stop tracking** orders from previous cart
  - Active Tracking header and MiniTracker continue to show all tracked orders
  - Click tracked order in Active Tracking to navigate to its cart

### 7. **Automatic Cleanup**
- Orders marked as "completed" are automatically removed from `trackedOrderIds`
- Cleanup happens in real-time via the store's `onSnapshot` listener
- User can also manually remove orders via MiniTracker

### 8. **User Sync Integration**
- **File**: `src/lib/userSync.ts`
  - Added `addTrackedOrder(userId, orderId)` function
  - Added `removeTrackedOrder(userId, orderId)` function
  - Updated `subscribeUserDoc` to fire `onTrackedOrdersChanged` callback
  - Updated `UserDoc` interface to include `trackedOrderIds?: string[]`

- **File**: `src/hooks/useUserSync.ts`
  - Added `onTrackedOrdersChanged` callback support
  - Real-time sync of tracked orders across devices

### 9. **Queue Page Integration**
- **File**: `src/pages/Queue.tsx`
- **Active Tracking Header**: Replaces single "My Order" pinned section
  - Displays all tracked orders at top of page
  - Groups by cart when tracking multiple carts
  - Click to navigate to order's cart
  - Persists across cart switches
- When user clicks an order card:
  - Order is added to `trackedOrderIds` array in Firestore
  - Order appears in Active Tracking header
  - Notifications can be enabled for the order
  - User can track multiple orders from different carts
- Tracked orders are filtered out of Ready/Pending sections to avoid duplication

### 10. **App-Level Integration**
- **File**: `src/App.tsx`
- MiniTracker rendered at app level for global visibility
- Hidden on dashboard, admin, login, and profile pages
- Visible on queue and public pages
- Handles tracked order changes from Firestore
- Provides remove functionality

### 11. **Firestore Security Rules**
- **File**: `firestore.rules`
- Updated to allow `trackedOrderIds` field in users collection
- Maintains open read/write for anonymous users

## Technical Implementation Details

### Data Flow
1. User clicks order on Queue page
2. `addTrackedOrder(userId, orderId)` called
3. Firestore updates `users/{userId}` with new order ID in `trackedOrderIds` array
4. `useUserSync` hook detects change via `onSnapshot`
5. `onTrackedOrdersChanged` callback fires in App.tsx
6. `trackedOrdersStore.setTrackedOrderIds()` updates store
7. Store subscribes to all tracked orders via Firestore query
8. MiniTracker displays all tracked orders in real-time

### Empty Array Handling
```typescript
// Firestore throws error if 'in' array is empty
if (orderIds.length === 0) {
  set({ trackedOrders: [], isLoading: false });
  return;
}
```

### Batch Query Support
```typescript
// Firestore 'in' query supports max 10 items
// We batch into groups of 10 for scalability
const batchSize = 10;
const batches: string[][] = [];
for (let i = 0; i < orderIds.length; i += batchSize) {
  batches.push(orderIds.slice(i, i + batchSize));
}
```

### Auto-Cleanup Logic
```typescript
// Remove completed orders automatically
const completedOrderIds = orders
  .filter(o => o.status === 'completed')
  .map(o => o.id);

if (completedOrderIds.length > 0) {
  completedOrderIds.forEach(orderId => {
    removeTrackedOrder(userId, orderId);
  });
}
```

## Files Created/Modified

### Created
- `src/stores/trackedOrdersStore.ts` - Multi-order tracking store
- `src/components/MiniTracker.tsx` - Bottom sticky tracker component
- `MULTI_CART_TRACKING.md` - This documentation

### Modified
- `src/lib/userSync.ts` - Added tracked orders functions
- `src/hooks/useUserSync.ts` - Added tracked orders callback
- `src/App.tsx` - Integrated MiniTracker and tracking logic
- `src/pages/Queue.tsx` - Added tracking on order click
- `firestore.rules` - Added trackedOrderIds to allowed fields

## Usage

### For Users
1. Scan QR code for Cart A, select an order to track
2. Scan QR code for Cart B, select another order to track
3. MiniTracker shows both orders at bottom of screen
4. Switch between carts - all tracked orders remain visible
5. When order is ready, status updates in MiniTracker
6. When order is completed, it auto-removes from tracker
7. Manually remove orders by clicking X button in MiniTracker

### For Developers
```typescript
// Add order to tracking
await addTrackedOrder(userId, orderId);

// Remove order from tracking
await removeTrackedOrder(userId, orderId);

// Access tracked orders in component
const { trackedOrders } = useTrackedOrdersStore();
```

## Constraints Met
✅ No Firebase Auth - uses `localUserId` from localStorage  
✅ MiniTracker visible across different cart views  
✅ Handles empty array case for Firestore 'in' query  
✅ Real-time updates via `onSnapshot`  
✅ Automatic cleanup of completed orders  
✅ Manual removal via UI  
✅ Multi-cart support maintained  

## Performance Optimizations

### 1. **LocalStorage Cache with TTL**
- **Cache Key**: `orderping_tracked_orders_cache`
- **TTL**: 5 minutes
- Stores tracked orders in localStorage for instant display
- Reduces Firebase reads on page refresh/navigation
- Automatically expires stale data

### 2. **Firestore Persistent Cache**
- Leverages Firestore's built-in persistent cache (configured in `firebase.ts`)
- `onSnapshot` metadata distinguishes cache vs server data
- Skips redundant processing of cached snapshots with pending writes
- Only performs auto-cleanup on server data, not cached data

### 3. **Smart Loading States**
```typescript
// Only show loading if we don't have cached data
const hasCachedData = cached && JSON.stringify(cached.orderIds) === JSON.stringify(orderIds);
set({ isLoading: !hasCachedData });
```
- Instant UI display from cache
- Background refresh from server
- No loading spinner if cache is valid

### 4. **Optimized Auto-Cleanup**
```typescript
// Only cleanup on server data, not cache
if (!isFromCache) {
  const completedOrderIds = orders
    .filter(o => o.status === 'completed')
    .map(o => o.id);
  // Remove from tracking...
}
```
- Prevents duplicate cleanup operations
- Reduces unnecessary Firestore writes

### 5. **Batch Query Optimization**
- Supports up to 30+ tracked orders via batching (10 per batch)
- Combines results efficiently
- Saves to cache only when all batches complete
- Logs cache vs server data for debugging

### 6. **Read Quota Savings**
**Before Optimization:**
- Every page load: Full query to Firestore
- Every navigation: New query
- Estimated: ~10-20 reads per session

**After Optimization:**
- First load: Firestore read (cached by Firestore SDK)
- Subsequent loads: LocalStorage cache (0 reads)
- Real-time updates: Only changed documents
- Estimated: ~2-5 reads per session (60-75% reduction)

### 7. **Cache Invalidation Strategy**
- **Time-based**: 5-minute TTL
- **Event-based**: Cleared when tracked orders list is empty
- **Preserved on unsubscribe**: Faster reload when returning
- **Automatic refresh**: Background sync via `onSnapshot`

## Future Enhancements
- Add notification badges when tracked orders become ready
- Persist expanded/collapsed state of MiniTracker
- Add "Track All" button to track all pending orders at once
- Add order filtering in MiniTracker (show only ready, etc.)
- Add estimated wait time for tracked orders
- Implement service worker caching for offline support
