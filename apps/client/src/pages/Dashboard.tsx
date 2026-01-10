import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import io, { Socket } from 'socket.io-client';

interface Channel {
  _id: string;
  name: string;
  createdBy?: { username: string } | null;
}

interface MessageAuthor {
  _id: string;
  username: string;
  banned?: boolean;
}

interface Message {
  _id: string;
  content: string;
  author?: MessageAuthor | null;
  createdAt: string;
}

interface DecodedToken {
  username: string;
  role: string;
  sub: string;
}

const Dashboard = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [pendingJoinChannelId, setPendingJoinChannelId] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ channelId: string; x: number; y: number } | null>(null);
  const [messageContextMenu, setMessageContextMenu] = useState<{ messageId: string; x: number; y: number } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<{ type: 'message' | 'channel' | 'ban'; id: string; username?: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchCurrentUser = async (id: string, token: string) => {
    try {
      const response = await axios.get(`http://localhost:3000/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsername(response.data.username);
    } catch (error) {
      console.error('Failed to fetch current user', error);
    }
  };

  const getAuthorName = (author?: MessageAuthor | null) => {
    if (!author) return '[supprimé]';
    if (author.banned) return '[supprimé]';
    if (author.username.startsWith('[supprimé')) return '[supprimé]';
    return author.username;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    const decoded: DecodedToken = jwtDecode(token);
    setUserRole(decoded.role);
    setUserId(decoded.sub);
    setUsername(decoded.username);
    // On récupère le username à jour depuis l'API (le token peut être obsolète après renommage)
    fetchCurrentUser(decoded.sub, token);
    fetchChannels();

    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join');
    if (joinParam) {
      setPendingJoinChannelId(joinParam);
    }

    // Connect to socket
    const newSocket = io('http://localhost:3000', {
      auth: { token },
    });
    setSocket(newSocket);

    newSocket.on('newMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('messageUpdated', (updatedMessage: Message) => {
      setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
    });

    newSocket.on('messageDeleted', (messageId: string) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    newSocket.on('userBanned', (data: { userId: string }) => {
      // Mettre à jour tous les messages de l'utilisateur banni
      setMessages(prev => prev.map(m => 
        m.author?._id === data.userId 
          ? { ...m, author: { ...m.author, username: '[supprimé]', banned: true } }
          : m
      ));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [navigate]);

  const fetchChannels = async () => {
    try {
      const response = await axios.get('http://localhost:3000/channels', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setChannels(response.data);
      return response.data as Channel[];
    } catch (error) {
      console.error('Failed to fetch channels', error);
      return [] as Channel[];
    }
  };

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

  const acceptJoin = async () => {
    if (!pendingJoinChannelId) return;
    setJoinLoading(true);
    try {
      await axios.post(`http://localhost:3000/channels/${pendingJoinChannelId}/join`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedChannels = await fetchChannels();
      const joined = updatedChannels.find(c => c._id === pendingJoinChannelId);
      if (joined) {
        handleChannelSelect(joined);
      }
      const params = new URLSearchParams(window.location.search);
      params.delete('join');
      window.history.replaceState({}, document.title, `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
      setPendingJoinChannelId(null);
    } catch (error) {
      console.error('Failed to join channel', error);
      alert('Impossible de rejoindre ce salon');
    } finally {
      setJoinLoading(false);
    }
  };

  const declineJoin = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('join');
    window.history.replaceState({}, document.title, `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
    setPendingJoinChannelId(null);
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
      await axios.post('http://localhost:3000/messages', {
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
      await axios.post('http://localhost:3000/channels', { name: newChannelName }, {
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

  const handleContextMenu = (e: React.MouseEvent, channelId: string) => {
    e.preventDefault();
    setContextMenu({ channelId, x: e.clientX, y: e.clientY });
  };

  const copyInviteLink = (channelId: string) => {
    const inviteLink = `${window.location.origin}/dashboard?join=${channelId}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      alert('Lien d\'invitation copié dans le presse-papier !');
      setContextMenu(null);
    }).catch(() => {
      alert('Erreur lors de la copie du lien');
    });
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  useEffect(() => {
    const handleClickOutside = () => setMessageContextMenu(null);
    if (messageContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [messageContextMenu]);

  const handleMessageContextMenu = (e: React.MouseEvent, messageId: string, messageAuthorId?: string) => {
    e.preventDefault();
    if (userRole === 'admin' || (messageAuthorId && messageAuthorId === userId)) {
      setMessageContextMenu({ messageId, x: e.clientX, y: e.clientY });
    }
  };

  const startEditMessage = (messageId: string) => {
    const message = messages.find(m => m._id === messageId);
    if (message) {
      setEditingMessageId(messageId);
      setEditingContent(message.content);
      setMessageContextMenu(null);
    }
  };

  const saveEditMessage = async (messageId: string) => {
    if (!editingContent.trim()) return;
    try {
      await axios.patch(`http://localhost:3000/messages/${messageId}`, 
        { content: editingContent },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setEditingMessageId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Failed to update message', error);
      alert('Erreur lors de la modification du message');
    }
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const deleteMessage = async (messageId: string) => {
    const message = messages.find(m => m._id === messageId);
    if (!message) return;
    
    // Si admin supprime le message de quelqu'un d'autre, demander la raison
    if (userRole === 'admin' && message.author?._id !== userId) {
      setDeleteModal({ type: 'message', id: messageId });
      setDeleteReason('Violation des règles de la communauté');
      setMessageContextMenu(null);
    } else {
      if (!confirm('Voulez-vous vraiment supprimer ce message ?')) return;
      try {
        await axios.delete(`http://localhost:3000/messages/${messageId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setMessageContextMenu(null);
      } catch (error) {
        console.error('Failed to delete message', error);
        alert('Erreur lors de la suppression du message');
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    try {
      if (deleteModal.type === 'message') {
        await axios.delete(`http://localhost:3000/messages/${deleteModal.id}`, {
          data: { reason: deleteReason },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else if (deleteModal.type === 'channel') {
        await axios.delete(`http://localhost:3000/channels/${deleteModal.id}`, {
          data: { reason: deleteReason },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSelectedChannel(null);
        await fetchChannels();
      } else if (deleteModal.type === 'ban') {
        await axios.post(`http://localhost:3000/users/${deleteModal.id}/ban`, 
          { reason: deleteReason },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        alert(`Utilisateur ${deleteModal.username} banni avec succès`);
      }
      setDeleteModal(null);
      setDeleteReason('');
    } catch (error) {
      console.error('Failed to execute admin action', error);
      alert('Erreur lors de l\'exécution de l\'action');
    }
  };

  const deleteChannel = (channelId: string) => {
    setDeleteModal({ type: 'channel', id: channelId });
    setDeleteReason('Violation des règles de la plateforme');
    setContextMenu(null);
  };

  const banUser = (username: string, userId: string) => {
    setDeleteModal({ type: 'ban', id: userId, username });
    setDeleteReason('Violation des règles de la plateforme');
    setMessageContextMenu(null);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white" onClick={() => setContextMenu(null)}>
      {pendingJoinChannelId && (
        (() => {
          const alreadyInChannel = channels.some(c => c._id === pendingJoinChannelId);
          return (
            <div className="modal modal-open">
              <div className="modal-box bg-gray-800 text-white">
                <h3 className="font-bold text-lg mb-2">
                  {alreadyInChannel ? 'Vous êtes déjà dans ce salon' : 'Rejoindre ce salon ?'}
                </h3>
                <p className="mb-4 text-gray-300">
                  {alreadyInChannel
                    ? 'Ce salon est déjà dans votre liste.'
                    : 'Vous avez été invité à rejoindre ce salon. Voulez-vous l\'ajouter à votre liste ?'}
                </p>
                <div className="modal-action">
                  {alreadyInChannel ? (
                    <button className="btn" onClick={declineJoin}>Fermer</button>
                  ) : (
                    <>
                      <button className="btn btn-primary" onClick={acceptJoin} disabled={joinLoading}>Accepter</button>
                      <button className="btn" onClick={declineJoin} disabled={joinLoading}>Refuser</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}

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
                onContextMenu={(e) => handleContextMenu(e, channel._id)}
              >
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-400">#</span>
                    <span className="truncate">{channel.name}</span>
                    <span className="text-xs text-gray-400">par {getAuthorName(channel.createdBy as any)}</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-xs text-gray-400 hover:text-white"
                    title="Copier le lien d'invitation"
                    onClick={(e) => { e.stopPropagation(); copyInviteLink(channel._id); }}
                  >
                    🔗
                  </button>
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="avatar placeholder">
                <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                  <span className="text-xs">{username.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-200">{username}</div>
                <div className="text-xs text-gray-400">{userRole === 'admin' ? 'Administrateur' : ''}</div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm text-gray-300 hover:text-white"
              onClick={() => navigate('/settings')}
              title="Paramètres utilisateur"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.757.426 1.757 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.757-2.924 1.757-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.757-.426-1.757-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
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
                    Créé par {getAuthorName(selectedChannel.createdBy as any)}
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
                  messages.map((message) => {
                    const authorName = getAuthorName(message.author);
                    const isOwnMessage = message.author?._id === userId;
                    const isBanned = authorName === '[supprimé]';
                    return (
                      <div 
                        key={message._id} 
                        className={`chat ${isOwnMessage ? 'chat-end' : 'chat-start'}`}
                        onContextMenu={(e) => handleMessageContextMenu(e, message._id, message.author?._id)}
                      >
                        <div className="chat-header text-gray-400 text-sm">
                          <span className={isBanned ? 'italic opacity-70' : ''}>
                            {authorName}
                          </span>
                          <time className="text-xs opacity-50 ml-2">
                            {new Date(message.createdAt).toLocaleString()}
                          </time>
                        </div>
                        {editingMessageId === message._id ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && saveEditMessage(message._id)}
                              className="input input-sm input-bordered flex-1 bg-gray-700 text-white"
                              autoFocus
                            />
                            <button 
                              onClick={() => saveEditMessage(message._id)}
                              className="btn btn-sm btn-success"
                            >✓</button>
                            <button 
                              onClick={cancelEditMessage}
                              className="btn btn-sm btn-error"
                            >✕</button>
                          </div>
                        ) : (
                          <div className={`chat-bubble ${isOwnMessage ? 'chat-bubble-success' : 'chat-bubble-primary'}`}>
                            {message.content}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
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
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2"
            onClick={() => copyInviteLink(contextMenu.channelId)}
          >
            <span>🔗</span>
            <span>Copier le lien d'invitation</span>
          </button>
          {userRole === 'admin' && (
            <button
              className="w-full px-4 py-2 text-left hover:bg-red-900 transition-colors flex items-center gap-2 text-red-400"
              onClick={() => deleteChannel(contextMenu.channelId)}
            >
              <span>🗑️</span>
              <span>Supprimer le salon</span>
            </button>
          )}
        </div>
      )}

      {/* Message Context Menu */}
      {messageContextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-50"
          style={{ top: messageContextMenu.y, left: messageContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const message = messages.find(m => m._id === messageContextMenu.messageId);
            const authorName = getAuthorName(message?.author);
            const isOwnMessage = message?.author?._id === userId;
            const isBanned = authorName === '[supprimé]';
            return (
              <>
                {isOwnMessage && !isBanned && (
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2"
                    onClick={() => startEditMessage(messageContextMenu.messageId)}
                  >
                    <span>✏️</span>
                    <span>Modifier</span>
                  </button>
                )}
                <button
                  className="w-full px-4 py-2 text-left hover:bg-red-900 transition-colors flex items-center gap-2 text-red-400"
                  onClick={() => deleteMessage(messageContextMenu.messageId)}
                >
                  <span>🗑️</span>
                  <span>Supprimer</span>
                </button>
                {userRole === 'admin' && !isOwnMessage && !isBanned && message?.author && (
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-red-900 transition-colors flex items-center gap-2 text-orange-400"
                    onClick={() => banUser(message.author.username, message.author._id)}
                  >
                    <span>🚫</span>
                    <span>Bannir l'utilisateur</span>
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Delete/Ban Modal */}
      {deleteModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-gray-800 text-white">
            <h3 className="font-bold text-lg mb-4">
              {deleteModal.type === 'message' && 'Supprimer le message'}
              {deleteModal.type === 'channel' && 'Supprimer le salon'}
              {deleteModal.type === 'ban' && `Bannir ${deleteModal.username}`}
            </h3>
            <p className="mb-4">
              Veuillez indiquer la raison de cette action :
            </p>
            <textarea
              className="textarea textarea-bordered w-full bg-gray-700 text-white mb-4"
              rows={3}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Raison..."
            />
            <div className="modal-action">
              <button 
                className="btn btn-error"
                onClick={confirmDelete}
                disabled={!deleteReason.trim()}
              >
                Confirmer
              </button>
              <button 
                className="btn"
                onClick={() => {
                  setDeleteModal(null);
                  setDeleteReason('');
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;