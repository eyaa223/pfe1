import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ padding: '10px', backgroundColor: '#ffcc00' }}>
      <Link to="/" style={{ marginRight: '15px' }}>Home</Link>

      {!user && <Link to="/login">Login</Link>}

      {user && user.role === 'admin' && (
        <>
          <Link to="/admin/dashboard" style={{ marginLeft: '15px' }}>Dashboard Admin</Link>
          <button onClick={handleLogout} style={{ marginLeft: '15px' }}>Logout</button>
        </>
      )}

      {user && user.role === 'avocat' && (
        <>
          <Link to="/avocat/dashboard" style={{ marginLeft: '15px' }}>Dashboard Avocat</Link>
          <button onClick={handleLogout} style={{ marginLeft: '15px' }}>Logout</button>
        </>
      )}

      {user && user.role === 'association' && (
        <>
          <Link to="/association/dashboard" style={{ marginLeft: '15px' }}>Dashboard Association</Link>
          <button onClick={handleLogout} style={{ marginLeft: '15px' }}>Logout</button>
        </>
      )}
    </nav>
  );
};

export default Navbar;
