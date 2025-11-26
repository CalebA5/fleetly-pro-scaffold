import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function BlogUpdates() {
  const blogPosts = [
    {
      title: "Introducing Multi-Tier Operator System",
      excerpt: "We're excited to announce our new three-tier operator system, designed to match customers with the right level of expertise and equipment for every job.",
      author: "Fleetly Team",
      date: new Date("2025-11-20"),
      category: "Product Updates",
      slug: "multi-tier-operator-system"
    },
    {
      title: "Weather Alert Integration Now Live",
      excerpt: "Fleetly now integrates with the National Weather Service to provide real-time weather alerts for proactive snow plowing and emergency services.",
      author: "Engineering Team",
      date: new Date("2025-11-15"),
      category: "Features",
      slug: "weather-alert-integration"
    },
    {
      title: "Customer Success Story: JackD Snow Removal",
      excerpt: "Learn how JackD transformed their snow plowing business using Fleetly's Professional Business tier and multi-driver management features.",
      author: "Customer Success",
      date: new Date("2025-11-10"),
      category: "Success Stories",
      slug: "jackd-snow-removal-story"
    },
    {
      title: "AI Assist: Smarter Service Recommendations",
      excerpt: "Our new AI Assist feature uses machine learning to recommend the best services and operators based on your job description and photos.",
      author: "Product Team",
      date: new Date("2025-11-05"),
      category: "Features",
      slug: "ai-assist-launch"
    },
    {
      title: "Operator Earnings Dashboard Updates",
      excerpt: "Track your earnings more accurately with our new persistent earnings tracking system, including daily, monthly, and lifetime statistics.",
      author: "Product Team",
      date: new Date("2025-11-01"),
      category: "Product Updates",
      slug: "earnings-dashboard-updates"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/help">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-help">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help & Support
          </Button>
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
            Blog & Updates
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Stay up to date with the latest features, tips, and news from Fleetly
          </p>
        </div>

        <div className="space-y-6">
          {blogPosts.map((post, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-blog-post-${index}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {post.category}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDistanceToNow(post.date, { addSuffix: true })}</span>
                  </div>
                </div>
                <CardTitle className="text-xl text-black dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  {post.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4" />
                  <span>{post.author}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {post.excerpt}
                </p>
                <Button variant="ghost" className="group" data-testid={`button-read-more-${index}`}>
                  Read More
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-12 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">Subscribe to Updates</CardTitle>
            <CardDescription>
              Get the latest Fleetly news and updates delivered to your inbox
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Contact our support team to subscribe to our newsletter and stay informed about new features, tips, and operator success stories.
            </p>
            <Link href="/help">
              <Button
                className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                data-testid="button-subscribe"
              >
                Contact Us to Subscribe
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
