// routes/dashboard.js
import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 🔹 Dashboard association
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    // Vérifier que c'est bien une association
    if (req.user.role !== 'association') {
      return res.status(403).json({ message: "Accès refusé" });
    }

    // Récupérer les infos de l'association connectée
    const [rows] = await db.execute(
      "SELECT id, nom, email, telephone, adresse, responsable, created_at FROM associations WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Association non trouvée" });

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
