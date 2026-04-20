export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb, type DbSchema, type ToolData, type CollectionData, type TagData } from '@/lib/blobDb'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Format de données invalide' }, { status: 400 })
    }

    const db = await getDb()

    // Build tag map from import data
    const tagMap = new Map<string, TagData>()
    if (data.tags && Array.isArray(data.tags)) {
      for (const tag of data.tags) {
        tagMap.set(tag.id, { id: tag.id, name: tag.name })
      }
    }

    // Build collection map
    const collectionMap = new Map<string, CollectionData>()
    if (data.collections && Array.isArray(data.collections)) {
      for (const col of data.collections) {
        const collectionData: CollectionData = {
          id: col.id,
          name: col.name,
          description: col.description || null,
          createdAt: new Date(col.createdAt),
          updatedAt: new Date(col.updatedAt)
        }
        collectionMap.set(col.id, collectionData)
      }
    }

    // Build toolTag and toolCollection lookups
    const toolTagsMap = new Map<string, string[]>()
    if (data.toolTags && Array.isArray(data.toolTags)) {
      for (const tt of data.toolTags) {
        if (!toolTagsMap.has(tt.toolId)) toolTagsMap.set(tt.toolId, [])
        toolTagsMap.get(tt.toolId)!.push(tt.tagId)
      }
    }

    const toolCollectionsMap = new Map<string, string[]>()
    if (data.toolCollections && Array.isArray(data.toolCollections)) {
      for (const tc of data.toolCollections) {
        if (!toolCollectionsMap.has(tc.toolId)) toolCollectionsMap.set(tc.toolId, [])
        toolCollectionsMap.get(tc.toolId)!.push(tc.collectionId)
      }
    }

    // Process tools: merge imported data with existing (upsert by id)
    if (data.tools && Array.isArray(data.tools)) {
      for (const rawTool of data.tools) {
        // Resolve tags for this tool
        const toolTagIds = toolTagsMap.get(rawTool.id) || []
        const resolvedTags = toolTagIds
          .map(tagId => tagMap.get(tagId))
          .filter((t): t is TagData => t !== undefined)

        // Resolve collections for this tool
        const toolColIds = toolCollectionsMap.get(rawTool.id) || []
        const resolvedCollections = toolColIds
          .map(colId => collectionMap.get(colId))
          .filter((c): c is CollectionData => c !== undefined)

        const tool: ToolData = {
          id: rawTool.id,
          name: rawTool.name,
          url: rawTool.url,
          description: rawTool.description || null,
          notes: rawTool.notes || null,
          rating: rawTool.rating || 0,
          status: rawTool.status || 'TO_TRY',
          pricingType: rawTool.pricingType || 'FREE',
          price: rawTool.price || null,
          image: rawTool.image || null,
          tags: resolvedTags,
          collections: resolvedCollections,
          createdAt: new Date(rawTool.createdAt),
          updatedAt: new Date(rawTool.updatedAt)
        }

        // Upsert: replace existing or add new
        const existingIndex = db.tools.findIndex(t => t.id === tool.id)
        if (existingIndex >= 0) {
          db.tools[existingIndex] = tool
        } else {
          db.tools.push(tool)
        }
      }
    }

    // Upsert collections into the db
    for (const [, col] of collectionMap) {
      const existingIndex = db.collections.findIndex(c => c.id === col.id)
      if (existingIndex >= 0) {
        db.collections[existingIndex] = col
      } else {
        db.collections.push(col)
      }
    }

    await saveDb(db)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'import' 
    }, { status: 500 })
  }
}
