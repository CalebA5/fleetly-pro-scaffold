import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle,
  Send,
  MessageCircle,
  Mail,
  Phone,
  Loader2,
  ChevronRight
} from "lucide-react";

export const HelpSupport = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const submitSupportMutation = useMutation({
    mutationFn: async (data: any) => {
      // In production, this would send to support backend
      return new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Our support team will get back to you within 24 hours.",
      });
      setSubject("");
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Failed to Send",
        description: "Unable to send your message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast({
        title: "All Fields Required",
        description: "Please fill out all fields to submit your message.",
        variant: "destructive",
      });
      return;
    }

    submitSupportMutation.mutate({ name, email, subject, message });
  };

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I request a service?",
          a: "You can request a service by browsing available operators on the map, selecting one, and clicking 'Request Service'. Alternatively, use our AI Assist feature to get personalized service recommendations based on your job description."
        },
        {
          q: "Do I need to create an account?",
          a: "You can browse operators without an account, but you'll need to sign in to send service requests to operators. Creating an account is quick and free!"
        },
        {
          q: "How does the AI Assist feature work?",
          a: "AI Assist analyzes your job description and any photos you upload to recommend the most suitable services. It considers factors like urgency, complexity, and nearby operator availability to provide personalized recommendations with pricing estimates."
        }
      ]
    },
    {
      category: "For Customers",
      questions: [
        {
          q: "How do I know my request was received?",
          a: "You'll receive a confirmation notification immediately after submitting your request. You can track your request status in the 'Request Status' page, which shows whether it's pending, confirmed, or declined."
        },
        {
          q: "Can I upload photos with my service request?",
          a: "Yes! You can upload up to 10 photos when creating a service request. Photos help operators better understand your job and provide more accurate quotes."
        },
        {
          q: "How are operators rated?",
          a: "Operators are rated by customers after each completed job. Ratings include star scores (1-5) and optional written reviews. Only verified completed jobs contribute to operator ratings."
        },
        {
          q: "What if an operator declines my request?",
          a: "If an operator declines, you'll be notified immediately and can send requests to other available operators. The system will suggest alternative operators based on your job requirements."
        }
      ]
    },
    {
      category: "For Operators",
      questions: [
        {
          q: "How do I become an operator?",
          a: "Click 'Drive & Earn' in the header, create an account, and complete the onboarding process. You'll need to provide business information, vehicle details, services offered, and verification documents."
        },
        {
          q: "How do I receive job requests?",
          a: "Once you're online and your profile is complete, you'll receive notifications for nearby job requests matching your services. You can view details and accept or decline each request from your operator dashboard."
        },
        {
          q: "Can I set my own prices?",
          a: "Yes, operators set their own hourly rates during onboarding. You can update your pricing at any time from your profile settings."
        },
        {
          q: "What happens if I can't complete a job?",
          a: "Contact the customer immediately through the app. You can communicate any issues or delays directly in the job tracking interface."
        }
      ]
    },
    {
      category: "Payments & Pricing",
      questions: [
        {
          q: "How is pricing determined?",
          a: "Each operator sets their own hourly rate. The final cost depends on the job duration and any additional services required. You'll see estimated pricing before confirming a service request."
        },
        {
          q: "When do I pay?",
          a: "Payment is collected after the job is completed and confirmed by both parties. You can add payment methods in your account settings."
        },
        {
          q: "What if I'm not satisfied with the service?",
          a: "Contact our support team within 24 hours of job completion. We review all disputes and work with both parties to reach a fair resolution."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header 
        onSignIn={() => {
          setAuthTab("signin");
          setShowAuthDialog(true);
        }}
        onSignUp={() => {
          setAuthTab("signup");
          setShowAuthDialog(true);
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <HelpCircle className="w-16 h-16 mx-auto mb-4 text-black dark:text-white" />
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
            Help & Support
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Find answers to common questions or contact our support team
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-black dark:text-white mb-1">Live Chat</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Chat with support team
              </p>
              <Button variant="outline" className="w-full" data-testid="button-live-chat">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Mail className="w-12 h-12 mx-auto mb-3 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-black dark:text-white mb-1">Email Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                support@fleetly.com
              </p>
              <Button variant="outline" className="w-full" data-testid="button-email-support">
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Phone className="w-12 h-12 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-black dark:text-white mb-1">Phone Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                1-800-FLEETLY
              </p>
              <Button variant="outline" className="w-full" data-testid="button-phone-support">
                Call Now
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* FAQs */}
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
              Frequently Asked Questions
            </h2>
            {faqs.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg text-black dark:text-white">
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, index) => (
                      <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                        <AccordionTrigger className="text-left text-black dark:text-white">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-700 dark:text-gray-300">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
              Send Us a Message
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-black dark:text-white">Contact Support</CardTitle>
                <CardDescription>We'll get back to you within 24 hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-black dark:text-white">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2"
                    data-testid="input-name"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-black dark:text-white">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2"
                    data-testid="input-email"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-black dark:text-white">
                    Subject *
                  </Label>
                  <Input
                    id="subject"
                    placeholder="What can we help you with?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-2"
                    data-testid="input-subject"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-black dark:text-white">
                    Message *
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your issue or question in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="mt-2"
                    data-testid="input-message"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitSupportMutation.isPending}
                  className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  data-testid="button-submit-support"
                >
                  {submitSupportMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Additional Resources */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-black dark:text-white">Additional Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-start" data-testid="link-user-guide">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  User Guide
                </Button>
                <Button variant="ghost" className="w-full justify-start" data-testid="link-operator-guide">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Operator Guide
                </Button>
                <Button variant="ghost" className="w-full justify-start" data-testid="link-community">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Community Forum
                </Button>
                <Button variant="ghost" className="w-full justify-start" data-testid="link-blog">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Blog & Updates
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
        defaultTab={authTab}
      />
    </div>
  );
};
