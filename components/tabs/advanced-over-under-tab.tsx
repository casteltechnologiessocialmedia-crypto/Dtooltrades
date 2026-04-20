"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface MoneyMakerAnalysis {
  underPercent: number
  overPercent: number
  underIncreasing: boolean
  overIncreasing: boolean
  volatility: number
  marketPower: number
  strongestUnder: number | null
  strongestOver: number | null
  underPredictions: string[]
  overPredictions: string[]
}

interface SignalState {
  status: "NEUTRAL" | "WAIT" | "READY" | "RUN NOW" | "TRADING" | "EXIT"
  color: string
  type: "UNDER" | "OVER" | null
  confidence: number
  phase: 1 | 2
  confirmedTicks: number
  tradingTicksRemaining: number
}

interface MoneyMakerTabProps {
  theme?: "light" | "dark"
  recentDigits?: number[]
}

export function MoneyMakerTab({ theme = "dark", recentDigits = [] }: MoneyMakerTabProps) {
  const UNDER_RANGE = [0, 1, 2, 3, 4]
  const OVER_RANGE = [5, 6, 7, 8, 9]
  const PHASE1_TICKS = 15 // Initial analysis ticks
  const PHASE2_TICKS = 15 // Confirmation ticks
  const TRADING_TICKS_MAX = 20 // Max ticks to trade

  const [analysis, setAnalysis] = useState<MoneyMakerAnalysis | null>(null)
  const [signal, setSignal] = useState<SignalState>({
    status: "NEUTRAL",
    color: "gray",
    type: null,
    confidence: 0,
    phase: 1,
    confirmedTicks: 0,
    tradingTicksRemaining: 0,
  })
  const [ticksAnalyzed, setTicksAnalyzed] = useState(0)
  const [historicalTrends, setHistoricalTrends] = useState<
    { time: string; underPercent: number; overPercent: number }[]
  >([])
  const signalTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Analyze market data
  const analyzeMarket = () => {
    if (recentDigits.length === 0) return

    const last60 = recentDigits.slice(-60)
    const last20 = recentDigits.slice(-20)
    const last10 = recentDigits.slice(-10)

    // Count Under/Over
    const underLast60 = last60.filter((d) => UNDER_RANGE.includes(d)).length
    const overLast60 = last60.filter((d) => OVER_RANGE.includes(d)).length
    const underLast20 = last20.filter((d) => UNDER_RANGE.includes(d)).length
    const overLast20 = last20.filter((d) => OVER_RANGE.includes(d)).length
    const underLast10 = last10.filter((d) => UNDER_RANGE.includes(d)).length
    const overLast10 = last10.filter((d) => OVER_RANGE.includes(d)).length

    const total60 = underLast60 + overLast60 || 1
    const underPercent = (underLast60 / total60) * 100
    const overPercent = (overLast60 / total60) * 100

    const underPercent20 = last20.length > 0 ? (underLast20 / last20.length) * 100 : 0
    const overPercent20 = last20.length > 0 ? (overLast20 / last20.length) * 100 : 0

    const underPercent10 = last10.length > 0 ? (underLast10 / last10.length) * 100 : 0
    const overPercent10 = last10.length > 0 ? (overLast10 / last10.length) * 100 : 0

    const underIncreasing = underPercent10 > underPercent20
    const overIncreasing = overPercent10 > overPercent20

    // Calculate volatility
    const volatility = Math.abs(overPercent - underPercent)

    // Find strongest digits
    let strongestUnder = null
    let maxUnderCount = 0
    UNDER_RANGE.forEach((digit) => {
      const count = last60.filter((d) => d === digit).length
      if (count > maxUnderCount) {
        maxUnderCount = count
        strongestUnder = digit
      }
    })

    let strongestOver = null
    let maxOverCount = 0
    OVER_RANGE.forEach((digit) => {
      const count = last60.filter((d) => d === digit).length
      if (count > maxOverCount) {
        maxOverCount = count
        strongestOver = digit
      }
    })

    // Generate predictions based on digit ranges
    const underPredictions: string[] = []
    const overPredictions: string[] = []

    if (strongestUnder !== null) {
      if (strongestUnder >= 0 && strongestUnder <= 1) {
        underPredictions.push("Under 6", "Under 7", "Under 8")
      } else if (strongestUnder >= 2 && strongestUnder <= 3) {
        underPredictions.push("Under 7", "Under 8", "Under 9")
      } else if (strongestUnder >= 4) {
        underPredictions.push("Under 9")
      }
    }

    if (strongestOver !== null) {
      if (strongestOver >= 3 && strongestOver <= 5) {
        overPredictions.push("Over 1", "Over 2", "Over 3")
      } else if (strongestOver >= 6 && strongestOver <= 8) {
        overPredictions.push("Over 2", "Over 3")
      } else if (strongestOver >= 9) {
        overPredictions.push("Over 3")
      }
    }

    const marketPower = Math.max(underPercent, overPercent)

    setAnalysis({
      underPercent,
      overPercent,
      underIncreasing,
      overIncreasing,
      volatility,
      marketPower,
      strongestUnder,
      strongestOver,
      underPredictions,
      overPredictions,
    })

    determineSignal(underPercent, overPercent, underIncreasing, overIncreasing, volatility, marketPower)
  }

  const determineSignal = (
    underPercent: number,
    overPercent: number,
    underIncreasing: boolean,
    overIncreasing: boolean,
    volatility: number,
    marketPower: number,
  ) => {
    const isVolatile = volatility > 20

    // Phase 1 check: Initial signal detection
    if (signal.phase === 1) {
      if (
        (overPercent >= 50 && overIncreasing && !isVolatile) ||
        (underPercent >= 50 && underIncreasing && !isVolatile)
      ) {
        setSignal((prev) => ({
          ...prev,
          status: "WAIT",
          color: "yellow",
          phase: 1,
          confirmedTicks: 0,
        }))

        // Clear existing timeout and set new one for phase 2
        if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current)
        phaseTimeoutRef.current = setTimeout(() => {
          setSignal((prev) => ({
            ...prev,
            phase: 2,
            confirmedTicks: 0,
          }))
        }, 5000)

        return
      }
    }

    // Phase 2: Confirmation with next 15 ticks
    if (signal.phase === 2 && signal.status === "WAIT") {
      setSignal((prev) => ({
        ...prev,
        confirmedTicks: prev.confirmedTicks + 1,
      }))

      // Check confirmation after 15 additional ticks
      if (signal.confirmedTicks >= 15) {
        if (
          (overPercent >= 56 && overIncreasing && !isVolatile) ||
          (underPercent >= 56 && underIncreasing && !isVolatile)
        ) {
          const signalType = overPercent >= 56 ? "OVER" : "UNDER"
          setSignal({
            status: "RUN NOW",
            color: "orange",
            type: signalType,
            confidence: Math.min(marketPower, 99),
            phase: 2,
            confirmedTicks: 15,
            tradingTicksRemaining: TRADING_TICKS_MAX,
          })

          // Auto timeout signal after 60 seconds
          if (signalTimeoutRef.current) clearTimeout(signalTimeoutRef.current)
          signalTimeoutRef.current = setTimeout(() => {
            setSignal({
              status: "EXIT",
              color: "red",
              type: signalType,
              confidence: 0,
              phase: 1,
              confirmedTicks: 0,
              tradingTicksRemaining: 0,
            })
          }, 60000)

          return
        } else if (overPercent >= 56 || underPercent >= 56) {
          setSignal((prev) => ({
            ...prev,
            status: "READY",
            color: "cyan",
          }))
          return
        }
      }
    }

    // Trading phase
    if (signal.status === "TRADING") {
      setSignal((prev) => ({
        ...prev,
        tradingTicksRemaining: Math.max(0, prev.tradingTicksRemaining - 1),
      }))

      // Exit if 20 ticks passed or market changes
      if (signal.tradingTicksRemaining <= 0 || (!underIncreasing && !overIncreasing)) {
        setSignal({
          status: "EXIT",
          color: "red",
          type: null,
          confidence: 0,
          phase: 1,
          confirmedTicks: 0,
          tradingTicksRemaining: 0,
        })
      }
    }
  }

  // Update analysis on digit change
  useEffect(() => {
    analyzeMarket()
  }, [recentDigits])

  const handleTrade = () => {
    if (signal.status === "RUN NOW") {
      setSignal((prev) => ({
        ...prev,
        status: "TRADING",
      }))
    }
  }

  const handleExit = () => {
    setSignal({
      status: "EXIT",
      color: "red",
      type: null,
      confidence: 0,
      phase: 1,
      confirmedTicks: 0,
      tradingTicksRemaining: 0,
    })
  }

  if (!analysis) {
    return (
      <div className="text-center py-16">
        <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Loading advanced analysis...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div
        className={`rounded-xl p-6 sm:p-8 border ${
          theme === "dark"
            ? "bg-gradient-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-purple-500/20"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="text-center mb-6">
          <h2
            className={`text-xl sm:text-2xl font-bold mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
          >
            Advanced Over/Under Analysis
          </h2>

          {/* Signal Display */}
          <Badge
            className={`text-sm px-4 py-1.5 font-semibold animate-pulse ${
              signal.status === "RUN NOW"
                ? "bg-orange-500/30 text-orange-300 border border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.6)]"
                : signal.status === "READY"
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                  : signal.status === "WAIT"
                    ? "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50"
                    : signal.status === "TRADING"
                      ? "bg-green-500/30 text-green-300 border border-green-500/50"
                      : signal.status === "EXIT"
                        ? "bg-red-500/30 text-red-300 border border-red-500/50"
                        : "bg-gray-500/30 text-gray-300 border border-gray-500/50"
            }`}
          >
            {signal.status}
            {signal.status === "RUN NOW" && ` - ${signal.confidence.toFixed(0)}%`}
            {signal.status === "TRADING" && ` - ${signal.tradingTicksRemaining}s`}
          </Badge>
        </div>

        {/* Market Analysis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          {/* Under Card */}
          <div className="flex flex-col items-center">
            <div className={`text-4xl sm:text-5xl font-black mb-2 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
              {analysis.underPercent.toFixed(1)}%
            </div>
            <div className={`text-sm font-semibold mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              Under (0, 1, 2, 3, 4) {analysis.underIncreasing ? "↗" : analysis.underIncreasing === false ? "↘" : "→"}
            </div>
            <div className={`w-full max-w-xs rounded-full h-3 mb-3 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}>
              <div
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                style={{ width: `${Math.min(analysis.underPercent, 100)}%` }}
              />
            </div>
            <div className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Count: {Math.round(analysis.underPercent * analysisDigits.length / 100)} | Strongest: {analysis.strongestUnder}
            </div>
          </div>

          {/* Over Card */}
          <div className="flex flex-col items-center">
            <div className={`text-4xl sm:text-5xl font-black mb-2 ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>
              {analysis.overPercent.toFixed(1)}%
            </div>
            <div className={`text-sm font-semibold mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              Over (5, 6, 7, 8, 9) {analysis.overIncreasing ? "↗" : analysis.overIncreasing === false ? "↘" : "→"}
            </div>
            <div className={`w-full max-w-xs rounded-full h-3 mb-3 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}>
              <div
                className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                style={{ width: `${Math.min(analysis.overPercent, 100)}%` }}
              />
            </div>
            <div className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Count: {Math.round(analysis.overPercent * analysisDigits.length / 100)} | Strongest: {analysis.strongestOver}
            </div>
          </div>
        </div>

        {/* Entry Conditions */}
        <div className="text-center border-t border-white/10 pt-6">
          <h4 className={`text-sm font-bold mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
            Entry Conditions:
          </h4>
          <p className={`text-sm ${theme === "dark" ? "text-cyan-300" : "text-cyan-600"}`}>
            {analysis.underPercent > 55 ? `Strong UNDER signal at ${analysis.underPercent.toFixed(1)}%` : analysis.overPercent > 55 ? `Strong OVER signal at ${analysis.overPercent.toFixed(1)}%` : "Wait for market to show clear direction (55%+ and increasing)"}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {signal.status === "RUN NOW" && (
          <Button
            onClick={handleTrade}
            size="lg"
            className="flex-1 text-base sm:text-lg font-bold py-6 text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 animate-pulse shadow-[0_0_30px_rgba(249,115,22,0.6)]"
          >
            🚀 START TRADING NOW
          </Button>
        )}

        {signal.status === "TRADING" && (
          <Button
            onClick={handleExit}
            size="lg"
            className="flex-1 text-base sm:text-lg font-bold py-6 text-white bg-red-500 hover:bg-red-600"
          >
            Exit Trade
          </Button>
        )}

        {signal.status !== "NEUTRAL" && signal.status !== "TRADING" && (
          <Button
            onClick={() =>
              setSignal({
                status: "NEUTRAL",
                color: "gray",
                type: null,
                confidence: 0,
                phase: 1,
                confirmedTicks: 0,
                tradingTicksRemaining: 0,
              })
            }
            size="lg"
            variant="outline"
            className="flex-1 text-base sm:text-lg font-bold py-6"
          >
            Reset Analysis
          </Button>
        )}
      </div>

      {/* Info Card */}
      <Card className={`p-4 ${theme === "dark" ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-50 border-blue-200"}`}>
        <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>
          <span className="font-bold">How Money Maker Works:</span> Phase 1 analyzes initial market conditions. If
          conditions are met, Phase 2 confirms with 15 additional ticks. When confidence reaches 56% or higher with
          increasing trend, a RUN NOW signal appears (orange with glow). You have maximum 20 ticks to trade. Exit signal
          appears if market changes or time expires.
        </p>
      </Card>
    </div>
  )
}
