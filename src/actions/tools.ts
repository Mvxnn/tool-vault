'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

export type ToolStatus = 'TO_TRY' | 'TESTED' | 'FAVORITE' | 'DEPRECATED'

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

export async function getTools(query?: string, status?: string, sort: string = 'date-desc') {
    const where: any = {}

    if (query) {
        const lowerQuery = query.toLowerCase()
        where.OR = [
            { name: { contains: lowerQuery, mode: 'insensitive' } },
            { description: { contains: lowerQuery, mode: 'insensitive' } },
            { tags: { some: { name: { contains: lowerQuery, mode: 'insensitive' } } } }
        ]
    }

    if (status && status !== 'ALL') {
        where.status = status
    }

    let orderBy: any = { updatedAt: 'desc' }
    if (sort === 'date-asc') {
        orderBy = { createdAt: 'asc' }
    } else if (sort === 'date-desc') {
        orderBy = { createdAt: 'desc' }
    } else if (sort === 'name-asc') {
        orderBy = { name: 'asc' }
    } else if (sort === 'name-desc') {
        orderBy = { name: 'desc' }
    } else if (sort === 'rating-desc') {
        orderBy = { rating: 'desc' }
    }

    return prisma.tool.findMany({
        where,
        include: {
            tags: true,
            collections: true
        },
        orderBy
    })
}

export async function createTool(data: ToolFormData) {
    const newTool = await prisma.tool.create({
        data: {
            name: data.name,
            url: data.url,
            description: data.description,
            notes: data.notes,
            rating: data.rating || 0,
            status: data.status || 'TO_TRY',
            pricingType: data.pricingType || 'FREE',
            price: data.price,
            image: data.image,
            tags: {
                connectOrCreate: data.tags.map(tagName => ({
                    where: { name: tagName },
                    create: { name: tagName }
                }))
            },
            collections: {
                connect: (data.collections || []).map(id => ({ id }))
            }
        },
        include: {
            tags: true,
            collections: true
        }
    })

    try {
        revalidatePath('/')
    } catch (e) { }
    return newTool
}

export async function updateTool(id: string, data: Partial<ToolFormData>) {
    const updateData: any = {
        name: data.name,
        url: data.url,
        description: data.description,
        notes: data.notes,
        rating: data.rating,
        status: data.status,
        pricingType: data.pricingType,
        price: data.price,
        image: data.image,
    }

    if (data.tags) {
        updateData.tags = {
            set: [], // clear existing
            connectOrCreate: data.tags.map(tagName => ({
                where: { name: tagName },
                create: { name: tagName }
            }))
        }
    }

    if (data.collections) {
        updateData.collections = {
            set: data.collections.map(cId => ({ id: cId }))
        }
    }

    const updatedTool = await prisma.tool.update({
        where: { id },
        data: updateData,
        include: {
            tags: true,
            collections: true
        }
    })

    try {
        revalidatePath('/')
    } catch (e) { }
    return updatedTool
}

export async function deleteTool(id: string) {
    await prisma.tool.delete({
        where: { id }
    })
    
    try {
        revalidatePath('/')
    } catch (e) { }
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
    await prisma.tool.update({
        where: { id },
        data: {
            status: isFavorite ? 'FAVORITE' : 'TESTED'
        }
    })
    
    try {
        revalidatePath('/')
    } catch (e) { }
}
