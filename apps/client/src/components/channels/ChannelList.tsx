import type { Channel } from '../../types';
import ChannelItem from './ChannelItem';

interface ChannelListProps {
  channels: Channel[];
  selectedChannelId: string | undefined;
  onChannelSelect: (channel: Channel) => void;
  onContextMenu: (e: React.MouseEvent, channelId: string) => void;
  onCopyInvite: (channelId: string) => void;
}

const ChannelList = ({ channels, selectedChannelId, onChannelSelect, onContextMenu, onCopyInvite }: ChannelListProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-2">
      {channels.length === 0 ? (
        <div className="text-center text-gray-400 italic py-8">
          Vous n'êtes dans aucun salon
        </div>
      ) : (
        <ul className="space-y-1">
          {channels.map((channel) => (
            <ChannelItem
              key={channel._id}
              channel={channel}
              isSelected={selectedChannelId === channel._id}
              onSelect={() => onChannelSelect(channel)}
              onContextMenu={(e) => onContextMenu(e, channel._id)}
              onCopyInvite={() => onCopyInvite(channel._id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChannelList;
