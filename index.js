// === Kaspa Lottery Web Interface (manual wallet entry, English version + validation + mobile responsive) ===
import { useEffect, useState } from 'react';

export default function KaspaLotteryFront() {
  const [username, setUsername] = useState('');
  const [kaspaAddress, setKaspaAddress] = useState('');
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState({ winner: '', address: '', total: 0 });
  const [history, setHistory] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [adminKey, setAdminKey] = useState('');

  const LOCAL_ADMIN_KEY = 'kaspa123admin';

  useEffect(() => {
    fetchSummary();
    fetchHistory();
    const savedKey = localStorage.getItem('kaspa-admin-key');
    if (savedKey === LOCAL_ADMIN_KEY) setAdminMode(true);
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await fetch('https://kaspa-lottery-backend.onrender.com/summary');
      const data = await res.json();
      setSummary(data);
    } catch {
      setMessage("Connection error with backend.");
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('https://kaspa-lottery-backend.onrender.com/history');
      const data = await res.json();
      setHistory(data);
    } catch {}
  };

  const isValidKaspaAddress = (address) => {
    return /^kaspa:q[a-z0-9]{60,70}$/.test(address);
  };

  const submitTicket = async () => {
    if (!username || !kaspaAddress) return setMessage('Name and address required.');
    if (!isValidKaspaAddress(kaspaAddress)) return setMessage('Invalid Kaspa address format.');
    try {
      const res = await fetch('https://kaspa-lottery-backend.onrender.com/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, address: kaspaAddress })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchSummary();
      } else {
        setMessage(data);
      }
    } catch {
      setMessage("Network error. Ticket not submitted.");
    }
  };

  const forceDraw = async () => {
    try {
      const res = await fetch('https://kaspa-lottery-backend.onrender.com/draw');
      const data = await res.json();
      setMessage(`Winner: ${data.winner}`);
      fetchSummary();
      fetchHistory();
    } catch {
      setMessage("Error during draw.");
    }
  };

  const tryLoginAdmin = () => {
    if (adminKey === LOCAL_ADMIN_KEY) {
      setAdminMode(true);
      localStorage.setItem('kaspa-admin-key', adminKey);
    } else {
      setMessage("Incorrect admin key.");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'Arial', fontSize: 16 }}>
      <h1 style={{ textAlign: 'center' }}>🎲 Kaspa Lottery</h1>

      <p><b>Last winner:</b> {summary.winner} ({summary.address})</p>
      <p><b>Total participants:</b> {summary.total}</p>

      <input
        type="text"
        placeholder="Your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ width: '100%', padding: 12, marginBottom: 10, borderRadius: 6, border: '1px solid #ccc' }}
      />
      <input
        type="text"
        placeholder="Your Kaspa address"
        value={kaspaAddress}
        onChange={(e) => setKaspaAddress(e.target.value)}
        style={{ width: '100%', padding: 12, marginBottom: 10, borderRadius: 6, border: '1px solid #ccc' }}
      />
      <button onClick={submitTicket} style={{ width: '100%', padding: 12, backgroundColor: '#0057ff', color: 'white', borderRadius: 6, border: 'none' }}>
        Enter Lottery
      </button>

      {message && <p style={{ color: 'green', marginTop: 10 }}>{message}</p>}

      {!adminMode && (
        <div style={{ marginTop: 30 }}>
          <input
            type="password"
            placeholder="Admin key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            style={{ padding: 10, width: '70%', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button onClick={tryLoginAdmin} style={{ padding: 10, marginLeft: 10, backgroundColor: '#333', color: 'white', borderRadius: 6 }}>
            Admin Access
          </button>
        </div>
      )}

      {adminMode && (
        <div style={{ marginTop: 30 }}>
          <h3>🛡️ Admin Panel</h3>
          <button onClick={forceDraw} style={{ padding: 12, background: 'black', color: 'white', borderRadius: 6 }}>
            🎯 Draw Winner
          </button>
          <ul style={{ marginTop: 20 }}>
            {history.map((entry, i) => (
              <li key={i}>{entry.date.split('T')[0]} – {entry.winner} ({entry.address})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
