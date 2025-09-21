'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Database, Plus, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface DebugData {
  tables: Record<string, boolean>
  counts: Record<string, number>
  samples: Record<string, any[]>
}

export function SubscriptionDebug() {
  const [loading, setLoading] = useState(false)
  const [debug, setDebug] = useState<DebugData | null>(null)
  const [creating, setCreating] = useState(false)

  const checkDatabaseState = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/subscription/debug')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to check database state')
      }

      setDebug(result.debug)
      toast.success('Database state checked successfully')
    } catch (error: any) {
      console.error('Error checking database state:', error)
      toast.error(error.message || 'Failed to check database state')
    } finally {
      setLoading(false)
    }
  }

  const createSampleData = async () => {
    try {
      setCreating(true)
      const response = await fetch('/api/admin/subscription/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_sample_data' })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create sample data')
      }

      toast.success('Sample data created successfully')
      // Refresh debug data
      await checkDatabaseState()
    } catch (error: any) {
      console.error('Error creating sample data:', error)
      toast.error(error.message || 'Failed to create sample data')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Subscription System Debug</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button
              onClick={checkDatabaseState}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Check Database State
                </>
              )}
            </Button>

            <Button
              onClick={createSampleData}
              disabled={creating || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sample Data
                </>
              )}
            </Button>
          </div>

          {debug && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Database Tables Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(debug.tables).map(([table, exists]) => (
                  <div key={table} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{table}</span>
                      <Badge variant={exists ? 'default' : 'destructive'}>
                        {exists ? 'Available' : 'Error'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Records: {debug.counts[table] || 0}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Sample Data</h3>
                {Object.entries(debug.samples).map(([table, data]) => (
                  <div key={table} className="p-3 border rounded-lg">
                    <div className="font-medium text-sm mb-2">{table}</div>
                    {data.length > 0 ? (
                      <pre className="text-xs bg-gray-50 p-2 rounded max-h-32 overflow-auto">
                        {JSON.stringify(data[0], null, 2)}
                      </pre>
                    ) : (
                      <div className="text-xs text-gray-500">No data found</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}