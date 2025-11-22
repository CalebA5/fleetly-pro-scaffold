import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
}

export const AutocompleteLocation = ({
  value,
  onChange,
  onSelectLocation,
  placeholder = "Enter location",
  disabled = false,
  testId = "input-location",
  icon = true
}: AutocompleteLocationProps) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const activeController = useRef<AbortController | null>(null);
  const justSelected = useRef(false);

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

  const handleSelect = (result: GeocodingResult) => {
    justSelected.current = true;
    onChange(result.fullAddress);
    onSelectLocation(result);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-transparent dark:focus-visible:ring-orange-400 text-base pr-10 rounded-lg transition-all hover:border-gray-400 dark:hover:border-gray-500"
            data-testid={testId}
            onFocus={() => {
              if (suggestions.length > 0) {
                setOpen(true);
              }
            }}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-orange-500" />
          )}
          {!isSearching && icon && (
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-[--radix-popover-trigger-width] shadow-lg border-2 border-gray-200 dark:border-gray-700 z-50" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="rounded-lg">
          <CommandList className="max-h-64">
            {suggestions.length === 0 && !isSearching && (
              <CommandEmpty className="py-6 text-center text-gray-500">
                No locations found
              </CommandEmpty>
            )}
            {suggestions.length > 0 && (
              <CommandGroup>
                {suggestions.map((result, index) => (
                  <CommandItem
                    key={`${result.lat}-${result.lon}-${index}`}
                    value={result.fullAddress}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer px-3 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors rounded-md mx-1 my-0.5"
                    data-testid={`autocomplete-item-${index}`}
                  >
                    <MapPin className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />
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
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
