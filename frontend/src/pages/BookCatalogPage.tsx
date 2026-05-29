import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card'
import { Button } from 'src/components/ui/button'
import { Skeleton } from 'src/components/ui/skeleton'
import { getPublicEventTypes } from 'src/api/guest'
import type { EventType } from 'src/types'
import { Clock } from 'lucide-react'

export function BookCatalogPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPublicEventTypes()
      .then(setEventTypes)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-destructive">Failed to load event types: {error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-heading mb-2 text-3xl font-bold">Available Meeting Types</h1>
      <p className="mb-8 text-muted-foreground">
        Choose a meeting type to book a call.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="mb-3 h-4 w-20" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))
          : eventTypes.map((et) => (
              <Card key={et.id}>
                <CardHeader>
                  <CardTitle>{et.title}</CardTitle>
                  <CardDescription>{et.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    <span>{et.durationMinutes} min</span>
                  </div>
                  <Button className="w-full" render={<Link to={`/book/${et.id}`} />}>
                    Book
                  </Button>
                </CardContent>
              </Card>
            ))}
        {!loading && eventTypes.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            No event types available yet.
          </p>
        )}
      </div>
    </div>
  )
}
