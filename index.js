const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const addresses = []; // Now stores { username, address, txid }
const history = [];
let summary = { winner: '', address: '', total: 0 };

app.get('/summary', (req, res) => {
  res.json(summary);
});

app.get('/history', (req, res) => {
  res.json(history);
});

app.post('/ticket', (req, res) => {
  const { username, address, txid } = req.body;
  if (!username || !address || !txid) return res.status(400).json({ message: "Missing fields" });

  if (addresses.some(entry => entry.address === address)) {
    return res.status(400).json({ message: "Address already submitted." });
  }

  addresses.push({ username, address, txid });
  summary.total += 1;
  res.json({ message: "Ticket successfully submitted!" });
});

app.get('/draw', (req, res) => {
  if (addresses.length === 0) return res.status(400).json({ message: "No participants" });

  const winnerIndex = Math.floor(Math.random() * addresses.length);
  const { username, address } = addresses[winnerIndex];

  summary.winner = username;
  summary.address = address;

  history.push({
    date: new Date().toISOString(),
    winner: username,
    address
  });

  addresses.length = 0;
  summary.total = 0;

  res.json({ winner: username });
});

// Auto-draw every day at midnight UTC
cron.schedule('0 0 * * *', () => {
  if (addresses.length === 0) return;
  const winnerIndex = Math.floor(Math.random() * addresses.length);
  const { username, address } = addresses[winnerIndex];

  summary.winner = username;
  summary.address = address;

  history.push({
    date: new Date().toISOString(),
    winner: username,
    address
  });

  addresses.length = 0;
  summary.total = 0;

  console.log(`🎯 Auto draw executed — Winner: ${username}`);
});

app.listen(PORT, () => {
  console.log(`Kaspa Lottery backend running on port ${PORT}`);
});
