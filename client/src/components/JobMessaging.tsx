import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageSquare, Send, X, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  messageId: string;
  jobId: string;
  senderId: string;
  senderType: "customer" | "operator";
  senderName: string;
  content: string;
  isRead: number;
  createdAt: string;
}

interface JobMessagingProps {
  jobId: string;
  currentUserId: string;
  currentUserType: "customer" | "operator";
  currentUserName: string;
  recipientName?: string;
  variant?: "inline" | "sheet";
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={cn("flex mb-3", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2",
          isOwn
            ? "bg-black dark:bg-white text-white dark:text-black rounded-br-md"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
        )}
      >
        {!isOwn && (
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {message.senderName}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className={cn(
          "text-[10px] mt-1",
          isOwn ? "text-gray-300 dark:text-gray-600" : "text-gray-400 dark:text-gray-500"
        )}>
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

function MessagingContent({
  jobId,
  currentUserId,
  currentUserType,
  currentUserName,
  recipientName,
}: Omit<JobMessagingProps, "variant">) {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/jobs", jobId, "messages"],
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/jobs/${jobId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          senderId: currentUserId,
          senderType: currentUserType,
          senderName: currentUserName,
          content,
          jobType: "service_request",
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId, "messages"] });
      setNewMessage("");
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/jobs/${jobId}/messages/read`, {
        method: "PATCH",
        body: JSON.stringify({
          readerId: currentUserId,
          readerType: currentUserType,
        }),
      });
    },
  });

  useEffect(() => {
    if (messages.length > 0) {
      markAsReadMutation.mutate();
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages.length]);

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollRef} className="flex-1 p-4 max-h-[400px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Send a message to {recipientName || "your operator"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.messageId}
                message={msg}
                isOwn={msg.senderId === currentUserId}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sendMessageMutation.isPending}
            className="flex-1"
            data-testid="input-message"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            size="icon"
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            data-testid="button-send-message"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function JobMessaging(props: JobMessagingProps) {
  const { variant = "sheet", recipientName } = props;

  if (variant === "inline") {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <MessagingContent {...props} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full" size="sm" data-testid="button-open-messages">
          <MessageSquare className="w-4 h-4 mr-2" />
          Send Message
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chat with {recipientName || "Operator"}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <MessagingContent {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function UnreadMessageBadge({ 
  userId, 
  userType 
}: { 
  userId: string; 
  userType: "customer" | "operator";
}) {
  const { data } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count", userId, userType],
    refetchInterval: 10000,
  });

  if (!data?.count || data.count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {data.count > 9 ? "9+" : data.count}
    </span>
  );
}
