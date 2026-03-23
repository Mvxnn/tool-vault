'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ToolDialog } from './tool-dialog'

export function AddToolDialog() {
    return (
        <ToolDialog
            trigger={
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20">
                    <Plus className="mr-2 h-4 w-4" /> Add Tool
                </Button>
            }
        />
    )
}
