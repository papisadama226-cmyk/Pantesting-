const net = require('net');

// Fonction pour scanner un port précis
const checkPort = (host, port, timeout = 1000) => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);
        
        socket.on('connect', () => { socket.destroy(); resolve({ port, status: 'OUVERT' }); });
        socket.on('timeout', () => { socket.destroy(); resolve({ port, status: 'FERMÉ' }); });
        socket.on('error', () => { socket.destroy(); resolve({ port, status: 'FERMÉ' }); });
        
        socket.connect(port, host);
    });
};

// C'est cette fonction que Vercel va exécuter à chaque fois qu'on clique sur le bouton
module.exports = async (req, res) => {
    // Autoriser les requêtes depuis ton iPhone (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    const { target } = req.body;
    if (!target) {
        return res.status(400).json({ error: "Ajoute une cible bro !" });
    }

    const portsToScan = [22, 80, 443, 3306, 8080]; // Liste réduite pour que Vercel réponde vite
    const results = [];

    try {
        for (const port of portsToScan) {
            const result = await checkPort(target, port);
            if (result.status === 'OUVERT') {
                results.push(`Port ${port}: OUVERT 🟢`);
            }
        }

        if (results.length === 0) {
            results.push("Aucun port standard ouvert détecté.");
        }

        res.status(200).json({ target, result: results.join('\n') });
    } catch (error) {
        res.status(500).json({ error: "Erreur pendant le scan." });
    }
};
