import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { searchAddresses, type GeocodingResult } from "@/lib/geocoding";

interface AutocompleteLocationProps {
  value: string;
  onChange: (value: string) => void;
  onSelectLocation: (result: GeocodingResult) => void;
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
  icon?: boolean;
  onIconClick?: () => void;
}

export const AutocompleteLocation = ({
  value,
  onChange,
  onSelectLocation,
  placeholder = "Enter location",
  disabled = false,
  testId = "input-location",
  icon = true,
  onIconClick
}: AutocompleteLocationProps) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const activeController = useRef<AbortController | null>(null);
  const justSelected = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip search if we just selected an item
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }

    if (!value || value.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true);
      
      if (abortController.current) {
        abortController.current.abort();
      }
      const controller = new AbortController();
      abortController.current = controller;
      activeController.current = controller;

      try {
        const results = await searchAddresses(value, 5, controller.signal);
        
        // Only update state if this request is still active
        if (activeController.current === controller) {
          setSuggestions(results);
          setOpen(results.length > 0);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // Request was aborted, don't update state
          return;
        }
        // Only update state if this request is still active
        if (activeController.current === controller) {
          console.error("Address search failed:", error);
          setSuggestions([]);
        }
      } finally {
        // Only clear loading if this request is still active
        if (activeController.current === controller) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Close dropdown on scroll (but not when scrolling inside dropdown)
  useEffect(() => {
    const handleScroll = (event: Event) => {
      // Don't close if scrolling inside the dropdown itself
      if (
        dropdownRef.current &&
        event.target instanceof Node &&
        dropdownRef.current.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    if (open) {
      window.addEventListener("scroll", handleScroll, true);
      return () => window.removeEventListener("scroll", handleScroll, true);
    }
  }, [open]);

  const handleSelect = (result: GeocodingResult) => {
    justSelected.current = true;
    onChange(result.fullAddress);
    onSelectLocation(result);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex h-10 w-full rounded-lg border-0 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-base pr-10 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white disabled:cursor-not-allowed disabled:opacity-50 transition-all"
        data-testid={testId}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
      />
      {isSearching && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
      )}
      {!isSearching && icon && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onIconClick?.();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded transition-colors cursor-pointer"
          title="Use my current location"
          data-testid="button-location-pin"
        >
          <MapPin className="w-4 h-4 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors" />
        </button>
      )}
      
      {/* Dropdown suggestions */}
      {open && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[100] max-h-64 overflow-y-auto"
        >
          {suggestions.map((result, index) => (
            <div
              key={`${result.lat}-${result.lon}-${index}`}
              onClick={() => handleSelect(result)}
              className="cursor-pointer px-3 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-start gap-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              data-testid={`autocomplete-item-${index}`}
            >
              <MapPin className="w-4 h-4 mt-0.5 text-orange-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate text-black dark:text-white">
                  {result.fullAddress}
                </div>
                {result.cityState && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {result.cityState}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
