import { useState } from 'react';
import axios from 'axios';
import type { Message } from '../types';

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const fetchMessages = async (channelId: string) => {
    try {
      const response = await axios.get(`http://localhost:3000/messages/${channelId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  const sendMessage = async (content: string, channelId: string) => {
    try {
      await axios.post('http://localhost:3000/messages', {
        content,
        channelId,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const updateMessage = async (messageId: string, content: string) => {
    try {
      await axios.patch(`http://localhost:3000/messages/${messageId}`, 
        { content },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
    } catch (error) {
      console.error('Failed to update message', error);
      throw error;
    }
  };

  const deleteMessage = async (messageId: string, reason?: string) => {
    try {
      await axios.delete(`http://localhost:3000/messages/${messageId}`, {
        data: reason ? { reason } : undefined,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (error) {
      console.error('Failed to delete message', error);
      throw error;
    }
  };

  return {
    messages,
    setMessages,
    fetchMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
  };
};
