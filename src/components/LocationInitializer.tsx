"use client";

import { useEffect } from 'react';
import { getUserLocation, saveUserLocation, getSavedLocation } from '../lib/geolocation';

export default function LocationInitializer() {
  useEffect(() => {
    const initializeLocation = async () => {
      // Check if we already have the location
      const savedLocation = getSavedLocation();
      
      if (!savedLocation) {
        try {
          // Get user's location
          const location = await getUserLocation();
          // Save to localStorage
          saveUserLocation(location);
          console.log('User location saved:', location);
        } catch (error) {
          console.error('Error getting user location:', error);
        }
      }
    };

    initializeLocation();
  }, []);

  // This component doesn't render anything
  return null;
}