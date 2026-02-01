import db from '../db.js';

// ================= ASSOCIATION =================

// Ajouter bénéficiaire
export const addBeneficiaire = async (req, res) => {
  if (req.user.role !== 'association') {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  const { nom, prenom, telephone, description } = req.body;

  try {
    await db.execute(
      `INSERT INTO beneficiaires 
       (nom, prenom, telephone, description, association_id, avocat_status, admin_status)
       VALUES (?, ?, ?, ?, ?, 'pending', 'pending')`,
      [nom, prenom, telephone, description, req.user.id]
    );

    res.json({ message: 'Bénéficiaire ajouté (en attente avocat)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Liste bénéficiaires d’une association
export const getAssociationBeneficiaires = async (req, res) => {
  if (req.user.role !== 'association') {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT b.*, a.nom AS association_nom
       FROM beneficiaires b
       JOIN associations a ON b.association_id = a.id
       WHERE b.association_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ================= AVOCAT =================

// Voir tous les bénéficiaires à traiter
export const getBeneficiairesForAvocat = async (req, res) => {
  if (req.user.role !== 'avocat') {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT b.id, b.nom, b.prenom, b.telephone, b.description,
              b.avocat_status, a.nom AS nom_association
       FROM beneficiaires b
       JOIN associations a ON b.association_id = a.id
       WHERE b.avocat_status = 'pending'
       ORDER BY b.created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Accepter / Refuser bénéficiaire
export const updateAvocatStatus = async (req, res) => {
  if (req.user.role !== 'avocat') {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  const { statut_avocat } = req.body;

  if (!['legale', 'illegale'].includes(statut_avocat)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }

  try {
    await db.execute(
      `UPDATE beneficiaires SET avocat_status = ? WHERE id = ?`,
      [statut_avocat, req.params.id]
    );

    res.json({ message: 'Statut avocat mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
