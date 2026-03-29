import { useState, useMemo, useCallback } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { subYears, subMonths, subDays, isAfter, differenceInDays } from 'date-fns'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart, Scatter
} from 'recharts'

import { useGeolocation } from '../hooks/useGeolocation'
import { useHistorical } from '../hooks/useHistorical'
import ChartWrapper from '../components/ChartWrapper'
import { SkeletonChart } from '../components/Skeleton'
import CustomTooltip from '../components/CustomTooltip'
import { formatDate, minutesToTime, timeToMinutes, degreesToCompass } from '../utils/helpers'

const CHART_COLORS = {
  blue:   '#63b3ed',
  cyan:   '#4fd1c5',
  amber:  '#f6ad55',
  rose:   '#fc8181',
  green:  '#68d391',
  purple: '#b794f4',
  grid:   'rgba(255,255,255,0.04)',
  axis:   '#4b5563',
}

const axisStyle = { fill: CHART_COLORS.axis, fontSize: 10, fontFamily: 'DM Mono' }

const MAX_YEARS = 2
const PRESETS = [
  { label: '7 days',  start: () => subDays(new Date(), 7) },
  { label: '1 month', start: () => subMonths(new Date(), 1) },
  { label: '6 months',start: () => subMonths(new Date(), 6) },
  { label: '1 year',  start: () => subYears(new Date(), 1) },
  { label: '2 years', start: () => subYears(new Date(), 2) },
]

