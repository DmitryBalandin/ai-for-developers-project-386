import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { HomePage } from 'src/pages/HomePage'
import { BookCatalogPage } from 'src/pages/BookCatalogPage'
import { BookEventPage } from 'src/pages/BookEventPage'
import { OwnerDashboardPage } from 'src/pages/OwnerDashboardPage'
import { Button } from 'src/components/ui/button'
import { Calendar } from 'lucide-react'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2 font-medium">
              <Calendar className="size-5" />
              Calendar of Calls
            </Link>
            <nav className="flex items-center gap-2">
              <Button variant="ghost" size="sm" render={<Link to="/book" />}>
                Book a Call
              </Button>
              <Button variant="outline" size="sm" render={<Link to="/owner" />}>
                Dashboard
              </Button>
            </nav>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/book" element={<BookCatalogPage />} />
            <Route path="/book/:eventTypeId" element={<BookEventPage />} />
            <Route path="/owner" element={<OwnerDashboardPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
