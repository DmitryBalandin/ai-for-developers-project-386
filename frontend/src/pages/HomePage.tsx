import { Link } from 'react-router-dom'
import { Button } from 'src/components/ui/button'
import heroImg from 'src/assets/hero.png'
import { Clock, Users } from 'lucide-react'

export function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div className="space-y-6">
          <h1 className="font-heading text-4xl leading-tight font-bold tracking-tight md:text-5xl">
            Schedule calls with ease
          </h1>
          <p className="text-lg text-muted-foreground">
            Let guests book time with you instantly. No back-and-forth emails.
            Just pick a time and it&apos;s done.
          </p>
          <div className="flex gap-3">
            <Button size="lg" render={<Link to="/book" />}>
              Book a Call
            </Button>
            <Button variant="outline" size="lg" render={<Link to="/owner" />}>
              Manage Events
            </Button>
          </div>
          <div className="flex gap-8 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" />
              <span>Set your availability</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" />
              <span>Guests book instantly</span>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <img
            src={heroImg}
            alt="Calendar illustration"
            className="w-full rounded-xl"
          />
        </div>
      </div>
    </div>
  )
}
