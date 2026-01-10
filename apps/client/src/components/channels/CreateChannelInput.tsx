interface CreateChannelInputProps {
  newChannelName: string;
  onChannelNameChange: (name: string) => void;
  onCreateChannel: () => void;
}

const CreateChannelInput = ({ newChannelName, onChannelNameChange, onCreateChannel }: CreateChannelInputProps) => {
  return (
    <div className="p-4 border-t border-gray-700">
      <div className="join w-full">
        <input
          type="text"
          placeholder="Nouveau salon..."
          value={newChannelName}
          onChange={(e) => onChannelNameChange(e.target.value)}
          className="input input-bordered input-primary join-item flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          onKeyPress={(e) => e.key === 'Enter' && onCreateChannel()}
        />
        <button 
          onClick={onCreateChannel}
          className="btn btn-primary join-item"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CreateChannelInput;
