import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AvocatDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [demandes, setDemandes] = useState([]);
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDemandes, setShowDemandes] = useState(false);
  const [showBeneficiaires, setShowBeneficiaires] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'avocat') {
      logout();
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [resDemandes, resBeneficiaires] = await Promise.all([
          axios.get('http://localhost:5000/demandes', { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get('http://localhost:5000/avocat/beneficiaires', { headers: { Authorization: `Bearer ${user.token}` } })
        ]);

        setDemandes(resDemandes.data);
        setBeneficiaires(resBeneficiaires.data);
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

  // 🔹 Modifier le statut avocat pour les demandes ou bénéficiaires
  const handleChangeStatut = async (id, statut, type) => {
    if (!window.confirm(`Voulez-vous vraiment changer le statut en "${statut}" ?`)) return;

    try {
      const url =
        type === 'demande'
          ? `http://localhost:5000/demandes/status/${id}`
          : `http://localhost:5000/avocat/beneficiaires/${id}`;

      await axios.put(url, { decision: statut }, { headers: { Authorization: `Bearer ${user.token}` } });

      // 🔹 Mettre à jour directement le tableau sans supprimer
      if (type === 'demande') {
        setDemandes(prev => prev.map(d => d.id === id ? { ...d, statut_avocat: statut } : d));
      } else {
        setBeneficiaires(prev => prev.map(b => b.id === id ? { ...b, avocat_status: statut } : b));
      }

      alert(`Statut mis à jour : ${statut}`);
    } catch (err) {
      console.error(err);
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

  if (loading) return <p>Chargement...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard Avocat ⚖️</h2>

      {/* 🔹 Boutons pour afficher/masquer */}
      <button onClick={() => setShowDemandes(!showDemandes)} style={btnToggle}>
        {showDemandes ? 'Masquer les demandes' : 'Afficher les demandes'}
      </button>
      <button onClick={() => setShowBeneficiaires(!showBeneficiaires)} style={{ ...btnToggle, marginLeft: '10px' }}>
        {showBeneficiaires ? 'Masquer les bénéficiaires' : 'Afficher les bénéficiaires'}
      </button>

      {/* 🔹 Tableau des demandes */}
      {showDemandes && (
        <>
          {demandes.length === 0 ? (
            <p>Aucune demande</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Nom Association</th>
                  <th>Email</th>
                  <th>Statut Avocat</th>
                  <th>Actions</th>
                  <th>Documents</th>
                </tr>
              </thead>
              <tbody>
                {demandes.map(d => (
                  <tr key={d.id}>
                    <td>{d.nom_association}</td>
                    <td>{d.email}</td>
                    <td style={{ textAlign: 'center' }}>{d.statut_avocat || 'En attente'}</td>
                    <td>
                      <button onClick={() => handleChangeStatut(d.id,'legale','demande')} style={btnStyleApprove}>Légale</button>
                      <button onClick={() => handleChangeStatut(d.id,'illegale','demande')} style={btnStyleReject}>Illégale</button>
                    </td>
                    <td>
                      {['doc_statut','doc_autorisation','doc_registre','doc_cin'].map(doc => (
                        <button key={doc} onClick={() => downloadFile(d.id, doc)} style={btnDoc}>{doc}</button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* 🔹 Tableau des bénéficiaires */}
      {showBeneficiaires && (
        <>
          {beneficiaires.length === 0 ? (
            <p>Aucun bénéficiaire en attente</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Nom Association</th>
                  <th>Nom de bénéficiaire</th>
                  <th>Prénom de bénéficiaire</th>
                  <th>Email</th>
                  <th>Statut Avocat</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaires.map(b => (
                  <tr key={b.id}>
                    <td>{b.association_nom}</td>
                    <td>{b.nom}</td>
                    <td>{b.prenom}</td>
                    <td>{b.email || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{b.avocat_status || 'En attente'}</td>
                    <td>
                      <button onClick={() => handleChangeStatut(b.id,'legale','beneficiaire')} style={btnStyleApprove}>Légale</button>
                      <button onClick={() => handleChangeStatut(b.id,'illegale','beneficiaire')} style={btnStyleReject}>Illégale</button>

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
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '15px' };
const btnToggle = { padding:'10px 20px', marginBottom:'20px', cursor:'pointer' };
const btnStyleApprove = { padding: '5px 10px', marginRight: '5px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' };
const btnStyleReject = { padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' };
const btnDoc = { padding:'3px 5px', marginRight:'5px', cursor: 'pointer' };

export default AvocatDashboard;
