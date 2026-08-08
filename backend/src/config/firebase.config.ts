import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';

export function initFirebase(): App {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }

  // No service-account env vars: boot with default credentials so the dev server
  // starts without Firebase setup. Token verification fails until creds are set.
  return initializeApp({ projectId: projectId ?? 'helper4u-dev' });
}
