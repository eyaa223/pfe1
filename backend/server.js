import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

// 🔹 Routes
import adminRoutes from './routes/admin.js';
import demandesRoutes from './routes/demandes.js';
import associationsRoutes from './routes/associations.js'; // liste publique et admin
import dashboardRoutes from './routes/dashboard.js';       // dashboard association
import avocatRoutes from './routes/avocat.js';
import publicRoutes from './routes/public.js';
import beneficiairesRoutes from './routes/beneficiaires.js';







dotenv.config();
const app = express();

// 🔹 Parser JSON & form-data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 CORS (frontend React)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// 🔹 Dossier uploads (téléchargement fichiers)
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));

// 🔹 Routes API
app.use('/admin', adminRoutes);              // login admin + avocat + association
app.use('/demandes', demandesRoutes);        // demandes association
app.use('/associations', associationsRoutes); // liste dynamique des associations (admin seulement)
app.use('/association', dashboardRoutes);    
app.use('/avocat', avocatRoutes);
app.use('/public', publicRoutes);
app.use('/beneficiaires', beneficiairesRoutes);

// 🔹 Test serveur
app.get('/', (req, res) => {
  res.send('✅ Backend association sécurisé OK');
});

// 🔹 Lancer serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
