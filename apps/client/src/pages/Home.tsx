import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

interface DecodedToken {
  exp: number;
}

const Home = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'home' | 'stats'>('home');
  const [stats, setStats] = useState<{ users: number; channels: number; totalMessages?: number; avgMessagesPerUser?: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          navigate('/channels');
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
      }
    }
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const res = await axios.get('http://localhost:3000/stats');
        if (res.data && res.data.data) setStats(res.data.data);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoadingStats(false);
      }
    };

    if (tab === 'stats') fetchStats();
  }, [tab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center text-white">
        <h1 className="text-6xl font-bold mb-6 animate-pulse flex items-center justify-center gap-4">
          Bienvenue sur Drocsid !
          <div className="badge badge-primary badge-lg">Bêta</div>
        </h1>

        <div className="flex justify-center mb-6">
          <button onClick={() => setTab('home')} className={`btn ${tab === 'home' ? 'btn-primary' : 'btn-ghost'} mr-2`}>Accueil</button>
          <button onClick={() => setTab('stats')} className={`btn ${tab === 'stats' ? 'btn-primary' : 'btn-ghost'}`}>Stats</button>
        </div>

        {tab === 'home' ? (
          <>
            <p className="text-xl mb-8 opacity-90">
              Rejoignez des communautés, discutez en temps réel et créez vos propres salons de discussion.
            </p>
            <div className="flex justify-center space-x-6 mb-12">
              <div className="card bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-20">
                <div className="card-body items-center text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="card-title text-white">Chat en Temps Réel</h3>
                  <p className="text-gray-200 ">Discutez instantanément avec vos amis et communautés.</p>
                </div>
              </div>
              <div className="card bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-20">
                <div className="card-body items-center text-center">
                  <div className="text-4xl mb-4">🏠</div>
                  <h3 className="card-title text-white">Salons Personnalisés</h3>
                  <p className="text-gray-200">Créez et gérez vos propres espaces de discussion.</p>
                </div>
              </div>
              <div className="card bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-20">
                <div className="card-body items-center text-center">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="card-title text-white">Sécurité</h3>
                  <p className="text-gray-200">Authentification sécurisée et modération avancée.</p>
                </div>
              </div>
            </div>
            <div className="space-x-4">
              <Link
                to="/register"
                className="btn btn-primary btn-lg"
              >
                S'inscrire
              </Link>
              <Link
                to="/login"
                className="btn btn-outline btn-primary btn-lg"
              >
                Se connecter
              </Link>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <p className="text-lg opacity-90">Statistiques publiques du service (visiteurs)</p>
            <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="card bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-20 p-6 min-h-28 flex flex-col justify-center">
                <div className="text-3xl">🖥️</div>
                <div className="mt-2 text-2xl">
                  {loadingStats ? '...' : stats ? stats.channels : '—'}
                </div>
                <div className="text-sm opacity-80">Serveurs / Salons</div>
              </div>
              <div className="card bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-20 p-6 min-h-28 flex flex-col justify-center">
                <div className="text-3xl">👥</div>
                <div className="mt-2 text-2xl">
                  {loadingStats ? '...' : stats ? stats.users : '—'}
                </div>
                <div className="text-sm opacity-80">Utilisateurs</div>
              </div>
              <div className="col-span-2">
                <div className="card bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-20 p-6 min-h-28 flex items-center justify-center">
                  <div className="w-full text-center">
                    <div className="text-3xl">✉️</div>
                    <div className="mt-2 text-2xl">
                      {loadingStats ? '...' : stats ? (stats.avgMessagesPerUser ?? 0) : '—'}
                    </div>
                    <div className="text-sm opacity-80">Moy. messages / utilisateur</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;