import { ref, get, set, push, remove, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from './firebaseServer';

export interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  isAdmin?: boolean;
  avatar?: string;
}

export async function getMessages(): Promise<ChatMessage[]> {
  try {
    const messagesRef = ref(db, 'messages');
    const q = query(messagesRef, orderByChild('timestamp'), limitToLast(200));
    const snapshot = await get(q);
    
    const messages: ChatMessage[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        messages.push({
          id: childSnapshot.key as string,
          name: data.name || 'Anonymous',
          message: data.message || '',
          timestamp: data.timestamp || new Date().toISOString(),
          isAdmin: !!data.isAdmin,
          avatar: data.avatar || '',
        });
      });
    }
    return messages;
  } catch (error) {
    console.error('Failed to get messages from Realtime Database:', error);
    return [];
  }
}

export async function saveMessage(name: string, message: string, isAdmin = false, avatar?: string): Promise<ChatMessage> {
  const timestamp = new Date().toISOString();
  
  try {
    const messagesRef = ref(db, 'messages');
    const newMsgRef = push(messagesRef);
    const id = newMsgRef.key as string;
    
    const newMessage: ChatMessage = {
      id,
      name: name.trim() || 'Anonymous',
      message: message.trim(),
      timestamp,
      isAdmin,
      avatar: avatar || '',
    };
    
    await set(newMsgRef, newMessage);
    return newMessage;
  } catch (error) {
    console.error('Failed to save message to Realtime Database:', error);
    const id = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    return {
      id,
      name: name.trim() || 'Anonymous',
      message: message.trim(),
      timestamp,
      isAdmin,
      avatar: avatar || '',
    };
  }
}

export async function deleteMessage(id: string): Promise<boolean> {
  try {
    const msgRef = ref(db, `messages/${id}`);
    await remove(msgRef);
    return true;
  } catch (error) {
    console.error('Failed to delete message from Realtime Database:', error);
    return false;
  }
}

export async function clearAllMessages(): Promise<void> {
  try {
    const messagesRef = ref(db, 'messages');
    await remove(messagesRef);
  } catch (error) {
    console.error('Failed to clear all messages from Realtime Database:', error);
  }
}
