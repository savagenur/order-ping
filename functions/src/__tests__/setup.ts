/**
 * Jest setup file for Firebase Functions tests
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK for tests with emulator
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'test-project',
  });
}

// Connect to Firestore emulator
admin.firestore().settings({
  host: 'localhost:8080',
  ssl: false,
});
