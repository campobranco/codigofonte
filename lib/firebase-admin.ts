// lib/firebase-admin.ts
// Cliente Firebase Admin para uso exclusivo no servidor (API routes, Server Components)
// Usa Service Account ou ADC para acesso privilegiado ao Firestore

import { initializeApp, getApps, cert, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

// Inicializa o Admin SDK de forma segura, tentando múltiplas fontes de credenciais
function initAdminApp(): App {
    const existingApps = getApps();
    if (existingApps.length > 0) {
        return existingApps[0];
    }

    const projectId = (
        process.env.FIREBASE_PROJECT_ID || 
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        'campo-branco' // Fallback para o ID conhecido
    ).replace(/^["']|["']$/g, '').trim();

    console.log(`🔧 Firebase Admin: Iniciando para projeto [${projectId}]`);

    // Prioridade 1: Chaves individuais (App Hosting Secrets) - Mais confiável para sessões manuais
    const rawKey = process.env.FB_ADMIN_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = (process.env.FB_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || '').replace(/^["']|["']$/g, '').trim();

    if (rawKey && clientEmail) {
        try {
            // Remove aspas, trata as quebras de linha literais \n e garante que a chave comece com o header correto
            let privateKey = rawKey.replace(/^["']|["']$/g, '').trim();
            privateKey = privateKey.replace(/\\n/g, '\n');
            
            console.log('🚀 Firebase Admin: Inicializando via chaves individuais (App Hosting)');
            return initializeApp({
                credential: cert({ projectId, clientEmail, privateKey }),
                projectId
            });
        } catch (e: any) {
            console.error('❌ Firebase Admin: Erro nas chaves individuais:', e.message);
        }
    }

    // Prioridade 2: ADC (Application Default Credentials) - Fallback para ambiente de nuvem nativo
    if (process.env.NODE_ENV === 'production') {
        try {
            console.log('🌐 Firebase Admin: Tentando ADC...');
            return initializeApp({
                credential: applicationDefault(),
                projectId: projectId
            });
        } catch (e: any) {
            console.warn('⚠️ Firebase Admin: ADC falhou:', e.message);
        }
    }


    // Prioridade 4: service-account.json local (dev)
    const saPath = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(saPath)) {
        try {
            const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
            console.log('✅ Firebase Admin: Inicializado via arquivo local');
            return initializeApp({
                credential: cert(serviceAccount),
                projectId: serviceAccount.project_id || projectId
            });
        } catch (e) {
            console.error('❌ Firebase Admin: Erro no arquivo local:', e);
        }
    }

    console.warn('⚠️ Firebase Admin: Nenhuma credencial válida encontrada. Usando mock.');
    return { name: '[mock]', options: {} } as any;
}

// Instâncias do Admin SDK - inicializadas de forma segura
const adminApp: App = initAdminApp();

// Evita chamar getFirestore/getAuth se o app for mock (comum no build do Next.js)
export const adminDb: Firestore = adminApp.name !== '[mock]'
    ? getFirestore(adminApp, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(default)')
    : {
        collection: () => { throw new Error('Firestore indisponível: credenciais ausentes.'); }
    } as any;

export const adminAuth: Auth = adminApp.name !== '[mock]'
    ? getAuth(adminApp)
    : {
        verifyIdToken: () => { throw new Error('Auth indisponível: credenciais ausentes.'); }
    } as any;
