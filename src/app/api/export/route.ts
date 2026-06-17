export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const tools = await prisma.tool.findMany({
        include: { tags: true, collections: true }
    })
    const allTags = await prisma.tag.findMany()
    const allCollections = await prisma.collection.findMany()

    const tags: { id: string; name: string }[] = []
    const toolTags: { toolId: string; tagId: string }[] = []
    const toolCollections: { toolId: string; collectionId: string }[] = []

    for (const tool of tools) {
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

    const flatTools = tools.map(({ tags, collections, ...rest }) => rest)

    const exportData = {
      tools: flatTools,
      tags: allTags,
      collections: allCollections,
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
