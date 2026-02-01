import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const HomePage = () => {
  // 🔹 États formulaire demande association
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nom_association: '',
    email: '',
    telephone: '',
    adresse: '',
    responsable: '',
    doc_statut: null,
    doc_autorisation: null,
    doc_registre: null,
    doc_cin: null
  });
  const [loading, setLoading] = useState(false);

  // 🔹 États bénéficiaires acceptés (IMPORTANT)
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [loadingBen, setLoadingBen] = useState(true);

  // 🔹 Charger bénéficiaires acceptés (avocat + admin)
  useEffect(() => {
    const fetchBeneficiaires = async () => {
      try {
        const res = await axios.get('http://localhost:5000/public/beneficiaires');
        setBeneficiaires(res.data);
      } catch (err) {
        console.error('Erreur récupération bénéficiaires:', err);
      } finally {
        setLoadingBen(false);
      }
    };
    fetchBeneficiaires();
  }, []);

  // 🔹 Formulaire changement
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    });
  };

  // 🔹 Soumettre demande association
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });

      const res = await axios.post('http://localhost:5000/demandes', data);

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: res.data.message,
        timer: 2500,
        showConfirmButton: false
      });

      setFormData({
        nom_association: '',
        email: '',
        telephone: '',
        adresse: '',
        responsable: '',
        doc_statut: null,
        doc_autorisation: null,
        doc_registre: null,
        doc_cin: null
      });
      setShowForm(false);

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Erreur serveur'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Bienvenue sur le portail solidaire</h1>

      {/* 🔹 Bouton formulaire */}
      <button
        onClick={() => setShowForm(!showForm)}
        style={btnYellow}
      >
        {showForm ? 'Annuler' : 'Demande création association'}
      </button>

      {/* 🔹 Formulaire demande association */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', marginTop: '20px' }}>
          <input type="text" name="nom_association" placeholder="Nom association" value={formData.nom_association} onChange={handleChange} required style={inputStyle} />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required style={inputStyle} />
          <input type="text" name="telephone" placeholder="Téléphone" value={formData.telephone} onChange={handleChange} required style={inputStyle} />
          <textarea name="adresse" placeholder="Adresse" value={formData.adresse} onChange={handleChange} required style={inputStyle} />
          <input type="text" name="responsable" placeholder="Responsable" value={formData.responsable} onChange={handleChange} required style={inputStyle} />

          <label>Statut:</label>
          <input type="file" name="doc_statut" onChange={handleChange} required />
          <label>Autorisation:</label>
          <input type="file" name="doc_autorisation" onChange={handleChange} required />
          <label>Registre:</label>
          <input type="file" name="doc_registre" onChange={handleChange} required />
          <label>CIN:</label>
          <input type="file" name="doc_cin" onChange={handleChange} required />

          <button type="submit" disabled={loading} style={submitBtnStyle}>
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>
      )}

      {/* 🔹 Affichage bénéficiaires acceptés */}
      <h2 style={{ marginTop: '40px' }}>Personnes prises en charge</h2>

      {loadingBen ? (
        <p>Chargement...</p>
      ) : beneficiaires.length === 0 ? (
        <p>Aucun bénéficiaire pour le moment</p>
      ) : (
        <div style={gridStyle}>
          {beneficiaires.map(b => (
            <div key={b.id} style={cardStyle}>
              <h3>{b.nom} {b.prenom}</h3>
              <p>{b.description}</p>
              <small><b>Association:</b> {b.association}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* 🔹 Styles */
const inputStyle = { width: '100%', marginBottom: '10px', padding: '8px' };
const submitBtnStyle = { padding: '10px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer' };
const btnYellow = { padding: '10px 20px', marginBottom: '20px', backgroundColor: '#ffcc00', border: 'none', cursor: 'pointer' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' };
const cardStyle = { border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#fff' };

export default HomePage;