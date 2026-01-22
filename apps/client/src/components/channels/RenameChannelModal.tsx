import { useState } from 'react';

interface RenameChannelModalProps {
  channelName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

const RenameChannelModal = ({ channelName, onConfirm, onCancel }: RenameChannelModalProps) => {
  const [newName, setNewName] = useState(channelName);

  const handleConfirm = () => {
    if (newName.trim() && newName.trim() !== channelName) {
      onConfirm(newName.trim());
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-gray-800 text-white">
        <h3 className="font-bold text-lg mb-4">Renommer le salon</h3>
        
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">
            Nouveau nom du salon
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input input-bordered w-full bg-gray-700 text-white"
            placeholder="Nom du salon"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') onCancel();
            }}
          />
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onCancel}>
            Annuler
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleConfirm}
            disabled={!newName.trim() || newName.trim() === channelName}
          >
            Renommer
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameChannelModal;
