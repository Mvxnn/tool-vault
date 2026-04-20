'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createTool, updateTool, getCollections, type ToolFormData, type ToolWithRelations, type Collection } from '@/lib/client-actions'
import { Loader2, X, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from "sonner"

// Schema
const formSchema = z.object({
    name: z.string().min(2, { message: "Le nom est requis" }),
    url: z.string().url({ message: "URL invalide" }),
    description: z.string().default(""),
    status: z.enum(['TO_TRY', 'TESTED', 'FAVORITE', 'DEPRECATED']),
    rating: z.coerce.number().min(0).max(5).default(0),
    pricingType: z.enum(['FREE', 'FREEMIUM', 'PAID']).default('FREE'),
    price: z.string().optional(),
})

interface ToolDialogProps {
    tool?: ToolWithRelations
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function ToolDialog({ tool, trigger, open: controlledOpen, onOpenChange: setControlledOpen }: ToolDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen

    const [tags, setTags] = useState<string[]>(tool?.tags.map(t => t.name) || [])
    const [tagInput, setTagInput] = useState('')
    const [availableCollections, setAvailableCollections] = useState<Collection[]>([])
    const [selectedCollections, setSelectedCollections] = useState<string[]>(tool?.collections.map(c => c.id) || [])
    const [loading, setLoading] = useState(false)

    const isEditing = !!tool

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: tool?.name || '',
            url: tool?.url || '',
            description: tool?.description || '',
            status: (tool?.status as any) || 'TO_TRY',
            rating: tool?.rating || 0,
            pricingType: (tool?.pricingType as any) || 'FREE',
            price: tool?.price || '',
        },
    })

    const watchPricingType = form.watch('pricingType')

    // Reset form when tool changes (for editing)
    useEffect(() => {
        if (tool) {
            form.reset({
                name: tool.name,
                url: tool.url,
                description: tool.description || '',
                status: tool.status as any,
                rating: tool.rating,
                pricingType: tool.pricingType as any,
                price: tool.price || '',
            })
            setTags(tool.tags.map(t => t.name))
            setSelectedCollections(tool.collections.map(c => c.id))
        } else {
            form.reset({
                name: '',
                url: '',
                description: '',
                status: 'TO_TRY',
                rating: 0,
                pricingType: 'FREE',
                price: '',
            })
            setTags([])
            setSelectedCollections([])
        }
    }, [tool, form])

    useEffect(() => {
        getCollections().then(setAvailableCollections)
    }, [])

    const toggleCollection = (id: string) => {
        setSelectedCollections(prev =>
            prev.includes(id)
                ? prev.filter(c => c !== id)
                : [...prev, id]
        )
    }

    const handleUrlBlur = async () => {
        const url = form.getValues('url')
        if (!url || form.getValues('name')) return
        console.log("Would scrape:", url)
    }

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()])
                setTagInput('')
            }
        }
    }

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag))
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const data: ToolFormData = {
                name: values.name,
                url: values.url,
                description: values.description,
                status: values.status,
                rating: values.rating,
                pricingType: values.pricingType,
                price: values.price,
                tags: tags,
                collections: selectedCollections,
            }

            if (isEditing && tool) {
                await updateTool(tool.id, data)
                toast.success("Outil mis à jour")
            } else {
                await createTool(data)
                toast.success("Outil ajouté")
            }

            setOpen(false)
            if (!isEditing) {
                form.reset()
                setTags([])
                setSelectedCollections([])
            }

            // Dispatch event to refresh data after a delay for Vercel Blob consistency
            setTimeout(() => {
                window.dispatchEvent(new Event('tools-updated'))
            }, 2500)
        } catch (error) {
            console.error(error)
            toast.error(isEditing ? "Échec de la mise à jour" : "Échec de l'ajout")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[85vh] w-[calc(100%-2rem)] rounded-xl p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-lg">{isEditing ? 'Modifier l\'outil' : 'Ajouter un outil'}</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        {isEditing ? 'Mettez à jour les détails.' : 'Ajoutez un outil à votre vault.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} onBlur={handleUrlBlur} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Tool name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Short description..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="TO_TRY">À tester</SelectItem>
                                                <SelectItem value="TESTED">Testé</SelectItem>
                                                <SelectItem value="FAVORITE">Favori</SelectItem>
                                                <SelectItem value="DEPRECATED">Obsolète</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="rating"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rating (0-5)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="5"
                                                {...field}
                                                value={field.value as number}
                                                onChange={e => field.onChange(e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="pricingType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pricing</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pricing type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="FREE">Gratuit</SelectItem>
                                                <SelectItem value="FREEMIUM">Freemium</SelectItem>
                                                <SelectItem value="PAID">Payant</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {watchPricingType === 'PAID' && (
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. $10/mo" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                                        {tag} <X className="ml-1 h-3 w-3" />
                                    </Badge>
                                ))}
                            </div>
                            <FormControl>
                                <Input
                                    placeholder="Tag + Entrée"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                />
                            </FormControl>
                        </FormItem>

                        <div className="space-y-2">
                            <FormLabel>Collections</FormLabel>
                            <div className="flex flex-wrap gap-2">
                                {availableCollections.map(collection => {
                                    const isSelected = selectedCollections.includes(collection.id)
                                    return (
                                        <Badge
                                            key={collection.id}
                                            variant={isSelected ? "default" : "outline"}
                                            className="cursor-pointer hover:bg-primary/90 transition-all font-normal"
                                            onClick={() => toggleCollection(collection.id)}
                                        >
                                            {isSelected && <Layers className="mr-1 h-3 w-3" />}
                                            {collection.name}
                                        </Badge>
                                    )
                                })}
                                {availableCollections.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic">Aucune collection. Créez-en une dans l'onglet Collections.</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Enregistrer' : 'Ajouter'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
