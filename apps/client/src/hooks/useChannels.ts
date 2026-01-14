import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import type { Channel } from '../types';

export const useChannels = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const fetchChannels = async () => {
    try {
      const response = await axios.get(`${API_URL}/channels`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setChannels(response.data);
      return response.data as Channel[];
    } catch (error) {
      console.error('Failed to fetch channels', error);
      return [] as Channel[];
    }
  };

  const createChannel = async (name: string) => {
    try {
      await axios.post(`${API_URL}/channels`, { name }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      await fetchChannels();
    } catch (error) {
      console.error('Failed to create channel', error);
      throw error;
    }
  };

  const deleteChannel = async (channelId: string, reason: string) => {
    try {
      await axios.delete(`${API_URL}/channels/${channelId}`, {
        data: { reason },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedChannel(null);
      await fetchChannels();
    } catch (error) {
      console.error('Failed to delete channel', error);
      throw error;
    }
  };

  const joinChannel = async (channelId: string) => {
    try {
      await axios.post(`${API_URL}/channels/${channelId}/join`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedChannels = await fetchChannels();
      return updatedChannels.find(c => c._id === channelId);
    } catch (error) {
      console.error('Failed to join channel', error);
      throw error;
    }
  };

  const leaveChannel = async (channelId: string) => {
    try {
      await axios.post(`${API_URL}/channels/${channelId}/leave`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      await fetchChannels();
    } catch (error) {
      console.error('Failed to leave channel', error);
      throw error;
    }
  };

  return {
    channels,
    selectedChannel,
    setSelectedChannel,
    fetchChannels,
    createChannel,
    deleteChannel,
    joinChannel,
    leaveChannel,
  };
};
