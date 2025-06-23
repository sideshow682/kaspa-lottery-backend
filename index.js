const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { Wallet, PrivateKey } = require('@kaspa/wallet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const addresses = []; // stores { username, address, txid }
const history = [];
let summary = { winner: '', address: '', total: 0 };

const COMMISSION_ADDRESS = 'kaspa:qrfh5j6gyqk4s2fzyy74q09e4fntgnzpcz99zxuqchaartx7jd5h6h2jjjujp';
const TICKET_PRICE = 10_000_000_000n; // 10 Kaspa in sompis (1 KAS = 10^8 sompi)
const COMMISSION_PERCENTAGE = 10; // 10%

// === Wallet Setup ===
const MNEMONIC = 'firm health purity fragile horse bounce laugh love symptom remind buzz laugh';
let wallet;
(async () => {
  wallet = await Wallet.fromMnemonic({
    mnemonic: MNEMONIC,
    network: 'kaspa',
  });
  await wallet.sync();
})();

app.get('/summary', (req, res) => {
  res.json(summary);
});

app.get('/history', (req, res) => {
  res.json(history);
});

app.get('/addresses', (req, res) => {
  res.json({ addresses });
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

async function drawWinner() {
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

  // Amounts
  const totalKaspa = BigInt(summary.total) * TICKET_PRICE;
  const commission = (totalKaspa * BigInt(COMMISSION_PERCENTAGE)) / 100n;
  const prize = totalKaspa - commission;

  // Send transactions
  try {
    await wallet.send({
      to: address,
      amount: prize,
    });

    await wallet.send({
      to: COMMISSION_ADDRESS,
      amount: commission,
    });

    console.log(`🎯 Sent ${prize} to winner ${address} and ${commission} to commission.`);
  } catch (e) {
    console.error("Error sending KASPA:", e);
  }

  addresses.length = 0;
  summary.total = 0;
}

app.get('/draw', async (req, res) => {
  await drawWinner();
  res.json({ winner: summary.winner });
});

// Auto-draw every 24h (midnight UTC)
cron.schedule('0 0 * * *', async () => {
  console.log("⏰ Auto draw triggered");
  await drawWinner();
});

app.listen(PORT, () => {
  console.log(`Kaspa Lottery backend running on port ${PORT}`);
});
