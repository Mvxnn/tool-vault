'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Hexagon, Layers, Star, Plus, Settings, LayoutGrid } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutGrid },
    { name: 'Collections', href: '/collections', icon: Layers },
    { name: 'Favorites', href: '/favorites', icon: Star },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="w-[250px] border-r h-screen bg-card flex flex-col fixed left-0 top-0 z-30 hidden md:flex">
            <div className="p-6 flex items-center gap-2">
                <Hexagon className="h-8 w-8 text-primary fill-primary/20" />
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    ToolVault
                </h1>
            </div>

            <div className="px-3 py-2 flex-1 space-y-1">
                <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                    Menu
                </h2>
                {navItems.map((item) => (
                    <Button
                        key={item.href}
                        variant={pathname === item.href ? 'secondary' : 'ghost'}
                        className={cn(
                            'w-full justify-start',
                            pathname === item.href && 'bg-secondary'
                        )}
                        asChild
                    >
                        <Link href={item.href}>
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.name}
                        </Link>
                    </Button>
                ))}
            </div>

            <div className="p-4 mt-auto">
                <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]">
                    <Plus className="mr-2 h-4 w-4" /> Add Tool
                </Button>
            </div>
        </div>
    )
}
