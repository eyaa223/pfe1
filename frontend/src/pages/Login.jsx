import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [mot_de_passe, setMotDePasse] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/admin/login', { email, mot_de_passe });
      const { token, role, association } = res.data;

      if (role === 'association') {
        login({
          token,
          role,
          id: association.id,
          nom: association.nom,
          email: association.email
        });
        navigate('/association/dashboard');
      } else {
        login({ token, role, email });
        navigate(role === 'admin' ? '/admin/dashboard' : '/avocat/dashboard');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Erreur login');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={mot_de_passe}
          onChange={e => setMotDePasse(e.target.value)}
          required
        />
        <button type="submit">Se connecter</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Login;
