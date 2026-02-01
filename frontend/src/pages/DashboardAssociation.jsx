import { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import AddBeneficiaireForm from '../components/AddBeneficiaireForm';

const DashboardAssociation = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Récupérer les infos de l'association
  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(
        'http://localhost:5000/association/dashboard',
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setData(res.data);
    } catch (err) {
      console.error('Erreur dashboard association:', err);
    }
  }, [user]);

  // 🔹 Récupérer les bénéficiaires avec le nom de l'association
  const fetchBeneficiaires = useCallback(async () => {
    try {
      const res = await axios.get(
        'http://localhost:5000/beneficiaires', // backend doit renvoyer association_nom
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setBeneficiaires(res.data);
    } catch (err) {
      console.error('Erreur chargement bénéficiaires:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'association') {
      Promise.all([fetchData(), fetchBeneficiaires()]).finally(() => setLoading(false));
    }
  }, [user, fetchData, fetchBeneficiaires]);

  if (loading) return <p>Chargement du dashboard...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard Association</h2>

      {data && (
        <>
          <h3>Bienvenue, {data.nom} 🎉</h3>
          <ul>
            <li><strong>Email :</strong> {data.email}</li>
            <li><strong>Téléphone :</strong> {data.telephone}</li>
            <li><strong>Adresse :</strong> {data.adresse}</li>
            <li><strong>Responsable :</strong> {data.responsable}</li>
            <li><strong>Créée le :</strong> {new Date(data.created_at).toLocaleDateString()}</li>
          </ul>
        </>
      )}

      <hr />

      <button onClick={() => setShowForm(true)} style={btnStyle}>
        ➕ Ajouter bénéficiaire
      </button>

      {showForm && (
        <AddBeneficiaireForm
          onClose={() => {
            setShowForm(false);
            fetchBeneficiaires(); // recharge le tableau après ajout
          }}
        />
      )}

      <hr />

      <h3>Liste des bénéficiaires</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th>Nom Association</th>
            <th>Nom Bénéficiaire</th>
            <th>Prénom</th>
            <th>Téléphone</th>
            <th>Statut Avocat</th>
            <th>Statut Admin</th>
          </tr>
        </thead>
        <tbody>
          {beneficiaires.length === 0 ? (
            <tr>
              <td colSpan="6">Aucun bénéficiaire ajouté</td>
            </tr>
          ) : (
            beneficiaires.map((b) => (
              <tr key={b.id}>
                <td>{b.association_nom}</td>
                <td>{b.nom}</td>
                <td>{b.prenom}</td>
                <td>{b.telephone}</td>
                <td>{b.avocat_status}</td>
                <td>{b.admin_status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const btnStyle = {
  padding: '10px 15px',
  marginTop: '15px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  borderRadius: '4px'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '15px'
};

export default DashboardAssociation;
