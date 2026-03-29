# WeatherLens 🌤️

A responsive weather dashboard built with React + Vite, powered by the [Open-Meteo API](https://open-meteo.com). Auto-detects your location via browser GPS and provides real-time weather conditions, hourly forecasts, and up to 2 years of historical data.

---

## Live Demo

🔗 [https://weather-dashboard-zeta-seven.vercel.app/]([https://weatherlens.vercel.app](https://weather-dashboard-zeta-seven.vercel.app/)) _(replace with your deployed URL)_

---

## Features

### Page 1 — Current Weather
- **GPS auto-detection** on load (falls back to Mumbai if denied)
- **Date picker** to view any past date
- **9 metric cards** — temperature (current/min/max), precipitation, humidity, UV index, sunrise/sunset, max wind, precip probability
- **7 air quality cards** — AQI with color-coded severity, PM10, PM2.5, CO, NO₂, SO₂, CO₂
- **6 hourly charts** with horizontal scroll and drag-to-pan:
  - Temperature (with °C / °F toggle)
  - Relative Humidity
  - Precipitation
  - Visibility
  - Wind Speed (10m)
  - PM10 & PM2.5 (combined)

### Page 2 — Historical Analysis (up to 2 years)
- **Date range picker** with 1-click presets (7 days, 1 month, 6 months, 1 year, 2 years)
- **Max 2-year range** enforced with validation
- **5 historical charts**:
  - Temperature Mean/Max/Min — multi-line chart with °C/°F toggle
  - Sunrise & Sunset in IST — area chart (daylight band)
  - Precipitation totals — bar chart
  - Wind speed + dominant direction — composed bar + scatter chart
  - PM10 & PM2.5 trends — dual-line chart
- **Period summary** stats card (avg temp, max/min temp, total rainfall, avg wind, days)

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| React Router v6 | Client-side routing |
| Recharts | All charts |
| React DatePicker | Date / range picker |
| date-fns | Date utilities |
| Axios | HTTP requests |
| Tailwind CSS | Utility-first styling |
| Open-Meteo API | Weather data (free, no API key) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/weather-dashboard.git
cd weather-dashboard

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect the GitHub repo to [vercel.com](https://vercel.com) for automatic deployments on every push.

---

## Project Structure

```
src/
├── hooks/
│   ├── useGeolocation.js     # Browser GPS detection
│   ├── useWeather.js         # Current weather data fetching
│   └── useHistorical.js      # Historical data fetching
├── services/
│   └── api.js                # All Open-Meteo API calls
├── components/
│   ├── Navbar.jsx            # Top navigation
│   ├── MetricCard.jsx        # Individual data card
│   ├── ChartWrapper.jsx      # Scroll + drag container for charts
│   ├── CustomTooltip.jsx     # Recharts tooltip
│   └── Skeleton.jsx          # Loading skeleton components
├── pages/
│   ├── CurrentWeather.jsx    # Page 1 — today's weather
│   └── Historical.jsx        # Page 2 — date range analysis
├── utils/
│   └── helpers.js            # Conversions, formatters, IST helpers
├── App.jsx                   # Router
├── main.jsx                  # Entry point
└── index.css                 # Global styles + design tokens
```

---

## API Reference

This app uses three Open-Meteo endpoints — **no API key required**:

| Endpoint | Used for |
|----------|---------|
| `api.open-meteo.com/v1/forecast` | Current + hourly weather |
| `air-quality-api.open-meteo.com/v1/air-quality` | AQI, PM10, PM2.5, NO₂, SO₂, CO |
| `archive-api.open-meteo.com/v1/archive` | Historical daily data |

All API calls are made in **parallel** using `Promise.all()` to stay within the 500ms rendering budget.

---

## Performance

- Parallel API fetching with `Promise.all`
- `React.memo` on all chart and card components
- Skeleton UI renders immediately while data loads
- Large date ranges are auto-downsampled for chart performance

---

