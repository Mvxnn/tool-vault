'use client'

import { useEffect, useState } from "react"
import { Layers } from "lucide-react"
import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog"
import { DeleteCollectionButton } from "@/components/collections/delete-collection-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getCollectionsWithCount, type CollectionWithCount } from "@/lib/client-actions"

function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">
            {children}
        </span>
    )
}

export default function CollectionsPage() {
    const [collections, setCollections] = useState<CollectionWithCount[]>([])
    const [loading, setLoading] = useState(true)

    const loadCollections = async () => {
        setLoading(true)
        const data = await getCollectionsWithCount()
        setCollections(data)
        setLoading(false)
    }

    useEffect(() => {
        loadCollections()
    }, [])

    useEffect(() => {
        const handler = () => loadCollections()
        window.addEventListener('collections-updated', handler)
        return () => window.removeEventListener('collections-updated', handler)
    }, [])

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-indigo-500/10 rounded-lg flex-shrink-0">
                        <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">Collections</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Organisez vos outils en groupes.</p>
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <CreateCollectionDialog />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
            ) : collections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-card/50 border border-dashed rounded-xl backdrop-blur-sm px-4">
                    <Layers className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mb-4" />
                    <h2 className="text-lg sm:text-xl font-semibold text-muted-foreground">Aucune collection</h2>
                    <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">Groupez vos outils par projet, stack ou catégorie.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {collections.map((collection) => (
                        <Card key={collection.id} className="group hover:shadow-lg active:shadow-md transition-all duration-300 border-muted/60 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="pb-2 px-4 sm:px-6">
                                <CardTitle className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-base sm:text-lg truncate">{collection.name}</span>
                                            <Badge>{collection._count.tools} outils</Badge>
                                        </div>
                                    </div>
                                    <DeleteCollectionButton id={collection.id} name={collection.name} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6">
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                    {collection.description || "Aucune description."}
                                </p>
                                <Button variant="ghost" className="w-full mt-3 h-9 text-sm" asChild>
                                    <Link href={`/collections/view?id=${collection.id}`}>Voir la collection</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
