# Square Webhook Production Troubleshooting

## Issue: Webhook works locally but not in production

### Root Cause Analysis
The webhook fails in production due to signature verification differences between local emulator and production Firebase Functions.

### Fixes Applied

1. **Enhanced Signature Verification**
   - Updated `verifySquareSignature()` to handle Firebase Functions v2
   - Added fallback to stringify body when `rawBody` is not available
   - Better error logging with detailed diagnostics

2. **Added Debug Mode**
   - Set `DEBUG_WEBHOOK=true` environment variable to bypass signature verification temporarily
   - Enhanced logging to show signature details without exposing the key

### Deployment Steps

#### 1. Set Environment Variables
**Option A: Using Firebase CLI (Recommended)**
```bash
# Set the Square webhook signature key from your Square dashboard
npx firebase functions:secrets:set SQUARE_WEBHOOK_SIGNATURE_KEY

# Optional: Enable debug mode temporarily  
npx firebase functions:secrets:set DEBUG_WEBHOOK
```

**Option B: Using .env file**
1. Edit `functions/.env.production`:
```
SQUARE_WEBHOOK_SIGNATURE_KEY=YOUR_ACTUAL_KEY_HERE
DEBUG_WEBHOOK=true
```

2. Deploy with environment variables:
```bash
npx firebase deploy --only functions --env .env.production
```

#### 2. Deploy Functions
```bash
firebase deploy --only functions
```

#### 3. Test Webhook
- Use Square's webhook testing tool
- Check Firebase Functions logs for detailed error information
- If using debug mode, verify orders are created successfully

#### 4. Disable Debug Mode (After Testing)
```bash
# Remove debug secret
npx firebase functions:secrets:delete DEBUG_WEBHOOK

# Or update .env.production to set DEBUG_WEBHOOK=false
# Then redeploy:
npx firebase deploy --only functions --env .env.production
```

### Common Issues & Solutions

#### Missing Signature Key
**Error**: "Missing signature or webhook key"
**Solution**: Ensure `SQUARE_WEBHOOK_SIGNATURE_KEY` is set in Firebase Functions config

#### Signature Verification Failure
**Error**: "Invalid webhook signature - rejecting"
**Solution**: 
1. Verify the signature key matches your Square webhook settings
2. Check that the webhook URL in Square matches your deployed function URL
3. Enable debug mode to test without signature verification

#### Body Parsing Issues
**Error**: "No body available for signature verification"
**Solution**: The updated code now handles both `rawBody` and parsed body

### Monitoring

Check Firebase Functions logs:
```bash
firebase functions:log
```

Look for these log entries:
- "Webhook received" - Confirms webhook reached the function
- "Signature verification" - Shows signature validation details
- "Created new order" - Confirms successful order creation

### Production URL Format
Your webhook URL should be:
```
https://us-west1-YOUR_PROJECT.cloudfunctions.net/handleSquareWebhook
```

Replace `YOUR_PROJECT` with your actual Firebase project ID.
