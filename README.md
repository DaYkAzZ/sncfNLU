# SNCF NLU - Assistant de réservation SNCF

Un assistant en ligne de commande utilisant le traitement du langage naturel (NLU) pour simuler un système de réservation et d'information SNCF.

## 🚆 Présentation

Ce projet implémente un système de compréhension du langage naturel qui permet aux utilisateurs d'interagir avec un assistant SNCF virtuel en utilisant des phrases en français. L'assistant peut comprendre les intentions des utilisateurs concernant les réservations, les horaires, les prix, et d'autres informations liées aux trains et aux gares SNCF.

## ✨ Fonctionnalités

- **Compréhension du langage naturel** : Comprend les requêtes en français concernant les trains
- **Détection d'intention** : Identifie automatiquement ce que l'utilisateur souhaite faire
- **Extraction des entités** : Reconnaît les noms de gares même avec des fautes mineures
- **Recherche de trains** : Trouve les trains entre deux gares spécifiées
- **Consultation d'horaires** : Affiche les horaires de départ et d'arrivée
- **Informations sur les gares** : Fournit des détails sur les gares et leurs trains

## 🛠️ Technologies utilisées

- **Node.js** : Environnement d'exécution JavaScript
- **SQLite** : Base de données légère pour stocker les informations des trains et des gares
- **Knex.js** : Constructeur de requêtes SQL pour Node.js
- **natural** : Bibliothèque pour le traitement du langage naturel
- **compromise** : Bibliothèque pour l'analyse grammaticale
- **fuzzysort** : Bibliothèque pour la recherche approximative

## 📋 Prérequis

- Node.js (v12 ou supérieur)
- npm ou yarn

## ⚙️ Installation

1. Clonez ce dépôt

```bash
git clone <url-du-depot>
cd sncf_nlu
```

2. Installez les dépendances

```bash
npm install
```

3. Lancez l'application

```bash
npm start
```

## 🚀 Utilisation

Une fois l'application démarrée, vous pouvez interagir avec l'assistant en tapant vos requêtes en langage naturel dans le terminal :

```
🚆 Votre requête (tapez "aide" pour de l'aide, "quitter" pour sortir) :
```

### Exemples de requêtes

- "Je veux réserver un billet de Paris à Lyon"
- "Quels sont les horaires des trains entre Marseille et Lille ?"
- "Donne-moi des informations sur la gare de Paris"
- "Quel est le prix d'un billet pour Nice ?"
- "Liste toutes les lignes disponibles"

### Commandes spéciales

- `aide` : Affiche l'aide et les exemples d'utilisation
- `quitter` : Quitte l'application

## 🗄️ Structure de la base de données

L'application utilise une base de données SQLite avec les tables suivantes :

- **Stations** : Informations sur les gares
- **Trains** : Détails des trains (numéro, départ, arrivée, places)
- **Lignes** : Informations sur les lignes ferroviaires
- **Horaires** : Heures de départ et d'arrivée des trains

## 🧠 Fonctionnement du NLU

Le système de compréhension du langage naturel fonctionne en plusieurs étapes :

1. **Normalisation** : Suppression des accents et caractères spéciaux
2. **Tokenization** : Division du texte en mots individuels
3. **Stemming** : Réduction des mots à leur racine
4. **Détection d'intention** : Analyse des mots-clés pour déterminer l'objectif de l'utilisateur
5. **Extraction d'entités** : Identification des gares mentionnées
6. **Traitement de la requête** : Exécution de l'action appropriée en fonction de l'intention

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).
