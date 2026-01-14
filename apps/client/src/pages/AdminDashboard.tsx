import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  username: string;
  role: string;
  sub: string;
}

interface UserStats {
  _id: string;
  username: string;
  email: string;
  role: string;
  banned: boolean;
  bannedReason?: string;
  createdAt: string;
  messageCount: number;
}

interface ChannelStats {
  _id: string;
  name: string;
  createdBy: { username: string };
  createdAt: string;
  memberCount: number;
  messageCount: number;
  deletedMessagesCount: number;
  bannedUsersCount: number;
}

interface AdminStats {
  users: UserStats[];
  channels: ChannelStats[];
}

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'users' | 'channels'>(
    (searchParams.get('tab') as 'users' | 'channels') || 'users'
  );
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (decoded.role !== 'admin') {
        navigate('/channels');
        return;
      }
    } catch {
      navigate('/login');
      return;
    }

    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des statistiques');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleChannelClick = (channelId: string) => {
    // Stocker l'ID du salon pour l'ouvrir automatiquement
    localStorage.setItem('selectedChannelId', channelId);
    navigate('/channels?channel=' + channelId);
  };

  const handleTabChange = (tab: 'users' | 'channels') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Administration</h1>
          <button
            onClick={handleLogout}
            className="btn btn-sm btn-ghost text-gray-300 hover:text-white"
          >
            Déconnexion
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-gray-400 text-sm text-center">Utilisateurs</div>
              <div className="text-3xl font-bold text-white text-center">{stats.users.length}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-gray-400 text-sm text-center">Utilisateurs bannis</div>
              <div className="text-3xl font-bold text-red-500 text-center">
                {stats.users.filter((u) => u.banned).length}
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-gray-400 text-sm text-center">Salons</div>
              <div className="text-3xl font-bold text-white text-center">{stats.channels.length}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="text-gray-400 text-sm text-center">Messages envoyés</div>
              <div className="text-3xl font-bold text-white text-center">
                {stats.channels.reduce((sum, ch) => sum + ch.messageCount, 0)}
              </div>
            </div>
          </div>
        )}


        {/* Tabs */}
        <div className="tabs tabs-boxed bg-gray-800 mb-6 p-2">
          <button
            className={`tab text-lg px-8 h-14 flex items-center justify-center ${activeTab === 'users' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('users')}
          >
            UTILISATEURS
          </button>
          <button
            className={`tab text-lg px-8 h-14 flex items-center justify-center ${activeTab === 'channels' ? 'tab-active' : ''}`}
            onClick={() => handleTabChange('channels')}
          >
            SALONS
          </button>
        </div>

        {/* Users Table */}
        {activeTab === 'users' && stats && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="text-gray-300">Nom d'utilisateur</th>
                    <th className="text-gray-300">Email</th>
                    <th className="text-gray-300 text-center">Statut</th>
                    <th className="text-gray-300 text-center">Messages</th>
                    <th className="text-gray-300 text-center">Date de création</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.users.filter(user => user.role !== 'admin').map((user) => (
                    <tr key={user._id} className="hover:bg-gray-700">
                      <td className="text-white">{user.username}</td>
                      <td className="text-gray-300">{user.email}</td>
                      <td className="text-center">
                        {user.banned ? (
                          <span className="badge badge-error" title={user.bannedReason}>
                            Banni
                          </span>
                        ) : (
                          <span className="badge badge-success" title="Actif"></span>
                        )}
                      </td>
                      <td className="text-gray-300 text-center">{user.messageCount}</td>
                      <td className="text-gray-300 text-center">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Channels Table */}
        {activeTab === 'channels' && stats && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="text-gray-300">Nom du salon</th>
                    <th className="text-gray-300">Créateur</th>
                    <th className="text-gray-300 text-center">Membres</th>
                    <th className="text-gray-300 text-center">Messages</th>
                    <th className="text-gray-300 text-center">Messages supprimés</th>
                    <th className="text-gray-300 text-center">Utilisateurs bannis</th>
                    <th className="text-gray-300 text-center">Date de création</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.channels.map((channel) => (
                    <tr key={channel._id} className="hover:bg-gray-700">
                      <td>
                        <button
                          onClick={() => handleChannelClick(channel._id)}
                          className="text-white font-semibold hover:text-blue-400 transition-colors underline cursor-pointer"
                        >
                          {channel.name}
                        </button>
                      </td>
                      <td className="text-gray-300">{channel.createdBy?.username || 'Inconnu'}</td>
                      <td className="text-gray-300 text-center">{channel.memberCount}</td>
                      <td className="text-gray-300 text-center">{channel.messageCount}</td>
                      <td className="text-gray-300 text-center">{channel.deletedMessagesCount}</td>
                      <td className="text-gray-300 text-center">{channel.bannedUsersCount}</td>
                      <td className="text-gray-300 text-center">
                        {new Date(channel.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
