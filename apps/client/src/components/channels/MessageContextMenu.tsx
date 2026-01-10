import type { MessageContextMenuState, Message } from '../../types';
import { getAuthorName } from '../../utils/helpers';

interface MessageContextMenuProps {
  messageContextMenu: MessageContextMenuState;
  messages: Message[];
  userId: string;
  isAdmin: boolean;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onBan: (username: string, userId: string) => void;
}

const MessageContextMenu = ({ messageContextMenu, messages, userId, isAdmin, onEdit, onDelete, onBan }: MessageContextMenuProps) => {
  const message = messages.find(m => m._id === messageContextMenu.messageId);
  const authorName = getAuthorName(message?.author);
  const isOwnMessage = message?.author?._id === userId;
  const isBanned = authorName === '[supprimé]';

  return (
    <div
      className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-50"
      style={{ top: messageContextMenu.y, left: messageContextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {isOwnMessage && !isBanned && (
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2"
          onClick={() => onEdit(messageContextMenu.messageId)}
        >
          <span>✏️</span>
          <span>Modifier</span>
        </button>
      )}
      <button
        className="w-full px-4 py-2 text-left hover:bg-red-900 transition-colors flex items-center gap-2 text-red-400"
        onClick={() => onDelete(messageContextMenu.messageId)}
      >
        <span>🗑️</span>
        <span>Supprimer</span>
      </button>
      {isAdmin && !isOwnMessage && !isBanned && message?.author && (
        <button
          className="w-full px-4 py-2 text-left hover:bg-red-900 transition-colors flex items-center gap-2 text-orange-400"
          onClick={() => onBan(message.author.username, message.author._id)}
        >
          <span>🚫</span>
          <span>Bannir l'utilisateur</span>
        </button>
      )}
    </div>
  );
};

export default MessageContextMenu;
