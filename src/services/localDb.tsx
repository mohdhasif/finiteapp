// Lightweight local NoSQL-like storage built on AsyncStorage
// Provides simple collection read/write with digest comparison to detect unchanged data

import AsyncStorage from '@react-native-async-storage/async-storage';

type StoredList<T> = {
    items: T[];
    meta: {
        digest: string;
        updatedAt: number; // epoch ms when we last wrote
        schemaVersion: number;
    };
};

const SCHEMA_VERSION = 1;

const keyFor = (collectionKey: string) => `localdb:list:${collectionKey}`;

const toStableString = (value: unknown): string => {
    // Stable stringify by sorting object keys
    const seen = new WeakSet();
    const stringify = (v: any): any => {
        if (v && typeof v === 'object') {
            if (seen.has(v)) return null;
            seen.add(v);
            if (Array.isArray(v)) return v.map(stringify);
            const out: Record<string, any> = {};
            Object.keys(v).sort().forEach((k) => { out[k] = stringify(v[k]); });
            return out;
        }
        return v;
    };
    return JSON.stringify(stringify(value));
};

const hashString = (s: string): string => {
    // Simple DJB2 variant
    let hash = 5381;
    for (let i = 0; i < s.length; i++) {
        hash = ((hash << 5) + hash) + s.charCodeAt(i);
        hash |= 0; // force 32-bit
    }
    // Convert to unsigned
    return (hash >>> 0).toString(16);
};

export const computeDigest = <T,>(collectionKey: string, items: T[], getId?: (t: T) => string | number): string => {
    const normalized = Array.isArray(items)
        ? [...items].sort((a, b) => {
            if (!getId) return 0;
            const A = String(getId(a));
            const B = String(getId(b));
            return A.localeCompare(B);
        })
        : [];
    const payload = toStableString({ collectionKey, normalized });
    return hashString(payload);
};

export async function readList<T = any>(collectionKey: string): Promise<StoredList<T> | null> {
    try {
        const raw = await AsyncStorage.getItem(keyFor(collectionKey));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredList<T>;
        if (!parsed?.meta || parsed.meta.schemaVersion !== SCHEMA_VERSION) return null;
        return parsed;
    } catch {
        return null;
    }
}

export async function writeList<T = any>(collectionKey: string, items: T[], digest: string): Promise<void> {
    const data: StoredList<T> = {
        items,
        meta: {
            digest,
            updatedAt: Date.now(),
            schemaVersion: SCHEMA_VERSION,
        },
    };
    try {
        await AsyncStorage.setItem(keyFor(collectionKey), JSON.stringify(data));
    } catch {
        // ignore write failures
    }
}

// After fetching from network, decide whether to use local copy or the fresh data
export async function resolveWithLocalIfUnchanged<T>(
    collectionKey: string,
    remoteItems: T[],
    getId?: (t: T) => string | number,
): Promise<T[]> {
    const local = await readList<T>(collectionKey);
    const remoteDigest = computeDigest(collectionKey, remoteItems ?? [], getId);
    if (local?.meta?.digest && local.meta.digest === remoteDigest) {
        // No new data → use the previously stored list (acts like NoSQL source)
        return local.items ?? [];
    }
    // New/changed → persist and return
    await writeList(collectionKey, remoteItems ?? [], remoteDigest);
    return remoteItems ?? [];
}

// When offline or request fails, fallback to local data if available
export async function fallbackToLocal<T>(collectionKey: string, defaultValue: T[] = []): Promise<T[]> {
    const local = await readList<T>(collectionKey);
    return local?.items ?? defaultValue;
}


