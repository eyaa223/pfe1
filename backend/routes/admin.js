import express from 'express';
import db from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();

// 🔹 Route LOGIN unique
router.post('/login', async (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  try {
    // 🔹 Cherche l'utilisateur dans la table admin/avocat
    const [users] = await db.execute(
      "SELECT * FROM utilisateurs WHERE email = ?",
      [email]
    );

    if (users.length > 0) {
      const user = users[0];
      const match = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
      if (!match) return res.status(401).json({ message: 'Mot de passe incorrect' });

      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

      return res.json({
        message: 'Connexion réussie',
        token,
        role: user.role,
        email: user.email
      });
    }

    // 🔹 Cherche dans la table associations
    const [assoc] = await db.execute(
      "SELECT * FROM associations WHERE email = ?",
      [email]
    );

    if (assoc.length > 0) {
      const association = assoc[0];

      // 🔹 Vérifier si l'association est bloquée
      if (association.blocked === 1) {
        return res.status(403).json({ message: "Vous êtes bloqué. Contactez l'admin." });
      }

      const match = await bcrypt.compare(mot_de_passe, association.password);
      if (!match) return res.status(401).json({ message: 'Mot de passe incorrect' });

      const token = jwt.sign({ id: association.id, role: 'association' }, process.env.JWT_SECRET, { expiresIn: '1h' });

      return res.json({
        message: 'Connexion réussie',
        token,
        role: 'association',
        association: { id: association.id, nom: association.nom, email: association.email }
      });
    }

    return res.status(401).json({ message: 'Utilisateur non trouvé' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 🔹 Route GET : toutes les associations (Admin seulement)
router.get('/associations', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: "Accès refusé" });

  try {
    const [associations] = await db.execute(
      "SELECT id, nom, email, telephone, adresse, responsable, created_at, blocked FROM associations ORDER BY created_at DESC"
    );
    res.json(associations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// 🔹 Bloquer / Débloquer une association (Admin seulement)
router.put('/block/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: "Accès refusé" });

  const { id } = req.params;
  const { blocked } = req.body;

  try {
    await db.execute("UPDATE associations SET blocked = ? WHERE id = ?", [blocked ? 1 : 0, id]);
    res.json({ message: `Association ${blocked ? 'bloquée' : 'débloquée'} avec succès` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.put('/beneficiaires/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin seulement' });
  }

  const { id } = req.params;
  const { decision } = req.body;

  const [rows] = await db.execute(
    "SELECT avocat_status FROM beneficiaires WHERE id = ?",
    [id]
  );

  if (rows[0].avocat_status !== 'approved') {
    return res.status(400).json({ message: 'Attente validation avocat' });
  }

  await db.execute(
    "UPDATE beneficiaires SET admin_status = ? WHERE id = ?",
    [decision, id]
  );

  res.json({ message: `Admin a ${decision} le bénéficiaire` });
});


export default router;
