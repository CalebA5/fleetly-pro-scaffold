import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, FileText, Shield, Scale, Cookie } from "lucide-react";

export default function Legal() {
  const [activeTab, setActiveTab] = useState("terms");

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
              Legal
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Terms, privacy, and legal information</p>
          </div>
        </div>

        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="terms" className="text-xs" data-testid="tab-terms">
                  <FileText className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Terms
                </TabsTrigger>
                <TabsTrigger value="privacy" className="text-xs" data-testid="tab-privacy">
                  <Shield className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger value="liability" className="text-xs" data-testid="tab-liability">
                  <Scale className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Liability
                </TabsTrigger>
                <TabsTrigger value="cookies" className="text-xs" data-testid="tab-cookies">
                  <Cookie className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  Cookies
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-4">
              <TabsContent value="terms" className="mt-0">
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Terms of Service</h2>
                    <p className="text-xs text-gray-500">Last updated: November 26, 2025</p>
                    
                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">1. Acceptance of Terms</h3>
                      <p>By accessing and using Fleetly, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">2. Description of Service</h3>
                      <p>Fleetly provides an on-demand marketplace connecting customers with service operators for snow plowing, towing, hauling, and courier services. We act as an intermediary platform and do not directly provide these services.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">3. User Accounts</h3>
                      <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">4. Operator Requirements</h3>
                      <p>Operators must maintain all required licenses, insurance, and certifications for their respective service categories. Fleetly reserves the right to verify credentials and suspend operators who fail to meet requirements.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">5. Service Fees</h3>
                      <p>Fleetly charges a service fee for facilitating transactions between customers and operators. Fee schedules are available in the app and may be updated from time to time with reasonable notice.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">6. Cancellation Policy</h3>
                      <p>Customers may cancel service requests according to our cancellation policy. Cancellation fees may apply depending on timing and operator availability.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">7. Dispute Resolution</h3>
                      <p>Any disputes between users will be handled through our internal dispute resolution process. We encourage users to attempt to resolve issues directly before escalating to our support team.</p>
                    </section>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="privacy" className="mt-0">
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Policy</h2>
                    <p className="text-xs text-gray-500">Last updated: November 26, 2025</p>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">1. Information We Collect</h3>
                      <p>We collect information you provide directly, including your name, email address, phone number, location data, and payment information. We also collect usage data and device information to improve our services.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">2. How We Use Your Information</h3>
                      <p>We use your information to provide and improve our services, process transactions, communicate with you, and ensure platform safety. We may also use data for analytics and marketing purposes.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">3. Information Sharing</h3>
                      <p>We share information with service operators to facilitate bookings, with payment processors to handle transactions, and with service providers who assist our operations. We do not sell your personal information.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">4. Data Security</h3>
                      <p>We implement industry-standard security measures to protect your information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">5. Your Rights</h3>
                      <p>You have the right to access, correct, or delete your personal information. You can also opt out of marketing communications and request data portability where applicable.</p>
                    </section>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="liability" className="mt-0">
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liability & Insurance</h2>
                    <p className="text-xs text-gray-500">Last updated: November 26, 2025</p>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">1. Platform Liability</h3>
                      <p>Fleetly acts as an intermediary platform and is not liable for the actions, negligence, or misconduct of independent operators or customers using our platform.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">2. Operator Insurance Requirements</h3>
                      <p>All operators are required to maintain appropriate insurance coverage for their service category. This includes general liability, commercial auto, and any industry-specific coverage.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">3. Damage Claims</h3>
                      <p>Claims for property damage or personal injury should be directed to the operator's insurance provider. Fleetly will assist in facilitating communication but is not responsible for claim outcomes.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">4. Limitation of Liability</h3>
                      <p>To the maximum extent permitted by law, Fleetly's liability for any claim arising from use of the platform shall not exceed the fees paid to Fleetly in the 12 months preceding the claim.</p>
                    </section>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="cookies" className="mt-0">
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cookie Policy</h2>
                    <p className="text-xs text-gray-500">Last updated: November 26, 2025</p>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">1. What Are Cookies</h3>
                      <p>Cookies are small text files placed on your device when you visit our platform. They help us remember your preferences and improve your experience.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">2. Types of Cookies We Use</h3>
                      <p><strong>Essential Cookies:</strong> Required for basic platform functionality and security.</p>
                      <p><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform.</p>
                      <p><strong>Preference Cookies:</strong> Remember your settings and preferences.</p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">3. Managing Cookies</h3>
                      <p>You can control cookies through your browser settings. Blocking certain cookies may impact your experience on our platform.</p>
                    </section>
                  </div>
                </ScrollArea>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
