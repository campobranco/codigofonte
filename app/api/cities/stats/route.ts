import { adminDb } from '@/lib/firebase-admin';
import { checkAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Função auxiliar para converter recursivamente Timestamps do Firestore para ISO Strings
// Isso evita erros de serialização no NextResponse.json()
function serializeTimestamps(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    // Se for um Timestamp do Firestore (tem método toDate)
    if (typeof obj.toDate === 'function') {
        const date = obj.toDate();
        return isNaN(date.getTime()) ? null : date.toISOString();
    }
    
    // Se for uma Date normal
    if (obj instanceof Date) {
        return isNaN(obj.getTime()) ? null : obj.toISOString();
    }
    
    // Se for Array
    if (Array.isArray(obj)) {
        return obj.map(item => serializeTimestamps(item));
    }
    
    // Se for Objeto
    if (typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = serializeTimestamps(obj[key]);
            }
        }
        return result;
    }
    
    return obj;
}

export async function GET(req: Request) {
    try {
        const user = await checkAuth(req);

        if (!user) {
            return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
        }

        const url = new URL(req.url);
        let congregationId = url.searchParams.get('congregationId');
        const startDateString = url.searchParams.get('startDate');
        const endDateString = url.searchParams.get('endDate');

        // Security: Force congregationId to be the user's congregation for operational views
        if (user.role !== 'ADMIN' || !congregationId) {
            congregationId = user.congregationId || null;
        }

        if (!congregationId) {
            return NextResponse.json({ error: 'Congregação não identificada' }, { status: 400 });
        }

        const start = startDateString ? new Date(startDateString) : null;
        const end = endDateString ? new Date(endDateString) : null;

        // 1. Fetch all territories
        let territoriesSnapshot = await adminDb.collection('territories')
            .where('congregationId', '==', congregationId)
            .get();

        if (territoriesSnapshot.empty) {
            territoriesSnapshot = await adminDb.collection('territories')
                .where('congregation_id', '==', congregationId)
                .get();
        }

        const territories = territoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...serializeTimestamps(doc.data())
        }));

        // 2. Fetch shared_lists (history)
        let assignmentsSnapshot = await adminDb.collection('shared_lists')
            .where('congregationId', '==', congregationId)
            .get();

        if (assignmentsSnapshot.empty) {
            assignmentsSnapshot = await adminDb.collection('shared_lists')
                .where('congregation_id', '==', congregationId)
                .get();
        }

        let history = assignmentsSnapshot.docs
            .map(doc => ({ id: doc.id, ...serializeTimestamps(doc.data()) }))
            .filter((item: any) => item.status === 'completed');

        // Filter by date
        if (start || end) {
            history = history.filter((item: any) => {
                const dateStr = item.returnedAt || item.returned_at;
                if (!dateStr) return false;
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return false;
                if (start && date < start) return false;
                if (end && date > end) return false;
                return true;
            });
        }

        // 3. Fetch Addresses
        let addressesSnapshot = await adminDb.collection('addresses')
            .where('congregationId', '==', congregationId)
            .get();

        if (addressesSnapshot.empty) {
            addressesSnapshot = await adminDb.collection('addresses')
                .where('congregation_id', '==', congregationId)
                .get();
        }

        let addresses = addressesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...serializeTimestamps(doc.data())
        }));

        if (start || end) {
            addresses = addresses.filter((item: any) => {
                const dateStr = item.lastVisitedAt || item.last_visited_at;
                if (!dateStr) return false;
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return false;
                if (start && date < start) return false;
                if (end && date > end) return false;
                return true;
            });
        }

        return NextResponse.json({
            success: true,
            territories,
            history,
            addresses
        });
    } catch (error: any) {
        console.error("Cities Stats API Error:", error);
        const isAuthError = ['TOKEN_EXPIRED', 'INVALID_TOKEN'].includes(error.message);
        const status = isAuthError ? 401 : 500;
        return NextResponse.json({ 
            success: false,
            error: error.message || "Internal Server Error",
            code: isAuthError ? 'AUTH_ERROR' : 'SERVER_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status });
    }
}
