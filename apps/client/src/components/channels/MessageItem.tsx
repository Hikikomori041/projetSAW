import type { Message } from '../../types';
import { getAuthorName } from '../../utils/helpers';

interface MessageItemProps {
  message: Message;
  userId: string;
  isEditing: boolean;
  editingContent: string;
  onEditingContentChange: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const MessageItem = ({ 
  message, 
  userId, 
  isEditing, 
  editingContent, 
  onEditingContentChange, 
  onSaveEdit, 
  onCancelEdit,
  onContextMenu 
}: MessageItemProps) => {
  const authorName = getAuthorName(message.author);
  const isOwnMessage = message.author?._id === userId;
  const isBanned = authorName === '[supprimé]';

  return (
    <div 
      className={`chat ${isOwnMessage ? 'chat-end' : 'chat-start'}`}
      onContextMenu={onContextMenu}
    >
      <div className="chat-header text-gray-400 text-sm">
        <span className={isBanned ? 'italic opacity-70' : ''}>
          {authorName}
        </span>
        <time className="text-xs opacity-50 ml-2">
          {new Date(message.createdAt).toLocaleString()}
        </time>
      </div>
      {isEditing ? (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={editingContent}
            onChange={(e) => onEditingContentChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSaveEdit()}
            className="input input-sm input-bordered flex-1 bg-gray-700 text-white"
            autoFocus
          />
          <button 
            onClick={onSaveEdit}
            className="btn btn-sm btn-success"
          >✓</button>
          <button 
            onClick={onCancelEdit}
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
};

export default MessageItem;
