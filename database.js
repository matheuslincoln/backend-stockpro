const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',       // altere se necessário
  password: 'DevLincon@123',       // altere se necessário
  database: 'cosmeticos'
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conectado ao MySQL!');
  }
});

module.exports = connection;
