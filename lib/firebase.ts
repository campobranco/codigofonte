// lib/firebase.ts
// Cliente Firebase para uso em componentes do lado do cliente (browser)

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Verifica se está rodando em ambiente local para usar credenciais de desenvolvimento
const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Configuração do Firebase lida das variáveis de ambiente (com bypass para localhost)
const firebaseConfig = isLocalhost ? {
  apiKey: "AIzaSyDOAEMjzEVhcWBSuxB1RiqwB4vvGRNlSSk",
  authDomain: "campobrancodev.firebaseapp.com",
  projectId: "campobrancodev",
  storageBucket: "campobrancodev.firebasestorage.app",
  messagingSenderId: "928550834050",
  appId: "1:928550834050:web:adcf6d8895f1b1b22c899b"
} : {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializa o app apenas uma vez (evita duplicatas em hot-reload do Next.js)
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta instâncias dos serviços para uso nos componentes
const auth: Auth = getAuth(app);

// Configura persistência local explicitamente
if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.error('[FIREBASE] Erro ao configurar persistência:', err);
    });
}

export const db: Firestore = getFirestore(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'campobrancodev');
export { app, auth };