export default function Historical() {
  const today = useMemo(() => new Date(), [])
  const minDate = useMemo(() => subYears(today, MAX_YEARS), [today])

  const [startDate, setStartDate] = useState(subMonths(today, 3))
  const [endDate, setEndDate]     = useState(subDays(today, 1))
  const [tempUnit, setTempUnit]   = useState('C')

  const { coords } = useGeolocation()
  const { data, loading, error } = useHistorical(coords, startDate, endDate)

  // ── Validate date range ────────────────────────────────────────────────
  const handleDateChange = useCallback(([start, end]) => {
    if (!start) return
    if (end && isAfter(end, today))       { setEndDate(subDays(today, 1)); return }
    if (end && differenceInDays(end, start) > 730) return // max 2 years
    setStartDate(start)
    setEndDate(end || null)
  }, [today])

  const applyPreset = (preset) => {
    setStartDate(preset.start())
    setEndDate(subDays(today, 1))
  }

  // ── Transform API data into chart-ready arrays ─────────────────────────
  const weatherData = useMemo(() => {
    if (!data?.weather?.daily) return []
    const d = data.weather.daily
    return (d.time || []).map((date, i) => ({
      date: formatDate(date),
      rawDate: date,
      tempMax:   d.temperature_2m_max?.[i],
      tempMin:   d.temperature_2m_min?.[i],
      tempMean:  d.temperature_2m_mean?.[i],
      precip:    d.precipitation_sum?.[i],
      windMax:   d.windspeed_10m_max?.[i],
      windDir:   d.winddirection_10m_dominant?.[i],
      sunriseMin: timeToMinutes(d.sunrise?.[i]),
      sunsetMin:  timeToMinutes(d.sunset?.[i]),
    }))
  }, [data])

  // Down-sample for large ranges to keep charts fast
  const sampledData = useMemo(() => {
    if (weatherData.length <= 60) return weatherData
    const step = Math.ceil(weatherData.length / 60)
    return weatherData.filter((_, i) => i % step === 0)
  }, [weatherData])

  const airData = useMemo(() => {
    if (!data?.air?.hourly) return []
    const h = data.air.hourly
    // Aggregate hourly to daily (take noon value or mean)
    const byDate = {}
    ;(h.time || []).forEach((t, i) => {
      const d = t.split('T')[0]
      if (!byDate[d]) byDate[d] = { pm10: [], pm25: [] }
      if (h.pm10?.[i] != null) byDate[d].pm10.push(h.pm10[i])
      if (h.pm2_5?.[i] != null) byDate[d].pm25.push(h.pm2_5[i])
    })
    return Object.entries(byDate).map(([date, vals]) => ({
      date: formatDate(date),
      pm10: vals.pm10.length ? +(vals.pm10.reduce((a, b) => a + b, 0) / vals.pm10.length).toFixed(1) : null,
      pm25: vals.pm25.length ? +(vals.pm25.reduce((a, b) => a + b, 0) / vals.pm25.length).toFixed(1) : null,
    }))
  }, [data])

  // Convert temperature if needed
  const tempData = useMemo(() => {
    return sampledData.map(d => ({
      ...d,
      tempMax:  d.tempMax  != null ? (tempUnit === 'F' ? +(d.tempMax  * 9/5 + 32).toFixed(1) : d.tempMax)  : null,
      tempMin:  d.tempMin  != null ? (tempUnit === 'F' ? +(d.tempMin  * 9/5 + 32).toFixed(1) : d.tempMin)  : null,
      tempMean: d.tempMean != null ? (tempUnit === 'F' ? +(d.tempMean * 9/5 + 32).toFixed(1) : d.tempMean) : null,
    }))
  }, [sampledData, tempUnit])

  const dayCount = differenceInDays(endDate || today, startDate)
  const minChartWidth = Math.max(700, dayCount * 2)

  return (
    <div className="pt-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Historical Analysis</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Up to 2 years · {dayCount} days selected
          </p>
        </div>

        {/* Date range controls */}
        <div className="flex flex-col gap-3 sm:items-end">
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Range picker */}
          <div className="flex items-center gap-2">
            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              minDate={minDate}
              maxDate={subDays(today, 1)}
              dateFormat="dd MMM yyyy"
              customInput={<RangeInput start={startDate} end={endDate} />}
              popperPlacement="bottom-end"
              monthsShown={2}
            />
          </div>
        </div>
      </div>

      {/* Validation warning */}
      {endDate && differenceInDays(endDate, startDate) > 730 && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)', color: '#fc8181' }}>
          ⚠️ Maximum range is 2 years. Please adjust your selection.
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonChart key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} />
      ) : !endDate ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* 1. Temperature */}
          <ChartWrapper
            title="Temperature (Mean / Max / Min)"
            minWidth={minChartWidth}
            rightSlot={<TempToggle value={tempUnit} onChange={setTempUnit} />}
          >
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={tempData} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="date" tick={axisStyle} interval="preserveStartEnd" />
                <YAxis tick={axisStyle} unit={tempUnit === 'C' ? '°C' : '°F'} />
                <Tooltip content={<CustomTooltip unit={tempUnit === 'C' ? '°C' : '°F'} />} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                <Line type="monotone" dataKey="tempMax"  name="Max"  stroke={CHART_COLORS.rose}   strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="tempMean" name="Mean" stroke={CHART_COLORS.amber}  strokeWidth={2}   dot={false} />
                <Line type="monotone" dataKey="tempMin"  name="Min"  stroke={CHART_COLORS.blue}   strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* 2. Sunrise / Sunset (IST) */}
          <ChartWrapper title="Sun Cycle — Sunrise & Sunset (IST)" minWidth={minChartWidth}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={sampledData} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CHART_COLORS.amber} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART_COLORS.amber} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="date" tick={axisStyle} interval="preserveStartEnd" />
                <YAxis tick={axisStyle} tickFormatter={minutesToTime} domain={['auto', 'auto']} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="custom-tooltip" style={{ background: '#1a2236', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: 11 }}>{label}</p>
                        {payload.map((p, i) => (
                          <div key={i} className="flex gap-2">
                            <span style={{ color: p.color }}>{p.name}:</span>
                            <span style={{ color: '#f0f4ff' }}>{minutesToTime(p.value)}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                <Area type="monotone" dataKey="sunsetMin"  name="Sunset"  stroke={CHART_COLORS.amber}  fill="url(#sunGrad)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="sunriseMin" name="Sunrise" stroke={CHART_COLORS.rose}   fill="transparent"   strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* 3. Precipitation */}
          <ChartWrapper title="Precipitation — Daily Total" minWidth={minChartWidth}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sampledData} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="date" tick={axisStyle} interval="preserveStartEnd" />
                <YAxis tick={axisStyle} unit=" mm" />
                <Tooltip content={<CustomTooltip unit="mm" />} />
                <Bar dataKey="precip" name="Precipitation" fill={CHART_COLORS.blue} radius={[2, 2, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* 4. Wind Speed + Direction */}
          <ChartWrapper title="Wind — Max Speed & Dominant Direction" minWidth={minChartWidth}>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={sampledData} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="date" tick={axisStyle} interval="preserveStartEnd" />
                <YAxis yAxisId="left"  tick={axisStyle} unit=" km/h" />
                <YAxis yAxisId="right" orientation="right" tick={axisStyle} domain={[0, 360]} tickFormatter={v => degreesToCompass(v)} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div style={{ background: '#1a2236', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: 11 }}>{label}</p>
                        {payload.map((p, i) => (
                          <div key={i} className="flex gap-2">
                            <span style={{ color: p.color, fontSize: 11 }}>{p.name}:</span>
                            <span style={{ color: '#f0f4ff' }}>
                              {p.dataKey === 'windDir' ? degreesToCompass(p.value) : `${p.value} km/h`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                <Bar      yAxisId="left"  dataKey="windMax" name="Max Speed" fill={CHART_COLORS.cyan}   radius={[2,2,0,0]} maxBarSize={16} opacity={0.8} />
                <Scatter  yAxisId="right" dataKey="windDir" name="Direction" fill={CHART_COLORS.amber}  opacity={0.7} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* 5. PM10 & PM2.5 */}
          <ChartWrapper title="Air Quality — PM10 & PM2.5 Trends" minWidth={minChartWidth}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={airData} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="date" tick={axisStyle} interval="preserveStartEnd" />
                <YAxis tick={axisStyle} unit=" μg" />
                <Tooltip content={<CustomTooltip unit="μg/m³" />} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                <Line type="monotone" dataKey="pm10" name="PM10"  stroke={CHART_COLORS.blue}   strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
                <Line type="monotone" dataKey="pm25" name="PM2.5" stroke={CHART_COLORS.purple} strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>

          {/* Stats summary card */}
          <div className="rounded-2xl p-5 fade-up lg:col-span-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Period Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { label: 'Avg Temp', value: avg(weatherData.map(d => d.tempMean)), unit: '°C' },
                { label: 'Max Temp', value: Math.max(...weatherData.map(d => d.tempMax).filter(Boolean)), unit: '°C' },
                { label: 'Min Temp', value: Math.min(...weatherData.map(d => d.tempMin).filter(Boolean)), unit: '°C' },
                { label: 'Total Rain', value: weatherData.reduce((s, d) => s + (d.precip || 0), 0).toFixed(0), unit: 'mm' },
                { label: 'Avg Wind', value: avg(weatherData.map(d => d.windMax)), unit: 'km/h' },
                { label: 'Days', value: weatherData.length, unit: '' },
              ].map(({ label, value, unit }) => (
                <div key={label}>
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
                  <div className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {isFinite(value) ? value : '--'}<span className="text-sm ml-0.5" style={{ color: 'var(--text-secondary)' }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

const RangeInput = ({ value, onClick, start, end }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    {start ? start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Start'} —{' '}
    {end   ? end.toLocaleDateString('en-IN',   { day: 'numeric', month: 'short', year: 'numeric' }) : 'End'}
  </button>
)

function TempToggle({ value, onChange }) {
  return (
    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {['C', 'F'].map(u => (
        <button key={u} onClick={() => onChange(u)} className="px-3 py-1 text-xs font-medium transition-all"
          style={{ background: value === u ? 'rgba(99,179,237,0.15)' : 'transparent', color: value === u ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
          °{u}
        </button>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="text-5xl opacity-30">📅</div>
      <p style={{ color: 'var(--text-secondary)' }}>Select an end date to load historical data</p>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="text-4xl">⚠️</div>
      <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
    </div>
  )
}

function avg(arr) {
  const valid = arr.filter(Boolean)
  if (!valid.length) return '--'
  return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1)
}
