import { db, type Tool, type Tag, type Collection } from './db'

interface SeedData {
    tools: Array<Tool & { tags: Tag[]; collections: Collection[] }>
    collections: Collection[]
    tags: Tag[]
}

/**
 * Seeds the IndexedDB with data from the exported seed-data.json file.
 * Only runs once — skips if any tools already exist in the database.
 */
export async function seedDatabaseIfEmpty() {
    const existingCount = await db.tools.count()
    if (existingCount > 0) {
        return // Database already has data
    }

    try {
        // Try multiple paths for compatibility (web vs Capacitor)
        let res: Response
        try {
            res = await fetch('./seed-data.json')
        } catch {
            res = await fetch('/seed-data.json')
        }
        if (!res.ok) {
            console.warn('[seed] seed-data.json not found (status:', res.status, ')')
            return
        }
        const data: SeedData = await res.json()

        // Import tags first
        for (const tag of data.tags) {
            await db.tags.put({
                id: tag.id,
                name: tag.name,
            })
        }

        // Import collections
        for (const col of data.collections) {
            await db.collections.put({
                id: col.id,
                name: col.name,
                description: col.description || undefined,
                createdAt: new Date(col.createdAt),
                updatedAt: new Date(col.updatedAt),
            })
        }

        // Import tools
        for (const tool of data.tools) {
            await db.tools.put({
                id: tool.id,
                name: tool.name,
                url: tool.url,
                description: tool.description || undefined,
                notes: tool.notes || undefined,
                rating: tool.rating,
                status: tool.status,
                pricingType: tool.pricingType,
                price: tool.price || undefined,
                image: tool.image || undefined,
                createdAt: new Date(tool.createdAt),
                updatedAt: new Date(tool.updatedAt),
            })

            // Import tool-tag relationships
            for (const tag of tool.tags) {
                await db.toolTags.put({
                    toolId: tool.id,
                    tagId: tag.id,
                })
            }

            // Import tool-collection relationships
            for (const col of tool.collections) {
                await db.toolCollections.put({
                    toolId: tool.id,
                    collectionId: col.id,
                })
            }
        }

        console.log(`[seed] Imported ${data.tools.length} tools, ${data.collections.length} collections, ${data.tags.length} tags`)

        // Dispatch event so pages reload the data
        window.dispatchEvent(new Event('tools-updated'))
        window.dispatchEvent(new Event('collections-updated'))
    } catch (error) {
        console.error('[seed] Failed to import seed data:', error)
    }
}
