import Dexie, { type EntityTable } from 'dexie'

// Types matching the Prisma schema
export interface Tool {
    id: string
    name: string
    url: string
    description?: string
    notes?: string
    rating: number
    status: string // TO_TRY, TESTED, FAVORITE, DEPRECATED
    pricingType: string // FREE, FREEMIUM, PAID
    price?: string
    image?: string
    createdAt: Date
    updatedAt: Date
}

export interface Tag {
    id: string
    name: string
}

export interface Collection {
    id: string
    name: string
    description?: string
    createdAt: Date
    updatedAt: Date
}

// Junction tables for many-to-many relations
export interface ToolTag {
    toolId: string
    tagId: string
}

export interface ToolCollection {
    toolId: string
    collectionId: string
}

// Dexie database class
class ToolVaultDB extends Dexie {
    tools!: EntityTable<Tool, 'id'>
    tags!: EntityTable<Tag, 'id'>
    collections!: EntityTable<Collection, 'id'>
    toolTags!: EntityTable<ToolTag, 'toolId'>
    toolCollections!: EntityTable<ToolCollection, 'toolId'>

    constructor() {
        super('ToolVaultDB')

        this.version(1).stores({
            tools: 'id, name, status, pricingType, updatedAt',
            tags: 'id, &name',
            collections: 'id, name, updatedAt',
            toolTags: '[toolId+tagId], toolId, tagId',
            toolCollections: '[toolId+collectionId], toolId, collectionId',
        })
    }
}

export const db = new ToolVaultDB()

// Helper to generate CUID-like IDs
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
