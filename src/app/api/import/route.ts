export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Format de données invalide' }, { status: 400 })
    }

    // Build tag map from import data
    const tagMap = new Map<string, any>()
    if (data.tags && Array.isArray(data.tags)) {
      for (const tag of data.tags) {
        tagMap.set(tag.id, { id: tag.id, name: tag.name })
      }
    }

    // Upsert collections
    if (data.collections && Array.isArray(data.collections)) {
      for (const col of data.collections) {
        await prisma.collection.upsert({
            where: { id: col.id },
            update: {
                name: col.name,
                description: col.description || null,
                createdAt: new Date(col.createdAt),
                updatedAt: new Date(col.updatedAt),
            },
            create: {
                id: col.id,
                name: col.name,
                description: col.description || null,
                createdAt: new Date(col.createdAt),
                updatedAt: new Date(col.updatedAt),
            }
        })
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

    // Upsert tags first
    for (const [id, tag] of tagMap) {
        await prisma.tag.upsert({
            where: { id },
            update: { name: tag.name },
            create: { id, name: tag.name }
        })
    }

    // Process tools
    if (data.tools && Array.isArray(data.tools)) {
      for (const rawTool of data.tools) {
        const toolTagIds = toolTagsMap.get(rawTool.id) || []
        const toolColIds = toolCollectionsMap.get(rawTool.id) || []

        await prisma.tool.upsert({
            where: { id: rawTool.id },
            update: {
                name: rawTool.name,
                url: rawTool.url,
                description: rawTool.description || null,
                notes: rawTool.notes || null,
                rating: rawTool.rating || 0,
                status: rawTool.status || 'TO_TRY',
                pricingType: rawTool.pricingType || 'FREE',
                price: rawTool.price || null,
                image: rawTool.image || null,
                createdAt: new Date(rawTool.createdAt),
                updatedAt: new Date(),
                tags: {
                    set: [], // clear existing
                    connect: toolTagIds.map(id => ({ id }))
                },
                collections: {
                    set: [],
                    connect: toolColIds.map(id => ({ id }))
                }
            },
            create: {
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
                createdAt: new Date(rawTool.createdAt),
                updatedAt: new Date(rawTool.updatedAt),
                tags: {
                    connect: toolTagIds.map(id => ({ id }))
                },
                collections: {
                    connect: toolColIds.map(id => ({ id }))
                }
            }
        })
      }
    }

    return NextResponse.json({ success: true, toolsCount: data.tools?.length || 0 })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'import' 
    }, { status: 500 })
  }
}
