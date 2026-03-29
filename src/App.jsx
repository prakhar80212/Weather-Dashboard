import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import CurrentWeather from './pages/CurrentWeather'
import Historical from './pages/Historical'
import { useGeolocation } from './hooks/useGeolocation'

function AnimatedRoutes({ geoLocation }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={location}>
          <Route path="/" element={<CurrentWeather />} />
          <Route path="/history" element={<Historical />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  const { location: geoLocation } = useGeolocation()
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navbar location={geoLocation} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <AnimatedRoutes geoLocation={geoLocation} />
        </main>
      </div>
    </BrowserRouter>
  )
}
