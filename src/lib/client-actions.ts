// ==========================================
// TYPES (kept compatible with existing UI components)
// ==========================================

export type ToolStatus = 'TO_TRY' | 'TESTED' | 'FAVORITE' | 'DEPRECATED'

export interface ToolWithRelations {
    id: string
    name: string
    url: string
    description?: string | null
    notes?: string | null
    rating: number
    status: string
    pricingType: string
    price?: string | null
    image?: string | null
    createdAt: Date
    updatedAt: Date
    tags: { id: string; name: string }[]
    collections: { id: string; name: string; description: string | null; createdAt: Date; updatedAt: Date }[]
}

export interface ToolFormData {
    name: string
    url: string
    description?: string
    notes?: string
    rating?: number
    status: ToolStatus
    image?: string
    pricingType?: string
    price?: string
    tags: string[]
    collections?: string[]
}

export interface Collection {
    id: string
    name: string
    description?: string | null
    createdAt: Date
    updatedAt: Date
}

export interface CollectionFormData {
    name: string
    description?: string
}

export interface CollectionWithCount extends Collection {
    _count: { tools: number }
}

// ==========================================
// HELPERS
// ==========================================

function parseDates<T>(obj: T): T {
    const o = obj as any;
    return {
        ...obj,
        ...(o.createdAt !== undefined ? { createdAt: new Date(o.createdAt as string) } : {}),
        ...(o.updatedAt !== undefined ? { updatedAt: new Date(o.updatedAt as string) } : {}),
    }
}

async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
    const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || `POST ${path} failed`)
    }
    return res.json() as Promise<T>
}

// ==========================================
// TOOL ACTIONS
// ==========================================

export async function getTools(query?: string, status?: string): Promise<ToolWithRelations[]> {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (status && status !== 'ALL') params.set('status', status)

    const res = await fetch(`/api/tools${params.toString() ? '?' + params.toString() : ''}`, {
        cache: 'no-store',
    })
    if (!res.ok) throw new Error('Failed to fetch tools')

    const data = await res.json()
    return (data as ToolWithRelations[]).map(t => parseDates(t))
}

export async function createTool(data: ToolFormData): Promise<ToolWithRelations> {
    const result = await apiPost<ToolWithRelations>('/api/tools', { action: 'create', data })
    dispatchUpdate('tools-updated')
    return parseDates(result)
}

export async function updateTool(id: string, data: Partial<ToolFormData>): Promise<void> {
    await apiPost('/api/tools', { action: 'update', id, data })
    dispatchUpdate('tools-updated')
}

export async function deleteTool(id: string): Promise<void> {
    await apiPost('/api/tools', { action: 'delete', id })
    dispatchUpdate('tools-updated')
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    await apiPost('/api/tools', { action: 'toggleFavorite', id, data: { isFavorite } })
    dispatchUpdate('tools-updated')
}

// ==========================================
// COLLECTION ACTIONS
// ==========================================

export async function getCollections(): Promise<Collection[]> {
    const res = await fetch('/api/collections', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch collections')
    const data = await res.json()
    return (data as Collection[]).map(c => parseDates(c))
}

export async function getCollectionsWithCount(): Promise<CollectionWithCount[]> {
    const res = await fetch('/api/collections?withCount=true', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch collections')
    const data = await res.json()
    return (data as CollectionWithCount[]).map(c => parseDates(c))
}

export async function createCollection(data: CollectionFormData): Promise<Collection> {
    const result = await apiPost<Collection>('/api/collections', { action: 'create', data })
    dispatchUpdate('collections-updated')
    return parseDates(result)
}

export async function deleteCollection(id: string): Promise<void> {
    await apiPost('/api/collections', { action: 'delete', id })
    dispatchUpdate('collections-updated')
    dispatchUpdate('tools-updated')
}

export async function getCollectionById(id: string): Promise<(Collection & { tools: ToolWithRelations[] }) | null> {
    const res = await fetch(`/api/collections/${id}`, { cache: 'no-store' })
    if (res.status === 404) return null
    if (!res.ok) throw new Error('Failed to fetch collection')
    const data = await res.json()
    return {
        ...parseDates(data),
        tools: (data.tools as ToolWithRelations[]).map(t => parseDates(t)),
    }
}

// ==========================================
// IMPORT / EXPORT ACTIONS
// ==========================================

export async function exportData(): Promise<string> {
    const res = await fetch('/api/export', { cache: 'no-store' })
    if (!res.ok) throw new Error('Export failed')
    const data = await res.json()
    return JSON.stringify(data, null, 2)
}

export async function importData(jsonData: string): Promise<{ success: boolean; error?: string }> {
    try {
        const data = JSON.parse(jsonData)
        const res = await fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        const result = await res.json()
        return res.ok && result.success
            ? { success: true }
            : { success: false, error: result.error || 'Erreur inconnue lors de l\'import' }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
    }
}

// ==========================================
// HELPERS
// ==========================================

function dispatchUpdate(event: string) {
    if (typeof window !== 'undefined') {
        // Delay by 2.5 seconds to account for Vercel Blob eventual consistency on overwrites
        setTimeout(() => {
            window.dispatchEvent(new Event(event))
        }, 2500)
    }
}
