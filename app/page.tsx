"use client"

import { useEffect, useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  PieChart,
  RefreshCw,
  Plus,
  X,
  Moon,
  Sun,
  ArrowUpDown,
  Flame,
  Calculator,
  Grid3x3,
  List,
  Sparkles,
} from "lucide-react"

interface CryptoData {
  id: string
  name: string
  symbol: string
  image: string
  current_price: number
  price_change_percentage_24h: number
  price_change_percentage_7d_in_currency: number
  market_cap: number
  total_volume: number
  circulating_supply: number
  total_supply: number
  max_supply: number
  market_cap_rank: number
  sparkline_in_7d: {
    price: number[]
  }
  high_24h: number
  low_24h: number
  ath: number
  ath_change_percentage: number
  atl: number
  atl_change_percentage: number
}

interface TrendingCoin {
  item: {
    id: string
    name: string
    symbol: string
    small: string
    price_btc: number
    market_cap_rank: number
    data: {
      price_change_percentage_24h: { usd: number }
    }
  }
}

interface PortfolioItem {
  id: string
  amount: number
}

interface GlobalData {
  total_market_cap: { usd: number }
  total_volume: { usd: number }
  market_cap_percentage: { [key: string]: number }
  market_cap_change_percentage_24h_usd: number
}

export default function CryptoTracker() {
  const [cryptos, setCryptos] = useState<CryptoData[]>([])
  const [filteredCryptos, setFilteredCryptos] = useState<CryptoData[]>([])
  const [trendingCoins, setTrendingCoins] = useState<TrendingCoin[]>([])
  const [featuredCoins, setFeaturedCoins] = useState<CryptoData[]>([])
  const [globalData, setGlobalData] = useState<GlobalData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [favorites, setFavorites] = useState<string[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "portfolio" | "trending" | "featured">("all")
  const [sortBy, setSortBy] = useState<"rank" | "price" | "change" | "volume" | "marketCap">("rank")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showAddModal, setShowAddModal] = useState<string | null>(null)
  const [amountInput, setAmountInput] = useState("")
  const [darkMode, setDarkMode] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "table">("table")
  const [showConverter, setShowConverter] = useState(false)
  const [converterFrom, setConverterFrom] = useState("bitcoin")
  const [converterTo, setConverterTo] = useState("ethereum")
  const [converterAmount, setConverterAmount] = useState("1")
  const [category, setCategory] = useState<string>("all")
  const [perPage, setPerPage] = useState(100)
  const chartRefs = useRef<{ [key: string]: any }>({})

  const fetchCryptoData = async () => {
    try {
      const [marketResponse, globalResponse, trendingResponse] = await Promise.all([
        fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=true&price_change_percentage=24h,7d`,
        ),
        fetch("https://api.coingecko.com/api/v3/global"),
        fetch("https://api.coingecko.com/api/v3/search/trending"),
      ])

      const marketData = await marketResponse.json()
      const globalDataResponse = await globalResponse.json()
      const trendingData = await trendingResponse.json()

      setCryptos(marketData)
      setGlobalData(globalDataResponse.data)
      setTrendingCoins(trendingData.coins || [])

      try {
        const featuredResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=brett,pepe,bonk,shiba-inu,dogecoin,floki&sparkline=true&price_change_percentage=24h,7d`,
        )
        const featuredData = await featuredResponse.json()
        setFeaturedCoins(featuredData)
      } catch (error) {
        console.error("Error fetching featured coins:", error)
      }

      setLoading(false)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error fetching crypto data:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    const savedFavorites = localStorage.getItem("crypto-favorites")
    const savedPortfolio = localStorage.getItem("crypto-portfolio")
    const savedDarkMode = localStorage.getItem("crypto-darkmode")

    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
    if (savedPortfolio) {
      setPortfolio(JSON.parse(savedPortfolio))
    }
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode))
    }

    fetchCryptoData()
    const interval = setInterval(fetchCryptoData, 60000)
    return () => clearInterval(interval)
  }, [perPage])

  useEffect(() => {
    localStorage.setItem("crypto-favorites", JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem("crypto-portfolio", JSON.stringify(portfolio))
  }, [portfolio])

  useEffect(() => {
    localStorage.setItem("crypto-darkmode", JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    let filtered = [...cryptos]

    // Apply tab filter
    if (activeTab === "favorites") {
      filtered = filtered.filter((crypto) => favorites.includes(crypto.id))
    } else if (activeTab === "portfolio") {
      filtered = filtered.filter((crypto) => portfolio.some((p) => p.id === crypto.id))
    } else if (activeTab === "trending") {
      const trendingIds = trendingCoins.map((t) => t.item.id)
      filtered = filtered.filter((crypto) => trendingIds.includes(crypto.id))
    } else if (activeTab === "featured") {
      const featuredIds = featuredCoins.map((f) => f.id)
      filtered = filtered.filter((crypto) => featuredIds.includes(crypto.id))
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "rank":
          comparison = a.market_cap_rank - b.market_cap_rank
          break
        case "price":
          comparison = a.current_price - b.current_price
          break
        case "change":
          comparison = a.price_change_percentage_24h - b.price_change_percentage_24h
          break
        case "volume":
          comparison = a.total_volume - b.total_volume
          break
        case "marketCap":
          comparison = a.market_cap - b.market_cap
          break
        default:
          comparison = 0
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredCryptos(filtered)
  }, [searchTerm, cryptos, activeTab, favorites, portfolio, trendingCoins, featuredCoins, sortBy, sortOrder])

  const toggleFavorite = (coinId: string) => {
    setFavorites((prev) => (prev.includes(coinId) ? prev.filter((id) => id !== coinId) : [...prev, coinId]))
  }

  const addToPortfolio = (coinId: string, amount: number) => {
    setPortfolio((prev) => {
      const existing = prev.find((p) => p.id === coinId)
      if (existing) {
        return prev.map((p) => (p.id === coinId ? { ...p, amount: p.amount + amount } : p))
      }
      return [...prev, { id: coinId, amount }]
    })
    setShowAddModal(null)
    setAmountInput("")
  }

  const removeFromPortfolio = (coinId: string) => {
    setPortfolio((prev) => prev.filter((p) => p.id !== coinId))
  }

  const getPortfolioValue = () => {
    return portfolio.reduce((total, item) => {
      const crypto = cryptos.find((c) => c.id === item.id)
      return total + (crypto ? crypto.current_price * item.amount : 0)
    }, 0)
  }

  const createMiniChart = (canvasId: string, prices: number[]) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = 2

    ctx.clearRect(0, 0, width, height)

    const max = Math.max(...prices)
    const min = Math.min(...prices)
    const range = max - min || 1

    const isPositive = prices[prices.length - 1] > prices[0]
    ctx.strokeStyle = isPositive ? "#10b981" : "#ef4444"
    ctx.lineWidth = 1.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    ctx.beginPath()
    prices.forEach((price, index) => {
      const x = padding + (index / (prices.length - 1)) * (width - padding * 2)
      const y = height - padding - ((price - min) / range) * (height - padding * 2)

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
  }

  useEffect(() => {
    if (filteredCryptos.length > 0) {
      setTimeout(() => {
        filteredCryptos.forEach((crypto) => {
          if (crypto.sparkline_in_7d?.price) {
            createMiniChart(`chart-${crypto.id}`, crypto.sparkline_in_7d.price)
          }
        })
      }, 100)
    }
  }, [filteredCryptos, viewMode])

  const formatPrice = (price: number) => {
    if (!price) return "$0.00"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price)
  }

  const formatLargeNumber = (num: number) => {
    if (!num) return "$0"
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const formatNumber = (num: number) => {
    if (!num) return "0"
    return new Intl.NumberFormat("en-US").format(Math.round(num))
  }

  const formatPercentage = (percentage: number) => {
    if (!percentage) return "0.00%"
    return `${percentage > 0 ? "+" : ""}${percentage.toFixed(2)}%`
  }

  const getConvertedValue = () => {
    const fromCrypto = cryptos.find((c) => c.id === converterFrom)
    const toCrypto = cryptos.find((c) => c.id === converterTo)
    if (!fromCrypto || !toCrypto || !converterAmount) return "0"
    const amount = Number.parseFloat(converterAmount)
    const result = (amount * fromCrypto.current_price) / toCrypto.current_price
    return result.toFixed(6)
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const bgClass = darkMode ? "bg-slate-950" : "bg-gray-50"
  const cardBgClass = darkMode ? "bg-slate-900/50" : "bg-white"
  const borderClass = darkMode ? "border-slate-800" : "border-gray-200"
  const textClass = darkMode ? "text-white" : "text-gray-900"
  const textSecondaryClass = darkMode ? "text-slate-400" : "text-gray-600"
  const hoverClass = darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"
  const inputBgClass = darkMode ? "bg-slate-800/50" : "bg-gray-100"

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-200`}>
      <header className={`border-b ${borderClass} ${cardBgClass} backdrop-blur-sm sticky top-0 z-20`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-xl font-bold ${textClass}`}>CryptoGecko Pro</h1>
                  <p className={`text-xs ${textSecondaryClass}`}>Track {perPage}+ cryptocurrencies</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowConverter(!showConverter)}
                variant="outline"
                size="sm"
                className={`${borderClass} ${inputBgClass} ${textClass} ${hoverClass}`}
              >
                <Calculator className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Converter</span>
              </Button>
              <Button
                onClick={() => setDarkMode(!darkMode)}
                variant="outline"
                size="sm"
                className={`${borderClass} ${inputBgClass} ${textClass} ${hoverClass}`}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => fetchCryptoData()}
                variant="outline"
                size="sm"
                className={`${borderClass} ${inputBgClass} ${textClass} ${hoverClass}`}
              >
                <RefreshCw className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {globalData && (
            <div className={`mt-4 flex flex-wrap gap-4 text-sm ${textSecondaryClass}`}>
              <div className="flex items-center gap-2">
                <span>Coins: </span>
                <span className={`font-medium ${textClass}`}>{perPage}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Market Cap: </span>
                <span className={`font-medium ${textClass}`}>{formatLargeNumber(globalData.total_market_cap.usd)}</span>
                <span
                  className={globalData.market_cap_change_percentage_24h_usd > 0 ? "text-emerald-500" : "text-red-500"}
                >
                  {formatPercentage(globalData.market_cap_change_percentage_24h_usd)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>24h Vol: </span>
                <span className={`font-medium ${textClass}`}>{formatLargeNumber(globalData.total_volume.usd)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>BTC Dom: </span>
                <span className={`font-medium ${textClass}`}>
                  {(globalData.market_cap_percentage.btc || 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>ETH Dom: </span>
                <span className={`font-medium ${textClass}`}>
                  {(globalData.market_cap_percentage.eth || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Featured Coins section with Brett prominently displayed */}
        {featuredCoins.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h2 className={`text-lg font-bold ${textClass}`}>Featured Meme Coins</h2>
              <span className={`text-xs ${textSecondaryClass}`}>Including BRETT</span>
            </div>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {featuredCoins.map((coin) => (
                <Card
                  key={coin.id}
                  className={`${borderClass} ${cardBgClass} backdrop-blur-sm p-3 cursor-pointer ${hoverClass} transition-all hover:scale-105`}
                  onClick={() => setSearchTerm(coin.name)}
                >
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <img src={coin.image || "/placeholder.svg"} alt={coin.name} className="h-10 w-10 rounded-full" />
                    <div className="text-center min-w-0 w-full">
                      <p className={`text-sm font-semibold ${textClass} truncate`}>{coin.name}</p>
                      <p className={`text-xs ${textSecondaryClass} uppercase`}>{coin.symbol}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-bold ${textClass} mb-1`}>{formatPrice(coin.current_price)}</p>
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className={`text-xs font-medium ${coin.price_change_percentage_24h > 0 ? "text-emerald-500" : "text-red-500"}`}
                      >
                        {formatPercentage(coin.price_change_percentage_24h)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {trendingCoins.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className={`text-lg font-bold ${textClass}`}>Trending</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {trendingCoins.slice(0, 7).map((trending) => (
                <Card
                  key={trending.item.id}
                  className={`flex-shrink-0 ${borderClass} ${cardBgClass} backdrop-blur-sm p-3 min-w-[180px] cursor-pointer ${hoverClass}`}
                  onClick={() => setSearchTerm(trending.item.name)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={trending.item.small || "/placeholder.svg"}
                      alt={trending.item.name}
                      className="h-6 w-6 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${textClass} truncate`}>{trending.item.name}</p>
                      <p className={`text-xs ${textSecondaryClass} uppercase`}>{trending.item.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-medium ${trending.item.data.price_change_percentage_24h.usd > 0 ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {formatPercentage(trending.item.data.price_change_percentage_24h.usd)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {showConverter && (
          <Card className={`${borderClass} ${cardBgClass} backdrop-blur-sm p-6 mb-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${textClass}`}>Crypto Converter</h3>
              <Button
                onClick={() => setShowConverter(false)}
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${hoverClass}`}
              >
                <X className={`h-5 w-5 ${textSecondaryClass}`} />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3 items-end">
              <div>
                <label className={`text-sm ${textSecondaryClass} mb-2 block`}>From</label>
                <select
                  value={converterFrom}
                  onChange={(e) => setConverterFrom(e.target.value)}
                  className={`w-full h-10 rounded-md border ${borderClass} ${inputBgClass} ${textClass} px-3`}
                >
                  {cryptos.slice(0, 50).map((crypto) => (
                    <option key={crypto.id} value={crypto.id}>
                      {crypto.name} ({crypto.symbol.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`text-sm ${textSecondaryClass} mb-2 block`}>Amount</label>
                <Input
                  type="number"
                  value={converterAmount}
                  onChange={(e) => setConverterAmount(e.target.value)}
                  className={`h-10 border ${borderClass} ${inputBgClass} ${textClass}`}
                />
              </div>
              <div>
                <label className={`text-sm ${textSecondaryClass} mb-2 block`}>To</label>
                <select
                  value={converterTo}
                  onChange={(e) => setConverterTo(e.target.value)}
                  className={`w-full h-10 rounded-md border ${borderClass} ${inputBgClass} ${textClass} px-3`}
                >
                  {cryptos.slice(0, 50).map((crypto) => (
                    <option key={crypto.id} value={crypto.id}>
                      {crypto.name} ({crypto.symbol.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={`mt-4 p-4 rounded-lg ${darkMode ? "bg-slate-800" : "bg-gray-100"}`}>
              <p className={`text-sm ${textSecondaryClass} mb-1`}>Result</p>
              <p className={`text-2xl font-bold ${textClass}`}>
                {getConvertedValue()} {cryptos.find((c) => c.id === converterTo)?.symbol.toUpperCase()}
              </p>
            </div>
          </Card>
        )}

        {portfolio.length > 0 && (
          <Card className={`${borderClass} ${cardBgClass} backdrop-blur-sm p-6 mb-6`}>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="h-5 w-5 text-blue-500" />
              <h2 className={`text-lg font-bold ${textClass}`}>Your Portfolio</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className={`text-sm ${textSecondaryClass} mb-1`}>Total Value</p>
                <p className={`text-2xl font-bold ${textClass}`}>{formatPrice(getPortfolioValue())}</p>
              </div>
              <div>
                <p className={`text-sm ${textSecondaryClass} mb-1`}>Holdings</p>
                <p className={`text-2xl font-bold ${textClass}`}>{portfolio.length}</p>
              </div>
              <div>
                <p className={`text-sm ${textSecondaryClass} mb-1`}>Best Performer</p>
                {(() => {
                  const bestPerformer = portfolio
                    .map((p) => ({
                      ...p,
                      crypto: cryptos.find((c) => c.id === p.id),
                    }))
                    .filter((p) => p.crypto)
                    .sort(
                      (a, b) =>
                        (b.crypto?.price_change_percentage_24h || 0) - (a.crypto?.price_change_percentage_24h || 0),
                    )[0]

                  return bestPerformer?.crypto ? (
                    <p className={`text-lg font-bold text-emerald-500`}>
                      {bestPerformer.crypto.symbol.toUpperCase()}{" "}
                      {formatPercentage(bestPerformer.crypto.price_change_percentage_24h)}
                    </p>
                  ) : (
                    <p className={`text-lg ${textSecondaryClass}`}>N/A</p>
                  )
                })()}
              </div>
              <div>
                <p className={`text-sm ${textSecondaryClass} mb-1`}>Favorites</p>
                <p className={`text-2xl font-bold ${textClass}`}>{favorites.length}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${textSecondaryClass}`} />
              <Input
                type="text"
                placeholder="Search cryptocurrencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`h-11 border ${borderClass} ${inputBgClass} pl-10 ${textClass} placeholder:${textSecondaryClass}`}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
                variant="outline"
                size="sm"
                className={`${borderClass} ${inputBgClass} ${textClass} ${hoverClass}`}
              >
                {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
              </Button>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className={`h-9 rounded-md border ${borderClass} ${inputBgClass} ${textClass} px-3 text-sm`}
              >
                <option value={50}>50 coins</option>
                <option value={100}>100 coins</option>
                <option value={250}>250 coins</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setActiveTab("all")}
              variant={activeTab === "all" ? "default" : "outline"}
              size="sm"
              className={
                activeTab === "all"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : `${borderClass} ${inputBgClass} ${textClass} ${hoverClass}`
              }
            >
              All Coins
            </Button>
            <Button
              onClick={() => setActiveTab("trending")}
              variant={activeTab === "trending" ? "default" : "outline"}
              size="sm"
              className={
                activeTab === "trending"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : `${borderClass} ${inputBgClass} ${textClass} ${hoverClass}`
              }
            >
              <Flame className="h-4 w-4 mr-1" />
              Trending ({trendingCoins.length})
            </Button>
            <Button
              onClick={() => setActiveTab("favorites")}
              variant={activeTab === "favorites" ? "default" : "outline"}
              size="sm"
              className={
                activeTab === "favorites"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : `${borderClass} ${inputBgClass} ${textClass} ${hoverClass}`
              }
            >
              <Star className="h-4 w-4 mr-1" />
              Favorites ({favorites.length})
            </Button>
            <Button
              onClick={() => setActiveTab("portfolio")}
              variant={activeTab === "portfolio" ? "default" : "outline"}
              size="sm"
              className={
                activeTab === "portfolio"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : `${borderClass} ${inputBgClass} ${textClass} ${hoverClass}`
              }
            >
              <PieChart className="h-4 w-4 mr-1" />
              Portfolio ({portfolio.length})
            </Button>
            <Button
              onClick={() => setActiveTab("featured")}
              variant={activeTab === "featured" ? "default" : "outline"}
              size="sm"
              className={
                activeTab === "featured"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : `${borderClass} ${inputBgClass} ${textClass} ${hoverClass}`
              }
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Featured ({featuredCoins.length})
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500"></div>
              <p className={textSecondaryClass}>Loading cryptocurrency data...</p>
            </div>
          </div>
        )}

        {!loading && viewMode === "table" && (
          <div className={`rounded-lg border ${borderClass} ${cardBgClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? "bg-slate-800/50" : "bg-gray-100"}`}>
                  <tr className={`text-sm ${textSecondaryClass}`}>
                    <th className="p-3 text-left w-12">#</th>
                    <th className="p-3 text-left">Coin</th>
                    <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("price")}>
                      <div className="flex items-center justify-end gap-1">
                        Price <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-right cursor-pointer" onClick={() => handleSort("change")}>
                      <div className="flex items-center justify-end gap-1">
                        24h % <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-right hidden md:table-cell">7d %</th>
                    <th
                      className="p-3 text-right cursor-pointer hidden lg:table-cell"
                      onClick={() => handleSort("marketCap")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Market Cap <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      className="p-3 text-right cursor-pointer hidden lg:table-cell"
                      onClick={() => handleSort("volume")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Volume (24h) <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="p-3 text-center hidden xl:table-cell">Last 7 Days</th>
                    <th className="p-3 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCryptos.map((crypto) => {
                    const portfolioItem = portfolio.find((p) => p.id === crypto.id)
                    const isFavorite = favorites.includes(crypto.id)

                    return (
                      <tr key={crypto.id} className={`border-t ${borderClass} ${hoverClass} transition-colors`}>
                        <td className="p-3">
                          <span className={`text-sm ${textSecondaryClass}`}>{crypto.market_cap_rank}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={() => toggleFavorite(crypto.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Star
                                className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : textSecondaryClass}`}
                              />
                            </Button>
                            <img
                              src={crypto.image || "/placeholder.svg"}
                              alt={crypto.name}
                              className="h-6 w-6 rounded-full"
                            />
                            <div className="min-w-0">
                              <p className={`font-semibold ${textClass} text-sm`}>{crypto.name}</p>
                              <p className={`text-xs ${textSecondaryClass} uppercase`}>{crypto.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <span className={`font-semibold ${textClass} text-sm`}>
                            {formatPrice(crypto.current_price)}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {crypto.price_change_percentage_24h > 0 ? (
                              <TrendingUp className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span
                              className={`text-sm font-medium ${
                                crypto.price_change_percentage_24h > 0 ? "text-emerald-500" : "text-red-500"
                              }`}
                            >
                              {formatPercentage(crypto.price_change_percentage_24h)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right hidden md:table-cell">
                          <span
                            className={`text-sm ${
                              crypto.price_change_percentage_7d_in_currency > 0 ? "text-emerald-500" : "text-red-500"
                            }`}
                          >
                            {formatPercentage(crypto.price_change_percentage_7d_in_currency || 0)}
                          </span>
                        </td>
                        <td className="p-3 text-right hidden lg:table-cell">
                          <span className={`text-sm ${textClass}`}>{formatLargeNumber(crypto.market_cap)}</span>
                        </td>
                        <td className="p-3 text-right hidden lg:table-cell">
                          <span className={`text-sm ${textClass}`}>{formatLargeNumber(crypto.total_volume)}</span>
                        </td>
                        <td className="p-3 hidden xl:table-cell">
                          <div className="flex justify-center">
                            <canvas
                              id={`chart-${crypto.id}`}
                              className="h-12 w-32"
                              style={{ width: "128px", height: "48px" }}
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            {portfolioItem ? (
                              <Button
                                onClick={() => removeFromPortfolio(crypto.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                onClick={() => setShowAddModal(crypto.id)}
                                variant="ghost"
                                size="sm"
                                className={`h-8 px-2 ${textSecondaryClass} ${hoverClass}`}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === "grid" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCryptos.map((crypto) => {
              const portfolioItem = portfolio.find((p) => p.id === crypto.id)
              const isFavorite = favorites.includes(crypto.id)

              return (
                <Card
                  key={crypto.id}
                  className={`${borderClass} ${cardBgClass} backdrop-blur-sm transition-all hover:shadow-lg`}
                >
                  <div className="p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={crypto.image || "/placeholder.svg"}
                          alt={crypto.name}
                          className="h-8 w-8 rounded-full"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold ${textClass} text-sm`}>{crypto.name}</h3>
                            <span className={`text-xs ${textSecondaryClass}`}>#{crypto.market_cap_rank}</span>
                          </div>
                          <p className={`text-xs ${textSecondaryClass} uppercase`}>{crypto.symbol}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => toggleFavorite(crypto.id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                      >
                        <Star
                          className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : textSecondaryClass}`}
                        />
                      </Button>
                    </div>

                    <div className="mb-3">
                      <p className={`text-xl font-bold ${textClass}`}>{formatPrice(crypto.current_price)}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {crypto.price_change_percentage_24h > 0 ? (
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              crypto.price_change_percentage_24h > 0 ? "text-emerald-500" : "text-red-500"
                            }`}
                          >
                            {formatPercentage(crypto.price_change_percentage_24h)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`mb-3 space-y-1 rounded-lg ${darkMode ? "bg-slate-800/50" : "bg-gray-100"} p-2`}>
                      <div className="flex justify-between text-xs">
                        <span className={textSecondaryClass}>Market Cap</span>
                        <span className={textClass}>{formatLargeNumber(crypto.market_cap)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={textSecondaryClass}>Volume</span>
                        <span className={textClass}>{formatLargeNumber(crypto.total_volume)}</span>
                      </div>
                    </div>

                    <div className={`relative h-16 rounded-lg ${darkMode ? "bg-slate-800/50" : "bg-gray-100"} mb-2`}>
                      <canvas
                        id={`chart-${crypto.id}`}
                        className="h-full w-full"
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>

                    {portfolioItem ? (
                      <div className="space-y-2">
                        <div
                          className={`rounded-lg ${darkMode ? "bg-blue-900/30 border-blue-700/50" : "bg-blue-50 border-blue-200"} border p-2`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs ${textSecondaryClass}`}>Holdings</span>
                            <Button
                              onClick={() => removeFromPortfolio(crypto.id)}
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className={`text-xs font-medium ${textClass}`}>
                            {portfolioItem.amount} {crypto.symbol.toUpperCase()}
                          </p>
                          <p className="text-xs text-emerald-500">
                            ≈ {formatPrice(portfolioItem.amount * crypto.current_price)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowAddModal(crypto.id)}
                        variant="outline"
                        size="sm"
                        className={`w-full ${borderClass} ${inputBgClass} ${textClass}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {!loading && filteredCryptos.length === 0 && (
          <div className="py-20 text-center">
            <p className={textSecondaryClass}>No cryptocurrencies found matching "{searchTerm}"</p>
          </div>
        )}
      </main>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className={`w-full max-w-md ${borderClass} ${cardBgClass} mx-4`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${textClass}`}>Add to Portfolio</h3>
                <Button
                  onClick={() => {
                    setShowAddModal(null)
                    setAmountInput("")
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className={`h-5 w-5 ${textSecondaryClass}`} />
                </Button>
              </div>
              <div className="mb-4">
                <label className={`text-sm ${textSecondaryClass} mb-2 block`}>
                  Amount of {cryptos.find((c) => c.id === showAddModal)?.symbol.toUpperCase()}
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className={`h-12 border ${borderClass} ${inputBgClass} ${textClass}`}
                />
              </div>
              <Button
                onClick={() => addToPortfolio(showAddModal, Number.parseFloat(amountInput) || 0)}
                disabled={!amountInput || Number.parseFloat(amountInput) <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Add to Portfolio
              </Button>
            </div>
          </Card>
        </div>
      )}

      <footer className={`border-t ${borderClass} ${cardBgClass} py-6 mt-12`}>
        <div className="container mx-auto px-4 text-center text-sm">
          <p className={textSecondaryClass}>
            Data provided by CoinGecko API • Updates every 60 seconds • Tracking {cryptos.length} cryptocurrencies
          </p>
        </div>
      </footer>
    </div>
  )
}
