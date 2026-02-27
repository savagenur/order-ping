# Production Deployment Guide - Order Ping

## 🚀 **Pre-Deployment Checklist**

### 1. Environment Setup
```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit .env.production with your actual values
# Replace all placeholder values with your production Firebase configuration
```

### 2. Firebase Secrets Setup
```bash
# Set Square webhook signature key
npx firebase functions:secrets:set SQUARE_WEBHOOK_SIGNATURE_KEY

# When prompted, enter your actual Square webhook signature key
# This should be the key from your Square Developer Dashboard
```

### 3. Build & Test
```bash
# Build the application
npm run build

# Test production build locally
npm run preview
```

## 📦 **Deployment Steps**

### 1. Deploy Functions
```bash
# Deploy all Firebase Functions
npm run deploy:functions

# Or deploy only the webhook
npx firebase deploy --only functions:handleSquareWebhook
```

### 2. Deploy Hosting
```bash
# Deploy the web application
npm run deploy:hosting
```

### 3. Full Deployment
```bash
# Deploy everything at once
npm run deploy
```

## 🔧 **Post-Deployment Verification**

### 1. Test Webhook Endpoint
```bash
# Test the webhook URL (should return 401 without proper signature)
curl -X POST "https://handlesquarewebhook-ranbdie4aq-uw.a.run.app/" \
  -H "Content-Type: application/json" \
  -d '{"type": "payment.created", "event_id": "test", "data": {}}'
```

### 2. Check Function Logs
```bash
# Monitor webhook logs
npx firebase functions:log --only handleSquareWebhook
```

### 3. Verify Webhook in Square Dashboard
- Go to Square Developer Dashboard
- Navigate to Webhooks
- Update webhook URL to: `https://handlesquarewebhook-ranbdie4aq-uw.a.run.app/`
- Test webhook from Square dashboard

## 🔒 **Security Verification**

### 1. Check Firebase Security Rules
```bash
# Test Firestore rules
npx firebase deploy --only firestore
```

### 2. Verify Environment Variables
```bash
# Check that all required environment variables are set
# The application should fail to start if any are missing
```

### 3. Test Authentication Flow
- Test admin login functionality
- Verify role-based access control
- Test worker registration and access

## 📊 **Monitoring Setup**

### 1. Function Monitoring
```bash
# Monitor function performance
npx firebase functions:log

# Check function metrics in Firebase Console
```

### 2. Error Monitoring
- Monitor error rates in Firebase Console
- Set up alerts for critical errors
- Check webhook success/failure rates

### 3. Performance Monitoring
- Monitor frontend performance
- Check database query performance
- Monitor webhook response times

## 🚨 **Rollback Procedures**

### 1. Function Rollback
```bash
# Rollback to previous function version
npx firebase deploy --only functions:handleSquareWebhook --force
```

### 2. Full Rollback
```bash
# Rollback entire application
npx firebase deploy
```

## 📋 **Production Checklist**

- [ ] Environment variables configured in `.env.production`
- [ ] Square webhook signature key set as Firebase secret
- [ ] All functions deployed successfully
- [ ] Webhook signature verification working
- [ ] Security rules active and tested
- [ ] Authentication flows working
- [ ] Error monitoring configured
- [ ] Performance monitoring active
- [ ] Rollback procedures documented

## 🎯 **Success Criteria**

✅ **Webhook Processing**: Square webhooks are received and processed correctly  
✅ **Order Creation**: Orders are created in Firestore with correct data structure  
✅ **Security**: All endpoints are secure and properly authenticated  
✅ **Performance**: Application loads quickly and responds promptly  
✅ **Monitoring**: All systems are monitored and alerts are configured  

## 📞 **Support Information**

- **Firebase Console**: https://console.firebase.google.com/project/order-pingx/
- **Function Logs**: `npx firebase functions:log`
- **Webhook URL**: https://handlesquarewebhook-ranbdie4aq-uw.a.run.app/
- **Application URL**: https://order-pingx.web.app
