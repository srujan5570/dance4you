// City alias mapping for better filtering
export const CITY_ALIASES: Record<string, string[]> = {
  "Delhi-NCR": ["delhi", "new delhi", "delhi-ncr", "ncr", "gurgaon", "gurugram", "noida", "faridabad", "ghaziabad"],
  "Mumbai": ["mumbai", "bombay"],
  "Bengaluru": ["bengaluru", "bangalore"],
  "Chennai": ["chennai", "madras"],
  "Kolkata": ["kolkata", "calcutta"],
  "Hyderabad": ["hyderabad", "secunderabad"],
  "Pune": ["pune", "pimpri-chinchwad"],
};

// Helper to normalize city names (strip state, fix common aliases)
export function cleanCity(name: string | null | undefined): string {
  const raw = String(name || "").trim();
  if (!raw) return "";
  // Use the segment before comma (drop ", State" suffixes)
  let base = raw.split(",")[0].trim();
  // Normalize common alias
  if (base.toLowerCase() === "bangalore") base = "Bengaluru";
  return base;
}

// Function to check if two cities match (considering aliases)
export function citiesMatch(city1: string, city2: string): boolean {
  const clean1 = cleanCity(city1).toLowerCase();
  const clean2 = cleanCity(city2).toLowerCase();
  
  // Direct match
  if (clean1 === clean2) return true;
  
  // Check if they belong to the same alias group
  for (const [mainCity, aliases] of Object.entries(CITY_ALIASES)) {
    const aliasesLower = aliases.map(a => a.toLowerCase());
    const hasCity1 = aliasesLower.includes(clean1);
    const hasCity2 = aliasesLower.includes(clean2);
    
    if (hasCity1 && hasCity2) return true;
  }
  
  return false;
}

// Get all possible city names that should match a given city
export function getCityAliases(cityName: string): string[] {
  const cleanName = cleanCity(cityName).toLowerCase();
  
  // Find the alias group this city belongs to
  for (const [mainCity, aliases] of Object.entries(CITY_ALIASES)) {
    const aliasesLower = aliases.map(a => a.toLowerCase());
    if (aliasesLower.includes(cleanName)) {
      return aliases;
    }
  }
  
  // If no alias group found, return just the cleaned city name
  return [cleanName];
}