import fs from 'fs';
import path from 'path';

export interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  isAdmin?: boolean;
  avatar?: string;
}

const FILE_PATH = path.join(process.cwd(), 'messages_chat.json');

// In-memory cache for fast access
let memoryCache: ChatMessage[] = [];
let isInitialized = false;

function initStore() {
  if (isInitialized) return;
  try {
    if (fs.existsSync(FILE_PATH)) {
      const data = fs.readFileSync(FILE_PATH, 'utf-8');
      memoryCache = JSON.parse(data);
    } else {
      memoryCache = [];
      fs.writeFileSync(FILE_PATH, JSON.stringify(memoryCache, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Failed to initialize chat store file, falling back to in-memory:', error);
    memoryCache = [];
  }
  isInitialized = true;
}

export function getMessages(): ChatMessage[] {
  initStore();
  return memoryCache;
}

export function saveMessage(name: string, message: string, isAdmin = false, avatar?: string): ChatMessage {
  initStore();
  const newMessage: ChatMessage = {
    id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
    name: name.trim() || 'Anonymous',
    message: message.trim(),
    timestamp: new Date().toISOString(),
    isAdmin,
    avatar,
  };

  memoryCache.push(newMessage);

  // Keep last 200 messages to prevent infinite file growth
  if (memoryCache.length > 200) {
    memoryCache = memoryCache.slice(memoryCache.length - 200);
  }

  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(memoryCache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write message to file:', error);
  }

  return newMessage;
}

export function deleteMessage(id: string): boolean {
  initStore();
  const index = memoryCache.findIndex((m) => m.id === id);
  if (index !== -1) {
    memoryCache.splice(index, 1);
    try {
      fs.writeFileSync(FILE_PATH, JSON.stringify(memoryCache, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to update file after deleting message:', error);
    }
  }
  return false;
}

export function clearAllMessages(): void {
  memoryCache = [];
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(memoryCache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to clear file database:', error);
  }
}
