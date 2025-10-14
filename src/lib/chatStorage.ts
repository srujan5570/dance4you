// IndexedDB storage for chat data persistence
interface MessageDTO {
  id: string;
  conversationId: string;
  sender: {
    id: string;
    name?: string | null;
    email: string;
  };
  text: string;
  createdAt: string;
  attachments?: { id?: string; url: string; mimeType?: string | null; size?: number | null }[];
  isMine?: boolean;
}

interface ConversationDTO {
  id: string;
  participants: { id: string; user: { id: string; name?: string | null; email: string } }[];
  messages: MessageDTO[];
  unreadCount?: number;
  status?: "ACTIVE" | "REQUEST_PENDING" | "REQUEST_DECLINED";
  requestInitiatorId?: string | null;
  lastActivity?: string;
}

interface ChatNotification {
  id: string;
  conversationId: string;
  messageId: string;
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

class ChatStorage {
  private dbName = 'DanceForYouChat';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationStore = db.createObjectStore('conversations', { keyPath: 'id' });
          conversationStore.createIndex('lastActivity', 'lastActivity', { unique: false });
        }

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('conversationId', 'conversationId', { unique: false });
          messageStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Notifications store
        if (!db.objectStoreNames.contains('notifications')) {
          const notificationStore = db.createObjectStore('notifications', { keyPath: 'id' });
          notificationStore.createIndex('conversationId', 'conversationId', { unique: false });
          notificationStore.createIndex('timestamp', 'timestamp', { unique: false });
          notificationStore.createIndex('read', 'read', { unique: false });
        }

        // User preferences store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };
    });
  }

  // Conversation methods
  async saveConversation(conversation: ConversationDTO): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['conversations'], 'readwrite');
    const store = transaction.objectStore('conversations');
    
    const conversationWithActivity = {
      ...conversation,
      lastActivity: new Date().toISOString()
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(conversationWithActivity);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getConversations(): Promise<ConversationDTO[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['conversations'], 'readonly');
    const store = transaction.objectStore('conversations');
    const index = store.index('lastActivity');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => {
        const conversations = request.result.sort((a, b) => 
          new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime()
        );
        resolve(conversations);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getConversation(id: string): Promise<ConversationDTO | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['conversations'], 'readonly');
    const store = transaction.objectStore('conversations');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Message methods
  async saveMessage(message: MessageDTO): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(message);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMessages(conversationId: string, limit = 50): Promise<MessageDTO[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');
    const index = store.index('conversationId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(conversationId);
      request.onsuccess = () => {
        const messages = request.result
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .slice(-limit);
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteOldMessages(daysToKeep = 30): Promise<void> {
    if (!this.db) await this.init();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const transaction = this.db!.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    const index = store.index('createdAt');
    
    const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Notification methods
  async saveNotification(notification: ChatNotification): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(notification);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUnreadNotifications(): Promise<ChatNotification[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['notifications'], 'readonly');
    const store = transaction.objectStore('notifications');
    const index = store.index('read');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => {
        const notifications = request.result.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(notifications);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markNotificationRead(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const notification = getRequest.result;
        if (notification) {
          notification.read = true;
          const putRequest = store.put(notification);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Preferences methods
  async setPreference(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['preferences'], 'readwrite');
    const store = transaction.objectStore('preferences');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPreference(key: string): Promise<any> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['preferences'], 'readonly');
    const store = transaction.objectStore('preferences');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // Sync methods
  async getLastSyncTime(): Promise<string | null> {
    return this.getPreference('lastSyncTime');
  }

  async setLastSyncTime(timestamp: string): Promise<void> {
    return this.setPreference('lastSyncTime', timestamp);
  }

  // Cleanup methods
  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['conversations', 'messages', 'notifications', 'preferences'], 'readwrite');
    
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('conversations').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('messages').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('notifications').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('preferences').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);
  }
}

// Export singleton instance
export const chatStorage = new ChatStorage();
export type { MessageDTO, ConversationDTO, ChatNotification };