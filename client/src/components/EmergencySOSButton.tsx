import { Phone } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export function EmergencySOSButton() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Link href="/emergency-sos">
      <div
        className="fixed bottom-6 right-6 z-50 group"
        data-testid="button-emergency-sos"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Floating Action Button */}
        <div className="relative">
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 rounded-full bg-red-500/30 dark:bg-red-600/30 animate-ping"></div>
          
          {/* Main button */}
          <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 dark:from-red-600 dark:to-orange-600 flex items-center justify-center shadow-xl hover:shadow-2xl hover:shadow-red-500/50 transition-all duration-300 cursor-pointer group-hover:scale-110">
            <Phone className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          
          {/* Expanded label */}
          <div
            className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap transition-all duration-300 ${
              isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
            }`}
          >
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">Emergency SOS</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Tap for instant help</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
