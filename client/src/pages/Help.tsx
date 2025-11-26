import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Send, Bot, User, MessageCircle, Phone, Mail,
  HelpCircle, FileText, Truck, CreditCard, MapPin, Shield,
  Clock, ChevronRight, Sparkles, UserCircle, Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  icon: any;
  label: string;
  query: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "booking", icon: Truck, label: "Booking Issues", query: "I'm having trouble with my booking" },
  { id: "payment", icon: CreditCard, label: "Payment Help", query: "I need help with a payment issue" },
  { id: "location", icon: MapPin, label: "Location Services", query: "I'm having issues with location services" },
  { id: "account", icon: Shield, label: "Account Security", query: "I have a question about my account security" },
  { id: "operator", icon: UserCircle, label: "Operator Questions", query: "I have questions about becoming an operator" },
  { id: "general", icon: HelpCircle, label: "General Help", query: "I need general assistance" },
];

const FAQ_ITEMS = [
  { question: "How do I request a service?", answer: "Tap 'Request Service' from the home page, select your service type, enter your location, and choose from available operators." },
  { question: "How do I become an operator?", answer: "Go to 'Drive & Earn' and complete the registration process. You'll need to verify your identity and any required certifications." },
  { question: "How do payments work?", answer: "Payments are processed securely through the app. Operators receive payouts weekly on Fridays to their connected bank account." },
  { question: "What if I need to cancel?", answer: "You can cancel a request before an operator accepts it at no charge. Once accepted, cancellation policies apply." },
];

export default function Help() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Fleetly's AI assistant. I can help you with questions about bookings, payments, account issues, and more. How can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [showEscalation, setShowEscalation] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("/api/support/chat", {
        method: "POST",
        body: JSON.stringify({ 
          message,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });
      return response;
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data: any) => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.shouldEscalate || messages.length > 6) {
        setShowEscalation(true);
      }
    },
    onError: () => {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I apologize, but I'm having trouble connecting. Would you like to speak with a human agent instead?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setShowEscalation(true);
    },
    onSettled: () => {
      setIsTyping(false);
    }
  });

  const handleSendMessage = (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    chatMutation.mutate(text);
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEscalate = () => {
    const escalationMessage: Message = {
      id: `system-${Date.now()}`,
      role: "system",
      content: "Your request has been escalated. A human support agent will reach out to you via email within 24 hours. You can also contact us directly at support@fleetly.com",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, escalationMessage]);
    setShowEscalation(false);
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                Help & Support
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Get instant help from our AI assistant
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Chat Section */}
          <div className="md:col-span-2">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm h-[600px] flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Fleetly Assistant</CardTitle>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Online
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                      data-testid={`message-${message.id}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        message.role === "user" 
                          ? "bg-gray-900 dark:bg-white" 
                          : message.role === "system"
                          ? "bg-amber-100"
                          : "bg-gradient-to-br from-teal-400 to-teal-600"
                      }`}>
                        {message.role === "user" ? (
                          <User className="h-4 w-4 text-white dark:text-gray-900" />
                        ) : message.role === "system" ? (
                          <MessageCircle className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Bot className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-tr-sm"
                          : message.role === "system"
                          ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === "user" 
                            ? "text-gray-300 dark:text-gray-600" 
                            : "text-gray-500"
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Quick Actions */}
              {messages.length <= 2 && (
                <div className="px-4 py-3 border-t bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 mb-2">Quick topics:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS.slice(0, 4).map((action) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleQuickAction(action)}
                        data-testid={`quick-action-${action.id}`}
                      >
                        <action.icon className="h-3 w-3 mr-1" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Escalation Banner */}
              {showEscalation && (
                <div className="px-4 py-3 border-t bg-amber-50 dark:bg-amber-900/20">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Need more help? Connect with a human agent.
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={handleEscalate}
                      data-testid="button-escalate"
                    >
                      <UserCircle className="h-4 w-4 mr-1" />
                      Connect to Agent
                    </Button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t bg-white dark:bg-gray-900">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={chatMutation.isPending}
                    data-testid="input-chat-message"
                  />
                  <Button 
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || chatMutation.isPending}
                    data-testid="button-send-message"
                  >
                    {chatMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* FAQ */}
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Common Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {FAQ_ITEMS.map((item, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSendMessage(item.question)}
                    data-testid={`faq-item-${index}`}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.question}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Contact Options */}
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Other Ways to Reach Us</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <a 
                  href="mailto:support@fleetly.com" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  data-testid="contact-email"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Email Support</p>
                    <p className="text-xs text-gray-500">support@fleetly.com</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                </a>
                <a 
                  href="tel:1-800-FLEETLY" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  data-testid="contact-phone"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Phone Support</p>
                    <p className="text-xs text-gray-500">1-800-FLEETLY</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                </a>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>Available 24/7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
