import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import io, { Socket } from 'socket.io-client';

interface Channel {
  _id: string;
  name: string;
  createdBy: { username: string };
}

interface Message {
  _id: string;
  content: string;
  author: { username: string };
  createdAt: string;
}

interface DecodedToken {
  role: string;
}

const Dashboard = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    const decoded: DecodedToken = jwtDecode(token);
    setUserRole(decoded.role);
    fetchChannels();

    // Connect to socket
    const newSocket = io('http://localhost:3001', {
      auth: { token },
    });
    setSocket(newSocket);

    newSocket.on('newMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [navigate]);

  const fetchChannels = async () => {
    try {
      console.log('Fetching channels...');
      const response = await axios.get('http://localhost:3001/channels', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Channels response:', response.data);
      setChannels(response.data);
    } catch (error) {
      console.error('Failed to fetch channels', error);
    }
  };

  const fetchMessages = async (channelId: string) => {
    try {
      const response = await axios.get(`http://localhost:3001/messages/${channelId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    fetchMessages(channel._id);
    if (socket) {
      socket.emit('joinChannel', channel._id);
    }
  };

  const sendMessage = async () => {
    if (!selectedChannel || !newMessage.trim()) return;
    try {
      await axios.post('http://localhost:3001/messages', {
        content: newMessage,
        channelId: selectedChannel._id,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNewMessage('');
      // No need to fetch, socket will update
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const createChannel = async () => {
    try {
      await axios.post('http://localhost:3001/channels', { name: newChannelName }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNewChannelName('');
      fetchChannels();
    } catch (error) {
      alert('Failed to create channel');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 flex flex-col h-full">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-200">
            Salons {userRole === 'admin' && '(Admin)'}
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {channels.map((channel) => (
              <li
                key={channel._id}
                className={`px-3 py-2 rounded cursor-pointer hover:bg-gray-700 transition-colors ${
                  selectedChannel?._id === channel._id ? 'bg-indigo-600 text-white' : 'text-gray-300'
                }`}
                onClick={() => handleChannelSelect(channel)}
              >
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">#</span>
                  <span className="truncate">{channel.name}</span>
                  {userRole === 'admin' && (
                    <span className="ml-auto text-xs text-gray-400">
                      par {channel.createdBy.username}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {userRole !== 'admin' && (
          <div className="p-4 border-t border-gray-700">
            <div className="join w-full">
              <input
                type="text"
                placeholder="Nouveau salon..."
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="input input-bordered input-primary join-item flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && createChannel()}
              />
              <button 
                onClick={createChannel}
                className="btn btn-primary join-item"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="avatar placeholder">
              <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                <span className="text-xs">U</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-200">Utilisateur</div>
              <div className="text-xs text-gray-400">{userRole === 'admin' ? 'Administrateur' : 'Membre'}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="btn btn-error w-full btn-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-gray-700">
        {selectedChannel ? (
          <>
            <div className="p-4 border-b border-gray-600 bg-gray-800">
              <h1 className="text-xl font-semibold text-white flex items-center">
                <span className="text-gray-400 mr-2">#</span>
                {selectedChannel.name}
                {userRole === 'admin' && (
                  <span className="ml-4 text-sm text-gray-400">
                    Créé par {selectedChannel.createdBy.username}
                  </span>
                )}
              </h1>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="alert alert-info">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Aucun message dans ce salon. Soyez le premier à écrire !</span>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message._id} className="chat chat-start">
                      <div className="chat-header text-gray-400 text-sm">
                        {message.author.username}
                        <time className="text-xs opacity-50 ml-2">
                          {new Date(message.createdAt).toLocaleString()}
                        </time>
                      </div>
                      <div className="chat-bubble chat-bubble-primary">
                        {message.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-600 bg-gray-800">
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder={`Message #${selectedChannel.name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="input input-bordered input-primary flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={sendMessage}
                  className="btn btn-primary"
                  disabled={!newMessage.trim()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="hero min-h-full">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <div className="text-8xl mb-8">💬</div>
                <h1 className="text-3xl font-bold text-gray-200 mb-4">
                  Aucun salon sélectionné
                </h1>
                <p className="text-gray-400 mb-6">
                  Choisissez un salon dans la sidebar pour commencer à discuter
                </p>
                <div className="badge badge-primary badge-lg">Prochainement : Chat en temps réel</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;