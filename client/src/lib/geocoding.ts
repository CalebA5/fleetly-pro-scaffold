export interface GeocodingResult {
  label: string;
  lat: number;
  lon: number;
  cityState?: string;
  fullAddress: string;
}

export const searchAddresses = async (query: string, limit: number = 5, signal?: AbortSignal): Promise<GeocodingResult[]> => {
  if (!query.trim()) {
    return [];
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`,
    { signal }
  );
  const data = await response.json();

  return data.map((item: any) => {
    const address = item.address || {};
    const cityState = [
      address.city || address.town || address.village,
      address.state
    ].filter(Boolean).join(", ");

    return {
      label: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      cityState,
      fullAddress: item.display_name
    };
  });
};

export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  try {
    const results = await searchAddresses(address, 1);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
};
