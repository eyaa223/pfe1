import db from './db.js';
import bcrypt from 'bcrypt';

const password = '12345';
const hashed = await bcrypt.hash(password, 10);

const sql = "INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)";
await db.execute(sql, ['Me Dupont', 'avocat@example.com', hashed, 'avocat']);

console.log('Avocat créé !');
process.exit();
