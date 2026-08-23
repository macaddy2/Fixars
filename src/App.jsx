import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { PointsProvider } from '@/contexts/PointsContext'
import { SocialProvider } from '@/contexts/SocialContext'
import { DataProvider } from '@/contexts/DataContext'
import { WalletProvider } from '@/contexts/WalletContext'
import { SearchProvider } from '@/contexts/SearchContext'

// New shell components
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import MobileHeader from '@/components/MobileHeader'
import MobileNav from '@/components/MobileNav'

// Legacy components (used on public pages)
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RewardToast from '@/components/RewardToast'
import WalletToast from '@/components/WalletToast'
import SearchOverlay from '@/components/SearchOverlay'
import ScreenShield from '@/components/ScreenShield'

// Pages
import Home from '@/pages/Home'
import Apps from '@/pages/Apps'
import Feed from '@/pages/Feed'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Dashboard from '@/pages/Dashboard'
import NotificationsPage from '@/pages/NotificationsPage'
import Analytics from '@/pages/Analytics'
import ApiDocs from '@/pages/ApiDocs'
import ProfilePage from '@/pages/ProfilePage'
import SettingsPage from '@/pages/SettingsPage'
import WalletPage from '@/pages/WalletPage'

// Sub-apps
import VestDen from '@/apps/vestden/VestDen'
import ConceptNexus from '@/apps/conceptnexus/ConceptNexus'
import Collaboard from '@/apps/collaboard/Collaboard'
import SkillsCanvas from '@/apps/skillscanvas/SkillsCanvas'
import TalentProfile from '@/apps/skillscanvas/TalentProfile'

// Simple placeholder pages
function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-4">About Fixars</h1>
      <p className="text-muted mb-4">
        Fixars is the future of connected productivity—a unified platform that brings together investing,
        idea validation, collaboration, and talent sourcing under one seamless ecosystem.
      </p>
      <p className="text-muted mb-4">
        Our vision is to create an interconnected world where ideas flow freely between apps,
        where a validated concept in ConceptNexus can instantly become a funded stake in VestDen,
        be executed on Collaboard, and staffed from SkillsCanvas—all with a single login and
        a unified points system that rewards every action.
      </p>
      <p className="text-muted">
        Built for dreamers, doers, and everyone in between.
      </p>
    </div>
  )
}

function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-4">Terms of Service</h1>
      <p className="text-muted">Terms and conditions for using the Fixars platform.</p>
    </div>
  )
}

function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-4">Privacy Policy</h1>
      <p className="text-muted">How we handle and protect your data on Fixars.</p>
    </div>
  )
}

function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
      <p className="text-xl text-muted mb-6">Page not found</p>
      <a href="/" className="text-primary hover:underline">Go back home</a>
    </div>
  )
}

/** Gate for authenticated-only routes. */
function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

/** Keeps signed-in users away from the auth pages. */
function RedirectIfAuth({ children }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}



// Shared route definitions. `guard` wraps protected routes.
function AppRoutes({ guard }) {
  return (
    <>
      <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
      <Route path="/signup" element={<RedirectIfAuth><Signup /></RedirectIfAuth>} />
      <Route path="/about" element={<About />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/developers" element={<ApiDocs />} />

      {/* Protected app routes */}
      <Route path="/dashboard" element={guard(<Dashboard />)} />
      <Route path="/apps" element={guard(<Apps />)} />
      <Route path="/apps/vestden" element={guard(<VestDen />)} />
      <Route path="/apps/conceptnexus" element={guard(<ConceptNexus />)} />
      <Route path="/apps/collaboard" element={guard(<Collaboard />)} />
      <Route path="/apps/skillscanvas" element={guard(<SkillsCanvas />)} />
      <Route path="/apps/skillscanvas/talent/:id" element={guard(<TalentProfile />)} />
      <Route path="/profile" element={guard(<ProfilePage />)} />
      <Route path="/wallet" element={guard(<WalletPage />)} />
      <Route path="/notifications" element={guard(<NotificationsPage />)} />
      <Route path="/analytics" element={guard(<Analytics />)} />
      <Route path="/settings" element={guard(<SettingsPage />)} />
      <Route path="/messages" element={guard(<Feed />)} />

      {/* Public feed — browsing is open, posting requires auth */}
      <Route path="/feed" element={<Feed />} />

      <Route path="*" element={<NotFound />} />
    </>
  )
}

/**
 * Layout wrapper that shows either the authenticated shell (sidebar+topbar)
 * or the public layout depending on auth state and route.
 * The home route ("/") renders the full-page splash without any Header/Footer wrapper.
 */
function AppLayout() {
  const { user } = useAuth()
  const location = useLocation()

  // The landing page is always rendered standalone (no app chrome)
  if (!user && location.pathname === '/') {
    return (
      <>
        <SearchOverlay />
        <Home />
        <RewardToast />
      </>
    )
  }

  // If not authenticated on other public pages, use classic header+footer layout
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <SearchOverlay />
        <div className="flex-1">
          <Routes>
            <AppRoutes guard={(el) => <RequireAuth>{el}</RequireAuth>} />
          </Routes>
        </div>
        <Footer />
        <RewardToast />
      </div>
    )
  }

  // Authenticated — use new app shell
  return (
    <>
      <div className="app-shell">
        <Sidebar />
        <main className="fx-main">
          <MobileHeader />
          <TopBar />
          <SearchOverlay />
          <section className="fx-content">
            <Routes>
              {/* Authenticated shell serves the dashboard at "/" */}
              <Route path="/" element={<Dashboard />} />
              <AppRoutes guard={(el) => el} />
            </Routes>
          </section>
        </main>
      </div>
      <MobileNav />
      <RewardToast />
      <WalletToast />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
          <WalletProvider>
          <PointsProvider>
            <SocialProvider>
              <SearchProvider>
                <AppLayout />
                <ScreenShield />
              </SearchProvider>
            </SocialProvider>
          </PointsProvider>
          </WalletProvider>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
