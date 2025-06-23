const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const kaspa = require('@kaspa/wallet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const mnemonicFile = 'mnemonic.txt';
const dataFile = 'lottery.json';

function loadMnemonic() {
    return fs.readFileSync(mnemonicFile, 'utf-8').trim();
}

function loadData() {
    if (!fs.existsSync(dataFile)) {
        return { participants: [], history: [], lastWinner: null };
    }
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
}

function saveData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

app.get('/addresses', (req, res) => {
    const data = loadData();
    const addresses = data.participants.map(p => p.address);
    res.json({ addresses });
});

app.get('/summary', (req, res) => {
    const data = loadData();
    const last = data.lastWinner || { name: 'Aucun', address: '---' };
    res.json({ winner: last.name, address: last.address, total: data.participants.length });
});

app.get('/history', (req, res) => {
    const data = loadData();
    res.json(data.history || []);
});

app.post('/ticket', (req, res) => {
    const data = loadData();
    const { username, address } = req.body;
    if (!username || !address) return res.status(400).send('Champs manquants');
    data.participants.push({ name: username, address });
    saveData(data);
    res.json({ message: 'Participation enregistrée !' });
});

app.get('/draw', async (req, res) => {
    const data = loadData();
    if (data.participants.length === 0) return res.status(400).send('Pas de participants');

    const winner = data.participants[Math.floor(Math.random() * data.participants.length)];
    const mnemonic = loadMnemonic();

    try {
        const wallet = await kaspa.fromMnemonic(mnemonic);
        const tx = await wallet.send(winner.address, 4.5); // 5 - 10% commission
    } catch (e) {
        return res.status(500).send('Erreur de transfert');
    }

    const now = new Date().toISOString().split('T')[0];
    data.history.push({ date: now, winner: winner.name, address: winner.address });
    data.lastWinner = winner;
    data.participants = [];
    saveData(data);
    res.json({ winner: winner.name });
});

app.listen(PORT, () => console.log(`Kaspa Lottery backend running on ${PORT}`));
