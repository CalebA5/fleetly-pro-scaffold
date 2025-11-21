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
            className="w-full border-0 bg-gray-50 dark:bg-gray-700 focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white text-base pr-10"
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
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-[--radix-popover-trigger-width]" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {suggestions.length === 0 && !isSearching && (
              <CommandEmpty>No locations found</CommandEmpty>
            )}
            {suggestions.length > 0 && (
              <CommandGroup>
                {suggestions.map((result, index) => (
                  <CommandItem
                    key={`${result.lat}-${result.lon}-${index}`}
                    value={result.fullAddress}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                    data-testid={`autocomplete-item-${index}`}
                  >
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
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
