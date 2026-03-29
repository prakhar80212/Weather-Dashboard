import { memo, useRef } from 'react'
import { motion } from 'framer-motion'

const ChartWrapper = memo(function ChartWrapper({ title, children, minWidth = 600, rightSlot }) {
  const scrollRef = useRef(null)

  // Enable drag-to-scroll
  const handleMouseDown = (e) => {
    const el = scrollRef.current
    if (!el) return
    el.isDragging = true
    el.startX = e.pageX - el.offsetLeft
    el.scrollStartLeft = el.scrollLeft
  }

  const handleMouseMove = (e) => {
    const el = scrollRef.current
    if (!el || !el.isDragging) return
    const x = e.pageX - el.offsetLeft
    el.scrollLeft = el.scrollStartLeft - (x - el.startX)
  }

  const stopDrag = () => {
    if (scrollRef.current) scrollRef.current.isDragging = false
  }

  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        {rightSlot && <div>{rightSlot}</div>}
      </div>

      {/* Scrollable chart area */}
      <div
        ref={scrollRef}
        className="chart-scroll select-none"
        style={{ padding: '16px 8px 8px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        <div style={{ minWidth }}>
          {children}
        </div>
      </div>
    </motion.div>
  )
})

export default ChartWrapper
