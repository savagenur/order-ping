# Production Deployment Checklist

## Pre-Deployment

### Environment Configuration
- [ ] Create `.env.production` file with production Firebase credentials
- [ ] Verify all environment variables are set correctly
- [ ] Remove or disable emulator configuration in `firebase.ts` (set `VITE_USE_EMULATOR=false`)
- [ ] Update CORS origins in Cloud Functions to production URLs only
- [ ] Review and update `firebase.json` hosting configuration

### Security
- [ ] Review Firestore security rules in `firestore.rules`
- [ ] Ensure no development/testing backdoors remain in security rules
- [ ] Verify authentication is properly configured
- [ ] Check that admin routes are properly protected
- [ ] Review API keys and ensure they're properly restricted in Firebase Console
- [ ] Enable App Check for production (recommended)

### Code Quality
- [ ] Run `npm run lint` and fix all errors
- [ ] Run TypeScript type checking: `npm run build` (checks types)
- [ ] Remove all `console.log` statements or ensure they're handled by logger
- [ ] Review all TODO/FIXME comments
- [ ] Test all critical user flows manually

### Performance
- [ ] Test build size: `npm run build` and check dist folder
- [ ] Verify lazy loading is working for routes
- [ ] Check bundle sizes in build output
- [ ] Test loading performance on slow 3G connection
- [ ] Verify service worker is properly configured

### Firebase Configuration
- [ ] Review Firestore indexes in `firestore.indexes.json`
- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Review Cloud Functions configuration
- [ ] Set up Cloud Functions secrets if using Twilio/Square
- [ ] Configure Cloud Scheduler for cleanup jobs
- [ ] Set up Firebase Performance Monitoring (optional)
- [ ] Configure Firebase Analytics (optional)

## Deployment Steps

### 1. Build Frontend
```bash
npm run build
```
- [ ] Verify build completes without errors
- [ ] Check dist folder size (should be optimized)

### 2. Deploy Cloud Functions
```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```
- [ ] Verify all functions deploy successfully
- [ ] Check function logs for any errors
- [ ] Test callable functions from production

### 3. Deploy Firestore Rules & Indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes
```
- [ ] Verify rules are active in Firebase Console
- [ ] Check that indexes are building/built

### 4. Deploy Hosting
```bash
firebase deploy --only hosting
```
- [ ] Verify deployment completes successfully
- [ ] Check hosting URL is accessible
- [ ] Verify service worker is registered

### 5. Post-Deployment Testing
- [ ] Test user registration and login
- [ ] Test QR code scanning and cart switching
- [ ] Test order creation and status updates
- [ ] Test push notifications (if enabled)
- [ ] Test admin dashboard functionality
- [ ] Test on multiple devices (iOS, Android, Desktop)
- [ ] Test PWA installation
- [ ] Verify cross-tab synchronization works
- [ ] Test offline functionality

## Monitoring & Maintenance

### Set Up Monitoring
- [ ] Enable Firebase Performance Monitoring
- [ ] Set up error tracking (Firebase Crashlytics or Sentry)
- [ ] Configure Cloud Functions logging and alerts
- [ ] Set up uptime monitoring
- [ ] Create dashboard for key metrics

### Regular Maintenance
- [ ] Schedule regular Firestore cleanup (30-day old completed orders)
- [ ] Monitor Cloud Functions usage and costs
- [ ] Review security rules periodically
- [ ] Update dependencies regularly
- [ ] Monitor bundle size growth
- [ ] Review and optimize Firestore queries

## Rollback Plan

If issues occur after deployment:

1. **Hosting Rollback**
   ```bash
   firebase hosting:rollback
   ```

2. **Functions Rollback**
   - Redeploy previous version from git
   - Or manually revert in Firebase Console

3. **Firestore Rules Rollback**
   - Restore previous rules from git history
   - Deploy: `firebase deploy --only firestore:rules`

## Performance Benchmarks

Target metrics:
- [ ] First Contentful Paint (FCP): < 1.8s
- [ ] Largest Contentful Paint (LCP): < 2.5s
- [ ] Time to Interactive (TTI): < 3.8s
- [ ] Cumulative Layout Shift (CLS): < 0.1
- [ ] First Input Delay (FID): < 100ms
- [ ] Total bundle size: < 500KB (gzipped)

## Security Checklist

- [ ] HTTPS enforced (automatic with Firebase Hosting)
- [ ] Security headers configured (X-Frame-Options, CSP, etc.)
- [ ] API keys restricted to production domains
- [ ] Authentication properly configured
- [ ] Admin privileges properly restricted
- [ ] No sensitive data in client-side code
- [ ] Rate limiting configured for Cloud Functions
- [ ] Input validation on all user inputs

## Cost Optimization

- [ ] Review Firestore read/write patterns
- [ ] Optimize Cloud Functions cold starts
- [ ] Use Firestore caching where appropriate
- [ ] Monitor bandwidth usage
- [ ] Review Cloud Functions memory allocation
- [ ] Consider Firebase Blaze plan limits

## Documentation

- [ ] Update README.md with production setup instructions
- [ ] Document environment variables
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document admin procedures
- [ ] Update API documentation if applicable

## Final Checks

- [ ] All team members notified of deployment
- [ ] Backup of current production state taken
- [ ] Deployment window scheduled (low traffic time)
- [ ] Support team ready for potential issues
- [ ] Rollback plan tested and ready
- [ ] Post-deployment communication plan ready

---

## Quick Deploy Commands

```bash
# Full deployment
npm run build && firebase deploy

# Functions only
firebase deploy --only functions

# Hosting only
firebase deploy --only hosting

# Firestore rules only
firebase deploy --only firestore:rules

# Everything except hosting
firebase deploy --except hosting
```

## Emergency Contacts

- Firebase Console: https://console.firebase.google.com
- Project ID: order-pingx
- Support: [Add support contact information]
