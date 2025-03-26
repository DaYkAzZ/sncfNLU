const readline = require('readline-sync');
const db = require('./db');

async function startNLU() {
  while (true) {
    let input = readline.question('Bonjour je suis SNCF_AI en quoi puis-je vous aider ? > ');
    if (input.toLowerCase() === 'exit') break;
  }
}

startNLU();