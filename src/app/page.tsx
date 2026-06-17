'use client'

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ToolGrid } from "@/components/tools/tool-grid"
import { AddToolDialog } from "@/components/tools/add-tool-dialog"
import { getTools, type ToolWithRelations } from "@/lib/client-actions"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, usePathname } from "next/navigation"

function DashboardContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ""
  const status = searchParams.get('status') || undefined
  const sort = searchParams.get('sort') || "date-desc"

  const [tools, setTools] = useState<ToolWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  const loadTools = async () => {
    setLoading(true)
    const data = await getTools(query, status, sort)
    setTools(data)
    setLoading(false)
  }

  useEffect(() => {
    loadTools()
  }, [query, status, sort])

  useEffect(() => {
    const handler = () => loadTools()
    window.addEventListener('tools-updated', handler)
    return () => window.removeEventListener('tools-updated', handler)
  }, [query, status, sort])

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gérez et organisez vos outils.</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-3 w-full sm:w-auto">
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
          <AddToolDialog />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <ToolGrid tools={tools} />
      )}
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
