import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Toast from '../components/Toast';

interface DecodedToken {
  username: string;
  role: string;
  sub: string;
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', response.data.access_token);
      
      // Décoder le token pour vérifier le rôle
      try {
        const decoded = jwtDecode<DecodedToken>(response.data.access_token);
        if (decoded.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/channels');
        }
      } catch {
        // Si le décodage échoue, rediriger vers channels par défaut
        navigate('/channels');
      }
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setToastMessage('Connexion au serveur impossible');
      } else if (error.response?.status === 401) {
        setToastMessage('Identifiants invalides');
      } else if (error.response?.status === 403) {
        // Compte banni - afficher le message du serveur si disponible
        const message = error.response?.data?.message || 'Compte banni';
        setToastMessage(message);
      } else if (error.response?.status >= 500) {
        setToastMessage('Erreur serveur, réessayez plus tard');
      } else {
        setToastMessage('Échec de la connexion');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Connexion</h2>
            <p className="text-gray-300">Rejoignez votre communauté</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300">Email</span>
              </label>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered input-primary bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:input-primary"
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300">Mot de passe</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered input-primary bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:input-primary"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-full"
            >
              Se connecter
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Pas encore de compte ?{' '}
              <a href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Créer un compte
              </a>
            </p>
            <br/>
            <a href="/" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Retour à l'accueil
            </a>
          </div>
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="error"
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default Login;