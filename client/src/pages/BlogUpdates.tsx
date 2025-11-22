import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { ArrowLeft, Calendar, User } from "lucide-react";

export function BlogUpdates() {
  const posts = [
    {
      title: "Winter Season Tips: Maximizing Your Snow Plowing Revenue",
      excerpt: "Learn proven strategies to optimize your snow plowing business during peak winter season. From pricing strategies to equipment maintenance...",
      date: "November 20, 2025",
      author: "Sarah Chen",
      category: "Tips & Tricks"
    },
    {
      title: "Introducing Multi-Tier Operators: Flexibility to Grow Your Business",
      excerpt: "We've launched a new multi-tier system that lets you operate at multiple levels. Start small and scale up at your own pace with our flexible tier options...",
      date: "November 15, 2025",
      author: "Fleetly Team",
      category: "Product Update"
    },
    {
      title: "Customer Story: How Marcus Grew His Hauling Business 3x",
      excerpt: "Meet Marcus, a manual operator who scaled to professional tier and tripled his revenue in just 8 months. Here's his success story...",
      date: "November 10, 2025",
      author: "James Wilson",
      category: "Success Stories"
    },
    {
      title: "Safety First: Best Practices for Winter Operations",
      excerpt: "Safety is our top priority. Learn how to operate safely during winter weather and what equipment and precautions we recommend...",
      date: "November 5, 2025",
      author: "Mike Johnson",
      category: "Safety"
    },
    {
      title: "New Feature: Enhanced AI Assist for Better Job Matching",
      excerpt: "Our AI Assist feature now provides even better operator recommendations using improved matching algorithms. See what's new...",
      date: "October 30, 2025",
      author: "Fleetly Team",
      category: "Product Update"
    },
    {
      title: "Weather Integration: Get Real-Time Alerts for Your Area",
      excerpt: "Stay ahead of weather changes with our new real-time weather integration. Get alerts for severe weather affecting your operating area...",
      date: "October 25, 2025",
      author: "Weather Team",
      category: "Feature"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/help">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-help">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help
          </Button>
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">Blog & Updates</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Stay informed with the latest news, tips, and updates from Fleetly.
          </p>
        </div>

        <div className="space-y-4">
          {posts.map((post, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <CardContent className="pt-6">
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold">
                    {post.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-black dark:text-white mb-2 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-gray-700 dark:text-gray-300 mb-4">{post.excerpt}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-orange-600 dark:text-orange-400 hover:text-orange-700" data-testid={`button-read-post-${index}`}>
                    Read More →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-gray-50 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">Subscribe to Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Get the latest Fleetly news and updates delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                data-testid="input-subscribe-email"
              />
              <Button className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200" data-testid="button-subscribe">
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
