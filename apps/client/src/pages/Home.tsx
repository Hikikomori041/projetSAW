import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { API_URL } from '../config/api';

interface DecodedToken {
  exp: number;
}

const Home = () => {
  const navigate = useNavigate();
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
        const res = await axios.get(`${API_URL}/stats`);
        if (res.data && res.data.data) setStats(res.data.data);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Section principale */}
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-6xl font-bold mb-6 animate-pulse flex items-center justify-center gap-4">
            Bienvenue sur Drocsid !
            <div className="badge badge-primary badge-lg">Bêta</div>
          </h1>

          <p className="text-xl mb-8 opacity-90">
            Rejoignez des communautés, discutez en temps réel et créez vos propres salons de discussion.
          </p>
          
          <div className="flex justify-center space-x-6 mb-12">
            <div className="card bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-20">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="card-title text-white">Chat en temps réel</h3>
                <p className="text-gray-200">Discutez instantanément avec vos amis et communautés.</p>
              </div>
            </div>
            <div className="card bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-20">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4">🏠</div>
                <h3 className="card-title text-white">Salons personnalisés</h3>
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
              Créer un compte
            </Link>
            <Link
              to="/login"
              className="btn btn-outline btn-primary btn-lg"
            >
              Se connecter
            </Link>
          </div>

          {/* Indicateur de scroll */}
          <div className="mt-16 animate-bounce">
            <svg className="w-8 h-8 mx-auto text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Barre de séparation avec effet de dégradé */}
      <div className="relative h-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3/4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        </div>
      </div>

      {/* Section statistiques */}
      <div className="min-h-screen flex items-center justify-center p-8 pb-24">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-5xl font-bold mb-4">Statistiques de la plateforme</h2>
          <p className="text-lg opacity-90 mb-12">Découvrez notre communauté grandissante</p>
          
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="card bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-20 p-8 transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">🖥️</div>
              <div className="text-4xl font-bold mb-2">
                {loadingStats ? '...' : stats ? stats.channels : '—'}
              </div>
              <div className="text-lg opacity-80">Salons actifs</div>
            </div>
            
            <div className="card bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-20 p-8 transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">👥</div>
              <div className="text-4xl font-bold mb-2">
                {loadingStats ? '...' : stats ? stats.users : '—'}
              </div>
              <div className="text-lg opacity-80">Utilisateurs</div>
            </div>
            
            <div className="col-span-2">
              <div className="card bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-20 p-8 transform hover:scale-105 transition-transform">
                <div className="text-5xl mb-4">✉️</div>
                <div className="text-4xl font-bold mb-2">
                  {loadingStats ? '...' : stats ? (stats.avgMessagesPerUser ?? 0).toFixed(1) : '—'}
                </div>
                <div className="text-lg opacity-80">Messages par utilisateur en moyenne</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;