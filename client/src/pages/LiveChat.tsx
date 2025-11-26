import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, 
  Send, 
  MessageCircle, 
  Bot,
  User,
  Clock,
  CheckCheck
} from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "support";
  timestamp: Date;
  status: "sent" | "delivered" | "read";
}

const supportResponses = [
  "Thank you for reaching out! How can I help you today?",
  "I'd be happy to assist you with that. Could you provide more details?",
  "That's a great question. Let me look into that for you.",
  "I understand your concern. Here's what I recommend...",
  "Is there anything else I can help you with?",
  "Our team is here to help 24/7. Feel free to ask any questions.",
  "Thank you for your patience. I'm checking on this now.",
  "I've noted your feedback and will pass it along to our team."
];

export function LiveChat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content: "Hello! Welcome to Fleetly Support. How can I help you today?",
      sender: "support",
      timestamp: new Date(),
      status: "read"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
      status: "sent"
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMessage.id ? { ...m, status: "delivered" as const } : m
        )
      );
    }, 500);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMessage.id ? { ...m, status: "read" as const } : m
        )
      );
      setIsTyping(true);
    }, 1000);

    setTimeout(() => {
      setIsTyping(false);
      const randomResponse = supportResponses[Math.floor(Math.random() * supportResponses.length)];
      const supportMessage: ChatMessage = {
        id: `support-${Date.now()}`,
        content: randomResponse,
        sender: "support",
        timestamp: new Date(),
        status: "read"
      };
      setMessages((prev) => [...prev, supportMessage]);
    }, 2000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        <Link href="/help">
          <Button variant="ghost" size="sm" className="mb-4 self-start" data-testid="button-back-help">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help & Support
          </Button>
        </Link>

        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="border-b bg-white dark:bg-gray-800 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-orange-100 dark:bg-orange-900">
                    <Bot className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
              </div>
              <div>
                <CardTitle className="text-base text-black dark:text-white">Fleetly Support</CardTitle>
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Online - Typically replies instantly
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-[400px] max-h-[500px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.sender === "user"
                      ? "bg-black text-white dark:bg-white dark:text-black rounded-br-md"
                      : "bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md"
                  }`}
                  data-testid={`message-${message.id}`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 ${
                      message.sender === "user"
                        ? "text-gray-300 dark:text-gray-600"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    <span className="text-xs">{formatTime(message.timestamp)}</span>
                    {message.sender === "user" && (
                      <CheckCheck
                        className={`w-3 h-3 ${
                          message.status === "read"
                            ? "text-blue-400"
                            : message.status === "delivered"
                            ? "text-gray-400"
                            : "text-gray-500"
                        }`}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          <div className="p-4 border-t bg-white dark:bg-gray-800 rounded-b-lg">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim()}
                className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Support available 24/7 - We typically respond within seconds
            </p>
          </div>
        </Card>

        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-black dark:text-white">Need more help?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Visit our Help Center or email support@fleetly.com
                  </p>
                </div>
              </div>
              <Link href="/help">
                <Button variant="outline" size="sm" data-testid="button-help-center">
                  Help Center
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LiveChat;
