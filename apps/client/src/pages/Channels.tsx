import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useChannels } from '../hooks/useChannels';
import { useMessages } from '../hooks/useMessages';
import { useSocket } from '../hooks/useSocket';
import { copyInviteLink } from '../utils/helpers';
import type { DeleteModalState, ContextMenuState, MessageContextMenuState } from '../types';
import JoinChannelModal from '../components/channels/JoinChannelModal';
import AdminActionModal from '../components/channels/AdminActionModal';
import LeaveChannelModal from '../components/channels/LeaveChannelModal';
import DeleteOwnChannelModal from '../components/channels/DeleteOwnChannelModal';
import ChannelContextMenu from '../components/channels/ChannelContextMenu';
import MessageContextMenu from '../components/channels/MessageContextMenu';
import UserPanel from '../components/channels/UserPanel';
import ChannelList from '../components/channels/ChannelList';
import CreateChannelInput from '../components/channels/CreateChannelInput';
import ChannelHeader from '../components/channels/ChannelHeader';
import MessageList from '../components/channels/MessageList';
import MessageInput from '../components/channels/MessageInput';

const Channels = () => {
  const { userRole, username, userId, token, logout } = useAuth();
  const { channels, selectedChannel, setSelectedChannel, fetchChannels, createChannel, deleteChannel, joinChannel, leaveChannel } = useChannels();
  const { messages, setMessages, fetchMessages, sendMessage, updateMessage, deleteMessage } = useMessages();
  const { socket, setupMessageListeners, joinChannel: socketJoinChannel } = useSocket(token);

  const [newChannelName, setNewChannelName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [pendingJoinChannelId, setPendingJoinChannelId] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [messageContextMenu, setMessageContextMenu] = useState<MessageContextMenuState | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [leaveChannelModal, setLeaveChannelModal] = useState<{ channelId: string; channelName: string } | null>(null);
  const [deleteOwnChannelModal, setDeleteOwnChannelModal] = useState<{ channelId: string; channelName: string } | null>(null);

  // Fetch channels on mount
  useEffect(() => {
    if (token) {
      fetchChannels();
    }
  }, [token]);

  // Handle join parameter from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join');
    if (joinParam) {
      setPendingJoinChannelId(joinParam);
    }
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    return setupMessageListeners(
      (message) => setMessages(prev => [...prev, message]),
      (updatedMessage) => setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m)),
      (messageId) => setMessages(prev => prev.filter(m => m._id !== messageId)),
      (data) => setMessages(prev => prev.map(m => 
        m.author?._id === data.userId 
          ? { ...m, author: { ...m.author, username: '[supprimé]', banned: true } }
          : m
      ))
    );
  }, [socket, setupMessageListeners, setMessages]);

  // Close context menus on click outside
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

  const handleChannelSelect = (channel: typeof selectedChannel) => {
    setSelectedChannel(channel);
    if (channel) {
      fetchMessages(channel._id);
      socketJoinChannel(channel._id);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChannel || !newMessage.trim()) return;
    await sendMessage(newMessage, selectedChannel._id);
    setNewMessage('');
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    await createChannel(newChannelName);
    setNewChannelName('');
  };

  const acceptJoin = async () => {
    if (!pendingJoinChannelId) return;
    setJoinLoading(true);
    try {
      const joined = await joinChannel(pendingJoinChannelId);
      if (joined) {
        handleChannelSelect(joined);
      }
      clearJoinParam();
    } catch (error) {
      alert('Impossible de rejoindre ce salon');
    } finally {
      setJoinLoading(false);
    }
  };

  const declineJoin = () => {
    clearJoinParam();
  };

  const clearJoinParam = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('join');
    window.history.replaceState({}, document.title, `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
    setPendingJoinChannelId(null);
  };

  const handleCopyInvite = (channelId: string) => {
    copyInviteLink(channelId);
    setContextMenu(null);
  };

  const handleDeleteChannelRequest = (channelId: string) => {
    const channel = channels.find(c => c._id === channelId);
    const isOwner = channel?.createdBy?._id === userId;
    
    if (isOwner) {
      // Propriétaire : modal avec confirmation "SUPPRIMER"
      setDeleteOwnChannelModal({
        channelId,
        channelName: channel?.name || 'ce salon'
      });
    } else {
      // Admin : modal avec raison
      setDeleteModal({ type: 'channel', id: channelId });
      setDeleteReason('Violation des règles de la plateforme');
    }
    setContextMenu(null);
  };

  const handleLeaveChannelRequest = (channelId: string) => {
    const channel = channels.find(c => c._id === channelId);
    setLeaveChannelModal({
      channelId,
      channelName: channel?.name || 'ce salon'
    });
    setContextMenu(null);
  };

  const handleLeaveChannel = async () => {
    if (!leaveChannelModal) return;
    try {
      await leaveChannel(leaveChannelModal.channelId);
      if (selectedChannel?._id === leaveChannelModal.channelId) {
        setSelectedChannel(null);
      }
      setLeaveChannelModal(null);
    } catch (error) {
      alert('Erreur lors de la sortie du salon');
    }
  };

  const handleDeleteOwnChannel = async () => {
    if (!deleteOwnChannelModal) return;
    try {
      await deleteChannel(deleteOwnChannelModal.channelId);
      if (selectedChannel?._id === deleteOwnChannelModal.channelId) {
        setSelectedChannel(null);
      }
      setDeleteOwnChannelModal(null);
    } catch (error) {
      alert('Erreur lors de la suppression du salon');
    }
  };

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
      await updateMessage(messageId, editingContent);
      setEditingMessageId(null);
      setEditingContent('');
    } catch (error) {
      alert('Erreur lors de la modification du message');
    }
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleDeleteMessageRequest = (messageId: string) => {
    const message = messages.find(m => m._id === messageId);
    if (!message) return;
    
    if (userRole === 'admin' && message.author?._id !== userId) {
      setDeleteModal({ type: 'message', id: messageId });
      setDeleteReason('Violation des règles de la communauté');
      setMessageContextMenu(null);
    } else {
      if (!confirm('Voulez-vous vraiment supprimer ce message ?')) return;
      deleteMessage(messageId);
      setMessageContextMenu(null);
    }
  };

  const handleBanUser = (username: string, targetUserId: string) => {
    setDeleteModal({ type: 'ban', id: targetUserId, username });
    setDeleteReason('Violation des règles de la plateforme');
    setMessageContextMenu(null);
  };

  const confirmAdminAction = async () => {
    if (!deleteModal) return;
    try {
      if (deleteModal.type === 'message') {
        await deleteMessage(deleteModal.id, deleteReason);
      } else if (deleteModal.type === 'channel') {
        await deleteChannel(deleteModal.id, deleteReason);
      } else if (deleteModal.type === 'ban') {
        await axios.post(`http://localhost:3000/users/${deleteModal.id}/ban`, 
          { reason: deleteReason },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(`Utilisateur ${deleteModal.username} banni avec succès`);
      }
      setDeleteModal(null);
      setDeleteReason('');
    } catch (error) {
      alert('Erreur lors de l\'exécution de l\'action');
    }
  };

  const alreadyInChannel = pendingJoinChannelId ? channels.some(c => c._id === pendingJoinChannelId) : false;

  return (
    <div className="flex h-screen bg-gray-900 text-white" onClick={() => setContextMenu(null)}>
      {/* Join Modal */}
      {pendingJoinChannelId && (
        <JoinChannelModal
          isAlreadyMember={alreadyInChannel}
          isLoading={joinLoading}
          onAccept={acceptJoin}
          onDecline={declineJoin}
        />
      )}

      {/* Admin Action Modal */}
      {deleteModal && (
        <AdminActionModal
          deleteModal={deleteModal}
          deleteReason={deleteReason}
          onReasonChange={setDeleteReason}
          onConfirm={confirmAdminAction}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      {/* Leave Channel Modal */}
      {leaveChannelModal && (
        <LeaveChannelModal
          channelName={leaveChannelModal.channelName}
          onConfirm={handleLeaveChannel}
          onCancel={() => setLeaveChannelModal(null)}
        />
      )}

      {/* Delete Own Channel Modal */}
      {deleteOwnChannelModal && (
        <DeleteOwnChannelModal
          channelName={deleteOwnChannelModal.channelName}
          onConfirm={handleDeleteOwnChannel}
          onCancel={() => setDeleteOwnChannelModal(null)}
        />
      )}

      {/* Sidebar */}
      <div className="w-80 bg-gray-800 flex flex-col h-full">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-200">
            Salons {userRole === 'admin' && '(Admin)'}
          </h2>
        </div>
        
        <ChannelList
          channels={channels}
          selectedChannelId={selectedChannel?._id}
          onChannelSelect={handleChannelSelect}
          onContextMenu={(e, channelId) => {
            e.preventDefault();
            setContextMenu({ channelId, x: e.clientX, y: e.clientY });
          }}
          onCopyInvite={handleCopyInvite}
        />
        
        {userRole !== 'admin' && (
          <CreateChannelInput
            newChannelName={newChannelName}
            onChannelNameChange={setNewChannelName}
            onCreateChannel={handleCreateChannel}
          />
        )}
        
        <UserPanel
          username={username}
          userRole={userRole}
          onLogout={logout}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-gray-700">
        {selectedChannel ? (
          <>
            <ChannelHeader channel={selectedChannel} isAdmin={userRole === 'admin'} />
            
            <div className="flex-1 p-4 overflow-y-auto">
              <MessageList
                messages={messages}
                userId={userId}
                editingMessageId={editingMessageId}
                editingContent={editingContent}
                onEditingContentChange={setEditingContent}
                onSaveEdit={saveEditMessage}
                onCancelEdit={cancelEditMessage}
                onContextMenu={handleMessageContextMenu}
              />
            </div>
            
            <MessageInput
              channelName={selectedChannel.name}
              newMessage={newMessage}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
            />
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

      {/* Context Menus */}
      {contextMenu && (
        <ChannelContextMenu
          contextMenu={contextMenu}
          channel={channels.find(c => c._id === contextMenu.channelId)}
          userId={userId}
          isAdmin={userRole === 'admin'}
          onCopyInvite={handleCopyInvite}
          onLeave={handleLeaveChannelRequest}
          onDelete={handleDeleteChannelRequest}
        />
      )}

      {messageContextMenu && (
        <MessageContextMenu
          messageContextMenu={messageContextMenu}
          messages={messages}
          userId={userId}
          isAdmin={userRole === 'admin'}
          onEdit={startEditMessage}
          onDelete={handleDeleteMessageRequest}
          onBan={handleBanUser}
        />
      )}
    </div>
  );
};

export default Channels;
