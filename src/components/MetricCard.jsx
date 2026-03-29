import { memo } from 'react'
import { motion } from 'framer-motion'

const MetricCard = memo(function MetricCard({ label, value, unit, sub, icon, accentColor = 'var(--accent-blue)', large = false, rightSlot }) {
  return (
    <motion.div
      className="rounded-2xl p-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          {rightSlot}
          {icon && (
            <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}>
              <span style={{ color: accentColor, fontSize: 14 }}>{icon}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-end gap-1.5">
        <span
          className="font-semibold leading-none"
          style={{
            color: 'var(--text-primary)',
            fontSize: large ? '2rem' : '1.6rem',
          }}
        >
          {value ?? '--'}
        </span>
        {unit && (
          <span className="pb-0.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {unit}
          </span>
        )}
      </div>

      {sub && (
        <div className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          {sub}
        </div>
      )}
    </motion.div>
  )
})

export default MetricCard
