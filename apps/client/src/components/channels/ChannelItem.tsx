import type { Channel } from '../../types';
import { getAuthorName } from '../../utils/helpers';

interface ChannelItemProps {
  channel: Channel;
  isSelected: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onCopyInvite: () => void;
}

const ChannelItem = ({ channel, isSelected, onSelect, onContextMenu, onCopyInvite }: ChannelItemProps) => {
  return (
    <li
      className={`px-3 py-2 rounded cursor-pointer hover:bg-gray-700 transition-colors ${
        isSelected ? 'bg-indigo-600 text-white' : 'text-gray-300'
      }`}
      onClick={onSelect}
      onContextMenu={onContextMenu}
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
          onClick={(e) => { e.stopPropagation(); onCopyInvite(); }}
        >
          🔗
        </button>
      </div>
    </li>
  );
};

export default ChannelItem;
