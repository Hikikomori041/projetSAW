import { useNavigate } from 'react-router-dom';

interface UserPanelProps {
  username: string;
  userRole: string;
  onLogout: () => void;
}

const UserPanel = ({ username, userRole, onLogout }: UserPanelProps) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 border-t border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="avatar placeholder">
            <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
              <span className="text-xs">{username.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-200">{username}</div>
            <div className="text-xs text-gray-400">{userRole === 'admin' ? 'Administrateur' : ''}</div>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm text-gray-300 hover:text-white"
          onClick={() => navigate('/settings')}
          title="Paramètres utilisateur"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.757.426 1.757 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.757-2.924 1.757-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.757-.426-1.757-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      <button 
        onClick={onLogout}
        className="btn btn-error w-full btn-sm"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Déconnexion
      </button>
    </div>
  );
};

export default UserPanel;
