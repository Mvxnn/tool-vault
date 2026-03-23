'use client'

import React from 'react'
import { ToolCard } from './tool-card'
import { motion } from 'framer-motion'
import type { ToolWithRelations } from '@/lib/client-actions'

interface ToolGridProps {
    tools: ToolWithRelations[]
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export function ToolGrid({ tools }: ToolGridProps) {
    if (tools.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
                <div className="bg-secondary/50 rounded-full p-5 sm:p-6 mb-4">
                    <span className="text-3xl sm:text-4xl">🔍</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucun outil trouvé</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                    Ajustez vos filtres ou ajoutez votre premier outil au vault.
                </p>
            </div>
        )
    }

    return (
        <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {tools.map((tool) => (
                <motion.div key={tool.id} variants={item}>
                    <ToolCard tool={tool} />
                </motion.div>
            ))}
        </motion.div>
    )
}
