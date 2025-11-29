import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft, CreditCard, Plus, Building2, 
  CheckCircle, MoreVertical, Shield, Trash2, Eye, EyeOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaymentCard {
  id: number;
  userId: number;
  cardholderName: string;
  lastFourDigits: string;
  cardBrand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: number;
  displayNumber?: string;
}

const getCardBrandDisplay = (brand: string) => {
  const brands: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    unknown: "Card",
  };
  return brands[brand] || brand;
};

export default function Payments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [showCvv, setShowCvv] = useState(false);

  // Fetch payment cards from API
  const { data: paymentCards = [], isLoading } = useQuery<PaymentCard[]>({
    queryKey: ['/api/payment-cards'],
    enabled: !!user,
  });

  // Add card mutation
  const addCardMutation = useMutation({
    mutationFn: (cardData: any) => apiRequest('/api/payment-cards', {
      method: 'POST',
      body: JSON.stringify(cardData),
      headers: { 'Content-Type': 'application/json' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-cards'] });
      toast({ title: "Card Added", description: "Your payment card has been added successfully." });
      setShowAddCardDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to add card", description: error?.message || "Please try again.", variant: "destructive" });
    },
  });

  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: (cardId: number) => apiRequest(`/api/payment-cards/${cardId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-cards'] });
      toast({ title: "Card Removed", description: "Your payment card has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to remove card", description: error?.message || "Please try again.", variant: "destructive" });
    },
  });

  // Set default card mutation
  const setDefaultMutation = useMutation({
    mutationFn: (cardId: number) => apiRequest(`/api/payment-cards/${cardId}/set-default`, {
      method: 'POST',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-cards'] });
      toast({ title: "Default Card Updated" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update default", description: error?.message || "Please try again.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setCardNumber("");
    setCardholderName("");
    setExpiryMonth("");
    setExpiryYear("");
    setCvv("");
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleAddCard = () => {
    if (!cardNumber || !cardholderName || !expiryMonth || !expiryYear || !cvv) {
      toast({ title: "Missing Information", description: "Please fill in all card details.", variant: "destructive" });
      return;
    }
    
    addCardMutation.mutate({
      cardNumber: cardNumber.replace(/\s/g, ''),
      cardholderName,
      expiryMonth,
      expiryYear,
      cvv,
      setAsDefault: paymentCards.length === 0,
    });
  };

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id);
  };

  const handleRemove = (id: number) => {
    deleteCardMutation.mutate(id);
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

        {/* Add Card Dialog */}
        <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Payment Card</DialogTitle>
              <DialogDescription>
                Enter your card details. Card numbers are never stored, only the last 4 digits.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  data-testid="input-card-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  placeholder="John Doe"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  data-testid="input-cardholder-name"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth">Month</Label>
                  <Input
                    id="expiryMonth"
                    placeholder="MM"
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    maxLength={2}
                    data-testid="input-expiry-month"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryYear">Year</Label>
                  <Input
                    id="expiryYear"
                    placeholder="YY"
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    data-testid="input-expiry-year"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <div className="relative">
                    <Input
                      id="cvv"
                      type={showCvv ? "text" : "password"}
                      placeholder="***"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="pr-10"
                      data-testid="input-cvv"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCvv(!showCvv)}
                    >
                      {showCvv ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddCardDialog(false)}>Cancel</Button>
              <Button onClick={handleAddCard} disabled={addCardMutation.isPending} data-testid="button-submit-card">
                {addCardMutation.isPending ? "Adding..." : "Add Card"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
                onClick={() => setShowAddCardDialog(true)}
                data-testid="button-add-card"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Card
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {paymentCards.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No payment cards added yet</p>
                <p className="text-xs mt-1">Add a card to make payments</p>
              </div>
            ) : (
              paymentCards.map((card) => (
                <div 
                  key={card.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  data-testid={`payment-card-${card.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 rounded bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-400 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-white dark:text-gray-900" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {getCardBrandDisplay(card.cardBrand)} •••• {card.lastFourDigits}
                        </p>
                        {card.isDefault === 1 && (
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Expires {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`dropdown-card-${card.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {card.isDefault !== 1 && (
                        <DropdownMenuItem onClick={() => handleSetDefault(card.id)} data-testid={`action-set-default-${card.id}`}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleRemove(card.id)}
                        className="text-red-600 dark:text-red-400"
                        data-testid={`action-remove-card-${card.id}`}
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

        {/* Bank Accounts - Coming Soon */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <CardTitle className="text-base font-semibold">Bank Accounts</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center py-6">
              <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Bank account linking coming soon</p>
              <p className="text-xs text-gray-400 mt-1">Link a bank account for faster withdrawals</p>
            </div>
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
