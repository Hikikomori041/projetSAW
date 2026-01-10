import type { DeleteModalState } from '../../types';

interface AdminActionModalProps {
  deleteModal: DeleteModalState;
  deleteReason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const AdminActionModal = ({ deleteModal, deleteReason, onReasonChange, onConfirm, onCancel }: AdminActionModalProps) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box bg-gray-800 text-white">
        <h3 className="font-bold text-lg mb-4">
          {deleteModal.type === 'message' && 'Supprimer le message'}
          {deleteModal.type === 'channel' && 'Supprimer le salon'}
          {deleteModal.type === 'ban' && `Bannir ${deleteModal.username}`}
        </h3>
        <p className="mb-4">
          Veuillez indiquer la raison de cette action :
        </p>
        <textarea
          className="textarea textarea-bordered w-full bg-gray-700 text-white mb-4"
          rows={3}
          value={deleteReason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Raison..."
        />
        <div className="modal-action">
          <button className="btn btn-error" onClick={onConfirm}>
            Confirmer
          </button>
          <button className="btn" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminActionModal;
