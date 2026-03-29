import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar({ location }) {
  return (
    <nav className="sticky top-0 z-40 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-glass)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,179,237,0.15)', border: '1px solid rgba(99,179,237,0.3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#63b3ed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
            </div>
            <span className="font-semibold tracking-tight" style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
              WeatherLens
            </span>

            {/* Location pill */}
            <AnimatePresence>
              {location && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.3 }}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.2)', color: 'var(--accent-blue)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  {location}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive ? 'text-white' : 'hover:text-white'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(99,179,237,0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(99,179,237,0.25)' : '1px solid transparent',
              })}
            >
              Today
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive ? '' : ''
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(99,179,237,0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(99,179,237,0.25)' : '1px solid transparent',
              })}
            >
              Historical
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  )
}
