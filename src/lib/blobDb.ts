import { put, list } from '@vercel/blob';
import { unstable_noStore as noStore } from 'next/cache';

const DB_FILENAME = 'data.json';

// Define the types that were previously from Prisma
export type ToolStatus = 'TO_TRY' | 'TESTED' | 'FAVORITE' | 'DEPRECATED';

export interface TagData {
  id: string;
  name: string;
}

export interface CollectionData {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolData {
  id: string;
  name: string;
  url: string;
  description: string | null;
  notes: string | null;
  rating: number;
  status: ToolStatus;
  pricingType: string;
  price: string | null;
  image: string | null;
  tags: TagData[];
  collections: CollectionData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DbSchema {
  tools: ToolData[];
  collections: CollectionData[];
}

export async function getDb(): Promise<DbSchema> {
  noStore();
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === DB_FILENAME);
    
    if (!file) {
      return { tools: [], collections: [] };
    }
    
    // Add cache buster to bypass Vercel Edge Cache since addRandomSuffix is false
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const isPrivate = token && token.includes('_private_'); // Vercel tokens indicate private stores occasionally, but we'll always pass it just in case
    
    const response = await fetch(`${file.url}?t=${Date.now()}`, { 
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    
    if (!response.ok) {
        console.error("Vercel Blob read error:", await response.text());
        return { tools: [], collections: [] };
    }
    
    const db = await response.json() as DbSchema;
    
    // Parse dates
    db.tools = db.tools.map(tool => ({
        ...tool,
        createdAt: new Date(tool.createdAt),
        updatedAt: new Date(tool.updatedAt)
    }));
    db.collections = db.collections.map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
    }));
    
    return db;
  } catch (err) {
    console.error("Error reading DB from blob:", err);
    return { tools: [], collections: [] };
  }
}

export async function saveDb(data: DbSchema) {
  // Check token to see if it's a private store or try public first?
  // We can just use 'private' if we know it's private, but we don't.
  // The error tells us it's a private store. We will attempt public, catch the specific error, and retry with private.
  try {
    await put(DB_FILENAME, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (e: any) {
    if (e.message && e.message.includes('Cannot use public access on a private store')) {
      await put(DB_FILENAME, JSON.stringify(data), {
        access: 'private' as 'public', // TypeScript cast in case library types are outdated
        addRandomSuffix: false,
        allowOverwrite: true,
      } as any);
    } else {
      throw e;
    }
  }
}
