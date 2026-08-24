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

// Pages
import Home from '@/pages/Home'
import Apps from '@/pages/Apps'
import Feed from '@/pages/Feed'
import { lazy, Suspense } from 'react'
const MessagesPage = lazy(() => import('@/pages/MessagesPage'))
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Dashboard from '@/pages/Dashboard'
import NotificationsPage from '@/pages/NotificationsPage'
const Analytics = lazy(() => import('@/pages/Analytics'))
import ApiDocs from '@/pages/ApiDocs'
import ProfilePage from '@/pages/ProfilePage'
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const WalletPage = lazy(() => import('@/pages/WalletPage'))
import ReceiptsPage from '@/pages/ReceiptsPage'
import RequireSession from '@/components/RequireSession'

// Sub-apps
const VestDen = lazy(() => import('@/apps/vestden/VestDen'))
const ConceptNexus = lazy(() => import('@/apps/conceptnexus/ConceptNexus'))
const Collaboard = lazy(() => import('@/apps/collaboard/Collaboard'))
const SkillsCanvas = lazy(() => import('@/apps/skillscanvas/SkillsCanvas'))
const TalentProfile = lazy(() => import('@/apps/skillscanvas/TalentProfile'))
const OpsPage = lazy(() => import('@/pages/OpsPage'))

// Simple placeholder pages
function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-4">About Fixars</h1>
      <p className="text-muted mb-4">
        Fixars is the future of connected productivity—a unified platform that brings together
        idea validation, collaboration, and talent sourcing under one seamless ecosystem.
      </p>
      <p className="text-muted mb-4">
        Our vision is to create an interconnected world where ideas flow freely between apps,
        where a validated concept in ConceptNexus can
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

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

function ForgotPassword() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">🔑</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">No live password reset</h1>
      <p className="text-muted mb-6">This is a public prototype. Dummy sign-in does not reset a live account. Go back to login and enter the demo.</p>
      <a href="/login" className="inline-block px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity">Back to prototype sign-in</a>
    </div>
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
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Authenticated routes also available here as fallback — gated */}
            <Route path="/apps" element={<RequireSession><Apps /></RequireSession>} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/dashboard" element={<RequireSession><Dashboard /></RequireSession>} />
            <Route path="/apps/vestden" element={<RequireSession><VestDen /></RequireSession>} />
            <Route path="/apps/conceptnexus" element={<RequireSession><ConceptNexus /></RequireSession>} />
            <Route path="/apps/collaboard" element={<RequireSession><Collaboard /></RequireSession>} />
            <Route path="/apps/skillscanvas" element={<RequireSession><SkillsCanvas /></RequireSession>} />
            <Route path="/apps/skillscanvas/talent/:id" element={<RequireSession><TalentProfile /></RequireSession>} />
            <Route path="/profile" element={<RequireSession><ProfilePage /></RequireSession>} />
            <Route path="/wallet" element={<RequireSession><WalletPage /></RequireSession>} />
            <Route path="/receipts" element={<RequireSession><ReceiptsPage /></RequireSession>} />
            <Route path="/notifications" element={<RequireSession><NotificationsPage /></RequireSession>} />
            <Route path="/analytics" element={<RequireSession><Analytics /></RequireSession>} />
            <Route path="/developers" element={<ApiDocs />} />
            <Route path="/settings" element={<RequireSession><SettingsPage /></RequireSession>} />
            <Route path="/messages" element={<RequireSession><MessagesPage /></RequireSession>} />
            <Route path="/ops" element={<RequireSession><OpsPage /></RequireSession>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
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
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/apps" element={<Apps />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/wallet" element={<RequireSession><WalletPage /></RequireSession>} />
              {/* Signed-in users don't need the auth pages */}
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* Sub-apps */}
              <Route path="/apps/vestden" element={<VestDen />} />
              <Route path="/apps/conceptnexus" element={<ConceptNexus />} />
              <Route path="/apps/collaboard" element={<Collaboard />} />
              <Route path="/apps/skillscanvas" element={<SkillsCanvas />} />
              <Route path="/apps/skillscanvas/talent/:id" element={<TalentProfile />} />

              {/* Account */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/receipts" element={<RequireSession><ReceiptsPage /></RequireSession>} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/developers" element={<ApiDocs />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/ops" element={<OpsPage />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
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
  const routerBasename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return (
    <BrowserRouter basename={routerBasename}>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
          <WalletProvider>
          <PointsProvider>
            <SocialProvider>
              <SearchProvider>
                <AppLayout />
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
