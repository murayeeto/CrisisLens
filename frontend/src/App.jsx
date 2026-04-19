import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

const router_future_flags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { BackgroundFX } from './components/layout/BackgroundFX'
import { Navbar } from './components/layout/Navbar'
import { TickerBar } from './components/layout/TickerBar'
import { CommandPalette } from './components/layout/CommandPalette'
import { EventDetailPanel } from './components/event/EventDetailPanel'
import { RequireAccountAccess } from './components/auth/RequireAccountAccess'
import HomePage from './routes/HomePage'
import TrendingPage from './routes/TrendingPage'
import UserPage from './routes/UserPage'
import AccountPage from './routes/AccountPage'
import NotFoundPage from './routes/NotFoundPage'
import { LoginPage } from './routes/LoginPage'
import { SignupPage } from './routes/SignupPage'
import OnboardingPage from './routes/OnboardingPage'
import ReliefCreatePage from './routes/ReliefCreatePage'
import ReliefCampaignPage from './routes/ReliefCampaignPage'

function RouteFrame({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function AppLayout() {
  const location = useLocation()
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [activeSeverities, setActiveSeverities] = useState([])
  const immersiveRoute = ['/login', '/signup', '/onboarding'].includes(location.pathname)
  const reliefRoute = location.pathname.startsWith('/relief')

  const openEvent = useCallback((id) => setSelectedEventId(id), [])
  const closeEvent = useCallback(() => setSelectedEventId(null), [])
  const toggleSeverity = useCallback((severity) => {
    setActiveSeverities((current) =>
      current.includes(severity) ? current.filter((item) => item !== severity) : [...current, severity],
    )
  }, [])
  const clearSeverityFilter = useCallback(() => setActiveSeverities([]), [])

  useEffect(() => {
    const handleOpenEvent = (event) => {
      const id = typeof event.detail === 'string' ? event.detail : event.detail?.id
      if (id) setSelectedEventId(id)
    }

    window.addEventListener('crisislens:open-event', handleOpenEvent)
    return () => window.removeEventListener('crisislens:open-event', handleOpenEvent)
  }, [])

  useEffect(() => {
    const search = new URLSearchParams(location.search)
    const sharedEventId = search.get('event')
    if (sharedEventId) {
      setSelectedEventId(sharedEventId)
    }
  }, [location.search])

  useEffect(() => {
    if (reliefRoute) {
      setSelectedEventId(null)
    }
  }, [reliefRoute])

  return (
    <>
      <BackgroundFX />
      {!immersiveRoute ? <Navbar /> : null}
      <main className={`relative z-10 min-h-screen ${immersiveRoute ? '' : 'pt-16'}`}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/login"
              element={
                <RouteFrame>
                  <LoginPage />
                </RouteFrame>
              }
            />
            <Route
              path="/signup"
              element={
                <RouteFrame>
                  <SignupPage />
                </RouteFrame>
              }
            />
            <Route
              path="/onboarding"
              element={
                <RouteFrame>
                  <OnboardingPage />
                </RouteFrame>
              }
            />
            <Route
              path="/"
              element={
                <RouteFrame>
                  <HomePage
                    onOpenEvent={openEvent}
                    detailEventId={selectedEventId}
                    isDetailOpen={Boolean(selectedEventId)}
                    activeSeverities={activeSeverities}
                    onToggleSeverity={toggleSeverity}
                  />
                </RouteFrame>
              }
            />
            <Route
              path="/trending"
              element={
                <RouteFrame>
                  <TrendingPage onOpenEvent={openEvent} activeEventId={selectedEventId} />
                </RouteFrame>
              }
            />
            <Route
              path="/for-you"
              element={
                <RouteFrame>
                  <RequireAccountAccess>
                    <UserPage onOpenEvent={openEvent} activeEventId={selectedEventId} />
                  </RequireAccountAccess>
                </RouteFrame>
              }
            />
            <Route
              path="/account"
              element={
                <RouteFrame>
                  <RequireAccountAccess>
                    <AccountPage />
                  </RequireAccountAccess>
                </RouteFrame>
              }
            />
            <Route
              path="/relief/new"
              element={
                <RouteFrame>
                  <ReliefCreatePage />
                </RouteFrame>
              }
            />
            <Route
              path="/relief/:campaignId"
              element={
                <RouteFrame>
                  <ReliefCampaignPage />
                </RouteFrame>
              }
            />
            <Route
              path="/desk"
              element={
                <RouteFrame>
                  <Navigate to="/for-you" replace />
                </RouteFrame>
              }
            />
            <Route
              path="/user"
              element={
                <RouteFrame>
                  <Navigate to="/for-you" replace />
                </RouteFrame>
              }
            />
            <Route
              path="*"
              element={
                <RouteFrame>
                  <NotFoundPage />
                </RouteFrame>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
      {!immersiveRoute && !reliefRoute ? (
        <>
          <TickerBar
            activeSeverities={activeSeverities}
            onSelectSeverity={toggleSeverity}
            onClearSeverityFilter={clearSeverityFilter}
          />
          <CommandPalette />
          <EventDetailPanel eventId={selectedEventId} onClose={closeEvent} />
        </>
      ) : null}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter future={router_future_flags}>
      <AppLayout />
    </BrowserRouter>
  )
}
