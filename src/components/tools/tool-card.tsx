'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { ExternalLink, Star, MoreVertical, Trash2, Edit, Heart } from 'lucide-react'
import type { Tag } from '@/lib/db'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteTool, toggleFavorite, type ToolWithRelations } from '@/lib/client-actions'
import { cn } from '@/lib/utils'
import { ToolDialog } from './tool-dialog'

interface ToolCardProps {
    tool: ToolWithRelations
}

const STATUS_COLORS: Record<string, string> = {
    TO_TRY: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    TESTED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    FAVORITE: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    DEPRECATED: 'bg-red-500/10 text-red-500 border-red-500/20',
}

const PRICING_COLORS: Record<string, string> = {
    FREE: 'bg-green-500/10 text-green-500 border-green-500/20',
    FREEMIUM: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    PAID: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
}

const PRICING_LABELS: Record<string, string> = {
    FREE: 'Gratuit',
    FREEMIUM: 'Freemium',
    PAID: 'Payant',
}

export function ToolCard({ tool }: ToolCardProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const handleDelete = async () => {
        if (confirm('Supprimer cet outil ?')) {
            await deleteTool(tool.id)
            window.dispatchEvent(new Event('tools-updated'))
        }
    }

    const handleToggleFavorite = async () => {
        const isFav = tool.status === 'FAVORITE'
        await toggleFavorite(tool.id, !isFav)
        window.dispatchEvent(new Event('tools-updated'))
    }

    const pricingType = tool.pricingType || 'FREE'
    const priceValue = tool.price

    return (
        <>
            <Card className="group flex flex-col h-full hover:shadow-lg active:shadow-md transition-all duration-300 border-muted/60 bg-card/50 backdrop-blur-sm overflow-hidden">
                {/* Image / Header area */}
                <div className="h-28 sm:h-32 bg-secondary/50 relative overflow-hidden">
                    {tool.image ? (
                        <img src={tool.image} alt={tool.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
                            <span className="text-3xl sm:text-4xl font-bold text-muted-foreground/20">{tool.name.slice(0, 2).toUpperCase()}</span>
                        </div>
                    )}

                    {/* Actions — always visible on mobile, hover on desktop */}
                    <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full backdrop-blur-md bg-background/80 focus-visible:ring-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleToggleFavorite}>
                                    <Heart className={cn("mr-2 h-4 w-4", tool.status === 'FAVORITE' && "fill-purple-500 text-purple-500")} />
                                    {tool.status === 'FAVORITE' ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                                    <Edit className="mr-2 h-4 w-4" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Status & pricing badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <Badge variant="outline" className={cn("backdrop-blur-md bg-background/50 border-0 text-[10px] sm:text-xs", STATUS_COLORS[tool.status])}>
                            {tool.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={cn("backdrop-blur-md bg-background/50 border-0 text-[10px]", PRICING_COLORS[pricingType])}>
                            {PRICING_LABELS[pricingType]}
                            {pricingType === 'PAID' && priceValue && ` : ${priceValue}`}
                        </Badge>
                    </div>
                </div>

                <CardHeader className="pb-2 px-3 sm:px-6">
                    <div className="flex justify-between items-start gap-2">
                        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-primary underline-offset-4 min-w-0 flex-1">
                            <h3 className="font-bold text-base sm:text-lg leading-tight truncate">{tool.name}</h3>
                        </a>
                        {tool.status === 'FAVORITE' && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />}
                    </div>
                </CardHeader>

                <CardContent className="flex-1 pb-2 px-3 sm:px-6">
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                        {tool.description || "Aucune description."}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-auto">
                        {tool.tags.slice(0, 4).map((tag: Tag) => (
                            <Badge key={tag.id} variant="secondary" className="px-1.5 py-0 text-[10px] font-medium opacity-80">
                                {tag.name}
                            </Badge>
                        ))}
                        {tool.tags.length > 4 && (
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium opacity-60">
                                +{tool.tags.length - 4}
                            </Badge>
                        )}
                        {tool.tags.length === 0 && <span className="text-[10px] text-muted-foreground italic">Aucun tag</span>}
                    </div>
                </CardContent>

                <CardFooter className="pt-2 pb-3 px-3 sm:px-6 border-t bg-secondary/10 flex justify-between items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        {tool.rating > 0 && Array.from({ length: tool.rating }).map((_, i) => (
                            <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary" />
                        ))}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                        <a href={tool.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </Button>
                </CardFooter>
            </Card>

            <ToolDialog
                tool={tool}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
            />
        </>
    )
}
