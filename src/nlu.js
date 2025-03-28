const path = require("path");
const knex = require("knex")({
  client: "sqlite3",
  connection: {
    filename: path.resolve(__dirname, "..", "database", "sncf.db"),
  },
  useNullAsDefault: true,
});

const readline = require("readline");
const fuzzyMatch = require("fuzzysort");

class TrainNLU {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt:
        '🚆 Votre requête (tapez "aide" pour de l\'aide, "quitter" pour sortir) : ',
    });

    this.stationsCache = null;
  }

  async loadStations() {
    if (this.stationsCache) return this.stationsCache;

    try {
      // Utilisez des requêtes plus flexibles
      const stations = await knex.select("*").from("stations");
      this.stationsCache = stations.map((station) => station.nom.toLowerCase());
      return this.stationsCache;
    } catch (error) {
      console.error("Erreur de chargement des stations:", error);
      return [];
    }
  }

  normalize(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, "");
  }

  async extractStations(text) {
    const stations = await this.loadStations();
    const normalizedText = this.normalize(text);

    const exactMatches = stations.filter((station) =>
      normalizedText.includes(this.normalize(station))
    );

    if (exactMatches.length === 0) {
      const matches = fuzzyMatch.go(normalizedText, stations, {
        limit: 2,
        threshold: -500,
      });
      return matches.map((match) => match.target);
    }

    return exactMatches;
  }

  detectIntention(text) {
    const normalizedText = this.normalize(text);

    const intentions = {
      reservation: [
        "reserver",
        "acheter",
        "prendre",
        "obtenir",
        "commander",
        "vouloir",
        "cherche",
        "aimerais",
        "souhaite",
        "billet",
      ],
      horaires: [
        "horaire",
        "heure",
        "quand",
        "depart",
        "arrivee",
        "planning",
        "temps",
        "programme",
        "train",
      ],
      informations: ["information", "renseignement", "details", "infos"],
    };

    for (const [intention, patterns] of Object.entries(intentions)) {
      for (const pattern of patterns) {
        if (normalizedText.includes(pattern)) {
          return intention;
        }
      }
    }

    return "inconnu";
  }

  async processRequest(text) {
    if (text.toLowerCase() === "aide") {
      return this.showHelp();
    }

    const stations = await this.extractStations(text);
    const intention = this.detectIntention(text);

    switch (intention) {
      case "reservation":
        return await this.handleReservation(stations);
      case "horaires":
        return await this.handleHoraires(stations);
      case "informations":
        return await this.handleInformations(stations);
      default:
        return "Je n'ai pas compris votre requête. Tapez 'aide' pour obtenir de l'aide.";
    }
  }

  async handleReservation(stations) {
    if (stations.length < 2) {
      return "Je n'ai pas trouvé les stations de départ et d'arrivée. Pouvez-vous préciser ?";
    }

    try {
      // Requête plus flexible
      const trains = await knex("trains")
        .where("depart", "like", `%${stations[0]}%`)
        .where("arrivee", "like", `%${stations[1]}%`)
        .select("*");

      if (trains.length === 0) {
        return `Aucun train trouvé entre ${stations[0]} et ${stations[1]}`;
      }

      let message = `=================TABLEAU D'AFFICHAGE=================\n🏠 Bienvenue en gare de ${stations[0]}\n\n🚉 Voici les trains disponibles de ${stations[0]} à ${stations[1]} :\n`;
      trains.forEach((train) => {
        message += `| 🚆 Train ${train.number} | 💺 Places ${train.seats} |\n--------------------------------\n`;
      });

      return message;
    } catch (error) {
      console.error("Erreur lors de la recherche de trains :", error);
      return "Une erreur est survenue lors de la recherche des trains.";
    }
  }

  async handleHoraires(stations) {
    if (stations.length < 2) {
      return "Merci de préciser les stations pour lesquelles vous voulez les horaires.";
    }

    try {
      // Jointure flexible
      const horaires = await knex("horaires")
        .join("trains", "horaires.train_id", "=", "trains.id")
        .where("trains.depart", "like", `%${stations[0]}%`)
        .where("trains.arrivee", "like", `%${stations[1]}%`)
        .select("*");

      if (horaires.length === 0) {
        return `Aucun horaire trouvé entre ${stations[0]} et ${stations[1]}`;
      }

      let message = `Horaires de ${stations[0]} à ${stations[1]} :\n`;
      horaires.forEach((horaire) => {
        message += `- Train ${horaire.train_id} : Départ ${horaire.heure_depart}, Arrivée ${horaire.heure_arrivee}\n`;
      });

      return message;
    } catch (error) {
      console.error("Erreur lors de la recherche des horaires :", error);
      return "Une erreur est survenue lors de la recherche des horaires.";
    }
  }

  async handleInformations(stations) {
    if (stations.length === 0) {
      return "Merci de préciser la gare pour laquelle vous voulez des informations.";
    }

    try {
      const gare = await knex("stations")
        .where("nom", "like", `%${stations[0]}%`)
        .first();

      const trains = await knex("trains").select("*").where('depart', 'like', `%${stations[0]}%`);

      if (!gare) {
        return `Aucune information trouvée pour la gare ${stations[0]}`;
      }
      if (!trains) {
        return `Aucun trains disponibles`;
      } 
        console.log(`Informations sur la gare ${gare.nom} : - ID de la gare : ${gare.id}`);
        console.log(`Voici la listes de trains disponibles actuellement en gare de ${gare.nom} :\n✅ Trains numéro : ${trains.number} | Destination : ${trains.arrivee} | Nombres de places restantes : ${trains.seats}`);

    } catch (error) {
      console.error("Erreur lors de la recherche d'informations :", error);
      return "Une erreur est survenue lors de la recherche des informations.";
    }
  }

  showHelp() {
    return `
            🚉 Aide pour l'assistant de réservation SNCF 🚉
              
            Vous pouvez utiliser des requêtes en langage naturel comme :
            - "Je veux réserver un billet de Paris à Lyon"
            - "Quels sont les horaires entre Marseille et Lille ?"
            - "Donne-moi des informations sur la gare de Paris"
              
            Exemples de commandes :
            - 'aide' : Affiche cette aide
            - 'quitter' : Quitte l'application
        `;
  }

  start() {
    console.log("🚆 Bienvenue dans l'assistant de réservation SNCF !");
    console.log("Tapez 'aide' pour voir les instructions.");

    this.rl.prompt();

    this.rl
      .on("line", async (line) => {
        if (line.toLowerCase() === "quitter") {
          console.log("Au revoir !");
          this.rl.close();
          return;
        }

        try {
          const response = await this.processRequest(line);
          console.log("\n" + response + "\n");
        } catch (error) {
          console.error("Erreur :", error);
        }

        this.rl.prompt();
      })
      .on("close", () => {
        process.exit(0);
      });
  }
}

// Démarrage de l'assistant
const trainNLU = new TrainNLU();
trainNLU.start();

module.exports = trainNLU;
