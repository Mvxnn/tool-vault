'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ModeToggle } from '@/components/mode-toggle'
import { Input } from '@/components/ui/input'
import { Search, Menu, X, Hexagon, LayoutGrid, Layers, Star, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutGrid },
    { name: 'Collections', href: '/collections', icon: Layers },
    { name: 'Favorites', href: '/favorites', icon: Star },
    { name: 'Settings', href: '/settings', icon: Settings },
]

function HeaderSearch() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set('q', term)
        } else {
            params.delete('q')
        }
        replace(`${pathname}?${params.toString()}`)
    }

    return (
        <>
            {/* Desktop search */}
            <div className="flex-1 max-w-md relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher outils, tags..."
                    className="pl-9 bg-background/50 border-muted focus-visible:ring-primary/50"
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={searchParams.get('q')?.toString()}
                />
            </div>

            {/* Mobile search toggle */}
            <div className="md:hidden flex-1 flex justify-end">
                {mobileSearchOpen ? (
                    <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher..."
                                className="pl-9 bg-background/50 border-muted focus-visible:ring-primary/50 h-9"
                                onChange={(e) => handleSearch(e.target.value)}
                                defaultValue={searchParams.get('q')?.toString()}
                                autoFocus
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => setMobileSearchOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileSearchOpen(true)}>
                        <Search className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </>
    )
}

function MobileSidebar() {
    const pathname = usePathname()

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[260px]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
                <div className="flex flex-col h-full">
                    <div className="p-5 flex items-center gap-2">
                        <Hexagon className="h-7 w-7 text-primary fill-primary/20" />
                        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                            ToolVault
                        </h1>
                    </div>

                    <Separator />

                    <div className="px-3 py-4 flex-1 space-y-1">
                        <h2 className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                            Menu
                        </h2>
                        {navItems.map((item) => (
                            <Button
                                key={item.href}
                                variant={pathname === item.href ? 'secondary' : 'ghost'}
                                className={cn(
                                    'w-full justify-start h-11 text-sm',
                                    pathname === item.href && 'bg-secondary'
                                )}
                                asChild
                            >
                                <Link href={item.href}>
                                    <item.icon className="mr-3 h-4 w-4" />
                                    {item.name}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export function Header() {
    return (
        <header className="h-14 md:h-16 border-b bg-card/50 backdrop-blur-md sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:hidden">
                <MobileSidebar />
            </div>

            <Suspense fallback={
                <div className="flex-1 max-w-md relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher outils, tags..."
                        className="pl-9 bg-background/50 border-muted focus-visible:ring-primary/50"
                        disabled
                    />
                </div>
            }>
                <HeaderSearch />
            </Suspense>

            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <ModeToggle />
            </div>
        </header>
    )
}
