import { useState } from 'react';

interface InviteLinkModalProps {
  channelId: string;
  onClose: () => void;
}

const InviteLinkModal = ({ channelId, onClose }: InviteLinkModalProps) => {
  const inviteLink = `${window.location.origin}/channels?join=${channelId}`;
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-gray-800 text-white relative">
        {/* Bouton croix pour fermer */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="font-bold text-lg mb-4">Lien d'invitation du salon</h3>
        
        {/* Zone de texte avec le lien */}
        <div className="mb-4">
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="input input-bordered w-full bg-gray-700 text-gray-200"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
        </div>

        {/* Bouton copier */}
        <div className="modal-action">
          <button 
            className={`btn ${copied ? 'btn-success' : 'btn-primary'}`} 
            onClick={handleCopyToClipboard}
          >
            {copied ? '✓ Copié !' : '📋 Copier le lien'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteLinkModal;
