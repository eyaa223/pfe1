import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 🔹 Avocat valide bénéficiaire
router.put('/beneficiaires/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'avocat') {
      return res.status(403).json({ message: 'Avocat seulement' });
    }

    const { id } = req.params;
    const { decision } = req.body; // approved | rejected

    await db.execute(
      "UPDATE beneficiaires SET avocat_status = ? WHERE id = ?",
      [decision, id]
    );

    res.json({ message: `Avocat a ${decision} le bénéficiaire` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
