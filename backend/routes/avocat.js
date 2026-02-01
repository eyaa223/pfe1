import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 🔹 Avocat valide un bénéficiaire
router.put('/beneficiaires/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'avocat') return res.status(403).json({ message: 'Avocat seulement' });

    const { id } = req.params;
    let { decision } = req.body;

    // 🔹 Adapter les valeurs frontend vers MySQL ENUM
    if (decision === 'legale') decision = 'approved';
    if (decision === 'illegale') decision = 'rejected';

    const validDecisions = ['approved', 'rejected'];
    if (!validDecisions.includes(decision)) return res.status(400).json({ message: 'Décision invalide' });

    const [result] = await db.execute(
      "UPDATE beneficiaires SET avocat_status = ? WHERE id = ?",
      [decision, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Bénéficiaire non trouvé' });

    res.json({ message: `Statut du bénéficiaire mis à jour : ${decision}` });

  } catch (err) {
    console.error('Erreur serveur PUT /avocat/beneficiaires/:id', err);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// 🔹 Avocat voit tous les bénéficiaires
router.get('/beneficiaires', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'avocat') return res.status(403).json({ message: 'Avocat seulement' });

    const [rows] = await db.execute(
      `SELECT b.id, b.nom, b.prenom, b.telephone, b.description, b.avocat_status,
              a.nom AS association_nom, a.email
       FROM beneficiaires b
       JOIN associations a ON b.association_id = a.id
       ORDER BY b.created_at DESC`
    );

    res.json(rows);

  } catch (err) {
    console.error('Erreur serveur GET /avocat/beneficiaires', err);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

export default router;
