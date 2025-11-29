import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import {
  ArrowLeft, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft,
  CreditCard, DollarSign, Clock, TrendingUp, Filter, Gift, Info,
  Calendar, ChevronRight, Sparkles, AlertCircle
} from "lucide-react";

type OperatorTier = "professional" | "equipped" | "manual";

interface Transaction {
  id: string;
  type: "credit" | "debit" | "withdrawal" | "bonus" | "referral_credit";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
  reference?: string;
  tier?: OperatorTier;
}

const TIER_INFO = {
  professional: { label: "Professional", shortLabel: "Pro", badge: "🏆", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  equipped: { label: "Skilled & Equipped", shortLabel: "Equipped", badge: "🚛", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  manual: { label: "Manual", shortLabel: "Manual", badge: "⛏️", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
};

interface WalletData {
  id: number;
  userId: number;
  balance: string;
  pendingBalance: string;
  totalEarnings: string;
  referralCredits: string;
  currency: string;
}

interface TransactionData {
  id: number;
  walletId: number;
  userId: number;
  type: string;
  amount: string;
  description: string;
  status: string;
  reference?: string;
  tier?: string;
  createdAt: string;
}

export default function Wallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [displayedCount, setDisplayedCount] = useState(5);
  
  // Tier filtering - read from URL params or user's current viewTier
  const searchParams = new URLSearchParams(window.location.search);
  const urlTier = searchParams.get('tier') as OperatorTier | null;
  const [selectedTier, setSelectedTier] = useState<OperatorTier | "all">(
    urlTier || "all"
  );
  
  // Store the origin path to navigate back to the correct dashboard
  const originPath = searchParams.get('from') || (user?.viewTier ? `/operator` : "/");
  
  // Determine if we came from operator context for navigation
  const isFromOperator = useMemo(() => {
    const fromParam = searchParams.get('from');
    return fromParam?.startsWith('/operator') || urlTier !== null || user?.operatorId !== undefined;
  }, [urlTier, user?.operatorId]);

  // Fetch wallet data
  const { data: walletData, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ['/api/wallet'],
    enabled: !!user,
  });

  // Fetch transactions
  const { data: transactionsData = [], isLoading: transactionsLoading } = useQuery<TransactionData[]>({
    queryKey: ['/api/wallet/transactions'],
    enabled: !!user,
  });

  // Withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => apiRequest('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount }),
      headers: { 'Content-Type': 'application/json' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
      toast({
        title: "Withdrawal Scheduled",
        description: `Your withdrawal will be processed on ${getNextFriday()}.`,
      });
      setShowWithdrawDialog(false);
      setWithdrawAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error?.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    },
  });

  const isLoading = walletLoading || transactionsLoading;

  // Convert API transactions to local format
  const transactions: Transaction[] = transactionsData.map(t => ({
    id: String(t.id),
    type: t.type as Transaction['type'],
    amount: parseFloat(t.amount),
    description: t.description,
    date: new Date(t.createdAt).toISOString().split('T')[0],
    status: t.status as Transaction['status'],
    reference: t.reference,
    tier: t.tier as OperatorTier | undefined,
  }));

  // Calculate tier-specific earnings from real data
  const tierEarnings = {
    professional: transactions.filter(t => t.tier === "professional" && t.type === "credit").reduce((sum, t) => sum + t.amount, 0),
    equipped: transactions.filter(t => t.tier === "equipped" && t.type === "credit").reduce((sum, t) => sum + t.amount, 0),
    manual: transactions.filter(t => t.tier === "manual" && t.type === "credit").reduce((sum, t) => sum + t.amount, 0),
  };

  // Use real wallet data or defaults
  const balance = parseFloat(walletData?.balance || "0.00");
  const pendingBalance = parseFloat(walletData?.pendingBalance || "0.00");
  const totalEarnings = parseFloat(walletData?.totalEarnings || "0.00");
  const referralCredits = parseFloat(walletData?.referralCredits || "0.00");

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate(originPath);
    }
  };
  
  // Handle tier filter change
  const handleTierFilterChange = (tier: string) => {
    setSelectedTier(tier as OperatorTier | "all");
    setDisplayedCount(5);
  };

  const getNextFriday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    return nextFriday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filterByPeriod = (transactions: Transaction[]) => {
    const now = new Date();
    switch (filterPeriod) {
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return transactions.filter(t => new Date(t.date) >= weekAgo);
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return transactions.filter(t => new Date(t.date) >= monthAgo);
      case "quarter":
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return transactions.filter(t => new Date(t.date) >= quarterAgo);
      default:
        return transactions;
    }
  };

  // First filter by tier, then by period, then by transaction type
  const tierFilteredTransactions = selectedTier === "all" 
    ? transactions 
    : transactions.filter(t => t.tier === selectedTier || !t.tier);
    
  const filteredTransactions = filterByPeriod(
    activeTab === "all" 
      ? tierFilteredTransactions 
      : activeTab === "credits"
        ? tierFilteredTransactions.filter(t => t.type === "referral_credit")
        : tierFilteredTransactions.filter(t => t.type === activeTab)
  );

  const displayedTransactions = filteredTransactions.slice(0, displayedCount);
  const hasMore = displayedCount < filteredTransactions.length;

  const handleLoadMore = () => {
    setDisplayedCount(prev => prev + 5);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return;
    }
    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You cannot withdraw more than your available balance.",
        variant: "destructive",
      });
      return;
    }
    withdrawMutation.mutate(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit":
        return <ArrowDownLeft className="h-4 w-4 text-emerald-600" />;
      case "debit":
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case "referral_credit":
        return <Gift className="h-4 w-4 text-purple-500" />;
      case "bonus":
        return <TrendingUp className="h-4 w-4 text-amber-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Please sign in to view your wallet</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-3 -ml-2" data-testid="button-back" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              Wallet
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your earnings and transactions</p>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm mb-4 overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Available Balance</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate" data-testid="text-balance">
                  ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {pendingBalance > 0 && (
                  <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                    <span className="truncate">${pendingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pending</span>
                  </p>
                )}
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0">
                <WalletIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white dark:text-gray-900" />
              </div>
            </div>

            {/* Friday Payout Notice */}
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Next payout: {getNextFriday()}</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Withdrawals are processed every Friday</p>
            </div>

            <div className="flex gap-2 mt-4">
              <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900"
                    data-testid="button-withdraw"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                      Enter the amount you'd like to withdraw. Withdrawals are processed every Friday.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="withdraw-amount">Amount</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="pl-7"
                          data-testid="input-withdraw-amount"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Available: ${balance.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Your withdrawal will be processed on {getNextFriday()}
                      </p>
                    </div>
                    <Button 
                      onClick={handleWithdraw} 
                      className="w-full"
                      data-testid="button-confirm-withdraw"
                    >
                      Schedule Withdrawal
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Tier Earnings Breakdown - Horizontal Scroll on Mobile */}
        <div className="mb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max pb-2">
            <button
              onClick={() => handleTierFilterChange("all")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all shrink-0 ${
                selectedTier === "all"
                  ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
              }`}
              data-testid="button-tier-all"
            >
              <span className="text-sm font-medium">All Tiers</span>
              <span className="text-xs opacity-75">${totalEarnings.toFixed(0)}</span>
            </button>
            {(Object.keys(TIER_INFO) as OperatorTier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => handleTierFilterChange(tier)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all shrink-0 ${
                  selectedTier === tier
                    ? `${TIER_INFO[tier].bgColor} border-current ${TIER_INFO[tier].color}`
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                }`}
                data-testid={`button-tier-${tier}`}
              >
                <span>{TIER_INFO[tier].badge}</span>
                <span className="text-sm font-medium">{TIER_INFO[tier].shortLabel}</span>
                <span className="text-xs opacity-75">${tierEarnings[tier].toFixed(0)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {selectedTier === "all" ? "Total Earnings" : `${TIER_INFO[selectedTier as OperatorTier].shortLabel}`}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate" data-testid="text-total-earnings">
                ${selectedTier === "all" ? totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : tierEarnings[selectedTier as OperatorTier].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">Referral Credits</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-purple-700 dark:text-purple-300 truncate" data-testid="text-referral-credits">
                ${referralCredits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 mt-0.5 sm:mt-1">Use towards jobs</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <CardTitle className="text-base font-semibold">Transaction History</CardTitle>
              </div>
              <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-gray-500" data-testid="button-filter">
                    <Filter className="h-4 w-4 mr-1" />
                    {filterPeriod !== "all" && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {filterPeriod === "week" ? "7d" : filterPeriod === "month" ? "30d" : "90d"}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Filter Transactions</DialogTitle>
                    <DialogDescription>
                      Select a time period to filter your transactions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                      <SelectTrigger data-testid="select-filter-period">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                        <SelectItem value="quarter">Last 90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => setShowFilterDialog(false)} 
                      className="w-full"
                      data-testid="button-apply-filter"
                    >
                      Apply Filter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setDisplayedCount(5); }}>
              <TabsList className="grid w-full grid-cols-4 h-9 mb-4">
                <TabsTrigger value="all" className="text-xs" data-testid="tab-all">All</TabsTrigger>
                <TabsTrigger value="credit" className="text-xs" data-testid="tab-earnings">Earnings</TabsTrigger>
                <TabsTrigger value="withdrawal" className="text-xs" data-testid="tab-withdrawals">Withdrawals</TabsTrigger>
                <TabsTrigger value="credits" className="text-xs" data-testid="tab-credits">Credits</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <div className="space-y-2">
                  {displayedTransactions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No transactions found</p>
                  ) : (
                    displayedTransactions.map((transaction) => (
                      <div 
                        key={transaction.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        data-testid={`transaction-${transaction.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                              {transaction.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                              <span>{new Date(transaction.date).toLocaleDateString()}</span>
                              {transaction.tier && (
                                <>
                                  <span>•</span>
                                  <span className={`${TIER_INFO[transaction.tier].color}`}>
                                    {TIER_INFO[transaction.tier].badge} {TIER_INFO[transaction.tier].shortLabel}
                                  </span>
                                </>
                              )}
                              {transaction.reference && (
                                <>
                                  <span>•</span>
                                  <span className="hidden sm:inline">{transaction.reference}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2 sm:ml-3">
                          <p className={`text-sm sm:text-base font-semibold ${transaction.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                            {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <div className="mt-0.5">
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {hasMore && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 text-gray-500 hover:text-gray-700"
                    data-testid="button-load-more"
                    onClick={handleLoadMore}
                  >
                    Load More Transactions ({filteredTransactions.length - displayedCount} remaining)
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Mobile Bottom Nav - context based on where user came from */}
      <MobileBottomNav context={isFromOperator ? "operator" : "customer"} />
    </div>
  );
}
