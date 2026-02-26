# Square Webhook Integration Setup Guide

This guide explains how to integrate Square Terminal payments with OrderPing's queue system.

## Overview

When a customer pays via Square Terminal, a webhook automatically creates an order in your queue with a 3-character alphanumeric code (e.g., `J6X`, `892`).

## Features

- ✅ Automatic order creation from Square payments
- ✅ 3-character alphanumeric order codes (last 3 chars of payment ID)
- ✅ Duplicate prevention for `payment.updated` events
- ✅ Credit card icon (💳) displayed on Square orders in staff dashboard
- ✅ Works seamlessly with existing queue system
- ✅ Customers can track orders using alphanumeric codes

## Setup Instructions

### 1. Deploy the Cloud Function

```bash
cd functions
npm run build
firebase deploy --only functions:handleSquareWebhook
```

After deployment, you'll get a URL like:
```
https://us-west1-your-project.cloudfunctions.net/handleSquareWebhook
```

### 2. Configure Square Webhook

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Select your application
3. Navigate to **Webhooks** section
4. Click **Add Endpoint**
5. Enter your Cloud Function URL
6. Select the following events:
   - `payment.created`
   - `payment.updated`
7. Save the webhook

### 3. Configure Cart Mapping (Important!)

The webhook needs to know which cart (location) to assign orders to. Update the `getCartIdFromLocation` function in `functions/src/squareWebhook.ts`:

```typescript
function getCartIdFromLocation(locationId: string): string {
  // Map Square location IDs to your cart IDs
  const locationMap: Record<string, string> = {
    'YOUR_SQUARE_LOCATION_ID_1': 'cart-id-1',
    'YOUR_SQUARE_LOCATION_ID_2': 'cart-id-2',
  };
  
  return locationMap[locationId] || 'default-cart-id';
}
```

To find your Square location IDs:
1. Go to Square Dashboard → Locations
2. Click on a location
3. The location ID is in the URL or settings

To find your OrderPing cart IDs:
1. Go to your Firebase Console → Firestore
2. Open the `carts` collection
3. Use the document ID as the cart ID

### 4. Enable Webhook Signature Verification (Recommended)

For security, verify that webhooks actually come from Square:

1. Get your webhook signature key from Square Developer Dashboard
2. Add it as a Firebase secret:
   ```bash
   firebase functions:secrets:set SQUARE_WEBHOOK_SIGNATURE_KEY
   ```
3. Uncomment the signature verification code in `squareWebhook.ts`:
   ```typescript
   const signature = request.headers["x-square-signature"] as string;
   const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || "";
   
   if (!verifySquareSignature(JSON.stringify(request.body), signature, webhookSignatureKey)) {
     console.error("Invalid Square webhook signature");
     response.status(401).send("Unauthorized");
     return;
   }
   ```
4. Update the function configuration:
   ```typescript
   export const handleSquareWebhook = onRequest(
     {
       region: "us-west1",
       cors: false,
       secrets: ["SQUARE_WEBHOOK_SIGNATURE_KEY"], // Add this
     },
     async (request, response) => {
       // ...
     }
   );
   ```
5. Redeploy the function

## How It Works

### Order Creation Flow

1. Customer pays via Square Terminal
2. Square sends `payment.created` or `payment.updated` webhook
3. Cloud Function extracts payment ID (e.g., `abc123j6x`)
4. Takes last 3 characters and converts to uppercase: `J6X`
5. Creates order in Firestore:
   ```javascript
   {
     orderNumber: "J6X",
     status: "pending",
     source: "square",
     cartId: "mapped-cart-id",
     cartName: "Square Terminal",
     createdAt: serverTimestamp(),
     customerName: "",
     phoneNumber: "",
     orderDetails: ""
   }
   ```

### Duplicate Prevention

For `payment.updated` events:
- Only processes if payment status is `COMPLETED`
- Checks if order already exists before creating
- Prevents duplicate orders from multiple webhook calls

### ID Extraction Priority

The webhook looks for payment ID in this order:
1. `data.object.payment.id` (primary)
2. `data.id` (fallback)

If no ID is found, the webhook logs an error and returns 400.

## UI Changes

### Staff Dashboard
- Orders from Square show a blue credit card icon (💳) next to the order number
- Example: `#J6X 💳`

### Customer Queue View
- Customers can select and track alphanumeric order codes
- Works exactly like numeric orders
- Example: Customer sees `#J6X` in the queue and can tap to track it

## Testing

### Test the Webhook Locally

1. Start Firebase emulators:
   ```bash
   firebase emulators:start --only functions
   ```

2. Send a test webhook:
   ```bash
   curl -X POST http://localhost:5001/your-project/us-west1/handleSquareWebhook \
     -H "Content-Type: application/json" \
     -d '{
       "type": "payment.created",
       "data": {
         "object": {
           "payment": {
             "id": "test123abc",
             "status": "COMPLETED",
             "location_id": "your-location-id"
           }
         }
       }
     }'
   ```

3. Check Firestore for a new order with `orderNumber: "ABC"`

### Test in Production

Use Square's webhook testing tool in the Developer Dashboard to send test events.

## Troubleshooting

### Orders not appearing
- Check Cloud Function logs: `firebase functions:log`
- Verify cart mapping is correct
- Ensure webhook URL is correct in Square Dashboard

### Duplicate orders
- Check that `payment.updated` logic is working
- Verify Firestore queries are correct

### Wrong cart assignment
- Update the `getCartIdFromLocation` mapping
- Redeploy the function

## Monitoring

View webhook activity:
```bash
firebase functions:log --only handleSquareWebhook
```

Check for errors in Firebase Console → Functions → Logs

## Security Notes

- ✅ Webhook signature verification prevents unauthorized requests
- ✅ Only processes payment events (ignores other Square events)
- ✅ Validates payment ID exists before creating orders
- ✅ Uses Firebase Admin SDK with proper permissions

## Support

For issues or questions:
- Email: usalife609@gmail.com
- Check Firebase logs for detailed error messages
