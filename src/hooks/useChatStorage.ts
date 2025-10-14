"use client";

import { useEffect, useCallback, useRef } from 'react';
import { chatStorage, type MessageDTO, type ConversationDTO } from '../lib/chatStorage';

interface UseChatStorageProps {
  conversations: ConversationDTO[];
  messages: MessageDTO[];
  activeConversationId: string | null;
  userId: string | null;
}

export function useChatStorage({
  conversations,
  messages,
  activeConversationId,
  userId
}: UseChatStorageProps) {
  const isInitialized = useRef(false);
  const lastSyncTime = useRef<string | null>(null);

  // Initialize storage
  useEffect(() => {
    const initStorage = async () => {
      try {
        await chatStorage.init();
        lastSyncTime.current = await chatStorage.getLastSyncTime();
        isInitialized.current = true;
        console.log('Chat storage initialized');
      } catch (error) {
        console.error('Failed to initialize chat storage:', error);
      }
    };

    initStorage();
  }, []);

  // Save conversations to local storage
  const saveConversationsToStorage = useCallback(async (conversationsToSave: ConversationDTO[]) => {
    if (!isInitialized.current) return;

    try {
      for (const conversation of conversationsToSave) {
        await chatStorage.saveConversation(conversation);
      }
    } catch (error) {
      console.error('Failed to save conversations to storage:', error);
    }
  }, []);

  // Save messages to local storage
  const saveMessagesToStorage = useCallback(async (messagesToSave: MessageDTO[]) => {
    if (!isInitialized.current) return;

    try {
      for (const message of messagesToSave) {
        await chatStorage.saveMessage(message);
      }
    } catch (error) {
      console.error('Failed to save messages to storage:', error);
    }
  }, []);

  // Load conversations from storage
  const loadConversationsFromStorage = useCallback(async (): Promise<ConversationDTO[]> => {
    if (!isInitialized.current) return [];

    try {
      return await chatStorage.getConversations();
    } catch (error) {
      console.error('Failed to load conversations from storage:', error);
      return [];
    }
  }, []);

  // Load messages from storage
  const loadMessagesFromStorage = useCallback(async (conversationId: string): Promise<MessageDTO[]> => {
    if (!isInitialized.current) return [];

    try {
      return await chatStorage.getMessages(conversationId);
    } catch (error) {
      console.error('Failed to load messages from storage:', error);
      return [];
    }
  }, []);

  // Save new message with offline support
  const saveMessageWithOfflineSupport = useCallback(async (message: MessageDTO) => {
    if (!isInitialized.current) return;

    try {
      // Save to local storage immediately
      await chatStorage.saveMessage(message);

      // Try to send to server
      if (navigator.onLine) {
        try {
          const response = await fetch('/api/chat/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId: message.conversationId,
              text: message.text,
              attachments: message.attachments,
              clientId: message.id
            })
          });

          if (!response.ok) {
            throw new Error('Failed to send message to server');
          }
        } catch (error) {
          console.error('Failed to send message to server, will retry when online:', error);
          
          // Register for background sync if available
          if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            try {
              const registration = await navigator.serviceWorker.ready;
              await registration.sync.register('chat-sync');
            } catch (syncError) {
              console.error('Failed to register background sync:', syncError);
            }
          }
        }
      } else {
        console.log('Offline: Message saved locally, will sync when online');
        
        // Register for background sync
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('chat-sync');
          } catch (syncError) {
            console.error('Failed to register background sync:', syncError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to save message with offline support:', error);
    }
  }, []);

  // Create notification for new message
  const createNotificationForMessage = useCallback(async (message: MessageDTO) => {
    if (!isInitialized.current || !userId || message.sender.id === userId) return;

    try {
      const notification = {
        id: `notif-${message.id}`,
        conversationId: message.conversationId,
        messageId: message.id,
        senderName: message.sender.name || message.sender.email,
        text: message.text || 'Sent an attachment',
        timestamp: message.createdAt,
        read: false
      };

      await chatStorage.saveNotification(notification);

      // Show browser notification if permission granted and page not visible
      if (Notification.permission === 'granted' && document.hidden) {
        new Notification(`${notification.senderName}`, {
          body: notification.text,
          icon: '/logo-dance.svg',
          tag: `chat-${message.conversationId}`,
          data: {
            conversationId: message.conversationId,
            messageId: message.id
          }
        });
      }
    } catch (error) {
      console.error('Failed to create notification for message:', error);
    }
  }, [userId]);

  // Sync with server when online
  const syncWithServer = useCallback(async () => {
    if (!isInitialized.current || !navigator.onLine) return;

    try {
      const lastSync = await chatStorage.getLastSyncTime();
      const syncTime = new Date().toISOString();

      // Fetch latest conversations from server
      const conversationsResponse = await fetch('/api/chat/conversations', {
        cache: 'no-store'
      });

      if (conversationsResponse.ok) {
        const serverConversations = await conversationsResponse.json();
        if (Array.isArray(serverConversations)) {
          await saveConversationsToStorage(serverConversations);
        }
      }

      // Fetch latest messages for active conversation
      if (activeConversationId) {
        const messagesResponse = await fetch(`/api/chat/messages?conversationId=${activeConversationId}`, {
          cache: 'no-store'
        });

        if (messagesResponse.ok) {
          const serverMessages = await messagesResponse.json();
          if (Array.isArray(serverMessages)) {
            await saveMessagesToStorage(serverMessages);
          }
        }
      }

      await chatStorage.setLastSyncTime(syncTime);
      console.log('Sync with server completed');
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  }, [activeConversationId, saveConversationsToStorage, saveMessagesToStorage]);

  // Auto-save conversations when they change
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversationsToStorage(conversations);
    }
  }, [conversations, saveConversationsToStorage]);

  // Auto-save messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages, saveMessagesToStorage]);

  // Sync periodically and on network status change
  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online, syncing with server...');
      syncWithServer();
    };

    const handleOffline = () => {
      console.log('Gone offline, using local storage...');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if online
    if (navigator.onLine) {
      syncWithServer();
    }

    // Periodic sync every 5 minutes when online
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        syncWithServer();
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [syncWithServer]);

  // Cleanup old data periodically
  useEffect(() => {
    const cleanupOldData = async () => {
      if (!isInitialized.current) return;

      try {
        await chatStorage.deleteOldMessages(30); // Keep 30 days
        console.log('Old messages cleaned up');
      } catch (error) {
        console.error('Failed to cleanup old messages:', error);
      }
    };

    // Cleanup on mount and then daily
    cleanupOldData();
    const cleanupInterval = setInterval(cleanupOldData, 24 * 60 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    saveMessageWithOfflineSupport,
    createNotificationForMessage,
    loadConversationsFromStorage,
    loadMessagesFromStorage,
    syncWithServer,
    isOnline: navigator.onLine
  };
}

export default useChatStorage;