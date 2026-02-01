import { useState, useContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';

const AddBeneficiaireForm = ({ onClose }) => {
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    description: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/beneficiaires', // route backend en minuscules
        formData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      Swal.fire('Succès', 'Bénéficiaire ajouté', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire('Erreur', 'Erreur serveur', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3>Ajouter un bénéficiaire</h3>

      <input name="nom" placeholder="Nom" onChange={handleChange} required />
      <input name="prenom" placeholder="Prénom" onChange={handleChange} required />
      <input name="telephone" placeholder="Téléphone" onChange={handleChange} required />
      <textarea name="description" placeholder="Description / Cas personnel" onChange={handleChange} required />

      <button type="submit">Ajouter</button>
      <button type="button" onClick={onClose}>Annuler</button>
    </form>
  );
};

const formStyle = {
  background: '#fff',
  padding: '20px',
  borderRadius: '8px',
  maxWidth: '400px'
};

export default AddBeneficiaireForm;
