# OrderPing - React + TypeScript + Vite + Firebase

A modern order management system built with React, TypeScript, Vite, and Firebase.

## Features

- **Admin Dashboard**: Manage carts, workers, and orders
- **Real-time Analytics**: Track revenue and order statistics
- **Firebase Integration**: Cloud Firestore, Authentication, and Functions
- **Responsive Design**: Built with Tailwind CSS and modern UI components

## Prerequisites

- Node.js 18+ 
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Firestore, Functions, and Hosting enabled

## Setup

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd order-ping
npm install
cd functions && npm install && cd ..
```

2. **Configure Firebase**
```bash
firebase login
firebase use your-project-id
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your Firebase configuration
```

4. **Local development**
```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start the dev server
npm run dev
```

## Deployment

### Deploy to Firebase Hosting

1. **Build the application**
```bash
npm run build
```

2. **Deploy all services**
```bash
firebase deploy
```

### Deploy individual services

```bash
# Deploy only hosting (frontend)
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

## Project Structure

- `src/` - React frontend application
- `functions/` - Firebase Cloud Functions
- `public/` - Static assets
- `firebase.json` - Firebase configuration
- `firestore.rules` - Firestore security rules

## Environment Variables

The app uses Vite environment variables (prefixed with `VITE_`):

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `firebase emulators:start` - Start local Firebase emulators

## Firebase Services Used

- **Firestore** - NoSQL database for carts, workers, and orders
- **Authentication** - User authentication and authorization
- **Functions** - Serverless backend logic
- **Hosting** - Static site hosting for the React app

## Production Considerations

- Ensure Firestore security rules are properly configured
- Set up Firebase Functions with appropriate regions
- Configure custom domain if needed
- Monitor Firebase usage and costs
- Set up proper error tracking and logging
