import { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { Home, Users, GitBranch, Trophy, Heart, Calculator, Book, Settings, Database, Activity } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  currentPage?: string
}

export function Layout({ children, currentPage = 'dashboard' }: LayoutProps) {
  const navItems = [
    {
      name: 'Dashboard',
      icon: Home,
      id: 'dashboard'
    },
    {
      name: 'Pigeons',
      icon: Users,
      id: 'pigeons'
    },
    {
      name: 'Pedigree',
      icon: GitBranch,
      id: 'pedigree'
    },
    {
      name: 'Results',
      icon: Trophy,
      id: 'results'
    },
    {
      name: 'Breeding',
      icon: Heart,
      id: 'breeding'
    },
    {
      name: 'Health',
      icon: Activity,
      id: 'health'
    },
  ]

  const toolItems = [
    {
      name: 'Calculator',
      icon: Calculator,
      id: 'calculator'
    },
    {
      name: 'Address Book',
      icon: Book,
      id: 'address-book'
    },
    {
      name: 'Import/Export',
      icon: Database,
      id: 'import-export'
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar navigation */}
      <aside className="w-64 border-r bg-card">
        <nav className="p-4 space-y-2">
          <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">
            Main
          </div>
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentPage === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </a>
          ))}

          <div className="pt-4 mt-4 border-t">
            <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">
              Tools
            </div>
            {toolItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </a>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t">
            <a
              href="#settings"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentPage === 'settings'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </a>
          </div>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}