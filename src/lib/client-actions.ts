import { db, generateId, type Tool, type Tag, type Collection } from './db'

// ==========================================
// TYPES
// ==========================================

export type ToolWithRelations = Tool & {
    tags: Tag[]
    collections: Collection[]
}

export type ToolStatus = 'TO_TRY' | 'TESTED' | 'FAVORITE' | 'DEPRECATED'

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

export interface CollectionFormData {
    name: string
    description?: string
}

export interface CollectionWithCount extends Collection {
    _count: { tools: number }
}

// ==========================================
// TOOL ACTIONS
// ==========================================

export async function getTools(query?: string, status?: string): Promise<ToolWithRelations[]> {
    let tools = await db.tools.orderBy('updatedAt').reverse().toArray()

    // Filter by status
    if (status && status !== 'ALL') {
        tools = tools.filter(t => t.status === status)
    }

    // Filter by query (search in name, description, tags)
    if (query) {
        const q = query.toLowerCase()
        const allToolTags = await db.toolTags.toArray()
        const allTags = await db.tags.toArray()
        const tagMap = new Map(allTags.map(t => [t.id, t.name.toLowerCase()]))

        tools = tools.filter(tool => {
            const nameMatch = tool.name.toLowerCase().includes(q)
            const descMatch = tool.description?.toLowerCase().includes(q)
            const toolTagIds = allToolTags.filter(tt => tt.toolId === tool.id).map(tt => tt.tagId)
            const tagMatch = toolTagIds.some(tagId => tagMap.get(tagId)?.includes(q))
            return nameMatch || descMatch || tagMatch
        })
    }

    // Populate relations
    return Promise.all(tools.map(tool => populateToolRelations(tool)))
}

export async function createTool(data: ToolFormData): Promise<Tool> {
    const now = new Date()
    const toolId = generateId()

    const tool: Tool = {
        id: toolId,
        name: data.name,
        url: data.url,
        description: data.description || undefined,
        notes: data.notes || undefined,
        rating: data.rating || 0,
        status: data.status,
        pricingType: data.pricingType || 'FREE',
        price: data.price || undefined,
        image: data.image || undefined,
        createdAt: now,
        updatedAt: now,
    }

    await db.tools.add(tool)

    // Handle tags (connectOrCreate)
    for (const tagName of data.tags) {
        let tag = await db.tags.where('name').equals(tagName).first()
        if (!tag) {
            tag = { id: generateId(), name: tagName }
            await db.tags.add(tag)
        }
        await db.toolTags.add({ toolId, tagId: tag.id })
    }

    // Handle collections
    if (data.collections) {
        for (const collectionId of data.collections) {
            await db.toolCollections.add({ toolId, collectionId })
        }
    }

    return tool
}

export async function updateTool(id: string, data: Partial<ToolFormData>): Promise<void> {
    const { tags, collections, ...rest } = data

    await db.tools.update(id, {
        ...rest,
        updatedAt: new Date(),
    })

    // Update tags
    if (tags) {
        // Clear existing tags
        await db.toolTags.where('toolId').equals(id).delete()
        // Add new tags
        for (const tagName of tags) {
            let tag = await db.tags.where('name').equals(tagName).first()
            if (!tag) {
                tag = { id: generateId(), name: tagName }
                await db.tags.add(tag)
            }
            await db.toolTags.add({ toolId: id, tagId: tag.id })
        }
    }

    // Update collections
    if (collections) {
        await db.toolCollections.where('toolId').equals(id).delete()
        for (const collectionId of collections) {
            await db.toolCollections.add({ toolId: id, collectionId })
        }
    }
}

export async function deleteTool(id: string): Promise<void> {
    await db.tools.delete(id)
    await db.toolTags.where('toolId').equals(id).delete()
    await db.toolCollections.where('toolId').equals(id).delete()
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    await db.tools.update(id, {
        status: isFavorite ? 'FAVORITE' : 'TESTED',
        updatedAt: new Date(),
    })
}

// ==========================================
// COLLECTION ACTIONS
// ==========================================

export async function getCollections(): Promise<Collection[]> {
    return db.collections.orderBy('updatedAt').reverse().toArray()
}

