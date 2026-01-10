interface MessageInputProps {
  channelName: string;
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
}

const MessageInput = ({ channelName, newMessage, onMessageChange, onSendMessage }: MessageInputProps) => {
  return (
    <div className="p-4 border-t border-gray-600 bg-gray-800">
      <div className="flex space-x-4">
        <input
          type="text"
          placeholder={`Message #${channelName}...`}
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
          className="input input-bordered input-primary flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={onSendMessage}
          className="btn btn-primary"
          disabled={!newMessage.trim()}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
