'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ToolGrid } from '@/components/tools/tool-grid'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Layers } from 'lucide-react'
import Link from 'next/link'
import { getCollectionById, type ToolWithRelations } from '@/lib/client-actions'
import type { Collection } from '@/lib/db'

interface CollectionData extends Collection {
    tools: ToolWithRelations[]
}

function CollectionViewContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const [collection, setCollection] = useState<CollectionData | null>(null)
    const [loading, setLoading] = useState(true)

    const loadCollection = async () => {
        if (!id) {
            setLoading(false)
            return
        }
        setLoading(true)
        const data = await getCollectionById(id)
        setCollection(data)
        setLoading(false)
    }

    useEffect(() => {
        loadCollection()
    }, [id])

    useEffect(() => {
        const handler = () => loadCollection()
        window.addEventListener('tools-updated', handler)
        return () => window.removeEventListener('tools-updated', handler)
    }, [id])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!collection) {
        return (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
                <h2 className="text-lg sm:text-xl font-semibold text-muted-foreground">Collection introuvable</h2>
                <Link href="/collections">
                    <Button variant="ghost" className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux collections
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
                <Link href="/collections">
                    <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex items-center gap-2 min-w-0">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 text-primary bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Layers className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-3xl font-bold truncate">{collection.name}</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">{collection.tools.length} outil{collection.tools.length > 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

            <ToolGrid tools={collection.tools} />
        </div>
    )
}

export default function CollectionViewPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        }>
            <CollectionViewContent />
        </Suspense>
    )
}
