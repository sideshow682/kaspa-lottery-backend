// === Backend complet pour Kaspa Lottery avec adresses fictives ===

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 📌 Phrase mnémonique stockée en variable d'environnement (peut être utilisée plus tard)
const mnemonic = process.env.MNEMONIC_FILE_CONTENT || "no mnemonic set";

// ✅ Adresses Kaspa fictives pour test
const addresses = [
  "kaspa:qq1234567890abcdefghijklmnopqrstuvwxyz1234567890",
  "kaspa:qq0987654321zyxwvutsrqponmlkjihgfedcba0987654321"
];

// 🔢 Historique des tirages et résumé
const history = [];
let summary = { winner: '', address: '', total: 0 };

// === ROUTES API ===

// 🔹 Retourne la liste des adresses participantes
app.get('/addresses', (req, res) => {
  res.json({ addresses });
});

// 🔹 Ajoute une participation (ticket)
app.post('/ticket', (req, res) => {
  const { username, address } = req.body;
  if (!username || !address) return res.status(400).send("Champs manquants");
  addresses.push(address);
  summary.total += 1;
  res.json({ message: 'Ticket enregistré avec succès !' });
});

// 🔹 Donne le résumé actuel
app.get('/summary', (req, res) => {
  res.json(summary);
});

// 🔹 Historique des gagnants
app.get('/history', (req, res) => {
  res.json(history);
});

// 🔹 Tirage d'un gagnant aléatoire
app.get('/draw', (req, res) => {
  if (addresses.length === 0) return res.status(400).send("Aucun participant");
  const winnerIndex = Math.floor(Math.random() * addresses.length);
  const winner = addresses[winnerIndex];
  summary.winner = `Participant ${winnerIndex + 1}`;
  summary.address = winner;
  history.push({
    date: new Date().toISOString(),
    winner: summary.winner,
    address: winner
  });
  addresses.length = 0; // réinitialiser les participants
  res.json({ winner });
});

// === Démarrage du serveur ===
app.listen(PORT, () => {
  console.log(`Kaspa Lottery backend running on port ${PORT}`);
});
