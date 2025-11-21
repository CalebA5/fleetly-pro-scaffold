import { AlertCircle, Phone } from "lucide-react";
import { Link } from "wouter";

export function EmergencySOSButton() {
  return (
    <Link href="/emergency-sos">
      <div
        className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-500 to-orange-500 dark:from-red-700 dark:via-red-600 dark:to-orange-600 p-6 md:p-8 cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-2xl hover:shadow-red-500/50"
        data-testid="button-emergency-sos"
      >
        {/* Animated pulse background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-white animate-pulse" />
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                EMERGENCY
              </h2>
            </div>
            <p className="text-white/90 text-sm md:text-base font-medium mb-1">
              Need immediate help?
            </p>
            <p className="text-white/70 text-xs md:text-sm">
              No login required • Instant operator notification
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-gray-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
              <Phone className="w-8 h-8 md:w-10 md:h-10 text-red-600 dark:text-red-700" />
            </div>
            <span className="text-white font-bold text-xs md:text-sm uppercase tracking-wider">
              SOS
            </span>
          </div>
        </div>
        
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-tr-full"></div>
      </div>
    </Link>
  );
}
