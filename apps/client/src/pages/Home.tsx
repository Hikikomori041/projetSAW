import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp: number;
}

const Home = () => {
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-8">
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
      </div>
    </div>
  );
};

export default Home;