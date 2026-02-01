import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 🔹 Ajouter un bénéficiaire (association seulement)
router.post('/', verifyToken, async (req, res) => {
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

    res.json({ message: 'Bénéficiaire ajouté, en attente validation' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 🔹 Récupérer les bénéficiaires avec le nom de l'association
router.get('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'association') {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT b.id, b.nom, b.prenom, b.telephone, b.description, b.avocat_status, b.admin_status, a.nom AS association_nom
       FROM beneficiaires b
       JOIN associations a ON b.association_id = a.id
       WHERE b.association_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
