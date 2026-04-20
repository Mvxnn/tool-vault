import { NextRequest, NextResponse } from 'next/server'
import { createTool, updateTool, deleteTool, toggleFavorite } from '@/actions/tools'
import type { ToolFormData } from '@/actions/tools'

// GET /api/tools
export async function GET(request: NextRequest) {
  const { getTools } = await import('@/actions/tools')
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || undefined
    const status = searchParams.get('status') || undefined

    const tools = await getTools(query, status)
    return NextResponse.json(tools)
  } catch (error) {
    console.error('GET /api/tools error:', error)
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 })
  }
}

// POST /api/tools { action, id?, data }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, id, data } = body

    switch (action) {
      case 'create': {
        const tool = await createTool(data as ToolFormData)
        return NextResponse.json(tool)
      }
      case 'update': {
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        const tool = await updateTool(id, data as Partial<ToolFormData>)
        return NextResponse.json(tool)
      }
      case 'delete': {
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        await deleteTool(id)
        return NextResponse.json({ success: true })
      }
      case 'toggleFavorite': {
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        await toggleFavorite(id, data.isFavorite)
        return NextResponse.json({ success: true })
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('POST /api/tools error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
