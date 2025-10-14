"use client";

import React, { useEffect, useState } from 'react';

interface NotificationPermissionProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export default function NotificationPermission({ 
  onPermissionGranted, 
  onPermissionDenied 
}: NotificationPermissionProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      
      // Show prompt if permission is default and user hasn't dismissed it recently
      const lastDismissed = typeof window !== 'undefined' ? localStorage.getItem('notification-prompt-dismissed') : null;
      const now = Date.now();
      const daysSinceLastDismiss = lastDismissed ? 
        (now - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24) : 999;
      
      if (Notification.permission === 'default' && daysSinceLastDismiss > 7) {
        // Show prompt after 5 seconds to not be intrusive
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    setIsRequesting(true);

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        setShowPrompt(false);
        onPermissionGranted?.();
        
        // Show a test notification
        new Notification('Dance 4 You', {
          body: 'Notifications enabled! You\'ll now receive chat messages.',
          icon: '/logo-dance.svg',
          tag: 'permission-granted'
        });
        
        // Register for push notifications if service worker is available
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
            });
            
            // Send subscription to server
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(subscription)
            });
          } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
          }
        }
      } else {
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
    }
  };

  // Don't show anything if notifications aren't supported or already granted
  if (typeof window === 'undefined' || !('Notification' in window) || permission === 'granted' || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Enable Chat Notifications
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Get notified instantly when you receive new messages, even when the app is closed.
            </p>
            
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={requestPermission}
                disabled={isRequesting}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 rounded-md transition-colors"
              >
                {isRequesting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Requesting...
                  </>
                ) : (
                  'Enable Notifications'
                )}
              </button>
              
              <button
                onClick={dismissPrompt}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
          
          <button
            onClick={dismissPrompt}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}