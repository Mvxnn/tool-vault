import { put, get, list } from '@vercel/blob';
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
    // Check if it exists first because get() throws if not found
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === DB_FILENAME);
    
    if (!file) {
      return { tools: [], collections: [] };
    }
    
    // We try to get it as private since the user's store is private
    // useCache: false strictly ensures we get the latest origin data immediately
    const result = await get(DB_FILENAME, { 
       access: 'private' as 'public', // Force type cast to resolve SDK versions where 'private' is missing from types
       useCache: false 
    } as any).catch(async (e) => {
       // Fallback to public if it was miraculously a public store, though we know it's private 
       return await get(DB_FILENAME, { access: 'public', useCache: false } as any);
    });

    if (!result || !result.stream) {
        return { tools: [], collections: [] };
    }

    const response = new Response(result.stream);
    const db = await response.json() as DbSchema;
    
    // Parse dates
    db.tools = (db.tools || []).map(tool => ({
        ...tool,
        createdAt: new Date(tool.createdAt),
        updatedAt: new Date(tool.updatedAt)
    }));
    db.collections = (db.collections || []).map(c => ({
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
  try {
    // Attempt private first, since we know user store is private!
    await put(DB_FILENAME, JSON.stringify(data), {
      access: 'private' as 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    } as any);
  } catch (e: any) {
    // Fallback to public if somehow it complains about private access
    await put(DB_FILENAME, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  }
}
