import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // États
  const [demandes, setDemandes] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDemandes, setShowDemandes] = useState(false);
  const [showAssociations, setShowAssociations] = useState(false);

  // Récupérer données au chargement
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      logout();
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [demandesRes, associationsRes] = await Promise.all([
          axios.get('http://localhost:5000/demandes', { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get('http://localhost:5000/admin/associations', { headers: { Authorization: `Bearer ${user.token}` } })
        ]);
        setDemandes(demandesRes.data);
        setAssociations(associationsRes.data);
      } catch (err) {
        console.error(err);
        logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, logout, navigate]);

  // 🔹 Modifier statut demande
  const handleChangeStatut = async (id, statut) => {
    const confirmChange = window.confirm(`Voulez-vous vraiment changer le statut de cette demande en "${statut}" ?`);
    if (!confirmChange) return;

    try {
      await axios.put(
        `http://localhost:5000/demandes/status/${id}`,
        { statut_admin: statut },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setDemandes(prev => prev.map(d => d.id === id ? { ...d, statut_admin: statut } : d));
      alert(`Statut mis à jour : ${statut}`);
    } catch {
      alert('Impossible de modifier le statut');
    }
  };

  // 🔹 Télécharger fichiers
  const downloadFile = async (id, field) => {
    try {
      const res = await axios.get(`http://localhost:5000/demandes/download/${id}/${field}`, {
        headers: { Authorization: `Bearer ${user.token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', field + '.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Impossible de télécharger le document');
    }
  };

  // 🔹 Bloquer / Débloquer association
  const toggleBlockAssociation = async (id, currentStatus) => {
    const action = currentStatus ? 'débloquer' : 'bloquer';
    const confirmAction = window.confirm(`Voulez-vous vraiment ${action} cette association ?`);
    if (!confirmAction) return;

    try {
      await axios.put(
        `http://localhost:5000/admin/block/${id}`,
        { blocked: !currentStatus },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setAssociations(prev => prev.map(a => a.id === id ? { ...a, blocked: !currentStatus } : a));
      alert(`Association ${action}ée avec succès`);
    } catch (err) {
      console.error(err);
      alert('Impossible de modifier le blocage');
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard Admin</h2>

      {/* 🔹 Boutons sections */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowDemandes(!showDemandes)}
          style={{ padding: '10px 20px', marginRight: '10px', cursor: 'pointer' }}
        >
          {showDemandes ? 'Masquer les demandes' : 'Afficher les demandes'}
        </button>
        <button
          onClick={() => setShowAssociations(!showAssociations)}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          {showAssociations ? 'Masquer les associations' : 'Afficher toutes les associations'}
        </button>
      </div>

      {/* 🔹 Section Demandes */}
      {showDemandes && (
        <>
          {demandes.length === 0 ? (
            <p>Aucune demande</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={thStyle}>Nom Association</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Statut Admin</th>
                  <th style={thStyle}>Statut Avocat</th>
                  <th style={thStyle}>Actions</th>
                  <th style={thStyle}>Documents</th>
                </tr>
              </thead>
              <tbody>
                {demandes.map(d => (
                  <tr key={d.id}>
                    <td style={tdStyle}>{d.nom_association}</td>
                    <td style={tdStyle}>{d.email}</td>
                    <td style={tdStyleCenter}>
                      <span style={badgeStyle(d.statut_admin, 'acceptee', 'refusee')}>
                        {d.statut_admin || 'En attente'}
                      </span>
                    </td>
                    <td style={tdStyleCenter}>
                      <span style={badgeStyle(d.statut_avocat, 'legale', 'illegale')}>
                        {d.statut_avocat || 'En attente'}
                      </span>
                    </td>
                    <td style={tdStyleCenter}>
                      <button onClick={() => handleChangeStatut(d.id, 'acceptee')} style={{ marginRight: '5px' }}>Accepter</button>
                      <button onClick={() => handleChangeStatut(d.id, 'refusee')}>Refuser</button>
                    </td>
                    <td style={tdStyleCenter}>
                      {['doc_statut','doc_autorisation','doc_registre','doc_cin'].map(doc => (
                        <button key={doc} onClick={() => downloadFile(d.id, doc)} style={{ marginRight: '5px', cursor: 'pointer' }}>
                          {doc}
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* 🔹 Section Associations */}
      {showAssociations && (
        <>
          {associations.length === 0 ? (
            <p>Aucune association</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={thStyle}>Nom</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Téléphone</th>
                  <th style={thStyle}>Adresse</th>
                  <th style={thStyle}>Responsable</th>
                  <th style={thStyle}>Créée le</th>
                  <th style={thStyle}>Bloqué</th>
                </tr>
              </thead>
              <tbody>
                {associations.map(a => (
                  <tr key={a.id}>
                    <td style={tdStyle}>{a.nom}</td>
                    <td style={tdStyle}>{a.email}</td>
                    <td style={tdStyle}>{a.telephone}</td>
                    <td style={tdStyle}>{a.adresse}</td>
                    <td style={tdStyle}>{a.responsable}</td>
                    <td style={tdStyle}>{new Date(a.created_at).toLocaleString()}</td>
                    <td style={tdStyleCenter}>
                      <button
                        onClick={() => toggleBlockAssociation(a.id, a.blocked)}
                        style={{
                          padding: '5px 10px',
                          cursor: 'pointer',
                          borderRadius: '5px',
                          border: 'none',
                          color: a.blocked ? '#721c24' : '#155724',
                          backgroundColor: a.blocked ? '#f8d7da' : '#d4edda'
                        }}
                      >
                        {a.blocked ? 'Débloquer' : 'Bloquer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

// 🔹 Styles
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginBottom: '30px' };
const thStyle = { border: '1px solid #ccc', padding: '8px' };
const tdStyle = { border: '1px solid #ccc', padding: '8px' };
const tdStyleCenter = { border: '1px solid #ccc', padding: '8px', textAlign: 'center' };
const badgeStyle = (value, positive, negative) => ({
  padding: '3px 8px',
  borderRadius: '5px',
  fontWeight: 'bold',
  color: value === positive ? '#155724' : value === negative ? '#721c24' : 'black',
  backgroundColor: value === positive ? '#d4edda' : value === negative ? '#f8d7da' : '#e2e3e5'
});

export default AdminDashboard;
