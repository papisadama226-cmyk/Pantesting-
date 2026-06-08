// Fonction pour tester un port via HTTP/HTTPS avec un timeout strict
const fetchTimeout = (url, timeout = 1500) => {
    return Promise.race([
        fetch(url, { method: 'HEAD', mode: 'no-cors' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
    ]);
};

module.exports = async (req, res) => {
    // Configuration des headers CORS pour ton iPhone
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    let { target } = req.body;
    if (!target) {
        return res.status(400).json({ error: "Ajoute une cible bro !" });
    }

    // Nettoyage de la cible (retirer http/https si l'utilisateur l'a mis)
    target = target.replace(/^(https?:\/\/)?(www\.)?/, '');

    // Liste des ports Web classiques testables en Serverless
    const commonWebPorts = [
        { port: 80, protocol: 'http://' },
        { port: 443, protocol: 'https://' },
        { port: 8080, protocol: 'http://' },
        { port: 8443, protocol: 'https://' }
    ];

    const results = [];

    try {
        for (const item of commonWebPorts) {
            const url = `${item.protocol}${target}:${item.port}`;
            try {
                // On tente de joindre le port
                await fetchTimeout(url, 1500);
                results.push(`Port ${item.port}: OUVERT 🟢`);
            } catch (err) {
                if (err.message === 'Timeout') {
                    results.push(`Port ${item.port}: FILTRÉ / FERMÉ (Timeout) 🔴`);
                } else {
                    // Si le serveur refuse la connexion ou renvoie une erreur CORS, 
                    // cela signifie quand même que le port a répondu et est donc OUVERT !
                    results.push(`Port ${item.port}: OUVERT 🟢 (Réponse reçue)`);
                }
            }
        }

        res.status(200).json({ target, result: results.join('\n') });
    } catch (error) {
        res.status(500).json({ error: "Erreur pendant l'exécution du scan." });
    }
};
