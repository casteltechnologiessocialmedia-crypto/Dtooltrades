"use client"

import { useState, useEffect } from "react"
import { useDeriv } from "@/hooks/use-deriv"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Moon, Sun, User, AlertTriangle, Menu, TrendingUp, Layers, Eye, Hash, Clock, Activity } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link'
import { DigitDistribution } from "@/components/digit-distribution"
import { SignalsTab } from "@/components/tabs/signals-tab"
import { ProSignalsTab } from "@/components/tabs/pro-signals-tab"
import { EvenOddTab } from "@/components/tabs/even-odd-tab"
import { OverUnderTab } from "@/components/tabs/over-under-tab"
import { MatchesTab } from "@/components/tabs/matches-tab"
import { DiffersTab } from "@/components/tabs/differs-tab"
import { StatisticalAnalysis } from "@/components/statistical-analysis"
import { LastDigitsChart } from "@/components/charts/last-digits-chart"
import { LastDigitsLineChart } from "@/components/charts/last-digits-line-chart"
import { AIAnalysisTab } from "@/components/tabs/ai-analysis-tab"
import { HeritageSuperSignals } from "@/components/heritage-super-signals"
import { SuperSignalsTab } from "@/components/tabs/super-signals-tab"
import { LoadingScreen } from "@/components/loading-screen"
import { DerivAuth } from "@/components/deriv-auth"
import { AutoBotTab } from "@/components/tabs/autobot-tab"
import { AutomatedTab } from "@/components/tabs/automated-tab"
import { SmartAuto24Tab } from "@/components/tabs/smartauto24-tab"
import { AdvancedSignalsTab } from "@/components/advanced-signals-tab"
import { useGlobalTradingContext } from "@/hooks/use-global-trading-context"
import { verifier } from "@/lib/system-verifier"
import { ResponsiveTabs } from "@/components/responsive-tabs"
import { MoneyMakerTab } from "@/components/tabs/money-maker-tab"
import { ToolsInfoTab } from "@/components/tabs/tools-info-tab"
import SmartAdaptiveTradingTab from "@/components/tabs/smart-adaptive-trading"
import { RiskDisclaimerModal } from "@/components/modals/risk-disclaimer-modal"
import { MarketSelector } from "@/components/market-selector"
import { WelcomeHero } from "@/components/welcome-hero"
import { FloatingAIScanner } from "@/components/floating-ai-scanner"
import { ApiTokenModal } from "@/components/api-token-modal"
import { useDerivAuth } from "@/hooks/use-deriv-auth"
import { DashboardTab } from "@/components/tabs/dashboard-tab"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function DerivAnalysisApp() {
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [activeTab, setActiveTab] = useState("smart-analysis")
  const [isLoading, setIsLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false)
  const [showRiskModal, setShowRiskModal] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [siteConfig, setSiteConfig] = useState<any>(null)
  const [watchedDigits, setWatchedDigits] = useState<number[]>(() => {
    if (typeof window === "undefined") return []
    const saved = localStorage.getItem("deriv_watched_digits")
    return saved ? JSON.parse(saved) : []
  })
  const globalContext = useGlobalTradingContext()
  const { showTokenModal, submitApiToken, loginWithDeriv } = useDerivAuth()

  // Wrapper to ensure OAuth login is properly triggered
  const handleOAuthLogin = () => {
    console.log("[v0] 🔐 Page: Triggering OAuth login...")
    try {
      loginWithDeriv()
    } catch (error) {
      console.error("[v0] ❌ Page: OAuth login error:", error)
    }
  }

  const {
    connectionStatus,
    currentPrice,
    currentDigit,
    tickCount,
    analysis,
    signals,
    proSignals,
    symbol,
    maxTicks,
    availableSymbols,
    connectionLogs,
    changeSymbol,
    changeMaxTicks,
    getRecentDigits,
  } = useDeriv("R_100")

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  useEffect(() => {
    try {
      document.documentElement.classList.add("dark")
      console.log("[v0] App initialization started")
      verifier.markComplete("Core System")
      console.log("[v0] App initialization completed successfully")
    } catch (error) {
      console.error("[v0] Initialization error:", error)
      setInitError(error instanceof Error ? error.message : "Unknown error")
    }

    // Check for risk acceptance
    const accepted = localStorage.getItem("deriv_risk_accepted")
    if (!accepted) {
      setShowRiskModal(true)
    }

    // Fetch site config
    fetch("/api/admin/site-config")
      .then(r => r.json())
      .then(setSiteConfig)
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("deriv_watched_digits", JSON.stringify(watchedDigits))
    }
  }, [watchedDigits])

  // Defensive filtering to prevent `.toString()` crashes in chart components
  const recent100DigitsRaw = getRecentDigits(100)
  const recent100Digits = recent100DigitsRaw.filter((d: any) => d !== undefined && d !== null)
  
  const recent50Digits = recent100Digits.length >= 50 ? recent100Digits.slice(-50) : recent100Digits
  const recent40Digits = recent100Digits.length >= 40 ? recent100Digits.slice(-40) : recent100Digits
  const recentDigits = recent100Digits.length >= 20 ? recent100Digits.slice(-20) : recent100Digits

  const activeSignals = (signals || []).filter((s) => s.status !== "NEUTRAL")
  const powerfulSignalsCount = activeSignals.filter((s) => s.status === "TRADE NOW").length

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-900 to-red-950">
        <div className="text-center p-8 bg-red-800/50 rounded-xl border border-red-500 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Initialization Error</h2>
          <p className="text-red-200 mb-6">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <LoadingScreen
        onComplete={() => {
          console.log("[v0] Loading screen completed, showing main app")
          setIsLoading(false)
        }}
      />
    )
  }

  if (showWelcome && tickCount === 0) {
    return (
      <div className={`min-h-screen flex flex-col ${theme === "dark" ? "bg-[#0a0a0a]" : "bg-white"}`}>
        <header className={`fixed top-0 left-0 right-0 z-[100] shrink-0 w-full transition-all duration-500 border-b ${theme === "dark"
          ? "bg-[#0a0a0a]/95 border-white/8"
          : "bg-white/98 border-gray-200"
        } backdrop-blur-xl`}>
          <div className="mx-auto w-full px-2 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg transition-all duration-300 ${theme === "dark" 
                  ? "bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/40" 
                  : "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-400/40"}`}>
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <h1 className={`text-base sm:text-lg font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    Profit<span className={theme === "dark" ? "text-blue-400" : "text-blue-600"}>Hub</span>
                  </h1>
                  <h2 className={`text-[8px] sm:text-[9px] font-semibold tracking-widest opacity-70 uppercase ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Trading Platform
                  </h2>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={`h-9 w-9 rounded-lg transition-all ${theme === "dark"
                  ? "bg-white/5 text-yellow-500 hover:bg-white/10"
                  : "bg-black/5 text-slate-700 hover:bg-black/10"
                }`}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-16 sm:pt-20">
          <WelcomeHero theme={theme} onGetStarted={() => setShowWelcome(false)} />
        </main>

        <footer className={`py-6 sm:py-8 border-t ${theme === "dark" ? "bg-[#0a0a0a] border-white/8" : "bg-gray-50 border-gray-200"}`}>
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}>
              © 2026 ProfitHub. Trading involves risk.
            </p>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${theme === "dark" ? "bg-linear-to-br from-[#0a0e27] via-[#0f1629] to-[#1a1f3a]" : "bg-linear-to-br from-gray-50 via-white to-gray-100"}`}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col relative">
        {!siteConfig?.headerHidden && (
          <header
             className={`fixed top-0 left-0 right-0 z-[100] shrink-0 w-full transition-all duration-500 border-b ${theme === "dark"
               ? "bg-[#0a0a0a]/95 border-white/8"
               : "bg-white/98 border-gray-200"
               } backdrop-blur-xl`}
          >
            <div className="mx-auto w-full px-2 sm:px-6 lg:px-8">
              <div className="flex flex-nowrap items-center h-14 xs:h-16 sm:h-20 gap-2 xs:gap-3 sm:gap-6 w-full justify-between overflow-hidden">

                {/* Brand Logo and Text - Premium Design */}
                <div className="flex items-center shrink-0 min-w-[130px] xs:min-w-[150px] sm:min-w-[220px]">
                  <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3">
                    <div className={`relative w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-sm xs:text-base sm:text-lg transition-all duration-300 ${theme === "dark" 
                      ? "bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60" 
                      : "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-400/40 hover:shadow-blue-400/60"}`}>
                      <svg className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <h1 className={`text-sm xs:text-base sm:text-lg font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                        Profit<span className={theme === "dark" ? "text-blue-400" : "text-blue-600"}>Hub</span>
                      </h1>
                      <h2 className={`text-[7px] xs:text-[8px] sm:text-[9px] font-semibold tracking-widest opacity-70 uppercase letter-spacing-wider ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                        Trading Platform
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <div className="hidden md:flex items-center gap-2">
                    <Link href="/account">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-3 text-[10px] rounded-lg font-bold flex items-center gap-1.5 transition-all ${theme === "dark"
                          ? "bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-blue-600 hover:text-white"
                          : "bg-gray-100 text-slate-700 hover:bg-blue-500 hover:text-white"}`}
                      >
                        <User className="h-3.5 w-3.5" />
                        Account
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRiskModal(true)}
                      className={`h-8 px-3 text-[10px] rounded-lg font-bold flex items-center gap-1 transition-all ${theme === "dark"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20"
                        : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"}`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Risk
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className={`h-8 w-8 rounded-lg transition-all ${theme === "dark"
                        ? "bg-white/5 text-yellow-500 hover:bg-white/10"
                        : "bg-black/5 text-slate-700 hover:bg-black/10"
                        }`}
                    >
                      {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    </Button>
                  </div>

                  <DerivAuth theme={theme} />

                  <div className="md:hidden -ml-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                          <Menu className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className={`w-40 ${theme === "dark" ? "bg-[#0a0e27] border-white/10" : ""}`}>
                        <DropdownMenuItem asChild>
                          <Link href="/account" className="flex items-center gap-2 w-full cursor-pointer p-3">
                            <User className="h-4 w-4" />
                            <span>Account</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowRiskModal(true)} className="flex items-center gap-2 cursor-pointer p-3">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span>Risk Disclaimer</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : ""} />
                        <DropdownMenuItem onClick={toggleTheme} className="flex items-center justify-between cursor-pointer p-3">
                          <span className="flex items-center gap-2">
                            {theme === "dark" ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4" />}
                            <span>Theme</span>
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <div className="px-2 sm:px-6 lg:px-8 flex flex-col gap-4 pb-4">
                {/* Navigation Tabs - Clean Design */}
                <div className="flex items-center justify-start w-full overflow-x-auto no-scrollbar -mx-2 sm:-mx-6 lg:-mx-8 px-2 sm:px-6 lg:px-8">
                  <div className={`inline-flex rounded-lg border transition-all duration-500 ${theme === "dark" 
                    ? "bg-[#0f0f0f] border-white/10" 
                    : "bg-gray-50 border-gray-200"
                    }`}>
                    <div className="overflow-x-auto no-scrollbar flex">
                      <ResponsiveTabs theme={theme} value={activeTab} onValueChange={setActiveTab}>
                        {[
                          "smart-adaptive",
                          "smart-analysis",
                          "smartauto24",
                          "autobot",
                          "automated",
                          "signals",
                          "pro-signals",
                          "super-signals",
                          "advanced-signals",
                          "even-odd",
                          "over-under",
                          "advanced-over-under",
                          "matches",
                          "differs",
                          "ai-analysis",
                          "tools-info",
                        ].filter(tab => !siteConfig?.hiddenTabs?.includes(tab)).map((tab) => {
                          const tabLabels: Record<string, string> = {
                            "smart-adaptive": "Smart Adaptive",
                            "smart-analysis": "Smart Analysis",
                            "smartauto24": "SmartAuto24",
                            "autobot": "Auto Bot",
                            "automated": "Automated",
                            "signals": "Signals",
                            "pro-signals": "Pro Signals",
                            "super-signals": "Super Signals",
                            "advanced-signals": "Advanced Signals",
                            "even-odd": "Even/Odd",
                            "over-under": "Over/Under",
                            "advanced-over-under": "Advanced Over/Under",
                            "matches": "Matches",
                            "differs": "Differs",
                            "ai-analysis": "AI Analysis",
                            "tools-info": "Tools Info"
                          }
                          return (
                          <TabsTrigger
                            key={tab}
                            value={tab}
                            className={`shrink-0 rounded-none text-[9px] xs:text-[10px] sm:text-[12px] h-9 xs:h-10 sm:h-12 px-2 xs:px-3 sm:px-6 whitespace-nowrap transition-all duration-300 font-semibold border-b-2 ${activeTab === tab
                              ? theme === "dark"
                                ? "border-blue-500 text-blue-500 bg-blue-500/10"
                                : "border-blue-600 text-blue-600 bg-blue-100/50"
                              : theme === "dark"
                                ? "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
                                : "border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300"
                              }`}
                            onClick={(e) => {
                              e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
                            }}
                          >
                            {tabLabels[tab] || tab}
                          </TabsTrigger>
                        )
                        })}
                      </ResponsiveTabs>
                    </div>
                  </div>
                </div>

                {/* 2. Balanced HUD Row - Dashboard Grid Style */}
                <div className="flex items-center justify-center w-full px-0.5 xs:px-1">
                  <div className={`p-0.25 xs:p-0.5 sm:p-1 rounded-lg xs:rounded-xl sm:rounded-2xl border ${theme === "dark" ? "bg-[#050505]/60 border-white/5 shadow-2xl" : "bg-white/50 border-gray-100 shadow-xl"} backdrop-blur-2xl w-full xs:w-auto`}>
                    <div className="flex flex-nowrap items-center justify-center gap-0.25 xs:gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.25 xs:py-0.5 px-0.25 xs:px-0.5">
                      
                      {/* 1. Market Selection Tile */}
                      {availableSymbols.length > 0 && (
                        <div className={`flex flex-col items-center justify-center min-w-[85px] xs:min-w-[110px] sm:min-w-[170px] h-8 xs:h-9 sm:h-11 rounded-md xs:rounded-lg sm:rounded-xl border transition-all ${theme === "dark"
                          ? "bg-white/[0.03] border-white/10 shadow-inner"
                          : "bg-gray-50 border-gray-200 shadow-xs"
                          }`}>
                          <span className={`text-[6px] xs:text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.15em] mb-0 opacity-70 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                            Market
                          </span>
                          <div className="w-full flex items-center justify-center scale-[0.75] xs:scale-[0.85] sm:scale-100 origin-center -mt-1 xs:-mt-0.5 sm:mt-0">
                            <MarketSelector
                              symbols={availableSymbols}
                              currentSymbol={symbol}
                              onSymbolChange={changeSymbol}
                              theme={theme}
                            />
                          </div>
                        </div>
                      )}

                      {/* 2. Price Tile */}
                      <div className={`flex flex-col items-center justify-center min-w-[55px] xs:min-w-[75px] sm:min-w-[140px] h-8 xs:h-9 sm:h-11 rounded-md xs:rounded-lg sm:rounded-xl border ${theme === "dark"
                        ? "bg-white/[0.03] border-white/10 shadow-inner"
                        : "bg-gray-50 border-gray-200 shadow-xs"
                        }`}>
                        <span className={`text-[6px] xs:text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.15em] mb-0 opacity-70 ${theme === "dark" ? "text-cyan-400" : "text-cyan-600"}`}>
                          Price
                        </span>
                        <span className={`text-[9px] xs:text-[11px] sm:text-[16px] font-black tabular-nums leading-none ${theme === "dark" ? "text-cyan-400" : "text-cyan-600"}`}>
                          {currentPrice?.toFixed(2) || "0.00"}
                        </span>
                      </div>

                      {/* 3. Last Digit Tile */}
                      <div className={`flex flex-col items-center justify-center min-w-[48px] xs:min-w-[55px] sm:min-w-[110px] h-8 xs:h-9 sm:h-11 rounded-md xs:rounded-lg sm:rounded-xl border relative overflow-hidden transition-all duration-300 ${theme === "dark"
                        ? "bg-orange-500/[0.08] border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.12)]"
                        : "bg-orange-50 border-orange-200"
                        }`}>
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/[0.05] to-transparent animate-pulse pointer-events-none" />
                        <span className={`text-[6px] xs:text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.15em] mb-0 relative z-10 opacity-70 ${theme === "dark" ? "text-orange-400" : "text-orange-600"}`}>
                          Digit
                        </span>
                        <span className={`text-[12px] xs:text-[15px] sm:text-[22px] font-black relative z-10 leading-none ${theme === "dark" ? "text-orange-400" : "text-orange-600"}`}>
                          {currentDigit ?? "0"}
                        </span>
                      </div>

                      {/* 4. Ticks Tile */}
                      <div className={`flex flex-col items-center justify-center min-w-[55px] xs:min-w-[75px] sm:min-w-[140px] h-8 xs:h-9 sm:h-11 rounded-md xs:rounded-lg sm:rounded-xl border ${theme === "dark"
                        ? "bg-white/[0.03] border-white/10 shadow-inner"
                        : "bg-gray-50 border-gray-200 shadow-xs"
                        }`}>
                        <span className={`text-[6px] xs:text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.15em] mb-0 opacity-70 ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>
                          Ticks
                        </span>
                        <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 h-3 xs:h-4 sm:h-5">
                          <span className={`text-[8px] xs:text-[11px] sm:text-[15px] font-black tabular-nums tracking-tight ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>
                            {(tickCount || 0).toLocaleString()}
                          </span>
                          <div className={`h-2 xs:h-3 w-px ${theme === "dark" ? "bg-white/20" : "bg-gray-300"}`} />
                          <select
                            value={maxTicks}
                            onChange={(e) => changeMaxTicks(Number(e.target.value))}
                            className={`bg-transparent text-[7px] xs:text-[9px] sm:text-[11px] font-black focus:outline-hidden cursor-pointer appearance-none ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}
                          >
                            {[25, 60, 100, 250, 500, 1000, 2500, 5000].map(v => (
                              <option key={v} value={v} className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>{v}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 5. Watch Tile - Optimized Ultra-Compact */}
                      <div className={`flex flex-col items-center justify-center min-w-[45px] sm:min-w-[80px] h-9 sm:h-11 rounded-lg sm:rounded-xl border transition-all ${theme === "dark"
                        ? "bg-white/[0.03] border-white/10 hover:border-amber-500/50 shadow-inner"
                        : "bg-gray-50 border-gray-200 shadow-xs"
                        }`}>
                        <span className={`text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.18em] mb-0 opacity-70 ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}>
                          Watch
                        </span>
                        <div className="flex items-center gap-1 px-1 w-full justify-center">
                          <Eye className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-amber-500 shrink-0" />
                          <input
                            type="text"
                            placeholder="D"
                            className={`bg-transparent text-[9px] sm:text-[11px] font-black w-[15px] sm:w-[30px] focus:outline-hidden text-center placeholder:text-slate-600 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}
                            value={watchedDigits.join(',')}
                            onChange={(e) => {
                              const val = e.target.value;
                              const digits = val.split(',')
                                .map(d => parseInt(d.trim()))
                                .filter(d => !isNaN(d) && d >= 0 && d <= 9);
                              setWatchedDigits([...new Set(digits)]);
                            }}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 pt-[180px] sm:pt-[240px] pb-4 px-1 sm:px-4 space-y-2 sm:space-y-4 max-w-7xl mx-auto w-full">
          {connectionStatus === "disconnected" && tickCount === 0 ? (
            <div className="text-center py-12 sm:py-20 md:py-32">
              <h2
                className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                Connection Failed
              </h2>
              <p className={`text-sm sm:text-base md:text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Unable to connect to Deriv. Please check your internet connection and refresh the page.
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold"
              >
                Retry Connection
              </Button>
            </div>
          ) : (
            <>
              {connectionStatus === "reconnecting" && (
                <div className="absolute top-0 left-0 right-0 z-50 bg-yellow-500/20 backdrop-blur-md p-2 text-center text-xs font-bold text-yellow-500 border-b border-yellow-500/30 animate-pulse">
                  Reconnecting to Deriv API... Some data may be delayed.
                </div>
              )}
              <TabsContent value="smart-analysis" className="mt-0 space-y-2 sm:space-y-3 md:space-y-4">
                <div
                  className={`rounded-lg sm:rounded-xl p-2 sm:p-3 border flex items-center justify-between ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse`} />
                    <span className={`text-[10px] font-bold uppercase ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>Market Live</span>
                  </div>
                </div>

                {analysis && analysis.digitFrequencies && (
                  <div
                    className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-3">
                      <h3
                        className={`text-sm sm:text-lg md:text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        Digits Distribution
                      </h3>
                    </div>

                    <DigitDistribution
                      frequencies={analysis.digitFrequencies}
                      currentDigit={currentDigit}
                      theme={theme}
                      watchedDigits={watchedDigits}
                    />
                  </div>
                )}

                {analysis && recent100Digits.length > 0 && recentDigits.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-4">
                    <div
                      className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-4 border ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                    >
                      <h3
                        className={`text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        Last Digits Line Chart
                      </h3>
                      <LastDigitsLineChart digits={recentDigits.slice(-10)} />
                    </div>

                    <div
                      className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-4 border ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                    >
                      <StatisticalAnalysis analysis={analysis} recentDigits={recent100Digits} theme={theme} />
                    </div>
                  </div>
                )}

                {recentDigits.length > 0 && (
                  <div
                    className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border ${theme === "dark" ? "bg-linear-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]" : "bg-white border-gray-200 shadow-lg"}`}
                  >
                    <h3
                      className={`text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      Last 20 Digits Chart
                    </h3>
                    <LastDigitsChart digits={recentDigits} />
                  </div>
                )}

                {analysis && analysis.digitFrequencies && analysis.powerIndex && (
                  <div
                    className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border ${theme === "dark" ? "bg-linear-to-br from-green-500/10 to-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "bg-green-50 border-green-200 shadow-lg"}`}
                  >
                    <h3
                      className={`text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      Frequency Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div
                        className={`text-center rounded-lg p-2 sm:p-3 md:p-4 border ${theme === "dark" ? "bg-blue-500/10" : "bg-blue-50"}`}
                      >
                        <div
                          className={`text-xs sm:text-sm mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                        >
                          Most Frequent
                        </div>
                        <div
                          className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
                        >
                          {analysis.powerIndex.strongest}
                        </div>
                        <div
                          className={`mt-1 text-xs sm:text-sm md:text-base font-bold ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
                        >
                          {analysis.digitFrequencies[analysis.powerIndex.strongest]?.percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div
                        className={`text-center rounded-lg p-2 sm:p-3 md:p-4 border ${theme === "dark" ? "bg-red-500/10" : "bg-red-50"}`}
                      >
                        <div
                          className={`text-xs sm:text-sm mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                        >
                          Least Frequent
                        </div>
                        <div
                          className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
                        >
                          {analysis.powerIndex.weakest}
                        </div>
                        <div
                          className={`mt-1 text-xs sm:text-sm md:text-base font-bold ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
                        >
                          {analysis.digitFrequencies[analysis.powerIndex.weakest]?.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="signals" className="mt-0">
                {analysis && <SignalsTab signals={signals} proSignals={proSignals} analysis={analysis} theme={theme} symbol={symbol} currentPrice={currentPrice} currentDigit={currentDigit} tickCount={tickCount} maxTicks={maxTicks} onMaxTicksChange={changeMaxTicks} />}
              </TabsContent>

              <TabsContent value="pro-signals" className="mt-0">
                {analysis && <ProSignalsTab proSignals={proSignals} analysis={analysis} theme={theme} symbol={symbol} currentPrice={currentPrice} currentDigit={currentDigit} tickCount={tickCount} maxTicks={maxTicks} onMaxTicksChange={changeMaxTicks} />}
              </TabsContent>

              <TabsContent value="super-signals" className="mt-0">
                {analysis && (
                  <HeritageSuperSignals 
                    theme={theme} 
                    symbol={symbol} 
                    availableSymbols={availableSymbols} 
                    maxTicks={maxTicks}
                    analysis={analysis}
                    recentDigits={recentDigits}
                    tickCount={tickCount}
                  />
                )}
              </TabsContent>

              <TabsContent value="advanced-signals" className="mt-0">
                <AdvancedSignalsTab theme={theme} availableSymbols={availableSymbols} />
              </TabsContent>

              <TabsContent value="even-odd" className="mt-0">
                {analysis && (
                  <EvenOddTab
                    analysis={analysis}
                    signals={signals}
                    currentDigit={currentDigit}
                    currentPrice={currentPrice}
                    recentDigits={recent40Digits}
                    theme={theme}
                    symbol={symbol}
                    availableSymbols={availableSymbols}
                    onSymbolChange={changeSymbol}
                    tickCount={tickCount}
                  />
                )}
              </TabsContent>

              <TabsContent value="over-under" className="mt-0">
                {analysis && (
                  <OverUnderTab
                    analysis={analysis}
                    signals={signals}
                    currentDigit={currentDigit}
                    currentPrice={currentPrice}
                    recentDigits={recent50Digits}
                    theme={theme}
                    symbol={symbol}
                    availableSymbols={availableSymbols}
                    onSymbolChange={changeSymbol}
                    tickCount={tickCount}
                  />
                )}
              </TabsContent>

              <TabsContent value="advanced-over-under" className="mt-0">
                {analysis && <MoneyMakerTab theme={theme} recentDigits={recent50Digits} symbol={symbol} />}
              </TabsContent>

              <TabsContent value="matches" className="mt-0">
                {analysis && (
                  <MatchesTab analysis={analysis} signals={signals} recentDigits={recentDigits} theme={theme} symbol={symbol} currentPrice={currentPrice} currentDigit={currentDigit} tickCount={tickCount} maxTicks={maxTicks} onMaxTicksChange={changeMaxTicks} />
                )}
              </TabsContent>

              <TabsContent value="differs" className="mt-0">
                {analysis && (
                  <DiffersTab analysis={analysis} signals={signals} recentDigits={recentDigits} theme={theme} symbol={symbol} currentPrice={currentPrice} currentDigit={currentDigit} tickCount={tickCount} maxTicks={maxTicks} onMaxTicksChange={changeMaxTicks} />
                )}
              </TabsContent>

              <TabsContent value="ai-analysis" className="mt-0">
                {analysis && (
                  <AIAnalysisTab
                    analysis={analysis}
                    currentDigit={currentDigit}
                    currentPrice={currentPrice}
                    symbol={symbol}
                    theme={theme}
                    availableSymbols={availableSymbols}
                    onSymbolChange={changeSymbol}
                  />
                )}
              </TabsContent>

              <TabsContent value="autobot" className="mt-0">
                <AutoBotTab theme={theme} symbol={symbol} />
              </TabsContent>

              <TabsContent value="automated" className="mt-0">
                <AutomatedTab theme={theme} symbol={symbol} />
              </TabsContent>

              <TabsContent value="smartauto24" className="mt-0">
                <SmartAuto24Tab
                  theme={theme}
                  symbol={symbol}
                  onSymbolChange={changeSymbol}
                  availableSymbols={availableSymbols}
                  maxTicks={maxTicks}
                  onMaxTicksChange={changeMaxTicks}
                />
              </TabsContent>

              <TabsContent value="smart-adaptive" className="mt-0">
                {analysis && <SmartAdaptiveTradingTab signals={signals} analysis={analysis} symbol={symbol} theme={theme} currentPrice={currentPrice} currentDigit={currentDigit} tickCount={tickCount} />}
              </TabsContent>

              <TabsContent value="tools-info" className="mt-0">
                <ToolsInfoTab theme={theme} connectionLogs={connectionLogs} />
              </TabsContent>
            </>
          )}
        </main>
      </Tabs>

      {!siteConfig?.footerHidden && (
        <footer
          className={`mt-6 py-6 sm:py-8 transition-all duration-300 border-t ${theme === "dark"
            ? "bg-[#0a0a0a] border-white/8"
            : "bg-gray-50 border-gray-200"
            }`}
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {/* Brand Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${theme === "dark" ? "bg-blue-600 text-white" : "bg-blue-600 text-white"}`}>
                    P
                  </div>
                  <span className={`font-semibold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    ProfitHub
                  </span>
                </div>
                <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  Real-time trading analysis and signals
                </p>
              </div>

              {/* Links Section */}
              <div className="flex flex-col gap-3 sm:col-span-2">
                <div className="flex flex-wrap gap-3 sm:gap-6">
                  <button
                    onClick={() => setIsDisclaimerOpen(true)}
                    className={`text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${theme === "dark" ? "text-gray-400 hover:text-blue-500" : "text-gray-600 hover:text-blue-600"}`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Risk Disclaimer
                  </button>
                  <a href="#" className={`text-xs sm:text-sm font-medium transition-colors ${theme === "dark" ? "text-gray-400 hover:text-blue-500" : "text-gray-600 hover:text-blue-600"}`}>
                    Privacy Policy
                  </a>
                  <a href="#" className={`text-xs sm:text-sm font-medium transition-colors hidden sm:inline-block ${theme === "dark" ? "text-gray-400 hover:text-blue-500" : "text-gray-600 hover:text-blue-600"}`}>
                    Terms of Service
                  </a>
                  <a href="#" className={`text-xs sm:text-sm font-medium transition-colors ${theme === "dark" ? "text-gray-400 hover:text-blue-500" : "text-gray-600 hover:text-blue-600"}`}>
                    Support
                  </a>
                </div>
              </div>
            </div>

            <div className={`mt-6 sm:mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm ${theme === "dark" ? "border-white/8 text-gray-500" : "border-gray-200 text-gray-500"}`}>
              <p>© 2026 ProfitHub. All rights reserved.</p>
              <p>Trading involves risk. Please read our risk disclaimer.</p>
            </div>
          </div>
        </footer>
      )}

      <Dialog open={isDisclaimerOpen} onOpenChange={setIsDisclaimerOpen}>
        <DialogContent className={`${theme === "dark" ? "bg-[#0a0e27] border-blue-500/30 text-white" : "bg-white"} sm:max-w-2xl`}>
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
              Risk Disclaimer
            </DialogTitle>
            <DialogDescription className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"} text-sm leading-relaxed space-y-4`}>
              <p>
                Deriv offers complex derivatives, such as options and contracts for difference (&quot;CFDs&quot;). These products may not be suitable for all clients, and trading them puts you at risk.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDisclaimerOpen(false)}
              className={theme === "dark" ? "border-gray-500 text-gray-300 hover:bg-gray-800" : ""}
            >
              Close
            </Button>
            <Button
              onClick={() => setIsDisclaimerOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <RiskDisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
        theme={theme}
      />

      {/* Floating AI Scanner */}
      <FloatingAIScanner 
        theme={theme} 
        availableSymbols={availableSymbols}
        onScanComplete={(results) => {
          console.log("[v0] AI Scanner results:", results)
        }}
      />

      {/* API Token Modal */}
      <ApiTokenModal
        open={showTokenModal}
        onSubmit={submitApiToken}
        onOAuthLogin={handleOAuthLogin}
        theme={theme}
      />
    </div>
  )
}
