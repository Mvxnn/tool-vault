export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/blobDb'

export async function GET() {
  try {
    const db = await getDb()

    // Convert to the same format the client-actions export uses,
    // so there is full compatibility with existing exported JSON files
    const tags: { id: string; name: string }[] = []
    const toolTags: { toolId: string; tagId: string }[] = []
    const toolCollections: { toolId: string; collectionId: string }[] = []

    for (const tool of db.tools) {
      for (const tag of tool.tags) {
        if (!tags.find(t => t.id === tag.id)) {
          tags.push(tag)
        }
        toolTags.push({ toolId: tool.id, tagId: tag.id })
      }
      for (const col of tool.collections) {
        toolCollections.push({ toolId: tool.id, collectionId: col.id })
      }
    }

    // Export tools without embedded tags/collections (flat format)
    const flatTools = db.tools.map(({ tags, collections, ...rest }) => rest)

    const exportData = {
      tools: flatTools,
      tags,
      collections: db.collections,
      toolTags,
      toolCollections,
      version: 1,
      exportedAt: new Date().toISOString()
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
