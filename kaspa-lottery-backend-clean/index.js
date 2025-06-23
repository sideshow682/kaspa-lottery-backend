const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const mnemonic = process.env.MNEMONIC_FILE_CONTENT || "no mnemonic set";
const addresses = [];
const history = [];
let summary = { winner: '', address: '', total: 0 };

app.get('/addresses', (req, res) => {
  res.json({ addresses });
});

app.post('/ticket', (req, res) => {
  const { username, address } = req.body;
  if (!username || !address) return res.status(400).send("Champs manquants");
  addresses.push(address);
  summary.total += 1;
  res.json({ message: 'Ticket enregistré avec succès !' });
});

app.get('/summary', (req, res) => {
  res.json(summary);
});

app.get('/history', (req, res) => {
  res.json(history);
});

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
  addresses.length = 0;
  res.json({ winner });
});

app.listen(PORT, () => {
  console.log(`Kaspa Lottery backend running on port ${PORT}`);
});