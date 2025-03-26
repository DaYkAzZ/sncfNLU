exports.up = function(knex) {
    return knex.schema
      .createTable('Usagers', table => {
        table.increments('id');
        table.string('nom');
        table.string('prenom');
        table.string('email');
        table.string('password');
      })
      .createTable('Stations', table => {
        table.increments('id');
        table.string('nom');
      })
      .createTable('Lignes', table => {
        table.increments('id');
        table.string('nom');
        table.string('company'); // INOUI OUIGO ETC.
        table.string('stations').references('nom').inTable('Stations');
      })
      .createTable('Trains', table => {
        table.increments('id');
        table.string('number');
        table.integer('ligne_id').references('id').inTable('Lignes');
        table.string('depart');
        table.string('arrivee');
        table.integer('seats');
      })
      .createTable('Horaires', table => {
        table.increments('id');
        table.integer('train_id').references('id').inTable('Trains');
        table.integer('heure_depart');
        table.integer('heure_arrivee');
      })
      .createTable('Billets', table => {
        table.increments('id');
        table.integer('usager_id').references('id').inTable('Usagers');
        table.integer('train_id').references('id').inTable('Trains');
        table.integer('seat')
        table.string('prix');
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTableIfExists('Billets')
      .dropTableIfExists('Horaires')
      .dropTableIfExists('Trains')
      .dropTableIfExists('Lignes')
      .dropTableIfExists('Stations')
      .dropTableIfExists('Usagers');
  };