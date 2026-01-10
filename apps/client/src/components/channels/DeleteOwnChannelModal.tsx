import { useState } from 'react';

interface DeleteOwnChannelModalProps {
  channelName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteOwnChannelModal = ({ channelName, onConfirm, onCancel }: DeleteOwnChannelModalProps) => {
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = () => {
    if (confirmText === 'SUPPRIMER') {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-red-400">Supprimer le salon</h2>
        <p className="mb-4 text-gray-300">
          Vous êtes sur le point de supprimer définitivement le salon{' '}
          <span className="font-semibold text-white">#{channelName}</span>.
        </p>
        <p className="mb-4 text-gray-300">
          Cette action est <span className="font-bold text-red-400">irréversible</span> et supprimera tous les messages du salon.
        </p>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Pour confirmer, tapez <span className="font-bold text-white">SUPPRIMER</span>
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-red-500"
            placeholder="SUPPRIMER"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmText !== 'SUPPRIMER'}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteOwnChannelModal;
