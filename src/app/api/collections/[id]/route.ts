import { NextRequest, NextResponse } from 'next/server'
import { getCollectionById } from '@/actions/collections'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const collection = await getCollectionById(id)
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }
    return NextResponse.json(collection)
  } catch (error) {
    console.error('GET /api/collections/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 })
  }
}
