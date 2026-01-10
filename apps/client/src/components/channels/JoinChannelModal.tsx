interface JoinChannelModalProps {
  isAlreadyMember: boolean;
  isLoading: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const JoinChannelModal = ({ isAlreadyMember, isLoading, onAccept, onDecline }: JoinChannelModalProps) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box bg-gray-800 text-white">
        <h3 className="font-bold text-lg mb-2">
          {isAlreadyMember ? 'Vous êtes déjà dans ce salon' : 'Rejoindre ce salon ?'}
        </h3>
        <p className="mb-4 text-gray-300">
          {isAlreadyMember
            ? 'Ce salon est déjà dans votre liste.'
            : 'Vous avez été invité à rejoindre ce salon. Voulez-vous l\'ajouter à votre liste ?'}
        </p>
        <div className="modal-action">
          {isAlreadyMember ? (
            <button className="btn" onClick={onDecline}>Fermer</button>
          ) : (
            <>
              <button className="btn btn-primary" onClick={onAccept} disabled={isLoading}>Accepter</button>
              <button className="btn" onClick={onDecline} disabled={isLoading}>Refuser</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinChannelModal;
