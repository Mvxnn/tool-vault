export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createCollection, deleteCollection } from '@/actions/collections'
import type { CollectionFormData } from '@/actions/collections'

// POST /api/collections { action, id?, data }
export async function GET(request: NextRequest) {
  const { getCollections, getCollectionsWithCount } = await import('@/actions/collections')
  try {
    const { searchParams } = new URL(request.url)
    const withCount = searchParams.get('withCount') === 'true'

    if (withCount) {
      const collections = await getCollectionsWithCount()
      return NextResponse.json(collections)
    }

    const collections = await getCollections()
    return NextResponse.json(collections)
  } catch (error) {
    console.error('GET /api/collections error:', error)
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, id, data } = body

    switch (action) {
      case 'create': {
        const collection = await createCollection(data as CollectionFormData)
        return NextResponse.json(collection)
      }
      case 'delete': {
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        await deleteCollection(id)
        return NextResponse.json({ success: true })
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('POST /api/collections error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
