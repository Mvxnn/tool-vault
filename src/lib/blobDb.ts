import { put, list } from '@vercel/blob';

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
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === DB_FILENAME);
    
    if (!file) {
      return { tools: [], collections: [] };
    }
    
    // Add cache buster to bypass Vercel Edge Cache since addRandomSuffix is false
    const response = await fetch(`${file.url}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
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
  try {
    await put(DB_FILENAME, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error("Error saving DB to blob:", err);
  }
}
