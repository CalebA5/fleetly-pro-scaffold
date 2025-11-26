import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, CreditCard, Plus, Building2, 
  CheckCircle, MoreVertical, Shield, Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaymentMethod {
  id: string;
  type: "card" | "bank";
  name: string;
  last4: string;
  isDefault: boolean;
  expiryDate?: string;
  bankName?: string;
}

const mockPaymentMethods: PaymentMethod[] = [
  { id: "1", type: "card", name: "Visa", last4: "4242", isDefault: true, expiryDate: "12/26" },
  { id: "2", type: "card", name: "Mastercard", last4: "8888", isDefault: false, expiryDate: "08/25" },
  { id: "3", type: "bank", name: "TD Bank", last4: "5678", isDefault: false, bankName: "Toronto-Dominion Bank" },
];

export default function Payments() {
  const { user } = useAuth();
  const [isLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods);

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods => 
      methods.map(m => ({ ...m, isDefault: m.id === id }))
    );
  };

  const handleRemove = (id: string) => {
    setPaymentMethods(methods => methods.filter(m => m.id !== id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-40 w-full" />
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
              <p className="text-center text-muted-foreground">Please sign in to manage payment methods</p>
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-3 -ml-2" 
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              Payment Methods
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your payment and payout methods</p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-4">
          <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Your payment information is encrypted and securely stored
          </p>
        </div>

        {/* Payment Methods List */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <CardTitle className="text-base font-semibold">Cards</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                data-testid="button-add-card"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Card
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {paymentMethods.filter(m => m.type === "card").map((method) => (
              <div 
                key={method.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                data-testid={`payment-method-${method.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-7 rounded bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-400 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-white dark:text-gray-900" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {method.name} •••• {method.last4}
                      </p>
                      {method.isDefault && (
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Expires {method.expiryDate}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`dropdown-card-${method.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!method.isDefault && (
                      <DropdownMenuItem onClick={() => handleSetDefault(method.id)} data-testid={`action-set-default-${method.id}`}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleRemove(method.id)}
                      className="text-red-600 dark:text-red-400"
                      data-testid={`action-remove-card-${method.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bank Accounts */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <CardTitle className="text-base font-semibold">Bank Accounts</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                data-testid="button-add-bank"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Bank
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {paymentMethods.filter(m => m.type === "bank").length === 0 ? (
              <div className="text-center py-6">
                <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No bank accounts linked</p>
                <p className="text-xs text-gray-400 mt-1">Add a bank account for faster withdrawals</p>
              </div>
            ) : (
              paymentMethods.filter(m => m.type === "bank").map((method) => (
                <div 
                  key={method.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  data-testid={`payment-method-${method.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {method.bankName}
                      </p>
                      <p className="text-xs text-gray-500">•••• {method.last4}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`dropdown-bank-${method.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleRemove(method.id)}
                        className="text-red-600 dark:text-red-400"
                        data-testid={`action-remove-bank-${method.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Payout Preferences */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Payout Preferences</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Automatic Payouts</p>
                <p className="text-xs text-gray-500">Automatically transfer earnings every week</p>
              </div>
              <Switch defaultChecked data-testid="switch-auto-payout" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Instant Payouts</p>
                <p className="text-xs text-gray-500">Get paid within minutes (1.5% fee)</p>
              </div>
              <Switch data-testid="switch-instant-payout" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
