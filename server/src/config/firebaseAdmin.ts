import admin from 'firebase-admin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { ServiceAccount } from 'firebase-admin';

// Initialize singleton instance if not already initialized
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'jaaamin-rox';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  // Resolves admin.credential.cert or cert from firebase-admin/app
  const certCredential =
    (admin as unknown as { credential?: { cert: typeof cert } }).credential?.cert ?? cert;

  if (clientEmail && privateKey && !privateKey.includes('your_private_key_here')) {
    try {
      initializeApp({
        credential: certCredential({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      console.log('Firebase Admin initialized with service account credentials.');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin with client email/private key:', error);
      initializeApp({ projectId });
    }
  } else if (serviceAccountJson && !serviceAccountJson.includes('your_service_account')) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
      if (serviceAccount.privateKey) {
        serviceAccount.privateKey = serviceAccount.privateKey.replace(/\\n/g, '\n');
      }
      initializeApp({
        credential: certCredential(serviceAccount),
        projectId: projectId || serviceAccount.projectId,
      });
      console.log('Firebase Admin initialized with service account JSON.');
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', error);
      initializeApp({ projectId });
    }
  } else {
    // Fallback: initialize with projectId
    initializeApp({
      projectId,
    });
    console.log(`Firebase Admin initialized with projectId: ${projectId}`);
  }
}

export const adminAuth = getAuth();
export default admin;
