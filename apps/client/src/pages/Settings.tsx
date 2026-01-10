import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Toast from '../components/Toast';

interface DecodedToken {
  sub: string;
  username: string;
  role: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    const decoded: DecodedToken = jwtDecode(token);
    setUserId(decoded.sub);
    fetchProfile(decoded.sub, token);
  }, [navigate]);

  const fetchProfile = async (id: string, token: string) => {
    try {
      const res = await axios.get(`http://localhost:3000/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsername(res.data.username);
      setNewUsername(res.data.username);
    } catch (err) {
      console.error('Failed to fetch profile', err);
      setError("Impossible de récupérer le profil utilisateur");
    }
  };

  const handleUsernameUpdate = async () => {
    if (!newUsername.trim()) {
      setError('Le pseudo ne peut pas être vide');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.patch(`http://localhost:3000/users/${userId}`, {
        username: newUsername.trim(),
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUsername(newUsername.trim());
      setSuccess('Pseudo mis à jour');
    } catch (err) {
      console.error('Failed to update username', err);
      setError('Erreur lors de la mise à jour du pseudo');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.patch(`http://localhost:3000/users/${userId}`, {
        password: newPassword,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Mot de passe mis à jour');
    } catch (err) {
      console.error('Failed to update password', err);
      setError('Erreur lors de la mise à jour du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.delete(`http://localhost:3000/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      localStorage.removeItem('token');
      navigate('/');
    } catch (err) {
      console.error('Failed to delete account', err);
      setError('Erreur lors de la suppression du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Paramètres du compte</h1>
            <p className="text-gray-400">Gérez votre profil, mot de passe et suppression de compte.</p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('/channels')}>
            Retour aux salons
          </button>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}
        {success && <div className="alert alert-success mb-4">{success}</div>}

        <div className="space-y-8">
          <div className="card bg-gray-800 border border-gray-700">
            <div className="card-body">
              <h2 className="card-title">Changer de pseudo</h2>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-300">Pseudo actuel</span>
                </label>
                <input
                  className="input input-bordered bg-gray-700"
                  value={username}
                  disabled
                />
              </div>
              <div className="form-control mt-3">
                <label className="label">
                  <span className="label-text text-gray-300">Nouveau pseudo</span>
                </label>
                <input
                  className="input input-bordered bg-gray-700"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-primary" onClick={handleUsernameUpdate} disabled={loading}>
                  Mettre à jour
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-gray-800 border border-gray-700">
            <div className="card-body">
              <h2 className="card-title">Changer le mot de passe</h2>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-300">Nouveau mot de passe</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered bg-gray-700"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="form-control mt-3">
                <label className="label">
                  <span className="label-text text-gray-300">Confirmer le mot de passe</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered bg-gray-700"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-primary" onClick={handlePasswordUpdate} disabled={loading}>
                  Mettre à jour le mot de passe
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-gray-800 border border-red-800">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title text-red-300">Supprimer le compte</h2>
                  <p className="text-gray-400 text-sm">Action irréversible. Vos messages et salons seront marqués comme "[supprimé]".</p>
                </div>
                <button className="btn btn-error" onClick={() => setShowDeleteModal(true)}>
                  Supprimer mon compte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-gray-800 text-white">
            <h3 className="font-bold text-lg mb-2">Confirmer la suppression</h3>
            <p className="mb-4 text-gray-300">
              Tapez <span className="font-mono">SUPPRIMER</span> pour confirmer. Vos messages et salons afficheront "[supprimé]".
            </p>
            <input
              className="input input-bordered w-full bg-gray-700 mb-4"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
            <div className="modal-action">
              <button className="btn" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button
                className="btn btn-error"
                disabled={deleteConfirm !== 'SUPPRIMER' || loading}
                onClick={() => {
                  if (deleteConfirm === 'SUPPRIMER') {
                    handleDeleteAccount();
                  }
                }}
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default Settings;
