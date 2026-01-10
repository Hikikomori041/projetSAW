import type { Channel } from '../../types';
import { getAuthorName } from '../../utils/helpers';

interface ChannelHeaderProps {
  channel: Channel;
  isAdmin: boolean;
}

const ChannelHeader = ({ channel, isAdmin }: ChannelHeaderProps) => {
  return (
    <div className="p-4 border-b border-gray-600 bg-gray-800">
      <h1 className="text-xl font-semibold text-white flex items-center">
        <span className="text-gray-400 mr-2">#</span>
        {channel.name}
        {isAdmin && (
          <span className="ml-4 text-sm text-gray-400">
            Créé par {getAuthorName(channel.createdBy as any)}
          </span>
        )}
      </h1>
    </div>
  );
};

export default ChannelHeader;
