const path = require("path");
const knex = require("knex")({
  client: "sqlite3",
  connection: {
    filename: path.resolve(__dirname, "..", "database", "sncf.db"),
  },
  useNullAsDefault: true,
  debug: false,
});

const readline = require("readline");
const fuzzyMatch = require("fuzzysort");
const natural = require("natural");
const nlp = require("compromise");

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmerFr;

class TrainNLU {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt:
        '🚆 Votre requête (tapez "aide" pour de l\'aide, "quitter" pour sortir) : ',
    });

    this.stationsCache = null;
    this.lignesCache = null;
    this.trainsCache = null;

    this.keywords = {
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
        "ticket",
        "place",
        "siege",
        "reservation",
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
        "tardive",
        "prochain",
        "suivant",
        "dernier",
      ],
      informations: [
        "information",
        "renseignement",
        "details",
        "infos",
        "info",
        "gare",
        "quai",
        "voie",
        "affichage",
      ],
      liste: [
        "liste",
        "toutes",
        "tous",
        "totalite",
        "ensemble",
        "disponible",
        "existant",
      ],
      prix: [
        "prix",
        "tarif",
        "cout",
        "combien",
        "euros",
        "cher",
        "montant",
        "abordable",
      ],
      lignes: ["ligne", "reseau", "liaison", "service"],
    };
  }

  async loadStations() {
    if (this.stationsCache) return this.stationsCache;

    try {
      const stations = await knex.select("*").from("Stations");
      this.stationsCache = stations.map((station) => station.nom.toLowerCase());
      return this.stationsCache;
    } catch (error) {
      console.error("Erreur de chargement des stations:", error);
      return [];
    }
  }

  async loadLignes() {
    if (this.lignesCache) return this.lignesCache;

    try {
      const lignes = await knex.select("*").from("Lignes");
      this.lignesCache = lignes;
      return this.lignesCache;
    } catch (error) {
      console.error("Erreur de chargement des lignes:", error);
      return [];
    }
  }

  async loadTrains() {
    if (this.trainsCache) return this.trainsCache;

    try {
      const trains = await knex
        .select("Trains.*", "Lignes.nom as ligne_nom", "Lignes.company")
        .from("Trains")
        .leftJoin("Lignes", "Trains.ligne_id", "Lignes.id");
      this.trainsCache = trains;
      return this.trainsCache;
    } catch (error) {
      console.error("Erreur de chargement des trains:", error);
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
    const tokens = tokenizer.tokenize(normalizedText);
    const stems = tokens.map((token) => stemmer.stem(token));
    const doc = nlp(normalizedText);
    const verbs = doc.verbs().out("array");
    const scores = {};

    for (const intention in this.keywords) {
      scores[intention] = 0;
    }

    for (const intention in this.keywords) {
      for (const pattern of this.keywords[intention]) {
        if (normalizedText.includes(pattern)) {
          scores[intention] += 2;
        }
        for (const token of tokens) {
          if (token === pattern || token.includes(pattern)) {
            scores[intention] += 1;
          }
        }
        for (const stem of stems) {
          if (stem === stemmer.stem(pattern)) {
            scores[intention] += 1;
          }
        }
      }
    }

    if (
      normalizedText.includes("tous les") ||
      normalizedText.includes("toutes les")
    ) {
      scores.liste += 3;
    }

    if (verbs.some((v) => v.includes("coût") || v.includes("coute"))) {
      scores.prix += 3;
    }

    let maxScore = 0;
    let bestIntention = "inconnu";

    for (const intention in scores) {
      if (scores[intention] > maxScore) {
        maxScore = scores[intention];
        bestIntention = intention;
      }
    }

    return bestIntention;
  }

  async processRequest(text) {
    if (text.toLowerCase() === "aide") {
      return this.showHelp();
    }

    const stations = await this.extractStations(text);
    const intention = this.detectIntention(text);

    console.log(`Intention détectée: ${intention}`);
    console.log(`Stations identifiées: ${stations.join(", ")}`);

    switch (intention) {
      case "reservation":
        return await this.handleReservation(stations);
      case "horaires":
        return await this.handleHoraires(stations);
      case "informations":
        return await this.handleInformations(stations);
      case "liste":
        return await this.handleListe(text, stations);
      case "prix":
        return await this.handlePrix(stations);
      case "lignes":
        return await this.handleLignes(stations);
      default:
        if (stations.length > 0) {
          return await this.handleInformations(stations);
        }
        return "Je n'ai pas bien compris votre requête. Essayez d'être plus précis ou tapez 'aide' pour obtenir de l'aide.";
    }
  }

  async handleReservation(stations) {
    if (stations.length < 2) {
      return "Je n'ai pas trouvé les stations de départ et d'arrivée. Pouvez-vous préciser ?";
    }

    try {
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
      return await this.handleSummary();
    }

    try {
      const gare = await knex("Stations")
        .where("nom", "like", `%${stations[0]}%`)
        .first();

      if (!gare) {
        return `Aucune information trouvée pour la gare ${stations[0]}`;
      }

      const trainsDepart = await knex("Trains")
        .select("Trains.*", "Lignes.nom as ligne_nom", "Lignes.company")
        .leftJoin("Lignes", "Trains.ligne_id", "Lignes.id")
        .where("depart", "like", `%${gare.nom}%`);

      const trainsArrivee = await knex("Trains")
        .select("Trains.*", "Lignes.nom as ligne_nom", "Lignes.company")
        .leftJoin("Lignes", "Trains.ligne_id", "Lignes.id")
        .where("arrivee", "like", `%${gare.nom}%`);

      const horaires = await knex("Horaires")
        .select(
          "Horaires.*",
          "Trains.depart",
          "Trains.arrivee",
          "Trains.number"
        )
        .join("Trains", "Horaires.train_id", "Trains.id")
        .where("Trains.depart", "like", `%${gare.nom}%`)
        .orWhere("Trains.arrivee", "like", `%${gare.nom}%`);

      let message = `🚉 Informations sur la gare de ${gare.nom} (ID: ${gare.id})\n\n`;

      if (trainsDepart.length === 0 && trainsArrivee.length === 0) {
        message += `❌ Aucun train disponible actuellement pour cette gare.\n`;
      } else {
        if (trainsDepart.length > 0) {
          message += `🚨 TRAINS AU DÉPART DE ${gare.nom.toUpperCase()} :\n`;
          message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

          trainsDepart.forEach((train) => {
            const trainHoraire = horaires.find((h) => h.train_id === train.id);
            const heureDepart = trainHoraire
              ? trainHoraire.heure_depart
              : "Non programmé";

            message += `✅ Train ${train.number} | → Destination: ${
              train.arrivee
            } | 🕒 Départ: ${heureDepart}h | 💺 ${
              train.company || train.ligne_nom
            } | 💺 Places: ${train.seats}\n`;
          });
          message += `\n`;
        }

        if (trainsArrivee.length > 0) {
          message += `🚨 TRAINS À L'ARRIVÉE À ${gare.nom.toUpperCase()} :\n`;
          message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

          trainsArrivee.forEach((train) => {
            const trainHoraire = horaires.find((h) => h.train_id === train.id);
            const heureArrivee = trainHoraire
              ? trainHoraire.heure_arrivee
              : "Non programmé";

            message += `✅ Train ${train.number} | ← Origine: ${
              train.depart
            } | 🕒 Arrivée: ${heureArrivee}h | 💺 ${
              train.company || train.ligne_nom
            }\n`;
          });
        }
      }

      return message;
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

const trainNLU = new TrainNLU();
trainNLU.start();

module.exports = trainNLU;