export async function getCollectionsWithCount(): Promise<CollectionWithCount[]> {
    const collections = await db.collections.orderBy('updatedAt').reverse().toArray()

    return Promise.all(
        collections.map(async (collection) => {
            const count = await db.toolCollections
                .where('collectionId')
                .equals(collection.id)
                .count()
            return {
                ...collection,
                _count: { tools: count },
            }
        })
    )
}

export async function createCollection(data: CollectionFormData): Promise<Collection> {
    const now = new Date()
    const collection: Collection = {
        id: generateId(),
        name: data.name,
        description: data.description || undefined,
        createdAt: now,
        updatedAt: now,
    }

    await db.collections.add(collection)
    return collection
}

export async function deleteCollection(id: string): Promise<void> {
    await db.collections.delete(id)
    await db.toolCollections.where('collectionId').equals(id).delete()
}

export async function getCollectionById(id: string) {
    const collection = await db.collections.get(id)
    if (!collection) return null

    // Get tools in this collection
    const toolCollections = await db.toolCollections
        .where('collectionId')
        .equals(id)
        .toArray()
    const toolIds = toolCollections.map(tc => tc.toolId)

    const tools = await db.tools.where('id').anyOf(toolIds).toArray()
    const toolsWithRelations = await Promise.all(tools.map(t => populateToolRelations(t)))

    return {
        ...collection,
        tools: toolsWithRelations,
    }
}

// ==========================================
// IMPORT / EXPORT ACTIONS
// ==========================================

export async function exportData(): Promise<string> {
    const data = {
        tools: await db.tools.toArray(),
        tags: await db.tags.toArray(),
        collections: await db.collections.toArray(),
        toolTags: await db.toolTags.toArray(),
        toolCollections: await db.toolCollections.toArray(),
        version: 1, // Store semantic version for future migrations
        exportedAt: new Date().toISOString()
    }

    return JSON.stringify(data, null, 2)
}

export async function importData(jsonData: string): Promise<{ success: boolean; error?: string }> {
    try {
        const data = JSON.parse(jsonData)

        // Basic validation
        if (!data || typeof data !== 'object') {
            throw new Error('Format de données invalide')
        }

        // Start a transaction for safe import
        await db.transaction('rw', [db.tools, db.tags, db.collections, db.toolTags, db.toolCollections], async () => {
            // Use bulkPut to upsert records (merge instead of overwrite/delete)
            if (data.tools && Array.isArray(data.tools)) {
                // Restore Date objects
                const tools = data.tools.map((t: any) => ({
                    ...t,
                    createdAt: new Date(t.createdAt),
                    updatedAt: new Date(t.updatedAt)
                }))
                await db.tools.bulkPut(tools)
            }
            if (data.tags && Array.isArray(data.tags)) {
                await db.tags.bulkPut(data.tags)
            }
            if (data.collections && Array.isArray(data.collections)) {
                const collections = data.collections.map((c: any) => ({
                    ...c,
                    createdAt: new Date(c.createdAt),
                    updatedAt: new Date(c.updatedAt)
                }))
                await db.collections.bulkPut(collections)
            }
            if (data.toolTags && Array.isArray(data.toolTags)) {
                await db.toolTags.bulkPut(data.toolTags)
            }
            if (data.toolCollections && Array.isArray(data.toolCollections)) {
                await db.toolCollections.bulkPut(data.toolCollections)
            }
        })

        return { success: true }
    } catch (error) {
        console.error('Import failed:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'import'
        }
    }
}

// ==========================================
// HELPERS
// ==========================================

async function populateToolRelations(tool: Tool): Promise<ToolWithRelations> {
    // Get tags
    const toolTags = await db.toolTags.where('toolId').equals(tool.id).toArray()
    const tagIds = toolTags.map(tt => tt.tagId)
    const tags = tagIds.length > 0 ? await db.tags.where('id').anyOf(tagIds).toArray() : []

    // Get collections
    const toolCollections = await db.toolCollections.where('toolId').equals(tool.id).toArray()
    const collectionIds = toolCollections.map(tc => tc.collectionId)
    const collections = collectionIds.length > 0
        ? await db.collections.where('id').anyOf(collectionIds).toArray()
        : []

    return { ...tool, tags, collections }
}
