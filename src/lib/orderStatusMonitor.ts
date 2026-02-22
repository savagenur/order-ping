// DEPRECATED: Client-side notification monitoring removed
// All notifications are now handled by the backend Firebase Functions
// This eliminates duplicate notifications and provides better reliability

// This file is kept as a placeholder to prevent import errors
// but all functionality has been moved to backend functions

export class OrderStatusMonitor {
  // Empty class - all functionality moved to backend
  static monitorOrder() {
    console.log('🔔 [MONITOR] Client-side monitoring disabled - using backend only');
    return () => {}; // Return empty cleanup function
  }
  
  static resetNotificationFlag() {
    console.log('🔔 [MONITOR] Reset not needed - backend handles deduplication');
  }
}
