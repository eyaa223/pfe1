const DemandeAssociation = () => (
  <form method="POST" encType="multipart/form-data">
    <input required name="nom_association" />
    <input required name="email" />
    <input required name="telephone" />
    <input required name="adresse" />
    <input required name="responsable" />

    <input type="file" name="doc_statut" required />
    <input type="file" name="doc_autorisation" required />
    <input type="file" name="doc_registre" required />
    <input type="file" name="doc_cin" required />

    <button>Envoyer demande</button>
  </form>
);
