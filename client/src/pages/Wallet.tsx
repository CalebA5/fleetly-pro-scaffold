import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft,
  CreditCard, DollarSign, Clock, TrendingUp, Filter
} from "lucide-react";

interface Transaction {
  id: string;
  type: "credit" | "debit" | "withdrawal" | "bonus";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
  reference?: string;
}

const mockTransactions: Transaction[] = [
  { id: "1", type: "credit", amount: 125.00, description: "Snow Plowing Job - Calgary Downtown", date: "2025-11-26", status: "completed", reference: "JOB-2411260" },
  { id: "2", type: "credit", amount: 85.50, description: "Towing Service - Highway 2", date: "2025-11-25", status: "completed", reference: "JOB-2411252" },
  { id: "3", type: "withdrawal", amount: -200.00, description: "Withdrawal to Bank Account", date: "2025-11-24", status: "completed" },
  { id: "4", type: "credit", amount: 45.00, description: "Courier Delivery", date: "2025-11-23", status: "completed", reference: "JOB-2411231" },
  { id: "5", type: "bonus", amount: 25.00, description: "Referral Bonus - New Operator", date: "2025-11-22", status: "completed" },
  { id: "6", type: "credit", amount: 180.00, description: "Hauling Job - Industrial Area", date: "2025-11-21", status: "completed", reference: "JOB-2411211" },
  { id: "7", type: "withdrawal", amount: -150.00, description: "Withdrawal to Bank Account", date: "2025-11-20", status: "pending" },
];

export default function Wallet() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading] = useState(false);

  const balance = 460.50;
  const pendingBalance = 150.00;
  const totalEarnings = 1235.50;

  const filteredTransactions = activeTab === "all" 
    ? mockTransactions 
    : mockTransactions.filter(t => t.type === activeTab);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit":
        return <ArrowDownLeft className="h-4 w-4 text-emerald-600" />;
      case "debit":
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
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
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-3 -ml-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              Wallet
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your earnings and transactions</p>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Available Balance</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-balance">
                  ${balance.toFixed(2)}
                </p>
                {pendingBalance > 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    ${pendingBalance.toFixed(2)} pending
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center">
                <WalletIcon className="h-6 w-6 text-white dark:text-gray-900" />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button 
                className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900"
                data-testid="button-withdraw"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                data-testid="button-add-funds"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Add Funds
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-total-earnings">
                ${totalEarnings.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownLeft className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">This Month</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-month-earnings">
                ${(balance + 200).toFixed(2)}
              </p>
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
              <Button variant="ghost" size="sm" className="h-8 text-gray-500">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 h-9 mb-4">
                <TabsTrigger value="all" className="text-xs" data-testid="tab-all">All</TabsTrigger>
                <TabsTrigger value="credit" className="text-xs" data-testid="tab-earnings">Earnings</TabsTrigger>
                <TabsTrigger value="withdrawal" className="text-xs" data-testid="tab-withdrawals">Withdrawals</TabsTrigger>
                <TabsTrigger value="bonus" className="text-xs" data-testid="tab-bonuses">Bonuses</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <div className="space-y-2">
                  {filteredTransactions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No transactions found</p>
                  ) : (
                    filteredTransactions.map((transaction) => (
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
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{new Date(transaction.date).toLocaleDateString()}</span>
                              {transaction.reference && (
                                <>
                                  <span>•</span>
                                  <span>{transaction.reference}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className={`font-semibold ${transaction.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                            {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                          </p>
                          <div className="mt-0.5">
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {filteredTransactions.length > 0 && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 text-gray-500 hover:text-gray-700"
                    data-testid="button-load-more"
                  >
                    Load More Transactions
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
