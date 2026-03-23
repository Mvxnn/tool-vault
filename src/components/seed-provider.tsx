'use client'

import { useEffect } from 'react'
import { seedDatabaseIfEmpty } from '@/lib/seed'

export function SeedProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        seedDatabaseIfEmpty()
    }, [])

    return <>{children}</>
}
