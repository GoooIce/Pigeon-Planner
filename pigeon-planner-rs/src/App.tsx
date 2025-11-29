import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/layout/Layout'
import PigeonList from './components/pigeons/PigeonList'
import { BreedingManager } from './components/breeding/BreedingManager'
import { RaceManager } from './components/races/RaceManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Users, GitBranch, Trophy, Heart, Calculator, Book, Settings, Database } from 'lucide-react'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Dashboard Component
function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pigeon Planner Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总鸽数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">暂无数据</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃配对</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">暂无数据</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">比赛记录</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">暂无数据</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">健康记录</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">暂无数据</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>常用功能快速访问</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              添加新鸽子
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Heart className="mr-2 h-4 w-4" />
              创建新配对
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Trophy className="mr-2 h-4 w-4" />
              录入比赛成绩
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Heart className="mr-2 h-4 w-4" />
              健康检查记录
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
            <CardDescription>应用程序状态和版本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">版本</span>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">数据库</span>
              <span className="text-sm text-muted-foreground">SQLite</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">状态</span>
              <span className="text-sm text-green-600">运行正常</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Placeholder components for other pages
function PedigreePage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">血统管理</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">血统管理功能开发中...</p>
        </CardContent>
      </Card>
    </div>
  )
}

function ResultsPage() {
  return <RaceManager />
}

function HealthPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">健康管理</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">健康管理功能开发中...</p>
        </CardContent>
      </Card>
    </div>
  )
}

function CalculatorPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">计算器工具</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">计算器功能开发中...</p>
        </CardContent>
      </Card>
    </div>
  )
}

function AddressBookPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">地址簿</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">地址簿功能开发中...</p>
        </CardContent>
      </Card>
    </div>
  )
}

function ImportExportPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">导入导出</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">导入导出功能开发中...</p>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">设置</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">设置功能开发中...</p>
        </CardContent>
      </Card>
    </div>
  )
}

function App() {
  const [currentPage, setCurrentPage] = useState('pigeons')

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setCurrentPage(hash)
      }
    }

    // Set initial page based on hash
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'pigeons':
        return <PigeonList />
      case 'pedigree':
        return <PedigreePage />
      case 'results':
        return <ResultsPage />
      case 'breeding':
        return <BreedingManager />
      case 'health':
        return <HealthPage />
      case 'calculator':
        return <CalculatorPage />
      case 'address-book':
        return <AddressBookPage />
      case 'import-export':
        return <ImportExportPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Layout currentPage={currentPage}>
          <div className="flex flex-col h-full">
            {renderCurrentPage()}
          </div>
        </Layout>
      </div>
    </QueryClientProvider>
  )
}

export default App