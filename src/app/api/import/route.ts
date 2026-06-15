export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb, saveDb, type DbSchema, type ToolData, type CollectionData, type TagData } from '@/lib/blobDb'

function normalizeUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    return (url.hostname + url.pathname + url.search).replace(/^www\./i, '').replace(/\/$/, '');
  } catch (e) {
    return urlStr.trim().toLowerCase().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
  }
}

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

    // Process tools: merge imported data with existing
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

        const importedTool: ToolData = {
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

        // Upsert logic with anti-duplicate comparison by URL and name
        const existingIndex = db.tools.findIndex(t => {
          if (t.id === importedTool.id) return true;
          if (t.url && importedTool.url && normalizeUrl(t.url) === normalizeUrl(importedTool.url)) return true;
          if (t.name.trim().toLowerCase() === importedTool.name.trim().toLowerCase()) return true;
          return false;
        })

        if (existingIndex >= 0) {
          const existing = db.tools[existingIndex]
          
          // Merge tags by name
          const mergedTagsMap = new Map<string, TagData>()
          existing.tags.forEach(t => mergedTagsMap.set(t.name.toLowerCase(), t))
          importedTool.tags.forEach(t => {
            if (!mergedTagsMap.has(t.name.toLowerCase())) {
              mergedTagsMap.set(t.name.toLowerCase(), t)
            }
          })

          // Merge collections by id/name
          const mergedCollectionsMap = new Map<string, CollectionData>()
          existing.collections.forEach(c => mergedCollectionsMap.set(c.id, c))
          importedTool.collections.forEach(c => mergedCollectionsMap.set(c.id, c))

          // Combine text fields/notes/images prioritizing newer if not empty
          db.tools[existingIndex] = {
            id: existing.id, // Preserve original ID to avoid breaking references
            name: importedTool.name || existing.name,
            url: importedTool.url || existing.url,
            description: importedTool.description || existing.description,
            notes: importedTool.notes ? (existing.notes && existing.notes !== importedTool.notes ? `${existing.notes}\n---\n${importedTool.notes}` : importedTool.notes) : existing.notes,
            rating: Math.max(existing.rating || 0, importedTool.rating || 0),
            status: importedTool.status === 'FAVORITE' || existing.status === 'FAVORITE' ? 'FAVORITE' : importedTool.status,
            pricingType: importedTool.pricingType || existing.pricingType,
            price: importedTool.price || existing.price,
            image: importedTool.image || existing.image,
            tags: Array.from(mergedTagsMap.values()),
            collections: Array.from(mergedCollectionsMap.values()),
            createdAt: existing.createdAt, // Preserve original date
            updatedAt: new Date()
          }
        } else {
          db.tools.push(importedTool)
        }
      }
    }

    // Upsert collections into the db
    for (const [, col] of collectionMap) {
      const existingIndex = db.collections.findIndex(c => c.id === col.id || c.name.trim().toLowerCase() === col.name.trim().toLowerCase())
      if (existingIndex >= 0) {
        // Update collection description if newer is provided
        db.collections[existingIndex] = {
          ...db.collections[existingIndex],
          description: col.description || db.collections[existingIndex].description,
          updatedAt: new Date()
        }
      } else {
        db.collections.push(col)
      }
    }

    await saveDb(db)

    return NextResponse.json({ success: true, toolsCount: data.tools?.length || 0 })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'import' 
    }, { status: 500 })
  }
}
