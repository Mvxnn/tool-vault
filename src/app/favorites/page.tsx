'use client'

import { useEffect, useState } from "react"
import { ToolGrid } from "@/components/tools/tool-grid"
import { Star } from "lucide-react"
import { getTools, type ToolWithRelations } from "@/lib/client-actions"

export default function FavoritesPage() {
    const [tools, setTools] = useState<ToolWithRelations[]>([])
    const [loading, setLoading] = useState(true)

    const loadTools = async () => {
        setLoading(true)
        const data = await getTools(undefined, 'FAVORITE')
        setTools(data)
        setLoading(false)
    }

    useEffect(() => {
        loadTools()
    }, [])

    useEffect(() => {
        const handler = () => loadTools()
        window.addEventListener('tools-updated', handler)
        return () => window.removeEventListener('tools-updated', handler)
    }, [])

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                    <Star className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 fill-purple-500/20" />
                </div>
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Favoris</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Vos outils et ressources préférés.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
            ) : tools.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-card/50 border border-dashed rounded-xl backdrop-blur-sm px-4">
                    <Star className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mb-4" />
                    <h2 className="text-lg sm:text-xl font-semibold text-muted-foreground">Aucun favori</h2>
                    <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">Les outils marqués comme favoris apparaîtront ici.</p>
                </div>
            ) : (
                <ToolGrid tools={tools} />
            )}
        </div>
    )
}
