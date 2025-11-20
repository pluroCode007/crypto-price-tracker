import { Chart } from "@/components/ui/chart"
/**
 * CryptoTracker - Cryptocurrency Price Tracker
 * This script handles fetching live cryptocurrency data from CoinGecko API,
 * rendering the data in cards, implementing search functionality, and displaying charts.
 */

// API Configuration
const API_BASE_URL = "https://api.coingecko.com/api/v3"
const COINS_TO_TRACK = ["bitcoin", "ethereum", "binancecoin", "cardano", "solana", "ripple", "polkadot", "dogecoin"]
const CHART_DAYS = 7 // Number of days for sparkline chart

// Global state
let allCryptoData = []
const chartInstances = {}

// DOM Elements
const searchInput = document.getElementById("searchInput")
const cryptoGrid = document.getElementById("cryptoGrid")
const loading = document.getElementById("loading")
const error = document.getElementById("error")
const lastUpdated = document.getElementById("lastUpdated")
const refreshBtn = document.getElementById("refreshBtn")
const retryBtn = document.getElementById("retryBtn")

/**
 * Fetches cryptocurrency market data from CoinGecko API
 * @returns {Promise<Array>} Array of cryptocurrency data
 */
async function fetchCryptoData() {
  try {
    // Fetch market data for specified coins with sparkline data
    const response = await fetch(
      `${API_BASE_URL}/coins/markets?vs_currency=usd&ids=${COINS_TO_TRACK.join(",")}&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d`,
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (err) {
    console.error("Error fetching crypto data:", err)
    throw err
  }
}

/**
 * Formats a number as currency (USD)
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  if (value === null || value === undefined) return "N/A"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value)
}

/**
 * Formats large numbers with abbreviations (K, M, B, T)
 * @param {number} value - The value to format
 * @returns {string} Formatted string with abbreviation
 */
function formatLargeNumber(value) {
  if (value === null || value === undefined) return "N/A"

  const abbreviations = [
    { threshold: 1e12, suffix: "T" },
    { threshold: 1e9, suffix: "B" },
    { threshold: 1e6, suffix: "M" },
    { threshold: 1e3, suffix: "K" },
  ]

  for (const { threshold, suffix } of abbreviations) {
    if (value >= threshold) {
      return "$" + (value / threshold).toFixed(2) + suffix
    }
  }

  return formatCurrency(value)
}

/**
 * Formats the percentage change with proper sign and styling
 * @param {number} change - The percentage change value
 * @returns {Object} Object with formatted text and CSS class
 */
function formatPercentageChange(change) {
  if (change === null || change === undefined) {
    return { text: "N/A", class: "" }
  }

  const isPositive = change >= 0
  const arrow = isPositive ? "↑" : "↓"
  const formattedChange = Math.abs(change).toFixed(2)

  return {
    text: `${arrow} ${formattedChange}%`,
    class: isPositive ? "positive" : "negative",
  }
}

/**
 * Creates a sparkline chart using Chart.js
 * @param {string} canvasId - The canvas element ID
 * @param {Array} sparklineData - Array of price data points
 * @param {number} priceChange - 24h price change percentage
 */
function createSparklineChart(canvasId, sparklineData, priceChange) {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return

  const ctx = canvas.getContext("2d")

  // Destroy existing chart if it exists
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy()
  }

  // Determine color based on price change
  const isPositive = priceChange >= 0
  const lineColor = isPositive ? "#10b981" : "#ef4444"
  const gradientColor = isPositive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"

  // Create gradient for area fill
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, gradientColor)
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

  // Create chart
  chartInstances[canvasId] = new Chart(ctx, {
    type: "line",
    data: {
      labels: sparklineData.map((_, i) => i), // Simple index labels
      datasets: [
        {
          data: sparklineData,
          borderColor: lineColor,
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: lineColor,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(30, 33, 40, 0.95)",
          titleColor: "#e8eaed",
          bodyColor: "#e8eaed",
          borderColor: "#2d3139",
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (context) => `Price: ${formatCurrency(context.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          display: false,
        },
        y: {
          display: false,
          beginAtZero: false,
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    },
  })
}

/**
 * Creates a cryptocurrency card element
 * @param {Object} coin - Cryptocurrency data object
 * @returns {HTMLElement} The created card element
 */
function createCryptoCard(coin) {
  const card = document.createElement("div")
  card.className = "crypto-card"
  card.dataset.name = coin.name.toLowerCase()
  card.dataset.symbol = coin.symbol.toLowerCase()

  // Format price change
  const priceChange = formatPercentageChange(coin.price_change_percentage_24h)

  // Generate unique canvas ID for the chart
  const canvasId = `chart-${coin.id}`

  // Build card HTML
  card.innerHTML = `
        <div class="card-header">
            <div class="coin-info">
                <img src="${coin.image}" alt="${coin.name}" class="coin-logo">
                <div class="coin-details">
                    <h3>${coin.name}</h3>
                    <span class="coin-symbol">${coin.symbol}</span>
                </div>
            </div>
            <div class="price-change ${priceChange.class}">
                ${priceChange.text}
            </div>
        </div>
        
        <div class="price-section">
            <div class="current-price">${formatCurrency(coin.current_price)}</div>
        </div>
        
        <div class="price-stats">
            <div class="stat-item">
                <div class="stat-label">Market Cap</div>
                <div class="stat-value">${formatLargeNumber(coin.market_cap)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">24h Volume</div>
                <div class="stat-value">${formatLargeNumber(coin.total_volume)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">24h High</div>
                <div class="stat-value">${formatCurrency(coin.high_24h)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">24h Low</div>
                <div class="stat-value">${formatCurrency(coin.low_24h)}</div>
            </div>
        </div>
        
        <div class="chart-container">
            <canvas id="${canvasId}"></canvas>
        </div>
    `

  return card
}

/**
 * Renders cryptocurrency cards to the DOM
 * @param {Array} cryptoData - Array of cryptocurrency data
 */
function renderCryptoCards(cryptoData) {
  // Clear existing content
  cryptoGrid.innerHTML = ""

  if (cryptoData.length === 0) {
    cryptoGrid.innerHTML =
      '<p style="text-align: center; color: var(--text-muted); grid-column: 1 / -1;">No cryptocurrencies found matching your search.</p>'
    return
  }

  // Create and append cards
  cryptoData.forEach((coin) => {
    const card = createCryptoCard(coin)
    cryptoGrid.appendChild(card)

    // Create chart after DOM insertion
    const canvasId = `chart-${coin.id}`
    if (coin.sparkline_in_7d && coin.sparkline_in_7d.price) {
      setTimeout(() => {
        createSparklineChart(canvasId, coin.sparkline_in_7d.price, coin.price_change_percentage_24h)
      }, 100)
    }
  })
}

/**
 * Filters cryptocurrency data based on search query
 * @param {string} query - The search query
 */
function filterCryptoData(query) {
  const searchTerm = query.toLowerCase().trim()

  if (searchTerm === "") {
    renderCryptoCards(allCryptoData)
    return
  }

  const filtered = allCryptoData.filter(
    (coin) => coin.name.toLowerCase().includes(searchTerm) || coin.symbol.toLowerCase().includes(searchTerm),
  )

  renderCryptoCards(filtered)
}

/**
 * Updates the last updated timestamp
 */
function updateLastUpdatedTime() {
  const now = new Date()
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
  lastUpdated.textContent = `Last updated: ${timeString}`
}

/**
 * Loads cryptocurrency data and renders the UI
 */
async function loadCryptoData() {
  try {
    // Show loading state
    loading.style.display = "block"
    error.style.display = "none"
    cryptoGrid.style.display = "none"

    // Fetch data
    const data = await fetchCryptoData()

    // Store data globally
    allCryptoData = data

    // Hide loading state
    loading.style.display = "none"
    cryptoGrid.style.display = "grid"

    // Render cards
    renderCryptoCards(allCryptoData)

    // Update timestamp
    updateLastUpdatedTime()
  } catch (err) {
    // Show error state
    loading.style.display = "none"
    error.style.display = "block"
    console.error("Failed to load crypto data:", err)
  }
}

/**
 * Refreshes the cryptocurrency data
 */
async function refreshData() {
  refreshBtn.disabled = true
  refreshBtn.style.opacity = "0.5"

  await loadCryptoData()

  refreshBtn.disabled = false
  refreshBtn.style.opacity = "1"
}

/**
 * Initialize the application
 */
function init() {
  // Load initial data
  loadCryptoData()

  // Set up search functionality with debouncing
  let searchTimeout
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      filterCryptoData(e.target.value)
    }, 300) // 300ms debounce delay
  })

  // Set up refresh button
  refreshBtn.addEventListener("click", refreshData)

  // Set up retry button
  retryBtn.addEventListener("click", loadCryptoData)

  // Auto-refresh every 60 seconds
  setInterval(() => {
    loadCryptoData()
  }, 60000)
}

// Start the application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
