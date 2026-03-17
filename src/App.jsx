import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { PointsProvider } from '@/contexts/PointsContext'
import { SocialProvider } from '@/contexts/SocialContext'
import { DataProvider } from '@/contexts/DataContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RewardToast from '@/components/RewardToast'

// Pages
import Home from '@/pages/Home'
import Apps from '@/pages/Apps'
import Feed from '@/pages/Feed'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Dashboard from '@/pages/Dashboard'

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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <PointsProvider>
            <SocialProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1">
                  <Routes>
                    {/* Core pages */}
                    <Route path="/" element={<Home />} />
                    <Route path="/apps" element={<Apps />} />
                    <Route path="/feed" element={<Feed />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />

                    {/* Sub-apps */}
                    <Route path="/apps/vestden" element={<VestDen />} />
                    <Route path="/apps/conceptnexus" element={<ConceptNexus />} />
                    <Route path="/apps/collaboard" element={<Collaboard />} />
                    <Route path="/apps/skillscanvas" element={<SkillsCanvas />} />
                    <Route path="/apps/skillscanvas/talent/:id" element={<TalentProfile />} />

                    {/* Placeholders for additional routes */}
                    <Route path="/profile" element={<Dashboard />} />
                    <Route path="/messages" element={<Feed />} />
                    <Route path="/notifications" element={<Feed />} />
                    <Route path="/settings" element={<About />} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
                <Footer />
                <RewardToast />
              </div>
            </SocialProvider>
          </PointsProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
