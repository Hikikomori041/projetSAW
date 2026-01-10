interface LeaveChannelModalProps {
  channelName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const LeaveChannelModal = ({ channelName, onConfirm, onCancel }: LeaveChannelModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Quitter le salon</h2>
        <p className="mb-6 text-gray-300">
          Êtes-vous sûr de vouloir quitter <span className="font-semibold text-white">#{channelName}</span> ?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded transition-colors"
          >
            Quitter
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveChannelModal;
