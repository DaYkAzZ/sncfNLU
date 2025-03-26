const { randomHours, randomSeats, randomTrainNumber } = require("./utils/random_data");

exports.seed = function (knex) {

  return knex('Billets').truncate()
    .then(() => knex('Horaires').truncate())
    // .then(() => knex('Trains').truncate())
    .then(() => knex('Lignes').truncate())
    .then(() => knex('Stations').truncate())
    .then(() => knex('Usagers').truncate())
    .then(() => {

      return knex('Usagers').insert(
        [
          { nom: 'Alice', prenom: 'Gibs', email: 'alicegibs@gmail.com', password: 'alicegibscp' },
          { nom: 'Bob', prenom: 'Dylan', email: 'bobdylan@gmail.com', password: 'bobdylancp' },
          { nom: 'jean', prenom: 'Dylan', email: 'jeandylan@gmail.com', password: 'jeandylancp' },
          { nom: 'kendrick', prenom: 'lamar', email: 'kendricklamar@gmail.com', password: 'kdotlmap' }
        ]
      );
    })
    .then(() => knex('Stations').insert(
      [
        { nom: 'Paris' },
        { nom: 'Lyon' },
        { nom: 'Marseille' },
        { nom: 'Bordeaux' },
        { nom: 'Toulouse' },
        { nom: 'Nice' },
        { nom: 'Nantes' },
        { nom: 'Strasbourg' },
        { nom: 'Lille' },
        { nom: 'Montpellier' }
      ]
    ))
    .then(() => knex('Lignes').insert(
      [
        { nom: 'TGV Nord', company: 'INOUI' },
        { nom: 'TGV SUD', company: 'OUIGO' }
      ]))
    .then(() => knex('Trains').insert(
      [
        { seats: randomSeats(), arrivee: 'Lyon', depart: 'Paris', ligne_id: 2, number: randomTrainNumber() }]))
    .then(() => knex('Horaires').insert(
      [
        { heure_depart: randomHours(), heure_arrivee: randomHours() }]))
    .then(() => knex('Billets').insert(
      [
        { usager_id: 1, train_id: 1, prix: '50€' }]));
};