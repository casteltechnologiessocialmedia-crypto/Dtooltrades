"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LastDigitsDisplay } from "@/components/last-digits-display"
import type { Signal, AnalysisResult } from "@/lib/analysis-engine"
import { MarketSelector } from "@/components/market-selector"
import type { DerivSymbol } from "@/hooks/use-deriv"

interface EvenOddTabProps {
  analysis: AnalysisResult | null
  signals: Signal[]
  currentDigit: number | null
  currentPrice: number | null
  recentDigits: number[]
  theme?: "light" | "dark"
  symbol?: string
  availableSymbols?: DerivSymbol[]
  onSymbolChange?: (symbol: string) => void
  tickCount?: number
}

export function EvenOddTab({
  analysis,
  signals,
  currentDigit,
  currentPrice,
  recentDigits,
  theme = "dark",
  symbol,
  availableSymbols = [],
  onSymbolChange,
  tickCount,
}: EvenOddTabProps) {
  const [tradeTimer, setTradeTimer] = useState<number>(0)
  const [marketChanged, setMarketChanged] = useState(false)
  const [powerTrend, setPowerTrend] = useState<"increasing" | "decreasing" | "stable">("stable")

  const last100Digits = recentDigits.slice(-100)
  const last50Digits = recentDigits.slice(-50)
  const last25Digits = recentDigits.slice(-25)
  const last10Digits = recentDigits.slice(-10)

  // Calculate Even/Odd percentages across different timeframes
  const evenPercent100 = (last100Digits.filter((d) => d % 2 === 0).length / Math.max(1, last100Digits.length)) * 100
  const oddPercent100 = (last100Digits.filter((d) => d % 2 === 1).length / Math.max(1, last100Digits.length)) * 100

  const evenPercent50 = (last50Digits.filter((d) => d % 2 === 0).length / Math.max(1, last50Digits.length)) * 100
  const oddPercent50 = (last50Digits.filter((d) => d % 2 === 1).length / Math.max(1, last50Digits.length)) * 100

  const evenPercent25 = (last25Digits.filter((d) => d % 2 === 0).length / Math.max(1, last25Digits.length)) * 100
  const oddPercent25 = (last25Digits.filter((d) => d % 2 === 1).length / Math.max(1, last25Digits.length)) * 100

  const evenPercent10 = (last10Digits.filter((d) => d % 2 === 0).length / Math.max(1, last10Digits.length)) * 100
  const oddPercent10 = (last10Digits.filter((d) => d % 2 === 1).length / Math.max(1, last10Digits.length)) * 100

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (tradeTimer > 0) {
      interval = setInterval(() => {
        setTradeTimer((prev) => (prev > 1 ? prev - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [tradeTimer])

  useEffect(() => {
    if (evenPercent10 > evenPercent50) {
      setPowerTrend("increasing")
    } else if (evenPercent10 < evenPercent50) {
      setPowerTrend("decreasing")
    } else {
      setPowerTrend("stable")
    }
  }, [evenPercent10, evenPercent50])

  if (!analysis) {
    return (
      <div className="text-center py-16">
        <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Loading analysis...</p>
      </div>
    )
  }

  const evenIncreasing = evenPercent10 > evenPercent50
  const oddIncreasing = oddPercent10 > oddPercent50
  const maxCurrent = Math.max(evenPercent10, oddPercent10)
  const dominantType = evenPercent10 > oddPercent10 ? "EVEN" : "ODD"

  const calculateVolatility = () => {
    const change25to50 = Math.abs(evenPercent25 - evenPercent50)
    const change10to25 = Math.abs(evenPercent10 - evenPercent25)
    const change10to50 = Math.abs(evenPercent10 - evenPercent50)

    // Volatility is the rate of change across timeframes
    const volatilityScore = (change10to25 * 2 + change10to50) / 3

    return Math.min(volatilityScore * 2, 100)
  }

  const volatility = calculateVolatility()

  const hourTrendChange = Math.abs(evenPercent100 - evenPercent50)
  const recent15MinChange = Math.abs(evenPercent50 - evenPercent10)

  let signalStatus: "TRADE NOW" | "WAIT" | "NEUTRAL" = "NEUTRAL"
  let signalColor = "gray"
  let signalMessage = ""
  let signalDescription = ""

  const isMarketChanging = volatility > 40
  const isPowerIncreasing = (dominantType === "EVEN" && evenIncreasing) || (dominantType === "ODD" && oddIncreasing)

  // Market change detection overrides signals
  if (isMarketChanging && powerTrend === "decreasing") {
    signalStatus = "WAIT"
    signalColor = "red"
    signalMessage = "Market is changing - Power decreasing"
    signalDescription = "The dominant type's power is falling. Wait for stabilization."
  }
  // TRADE NOW signal at 56%+ and increasing
  else if (maxCurrent >= 56 && isPowerIncreasing) {
    signalStatus = "TRADE NOW"
    signalColor = "green"
    signalMessage = `${dominantType} at ${maxCurrent.toFixed(1)}% - POWERFUL SIGNAL`
    signalDescription = `${dominantType} power is at ${maxCurrent.toFixed(1)}% and INCREASING. Market momentum is strong!`
    if (tradeTimer === 0) setTradeTimer(120)
  }
  // WAIT signal at 50%+ and increasing
  else if (maxCurrent >= 50 && isPowerIncreasing) {
    signalStatus = "WAIT"
    signalColor = "blue"
    signalMessage = `${dominantType} at ${maxCurrent.toFixed(1)}% - Building Power`
    signalDescription = `${dominantType} power reaching threshold. Watch for confirmation to reach 56%+.`
  }
  // Power decreasing - revert to WAIT
  else if (maxCurrent >= 50 && !isPowerIncreasing) {
    signalStatus = "WAIT"
    signalColor = "orange"
    signalMessage = `Market shifting - ${dominantType} power decreasing`
    signalDescription = "Power was strong but is now decreasing. Market conditions changing."
  } else {
    signalStatus = "NEUTRAL"
    signalColor = "gray"
    signalMessage = "Analyzing market patterns"
    signalDescription = "Waiting for either EVEN or ODD to reach 50%+ with increasing power."
  }

  return (
    <div className="space-y-6">
      <div className="soft-card p-4 border-white/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
            Current Digit:
          </span>
          {currentDigit !== null ? (
            <span
              className={`text-2xl font-bold animate-pulse ${theme === "dark"
                ? "bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent"
                : "text-orange-600"
                }`}
            >
              {currentDigit}
            </span>
          ) : (
            <span className={`text-2xl font-bold ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`}>-</span>
          )}
        </div>
        <div className={`text-sm font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          Price: <span className="font-mono">{currentPrice?.toFixed(5) || "---"}</span>
        </div>
      </div>

      <div className="soft-card p-6 sm:p-8 border-white/5">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-widest mb-3 text-white">
            Even vs Odd Analysis (Selected: 10)
          </h2>
          <Badge
            className={`text-sm px-4 py-1.5 font-semibold ${signalStatus === "TRADE NOW"
              ? theme === "dark"
                ? "bg-green-500/30 text-green-300 border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                : "bg-green-100 text-green-700 border-green-300"
              : signalStatus === "WAIT"
                ? theme === "dark"
                  ? "bg-blue-500/30 text-blue-300 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  : "bg-blue-100 text-blue-700 border-blue-300"
                : theme === "dark"
                  ? "bg-gray-500/30 text-gray-300 border border-gray-500/50"
                  : "bg-gray-100 text-gray-600 border-gray-300"
              }`}
          >
            {signalStatus} {tradeTimer > 0 && `(${tradeTimer}s)`}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8">
          {/* Even Card */}
          <div className="flex flex-col items-center">
            <div className={`text-4xl sm:text-5xl font-black mb-2 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
              {evenPercent10.toFixed(1)}%
            </div>
            <div className={`text-sm font-semibold mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              Even (0, 2, 4, 6, 8) {evenIncreasing ? "↗" : evenIncreasing === false ? "↘" : "→"}
            </div>
            <div className={`w-full max-w-xs rounded-full h-3 mb-3 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}>
              <div
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                style={{ width: `${Math.min(evenPercent10, 100)}%` }}
              />
            </div>
            <div className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Count: {recentDigits.filter((d) => d % 2 === 0).length} | Trend: {evenIncreasing ? "Increasing" : "Decreasing"}
            </div>
          </div>

          {/* Odd Card */}
          <div className="flex flex-col items-center">
            <div className={`text-4xl sm:text-5xl font-black mb-2 ${theme === "dark" ? "text-pink-400" : "text-pink-600"}`}>
              {oddPercent10.toFixed(1)}%
            </div>
            <div className={`text-sm font-semibold mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              Odd (1, 3, 5, 7, 9) {oddIncreasing ? "↗" : oddIncreasing === false ? "↘" : "→"}
            </div>
            <div className={`w-full max-w-xs rounded-full h-3 mb-3 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}>
              <div
                className="h-3 rounded-full bg-gradient-to-r from-pink-500 to-red-400 transition-all"
                style={{ width: `${Math.min(oddPercent10, 100)}%` }}
              />
            </div>
            <div className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Count: {recentDigits.filter((d) => d % 2 === 1).length} | Trend: {oddIncreasing ? "Increasing" : "Decreasing"}
            </div>
          </div>
        </div>

        {/* Entry Conditions */}
        <div className="text-center border-t border-white/10 pt-6">
          <h4 className={`text-sm font-bold mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
            Entry Conditions:
          </h4>
          <p className={`text-sm ${theme === "dark" ? "text-cyan-300" : "text-cyan-600"}`}>
            {signalMessage}
          </p>
        </div>


      </div>

      {recentDigits.length > 0 && (
        <div
          className={`rounded-xl p-6 border ${theme === "dark"
            ? "bg-gradient-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
            : "bg-white border-gray-200 shadow-lg"
            }`}
        >
          <h3 className={`text-lg font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            Last 40 Digits
          </h3>
          <LastDigitsDisplay digits={recentDigits} currentDigit={currentDigit} mode="even-odd" theme={theme} />
        </div>
      )}
    </div>
  )
}
