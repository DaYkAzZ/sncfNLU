const readline = require('readline-sync');
const db = require('./db');

function extraireMots(requete) {
  return requete.toLowerCase().split(/\s+/);
}

async function rechercherDansBDD(mots) {
  try {
    for (let mot of mots) {
      const resultatsTrains = await db('Trains')
        .where('depart', 'like', `%${mot}%`)
        .orWhere('arrivee', 'like', `%${mot}%`)
        .orWhere('number', 'like', `%${mot}%`)
        .orWhere('seats', 'like', `%${mot}%`);
      
      if (resultatsTrains.length > 0) {
        return resultatsTrains;
      }
    }
    
    return "Aucun résultat trouvé.";
  } catch (erreur) {
    console.error("Erreur de recherche :", erreur);
    return "Une erreur s'est produite lors de la recherche.";
  }
}

async function lancerNLU() {
  console.log("🚉 NLU SNCF - Tapez 'exit' pour quitter");
  
  while (true) {
    const requete = readline.question('Bonjour en quoi puis-je vous aider ?');
    
    if (requete.toLowerCase() === 'exit') break;
    
    const mots = extraireMots(requete);
    const resultats = await rechercherDansBDD(mots);
    
    resultats.map(item => {
      console.log('Voici les informations concernant votre train : \n\n');
      console.log('Votre train prendra place en gare de', item.depart, 'et arrivera à', item.arrivee);
      console.log('Il y a ', item.seats, 'places disponibles');
      console.log('Le numéro de train est', item.number);
      console.log('Bon voyage !!');
    })
  }
}

lancerNLU();