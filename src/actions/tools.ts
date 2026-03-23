'use server'

import { revalidatePath } from 'next/cache'
import { getDb, saveDb, ToolData, ToolStatus } from '@/lib/blobDb'
import { v4 as uuidv4 } from 'uuid'

export type { ToolData as ToolWithRelations, ToolStatus }

export interface ToolFormData {
    name: string
    url: string
    description?: string
    notes?: string
    rating?: number
    status: ToolStatus
    image?: string
    pricingType?: string
    price?: string
    tags: string[]
    collections?: string[]
}

export async function getTools(query?: string, status?: string) {
    const db = await getDb()
    let tools = db.tools

    if (query) {
        const lowerQuery = query.toLowerCase()
        tools = tools.filter(t => 
            t.name.toLowerCase().includes(lowerQuery) || 
            (t.description && t.description.toLowerCase().includes(lowerQuery)) ||
            t.tags.some(tag => tag.name.toLowerCase().includes(lowerQuery))
        )
    }

    if (status && status !== 'ALL') {
        tools = tools.filter(t => t.status === status)
    }

    return tools.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export async function createTool(data: ToolFormData) {
    const db = await getDb()
    
    // Resolve tags (create pseudo tags, though we don't strictly need a separate tag table now)
    const resolvedTags = data.tags.map(tagName => ({
        id: uuidv4(),
        name: tagName
    }))

    // Resolve collections
    const resolvedCollections = (data.collections || [])
        .map(id => db.collections.find(c => c.id === id))
        .filter((c): c is NonNullable<typeof c> => c !== undefined)

    const newTool: ToolData = {
        id: uuidv4(),
        name: data.name,
        url: data.url,
        description: data.description || null,
        notes: data.notes || null,
        rating: data.rating || 0,
        status: data.status || 'TO_TRY',
        pricingType: data.pricingType || 'FREE',
        price: data.price || null,
        image: data.image || null,
        tags: resolvedTags,
        collections: resolvedCollections,
        createdAt: new Date(),
        updatedAt: new Date()
    }

    db.tools.push(newTool)
    await saveDb(db)

    try {
        revalidatePath('/')
    } catch (e) { }
    return newTool
}

export async function updateTool(id: string, data: Partial<ToolFormData>) {
    const db = await getDb()
    const toolIndex = db.tools.findIndex(t => t.id === id)
    
    if (toolIndex === -1) throw new Error("Tool not found")

    const existingTool = db.tools[toolIndex]

    let resolvedTags = existingTool.tags
    if (data.tags) {
        resolvedTags = data.tags.map(tagName => ({
            id: uuidv4(),
            name: tagName
        }))
    }

    let resolvedCollections = existingTool.collections
    if (data.collections) {
        resolvedCollections = data.collections
            .map(cId => db.collections.find(c => c.id === cId))
            .filter((c): c is NonNullable<typeof c> => c !== undefined)
    }

    const updatedTool: ToolData = {
        ...existingTool,
        ...data,
        description: data.description !== undefined ? data.description : existingTool.description,
        notes: data.notes !== undefined ? data.notes : existingTool.notes,
        status: data.status !== undefined ? data.status : existingTool.status,
        pricingType: data.pricingType !== undefined ? data.pricingType : existingTool.pricingType,
        price: data.price !== undefined ? data.price : existingTool.price,
        image: data.image !== undefined ? data.image : existingTool.image,
        tags: resolvedTags,
        collections: resolvedCollections,
        updatedAt: new Date()
    }

    db.tools[toolIndex] = updatedTool
    await saveDb(db)

    try {
        revalidatePath('/')
    } catch (e) { }
    return updatedTool
}

export async function deleteTool(id: string) {
    const db = await getDb()
    db.tools = db.tools.filter(t => t.id !== id)
    await saveDb(db)
    
    try {
        revalidatePath('/')
    } catch (e) { }
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
    const db = await getDb()
    const tool = db.tools.find(t => t.id === id)
    if (tool) {
        tool.status = isFavorite ? 'FAVORITE' : 'TESTED'
        tool.updatedAt = new Date()
        await saveDb(db)
    }
    
    try {
        revalidatePath('/')
    } catch (e) { }
}
