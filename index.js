const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const addresses = []; // Stores { username, address, txid }
const history = [];
let summary = { winner: '', address: '', total: 0 };
const kaspaReceiver = 'kaspa:qpfsv33s524trw6vgwkxhcxfwwra0c05wdc6vhg0n78645l3ayfj7tf0tq96g';
const requiredKasAmount = 1; // 1 KAS minimum

// === ROUTES ===

app.get('/summary', (req, res) => {
  res.json(summary);
});

app.get('/history', (req, res) => {
  res.json(history);
});

app.post('/ticket', async (req, res) => {
  const { username, address, txid } = req.body;

  if (!username || !address || !txid) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (addresses.some(entry => entry.address === address)) {
    return res.status(400).json({ message: "Address already submitted." });
  }

  try {
    const txResponse = await axios.get(`https://api.kaspa.org/transactions/${txid}`);
    const txData = txResponse.data;

    const paid = txData.outputs.find(output =>
      output.address === kaspaReceiver && parseFloat(output.amount) >= requiredKasAmount
    );

    if (!paid) {
      return res.status(400).json({ message: "No valid payment found in transaction." });
    }

    addresses.push({ username, address, txid });
    summary.total += 1;

    res.json({ message: "Ticket successfully submitted!" });
  } catch (error) {
    return res.status(500).json({ message: "Transaction check failed." });
  }
});

app.get('/draw', (req, res) => {
  if (addresses.length === 0) {
    return res.status(400).json({ message: "No participants" });
  }

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
  res.json({ winner: username });
});

// === START SERVER ===

app.listen(PORT, () => {
  console.log(`Kaspa Lottery backend running on port ${PORT}`);
});
