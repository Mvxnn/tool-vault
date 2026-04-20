'use server'

import { revalidatePath } from 'next/cache'
import { getDb, saveDb } from '@/lib/blobDb'
import type { CollectionData } from '@/lib/blobDb'
import { v4 as uuidv4 } from 'uuid'

export interface CollectionFormData {
    name: string
    description?: string
}

export async function createCollection(data: CollectionFormData) {
    const db = await getDb()
    
    const newCollection: CollectionData = {
        id: uuidv4(),
        name: data.name,
        description: data.description || null,
        createdAt: new Date(),
        updatedAt: new Date()
    }

    db.collections.push(newCollection)
    await saveDb(db)

    try {
        revalidatePath('/collections')
    } catch (e) { }
    return newCollection
}

export async function deleteCollection(id: string) {
    const db = await getDb()
    db.collections = db.collections.filter(c => c.id !== id)
    
    // Also remove this collection from all tools
    db.tools = db.tools.map(tool => ({
        ...tool,
        collections: tool.collections.filter(c => c.id !== id)
    }))
    
    await saveDb(db)
    
    try {
        revalidatePath('/collections')
    } catch (e) { }
}

export async function getCollections() {
    const db = await getDb()
    return db.collections.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export async function getCollectionsWithCount() {
    const db = await getDb()
    const sorted = db.collections.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    return sorted.map(col => ({
        ...col,
        _count: {
            tools: db.tools.filter(t => t.collections.some(c => c.id === col.id)).length
        }
    }))
}

export async function getCollectionById(id: string) {
    const db = await getDb()
    const collection = db.collections.find(c => c.id === id)
    if (!collection) return null

    const tools = db.tools.filter(t => t.collections.some(c => c.id === id))
    return {
        ...collection,
        tools,
    }
}
