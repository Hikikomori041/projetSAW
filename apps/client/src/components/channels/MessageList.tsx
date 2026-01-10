import { useRef, useEffect } from 'react';
import type { Message } from '../../types';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Message[];
  userId: string;
  editingMessageId: string | null;
  editingContent: string;
  onEditingContentChange: (content: string) => void;
  onSaveEdit: (messageId: string) => void;
  onCancelEdit: () => void;
  onContextMenu: (e: React.MouseEvent, messageId: string, authorId?: string) => void;
}

const MessageList = ({ 
  messages, 
  userId, 
  editingMessageId, 
  editingContent, 
  onEditingContentChange, 
  onSaveEdit, 
  onCancelEdit,
  onContextMenu 
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="alert alert-info">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Aucun message dans ce salon. Soyez le premier à écrire !</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageItem
          key={message._id}
          message={message}
          userId={userId}
          isEditing={editingMessageId === message._id}
          editingContent={editingContent}
          onEditingContentChange={onEditingContentChange}
          onSaveEdit={() => onSaveEdit(message._id)}
          onCancelEdit={onCancelEdit}
          onContextMenu={(e) => onContextMenu(e, message._id, message.author?._id)}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
