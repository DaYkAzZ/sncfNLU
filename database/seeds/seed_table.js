exports.seed = function(knex) {
    return knex('Usagers').insert([{ nom: 'Alice' }, { nom: 'Bob' }])
      .then(() => knex('Stations').insert([{ nom: 'Paris' }, { nom: 'Lyon' }]))
      .then(() => knex('Lignes').insert([{ nom: 'TGV Nord' }]))
      .then(() => knex('Trains').insert([{ type: 'TGV' }]))
      .then(() => knex('Horaires').insert([{ train_id: 1, heure_depart: '08:00', heure_arrivee: '10:00' }]))
      .then(() => knex('Billets').insert([{ usager_id: 1, train_id: 1, prix: '50€' }]));
  };