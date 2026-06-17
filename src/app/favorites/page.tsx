'use client'

import { useEffect, useState, Suspense } from "react"
import { ToolGrid } from "@/components/tools/tool-grid"
import { Star } from "lucide-react"
import { getTools, type ToolWithRelations } from "@/lib/client-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

function FavoritesContent() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const sort = searchParams.get('sort') || "date-desc"

    const [tools, setTools] = useState<ToolWithRelations[]>([])
    const [loading, setLoading] = useState(true)

    const loadTools = async () => {
        setLoading(true)
        const data = await getTools(undefined, 'FAVORITE', sort)
        setTools(data)
        setLoading(false)
    }

    useEffect(() => {
        loadTools()
    }, [sort])

    useEffect(() => {
        const handler = () => loadTools()
        window.addEventListener('tools-updated', handler)
        return () => window.removeEventListener('tools-updated', handler)
    }, [sort])

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        params.set('sort', value)
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                        <Star className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 fill-purple-500/20" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Favoris</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Vos outils et ressources préférés.</p>
                    </div>
                </div>
                <div className="flex-shrink-0 w-full sm:w-auto">
                    <Select value={sort} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Trier par" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date-desc">Plus récent</SelectItem>
                            <SelectItem value="date-asc">Plus ancien</SelectItem>
                            <SelectItem value="name-asc">Nom (A-Z)</SelectItem>
                            <SelectItem value="name-desc">Nom (Z-A)</SelectItem>
                            <SelectItem value="rating-desc">Mieux noté</SelectItem>
                        </SelectContent>
                    </Select>
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

export default function FavoritesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        }>
            <FavoritesContent />
        </Suspense>
    )
}
