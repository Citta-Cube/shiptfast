import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const typeLabel = (t) => {
  if (!t) return 'Status Change'
  if (t === 'REASSIGN') return 'Reassigned'
  if (t === 'VOIDED') return 'Voided'
  return t.charAt(0) + t.slice(1).toLowerCase()
}

export default function StatusHistory({ history = [] }) {
  if (!Array.isArray(history) || history.length === 0) return null

  const items = history
    .slice()
    .sort((a, b) => new Date(b.at) - new Date(a.at))

  const formatUTC = (dateLike) => {
    try {
      return new Date(dateLike).toISOString().replace('T', ' ').replace('Z', ' UTC')
    } catch {
      return String(dateLike)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((h, idx) => (
          <div key={idx} className="text-sm border-b last:border-b-0 pb-2">
            <div className="font-medium">{typeLabel(h.type)} <span className="text-muted-foreground">on {formatUTC(h.at)}</span></div>
            {h.reason && <div className="text-muted-foreground mt-1">Reason: {h.reason}</div>}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
