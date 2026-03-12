import { adminDb } from '@/lib/firebase-admin';
import { checkAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    console.log('📡 API: Listando congregações...');
    try {
        const user = await checkAuth(req);

        if (!user) {
            return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
        }

        const isAdmin = user.role === 'ADMIN' || user.email === 'campobrancojw@gmail.com';

        if (!isAdmin) {
            return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
        }

        // Busca todas as congregações ordenadas por nome
        console.log('📂 API: Buscando congregações no Firestore...');
        const snapshot = await adminDb.collection('congregations').orderBy('name', 'asc').get();

        const congregations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ API: ${congregations.length} congregações encontradas`);
        return NextResponse.json({ success: true, congregations });

    } catch (error: any) {
        console.error('💥 Congregations List API Error:', error.message);
        
        const isAuthError = ['TOKEN_EXPIRED', 'INVALID_TOKEN'].includes(error.message);
        const status = isAuthError ? 401 : 500;
        
        return NextResponse.json({ 
            success: false,
            error: isAuthError ? 'Sessão expirada' : 'Erro interno no servidor',
            details: error.message 
        }, { status });
    }
}
