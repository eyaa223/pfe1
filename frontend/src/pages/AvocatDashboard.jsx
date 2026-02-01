import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AvocatDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false); // pour afficher/masquer la liste

  useEffect(() => {
    if (!user || user.role !== 'avocat') { 
      logout(); 
      navigate('/login'); 
      return; 
    }

    const fetchDemandes = async () => {
      try {
        const res = await axios.get('http://localhost:5000/demandes', { 
          headers: { Authorization: `Bearer ${user.token}` } 
        });
        setDemandes(res.data);
      } catch { 
        logout(); 
        navigate('/login'); 
      } finally { 
        setLoading(false); 
      }
    };

    fetchDemandes();
  }, [user, logout, navigate]);

  const handleChangeStatut = async (id, statut) => {
    const confirmChange = window.confirm(`Voulez-vous vraiment changer le statut de cette demande en "${statut}" ?`);
    if (!confirmChange) return;

    try {
      await axios.put(
        `http://localhost:5000/demandes/status/${id}`, 
        { statut_avocat: statut }, 
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setDemandes(prev => prev.map(d => d.id === id ? { ...d, statut_avocat: statut } : d));

      alert(`Le statut de la demande a été mis à jour : ${statut}`);

    } catch {
      alert('Impossible de modifier le statut');
    }
  };

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

  if (loading) return <p>Chargement...</p>;

  return (
    <div style={{ padding:'20px' }}>
      <h2>Dashboard Avocat ⚖️</h2>

      <button 
        onClick={() => setShowList(!showList)} 
        style={{ padding:'10px 20px', marginBottom:'20px', cursor:'pointer' }}
      >
        {showList ? 'Masquer les demandes' : 'Afficher les demandes'}
      </button>

      {showList && (
        <>
          {demandes.length === 0 ? (
            <p>Aucune demande</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Nom Association</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Email</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Statut Avocat</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Actions</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Documents</th>
                </tr>
              </thead>
              <tbody>
                {demandes.map(d => (
                  <tr key={d.id}>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{d.nom_association}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{d.email}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '5px',
                        fontWeight: 'bold',
                        color: d.statut_avocat === 'legale' ? '#155724' : d.statut_avocat === 'illegale' ? '#721c24' : 'black',
                        backgroundColor: d.statut_avocat === 'legale' ? '#d4edda' : d.statut_avocat === 'illegale' ? '#f8d7da' : '#e2e3e5'
                      }}>
                        {d.statut_avocat || 'En attente'}
                      </span>
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                      <button onClick={() => handleChangeStatut(d.id,'legale')} style={{ marginRight:'5px' }}>Légale</button>
                      <button onClick={() => handleChangeStatut(d.id,'illegale')}>Illégale</button>
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                      {['doc_statut','doc_autorisation','doc_registre','doc_cin'].map(doc => (
                        <button 
                          key={doc} 
                          onClick={() => downloadFile(d.id, doc)} 
                          style={{ marginRight: '5px', cursor: 'pointer' }}
                        >
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
    </div>
  );
};

export default AvocatDashboard;
