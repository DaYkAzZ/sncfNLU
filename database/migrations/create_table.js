exports.up = function(knex) {
    return knex.schema
      .createTable('Usagers', table => {
        table.increments('id');
        table.string('nom');
      })
      .createTable('Stations', table => {
        table.increments('id');
        table.string('nom');
      })
      .createTable('Lignes', table => {
        table.increments('id');
        table.string('nom');

      })
      .createTable('Trains', table => {
        table.increments('id');
        table.string('type');
        table.string('number');
        table.integer('ligne_id').references('id').inTable('Lignes');
        table.string('depart');
        table.string('arrivee');
        table.integer('seats');
      })
      .createTable('Horaires', table => {
        table.increments('id');
        table.integer('train_id').references('id').inTable('Trains');
        table.string('heure_depart');
        table.string('heure_arrivee');
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
  