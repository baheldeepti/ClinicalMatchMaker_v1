// ============================================================================
// Types
// ============================================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  facility: string;
  city: string;
  state: string;
  zipcode: string;
  distance?: number;
}

// ============================================================================
// US Zipcode Database (subset of common zipcodes)
// In production, use a complete database or API service
// ============================================================================

const ZIPCODE_DATA: Record<string, Coordinates> = {
  // Major cities - Northeast
  '10001': { lat: 40.7484, lng: -73.9967 }, // New York, NY
  '10019': { lat: 40.7654, lng: -73.9856 }, // New York, NY
  '02101': { lat: 42.3704, lng: -71.0266 }, // Boston, MA
  '02115': { lat: 42.3420, lng: -71.0944 }, // Boston, MA
  '19102': { lat: 39.9526, lng: -75.1680 }, // Philadelphia, PA
  '20001': { lat: 38.9120, lng: -77.0160 }, // Washington, DC
  '21201': { lat: 39.2908, lng: -76.6209 }, // Baltimore, MD

  // Major cities - Southeast
  '30301': { lat: 33.7490, lng: -84.3880 }, // Atlanta, GA
  '30303': { lat: 33.7537, lng: -84.3930 }, // Atlanta, GA
  '33101': { lat: 25.7617, lng: -80.1918 }, // Miami, FL
  '33130': { lat: 25.7656, lng: -80.2052 }, // Miami, FL
  '28201': { lat: 35.2271, lng: -80.8431 }, // Charlotte, NC
  '37201': { lat: 36.1627, lng: -86.7816 }, // Nashville, TN

  // Major cities - Midwest
  '60601': { lat: 41.8819, lng: -87.6278 }, // Chicago, IL
  '60611': { lat: 41.8930, lng: -87.6166 }, // Chicago, IL
  '48201': { lat: 42.3314, lng: -83.0458 }, // Detroit, MI
  '44101': { lat: 41.4993, lng: -81.6944 }, // Cleveland, OH
  '55401': { lat: 44.9833, lng: -93.2667 }, // Minneapolis, MN
  '63101': { lat: 38.6270, lng: -90.1994 }, // St. Louis, MO

  // Major cities - Southwest
  '75201': { lat: 32.7876, lng: -96.7985 }, // Dallas, TX
  '77001': { lat: 29.7604, lng: -95.3698 }, // Houston, TX
  '77030': { lat: 29.7105, lng: -95.3965 }, // Houston, TX (Medical Center)
  '85001': { lat: 33.4484, lng: -112.0740 }, // Phoenix, AZ
  '87101': { lat: 35.0844, lng: -106.6504 }, // Albuquerque, NM
  '73101': { lat: 35.4676, lng: -97.5164 }, // Oklahoma City, OK

  // Major cities - West Coast
  '90001': { lat: 33.9425, lng: -118.2551 }, // Los Angeles, CA
  '90024': { lat: 34.0633, lng: -118.4333 }, // Los Angeles, CA (Westwood)
  '94102': { lat: 37.7792, lng: -122.4191 }, // San Francisco, CA
  '94143': { lat: 37.7631, lng: -122.4586 }, // San Francisco, CA (UCSF)
  '92101': { lat: 32.7195, lng: -117.1628 }, // San Diego, CA
  '98101': { lat: 47.6062, lng: -122.3321 }, // Seattle, WA
  '97201': { lat: 45.5051, lng: -122.6750 }, // Portland, OR
  '89101': { lat: 36.1699, lng: -115.1398 }, // Las Vegas, NV

  // Major medical/research centers
  '55905': { lat: 44.0225, lng: -92.4669 }, // Rochester, MN (Mayo Clinic)
  '27710': { lat: 36.0014, lng: -78.9382 }, // Durham, NC (Duke)
  '02114': { lat: 42.3626, lng: -71.0688 }, // Boston, MA (MGH)
  '21287': { lat: 39.2965, lng: -76.5927 }, // Baltimore, MD (Johns Hopkins)

  // Additional medical centers (for mock data)
  '10065': { lat: 40.7649, lng: -73.9632 }, // New York, NY (Memorial Sloan Kettering)
  '10016': { lat: 40.7425, lng: -73.9780 }, // New York, NY (NYU Langone)
  '20892': { lat: 39.0000, lng: -77.1000 }, // Bethesda, MD (NIH)
  '94305': { lat: 37.4275, lng: -122.1697 }, // Stanford, CA (Stanford Medical)
};

// ============================================================================
// Coordinate Functions
// ============================================================================

/**
 * Get coordinates for a US zipcode
 * @param zipcode - 5-digit US zipcode
 * @returns Coordinates or null if not found
 */
export function getCoordinates(zipcode: string): Coordinates | null {
  if (!isValidZipcode(zipcode)) {
    return null;
  }

  return ZIPCODE_DATA[zipcode] || null;
}

/**
 * Validate zipcode format (5 digits, numeric only)
 */
export function isValidZipcode(zipcode: string): boolean {
  return /^\d{5}$/.test(zipcode);
}

// ============================================================================
// Distance Calculation (Haversine Formula)
// ============================================================================

const EARTH_RADIUS_MILES = 3958.8;

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Distance in miles
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const lat1 = toRadians(coord1.lat);
  const lat2 = toRadians(coord2.lat);
  const deltaLat = toRadians(coord2.lat - coord1.lat);
  const deltaLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

/**
 * Calculate distance between two zipcodes
 * @returns Distance in miles or null if either zipcode is invalid
 */
export function calculateDistanceByZipcode(
  zipcode1: string,
  zipcode2: string
): number | null {
  const coord1 = getCoordinates(zipcode1);
  const coord2 = getCoordinates(zipcode2);

  if (!coord1 || !coord2) {
    return null;
  }

  return calculateDistance(coord1, coord2);
}

// ============================================================================
// Location Filtering
// ============================================================================

/**
 * Filter locations within a radius of an origin zipcode
 * @param locations - Array of locations to filter
 * @param originZip - Origin zipcode
 * @param radiusMiles - Maximum distance in miles
 * @returns Filtered locations with distance added, sorted by distance
 */
export function filterByRadius(
  locations: Location[],
  originZip: string,
  radiusMiles: number
): Location[] {
  const originCoords = getCoordinates(originZip);

  if (!originCoords) {
    return [];
  }

  const locationsWithDistance: Location[] = [];

  for (const location of locations) {
    const locationCoords = getCoordinates(location.zipcode);

    if (locationCoords) {
      const distance = calculateDistance(originCoords, locationCoords);

      if (distance <= radiusMiles) {
        locationsWithDistance.push({
          ...location,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        });
      }
    }
  }

  // Sort by distance ascending
  return locationsWithDistance.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

/**
 * Find the nearest location from an array
 * @returns Nearest location with distance or null if none found
 */
export function findNearestLocation(
  locations: Location[],
  originZip: string
): Location | null {
  const filtered = filterByRadius(locations, originZip, Infinity);
  return filtered.length > 0 ? filtered[0] : null;
}

/**
 * Add distance to all locations from an origin
 */
export function addDistanceToLocations(
  locations: Location[],
  originZip: string
): Location[] {
  const originCoords = getCoordinates(originZip);

  if (!originCoords) {
    return locations;
  }

  return locations.map((location) => {
    const locationCoords = getCoordinates(location.zipcode);
    if (locationCoords) {
      const distance = calculateDistance(originCoords, locationCoords);
      return {
        ...location,
        distance: Math.round(distance * 10) / 10,
      };
    }
    return location;
  });
}
