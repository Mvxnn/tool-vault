'use client'

import { useRef, useState } from "react"
import { useTheme } from "next-themes"
import { Settings as SettingsIcon, Moon, Sun, Monitor, Download, Upload, Info, Smartphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const res = await fetch('/api/export')
            if (!res.ok) throw new Error('Export failed')
            const jsonData = JSON.stringify(await res.json(), null, 2)

            const date = new Date().toISOString().split('T')[0]
            const fileName = `toolvault-backup-${date}.json`

            if (Capacitor.isNativePlatform()) {
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: jsonData,
                    directory: Directory.Cache,
                    encoding: Encoding.UTF8
                });
                await Share.share({
                    title: 'ToolVault Backup',
                    text: 'Voici ma sauvegarde ToolVault',
                    url: result.uri,
                    dialogTitle: 'Sauvegarder ou partager'
                });
                toast.success('Données prêtes à être partagées ou sauvegardées');
            } else {
                const blob = new Blob([jsonData], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = fileName
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                toast.success('Données exportées avec succès')
            }
        } catch (error) {
            console.error(error)
            toast.error('Erreur lors de l\'exportation des données')
        } finally {
            setIsExporting(false)
        }
    }

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsImporting(true)
            const text = await file.text()
            const jsonData = JSON.parse(text)

            const res = await fetch('/api/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jsonData)
            })

            const result = await res.json()

            if (res.ok && result.success) {
                toast.success(`Données importées avec succès ! Outils: ${result.toolsCount || 0}`)
                // Introduce a slight delay before reloading to allow Vercel Blob to propagate and give time for the user to read the toast
                setTimeout(() => {
                    window.location.reload()
                }, 2000)
            } else {
                toast.error(result.error || 'Erreur lors de l\'importation')
            }
        } catch (error) {
            console.error(error)
            toast.error('Erreur lors de la lecture du fichier')
        } finally {
            setIsImporting(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-500/10 rounded-lg flex-shrink-0">
                    <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500" />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-400 to-slate-200 bg-clip-text text-transparent">Paramètres</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Gérez vos préférences et données.</p>
                </div>
            </div>

            <div className="grid gap-4 sm:gap-6">
                {/* Appearance Section */}
                <Card className="border-muted/60 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="px-4 sm:px-6 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                            Apparence
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Personnalisez le thème de ToolVault.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 sm:px-6">
                        <div className="flex flex-col gap-3">
                            <div>
                                <p className="font-medium text-sm sm:text-base">Mode d'affichage</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">Choisissez entre clair, sombre ou système.</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 bg-secondary/30 p-1 rounded-lg border border-muted/50">
                                <Button
                                    variant={theme === 'light' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className={cn("h-9 rounded-md text-xs sm:text-sm", theme === 'light' && 'shadow-sm')}
                                    onClick={() => setTheme('light')}
                                >
                                    <Sun className="h-3.5 w-3.5 mr-1.5" /> Clair
                                </Button>
                                <Button
                                    variant={theme === 'dark' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className={cn("h-9 rounded-md text-xs sm:text-sm", theme === 'dark' && 'shadow-sm')}
                                    onClick={() => setTheme('dark')}
                                >
                                    <Moon className="h-3.5 w-3.5 mr-1.5" /> Sombre
                                </Button>
                                <Button
                                    variant={theme === 'system' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className={cn("h-9 rounded-md text-xs sm:text-sm", theme === 'system' && 'shadow-sm')}
                                    onClick={() => setTheme('system')}
                                >
                                    <Monitor className="h-3.5 w-3.5 mr-1.5" /> Auto
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Management Section */}
                <Card className="border-muted/60 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="px-4 sm:px-6 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Download className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            Gestion des données
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Exportez ou importez vos outils.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 sm:px-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-medium text-sm sm:text-base">Exporter</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">Téléchargez tous vos outils en JSON.</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-28 h-9"
                                onClick={handleExport}
                                disabled={isExporting}
                            >
                                {isExporting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
                                Exporter
                            </Button>
                        </div>
                        <Separator className="bg-muted/30" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-medium text-sm sm:text-base">Importer</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">Chargez des outils depuis un fichier JSON ou CSV.</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-28 h-9"
                                onClick={handleImportClick}
                                disabled={isImporting}
                            >
                                {isImporting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 h-3.5 w-3.5" />}
                                Importer
                            </Button>
                            <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* About Section */}
                <Card className="border-muted/60 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="px-4 sm:px-6 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                            À propos
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Informations sur l'application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1 px-4 sm:px-6">
                        <div className="flex justify-between text-xs sm:text-sm py-1.5">
                            <span className="text-muted-foreground">Version</span>
                            <span className="font-medium font-mono text-xs">v2.0.0-mobile</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm py-1.5">
                            <span className="text-muted-foreground">Base de données</span>
                            <span className="font-medium flex items-center gap-1">
                                ☁️ Vercel Blob (cloud)
                            </span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm py-1.5">
                            <span className="text-muted-foreground">Plateforme</span>
                            <span className="font-medium">Capacitor (Android)</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
