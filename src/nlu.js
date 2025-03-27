const knex = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const readline = require('readline-sync');

const SECRET_KEY = "secret123"; // 🔥 À sécuriser avec dotenv

let currentUser = null;

// 🔹 Fonction d'inscription
async function register() {
    const nom = readline.question("Nom : ");
    const prenom = readline.question("Prénom : ");
    const email = readline.question("Email : ");
    const password = readline.question("Mot de passe : ", { hideEchoBack: true });

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await knex('Usagers').insert({ nom, prenom, email, password: hashedPassword });
        console.log('✅ Inscription réussie !');
    } catch (error) {
        console.error('❌ Erreur lors de l\'inscription. Cet email est peut-être déjà utilisé.');
    }
}

// 🔹 Fonction de connexion
async function login() {
    const email = readline.question("Email : ");
    const password = readline.question("Mot de passe : ", { hideEchoBack: true });

    const user = await knex('Usagers').where({ email }).first();

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return console.log("❌ Identifiants incorrects.");
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
    currentUser = { id: user.id, email, token };
    console.log(`✅ Connecté en tant que ${email}`);
}

// 🔹 Afficher les trains disponibles
async function listTrains() {
    const trains = await knex('Trains')
        .join('Lignes', 'Trains.ligne_id', '=', 'Lignes.id')
        .select('Trains.id', 'Trains.number', 'Trains.depart', 'Trains.arrivee', 'Trains.seats', 'Lignes.nom as ligne');

    if (trains.length === 0) {
        return console.log("🚆 Aucun train disponible.");
    }

    console.log("\n📋 Liste des trains :");
    trains.forEach(train => {
        console.log(`🛤️ Train ${train.id} (${train.number}) - ${train.ligne} : ${train.depart} → ${train.arrivee} (${train.seats} places)`);
    });
}

// 🔹 Réserver un billet
async function reserveTicket() {
    if (!currentUser) return console.log("⚠️ Vous devez être connecté.");

    await listTrains();
    const trainId = readline.questionInt("ID du train à réserver : ");
    const seat = readline.questionInt("Numéro de siège : ");
    const prix = readline.question("Prix du billet : ");

    try {
        await knex('Billets').insert({
            usager_id: currentUser.id,
            train_id: trainId,
            seat,
            prix
        });
        console.log("🎟️ Billet réservé !");
    } catch (error) {
        console.error("❌ Erreur lors de la réservation.");
    }
}

// 🔹 Voir les réservations de l'utilisateur
async function listReservations() {
    if (!currentUser) return console.log("⚠️ Vous devez être connecté.");

    const reservations = await knex('Billets')
        .join('Trains', 'Billets.train_id', '=', 'Trains.id')
        .select('Trains.number', 'Trains.depart', 'Trains.arrivee', 'Billets.seat', 'Billets.prix')
        .where('Billets.usager_id', currentUser.id);

    if (reservations.length === 0) return console.log("📭 Aucune réservation.");

    console.log("\n🎟️ Vos réservations :");
    reservations.forEach(r => {
        console.log(`🚆 Train ${r.number} : ${r.depart} → ${r.arrivee} | Siège : ${r.seat} | Prix : ${r.prix}€`);
    });
}

async function myProfile() {
  if (!currentUser) return console.log("⚠️ Vous devez être connecté pour consulter votre profil. Tapez 2️⃣ pour vous connecter ou 1️⃣ pour vous inscrire.");
  const user = await knex('Usagers').where({ id: currentUser.id }).first();
  console.log(`=========================\n🚹 Bienvenue sur votre profil ${user.prenom} \nNom : ${user.nom}\nPrenom : ${user.prenom}\nEmail : ${user.email}\n=========================`);
  
}

// 🔹 Menu CLI
async function mainMenu() {
    while (true) {
        console.log("\n=== MENU ===");
        console.log("1️⃣ Inscription");
        console.log("2️⃣ Connexion");
        console.log("3️⃣ Afficher les trains");
        console.log("4️⃣ Réserver un billet");
        console.log("5️⃣ Mes réservations");
        console.log("6️⃣ Afficher mon profil");
        console.log("7️⃣ Quitter");

        const choix = readline.questionInt("Votre choix : ");

        switch (choix) {
            case 1:
                await register();
                break;
            case 2:
                await login();
                break;
            case 3:
                await listTrains();
                break;
            case 4:
                await reserveTicket();
                break;
            case 5:
                await listReservations();
                break;
            case 6:
                await myProfile();
                break;
            case 7:
                console.log("👋 Au revoir !");
                process.exit(0);
            default:
                console.log("⚠️ Choix invalide !");
        }
    }
}

mainMenu();
