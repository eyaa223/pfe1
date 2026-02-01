import express from 'express';
import db from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 🔹 Config multer pour uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 🔹 Config Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

// 🔹 Créer une demande (association)
router.post('/', upload.fields([
  { name: 'doc_statut', maxCount: 1 },
  { name: 'doc_autorisation', maxCount: 1 },
  { name: 'doc_registre', maxCount: 1 },
  { name: 'doc_cin', maxCount: 1 }
]), async (req, res) => {
  const { nom_association, email, telephone, adresse, responsable } = req.body;

  if (!nom_association || !email || !telephone || !adresse || !responsable ||
      !req.files['doc_statut'] || !req.files['doc_autorisation'] ||
      !req.files['doc_registre'] || !req.files['doc_cin']) {
    return res.status(400).json({ message: "Tous les champs et documents sont obligatoires" });
  }

  try {
    const [exist] = await db.execute("SELECT * FROM demandes_association WHERE email = ?", [email]);
    if (exist.length > 0) return res.status(400).json({ message: "Cette association a déjà envoyé une demande" });

    const [result] = await db.execute(
      `INSERT INTO demandes_association 
      (nom_association,email,telephone,adresse,responsable,doc_statut,doc_autorisation,doc_registre,doc_cin,statut_admin,statut_avocat)
      VALUES (?,?,?,?,?,?,?,?,?, 'en attente', 'en attente')`,
      [
        nom_association,
        email,
        telephone,
        adresse,
        responsable,
        req.files['doc_statut'][0].filename,
        req.files['doc_autorisation'][0].filename,
        req.files['doc_registre'][0].filename,
        req.files['doc_cin'][0].filename
      ]
    );

    res.status(201).json({ message: "Demande envoyée avec succès", demandeId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🔹 Voir toutes les demandes
router.get('/', verifyToken, async (req, res) => {
  if (!['avocat','admin'].includes(req.user.role)) return res.status(403).json({ message: "Accès refusé" });

  try {
    const [rows] = await db.execute("SELECT * FROM demandes_association ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🔹 Modifier statut
router.put('/status/:id', verifyToken, async (req, res) => {
  const { statut_avocat, statut_admin } = req.body;
  const id = req.params.id;

  try {
    // 🔹 Mise à jour statut avocat
    if (req.user.role === 'avocat' && statut_avocat) {
      await db.execute("UPDATE demandes_association SET statut_avocat = ? WHERE id = ?", [statut_avocat, id]);
      return res.json({ message: "Statut avocat mis à jour" });
    }

    // 🔹 Mise à jour statut admin
    if (req.user.role === 'admin' && statut_admin) {
      await db.execute("UPDATE demandes_association SET statut_admin = ? WHERE id = ?", [statut_admin, id]);

      // 🔹 Si admin accepte, créer compte dans table associations + envoyer email
      if (statut_admin === 'acceptee') {
        const [rows] = await db.execute("SELECT * FROM demandes_association WHERE id = ?", [id]);
        const demande = rows[0];

        // Vérifier si déjà créé dans associations
        const [exist] = await db.execute("SELECT * FROM associations WHERE email = ?", [demande.email]);
        if (exist.length === 0) {
          const generatedPassword = Math.random().toString(36).slice(-8); // mot de passe aléatoire 8 caractères
          const hashedPassword = await bcrypt.hash(generatedPassword, 10);

          await db.execute(
            "INSERT INTO associations (nom, email, password, telephone, adresse, responsable) VALUES (?,?,?,?,?,?)",
            [demande.nom_association, demande.email, hashedPassword, demande.telephone, demande.adresse, demande.responsable]
          );

          // 🔹 Envoi email
          await transporter.sendMail({
            from: process.env.EMAIL,
            to: demande.email,
            subject: "Association acceptée ✅",
            text: `Bonjour ${demande.nom_association},\n\nVotre demande a été acceptée par l'admin.\n\nVoici vos identifiants :\nEmail : ${demande.email}\nMot de passe : ${generatedPassword}\n\nMerci.`
          });
        }
      }

      return res.json({ message: "Statut admin mis à jour et compte créé si accepté" });
    }

    res.status(403).json({ message: "Accès refusé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🔹 Télécharger fichier
router.get('/download/:id/:field', verifyToken, async (req, res) => {
  const { id, field } = req.params;
  if (!['doc_statut','doc_autorisation','doc_registre','doc_cin'].includes(field)) {
    return res.status(400).json({ message: "Champ invalide" });
  }

  try {
    const [rows] = await db.execute("SELECT * FROM demandes_association WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Demande non trouvée" });
    if (!['avocat','admin'].includes(req.user.role)) return res.status(403).json({ message: "Accès refusé" });

    const filePath = path.join('./uploads', rows[0][field]);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Fichier introuvable" });

    res.download(filePath);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
