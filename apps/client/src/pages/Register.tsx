import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/auth/register', { username, email, password });
      localStorage.setItem('token', response.data.access_token);
      navigate('/');
    } catch (error) {
      alert('Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Inscription</h2>
            <p className="text-gray-300">Créez votre compte</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300">Nom d'utilisateur</span>
              </label>
              <input
                type="text"
                placeholder="Votre nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input input-bordered input-primary bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:input-primary"
                required
              />
            </div>
            
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
              className="btn btn-success w-full"
            >
              S'inscrire
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Déjà un compte ?{' '}
              <a href="/" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Retour à l'accueil
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;