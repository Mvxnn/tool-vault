'use client'

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ToolGrid } from "@/components/tools/tool-grid"
import { AddToolDialog } from "@/components/tools/add-tool-dialog"
import { getTools, type ToolWithRelations } from "@/lib/client-actions"

function DashboardContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ""
  const status = searchParams.get('status') || undefined

  const [tools, setTools] = useState<ToolWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  const loadTools = async () => {
    setLoading(true)
    const data = await getTools(query, status)
    setTools(data)
    setLoading(false)
  }

  useEffect(() => {
    loadTools()
  }, [query, status])

  useEffect(() => {
    const handler = () => loadTools()
    window.addEventListener('tools-updated', handler)
    return () => window.removeEventListener('tools-updated', handler)
  }, [query, status])

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gérez et organisez vos outils.</p>
        </div>
        <div className="flex-shrink-0">
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
