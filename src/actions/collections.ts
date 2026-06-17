'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

export interface CollectionFormData {
    name: string
    description?: string
}

export async function createCollection(data: CollectionFormData) {
    const newCollection = await prisma.collection.create({
        data: {
            name: data.name,
            description: data.description || null
        }
    })

    try {
        revalidatePath('/collections')
    } catch (e) { }
    return newCollection
}

export async function deleteCollection(id: string) {
    await prisma.collection.delete({
        where: { id }
    })
    
    try {
        revalidatePath('/collections')
    } catch (e) { }
}

export async function getCollections() {
    return prisma.collection.findMany({
        orderBy: {
            updatedAt: 'desc'
        }
    })
}

export async function getCollectionsWithCount() {
    const collections = await prisma.collection.findMany({
        include: {
            _count: {
                select: { tools: true }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    })
    return collections
}

export async function getCollectionById(id: string) {
    return prisma.collection.findUnique({
        where: { id },
        include: {
            tools: {
                include: {
                    tags: true,
                    collections: true
                }
            }
        }
    })
}
