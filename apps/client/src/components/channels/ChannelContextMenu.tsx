import type { ContextMenuState, Channel } from '../../types';

interface ChannelContextMenuProps {
  contextMenu: ContextMenuState;
  channel: Channel | undefined;
  userId: string;
  isAdmin: boolean;
  onCopyInvite: (channelId: string) => void;
  onRename: (channelId: string) => void;
  onLeave: (channelId: string) => void;
  onDelete: (channelId: string) => void;
}

const ChannelContextMenu = ({ contextMenu, channel, userId, isAdmin, onCopyInvite, onRename, onLeave, onDelete }: ChannelContextMenuProps) => {
  const isOwner = channel?.createdBy?._id === userId;

  return (
    <div
      className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-50"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2"
        onClick={() => onCopyInvite(contextMenu.channelId)}
      >
        <span>🔗</span>
        <span>Copier le lien d'invitation</span>
      </button>
      {isOwner && (
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2"
          onClick={() => onRename(contextMenu.channelId)}
        >
          <span>✏️</span>
          <span>Changer le nom du salon</span>
        </button>
      )}
      {isOwner ? (
        <button
          className="w-full px-4 py-2 text-left hover:bg-red-900 transition-colors flex items-center gap-2 text-red-400"
          onClick={() => onDelete(contextMenu.channelId)}
        >
          <span>🗑️</span>
          <span>Supprimer le salon</span>
        </button>
      ) : !isAdmin && (
        <button
          className="w-full px-4 py-2 text-left hover:bg-orange-900 transition-colors flex items-center gap-2 text-orange-400"
          onClick={() => onLeave(contextMenu.channelId)}
        >
          <span>🚪</span>
          <span>Quitter le salon</span>
        </button>
      )}
      {isAdmin && !isOwner && (
        <button
          className="w-full px-4 py-2 text-left hover:bg-red-900 transition-colors flex items-center gap-2 text-red-400"
          onClick={() => onDelete(contextMenu.channelId)}
        >
          <span>🗑️</span>
          <span>Supprimer le salon (Admin)</span>
        </button>
      )}
    </div>
  );
};

export default ChannelContextMenu;
