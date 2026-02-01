import express from 'express';
import db from '../db.js';
import path from 'path';
import fs from 'fs';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 🔹 GET : liste dynamique de toutes les associations (Admin seulement)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Admin uniquement' });
    }

    // Récupérer toutes les associations depuis la table associations
    const [associations] = await db.execute(
      `SELECT id, nom, email, telephone, adresse, responsable, created_at 
       FROM associations ORDER BY created_at DESC`
    );

    res.json(associations);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// 🔹 GET : liste publique des associations (non bloquées)
router.get('/public', async (req, res) => {
  try {
    // Récupérer uniquement les associations non bloquées
    const [associations] = await db.execute(
      `SELECT id, nom, email, telephone, adresse, responsable, created_at
       FROM associations
       WHERE blocked = 0
       ORDER BY created_at DESC`
    );

    res.json(associations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 🔹 GET : télécharger un document d’une association
router.get('/download/:id/:doc', verifyToken, async (req, res) => {
  const { id, doc } = req.params;
  const allowedFields = ['doc_statut','doc_autorisation','doc_registre','doc_cin'];

  if (!allowedFields.includes(doc)) {
    return res.status(400).json({ message: 'Champ invalide' });
  }

  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' });

    const [rows] = await db.execute(
      `SELECT ${doc} FROM demandes_association WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Association introuvable' });

    const filePath = path.join('./uploads', rows[0][doc]);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Fichier introuvable' });

    res.download(filePath);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/Beneficiaires', verifyToken, async (req, res) => {
  if (req.user.role !== 'association') {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  const { nom, prenom, telephone, description } = req.body;

  await db.execute(
    `INSERT INTO Beneficiaires
     (nom, prenom, telephone, description, association_id)
     VALUES (?,?,?,?,?)`,
    [nom, prenom, telephone, description, req.user.id]
  );

  res.json({ message: 'Bénéficiaire ajouté, en attente validation' });
});


export default router;
