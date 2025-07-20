const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Cadastrar produto
app.post('/produtos', (req, res) => {
  const { codigo, nome, valor, quantidade } = req.body;
  const sql = 'INSERT INTO produtos (codigo, nome, valor, quantidade) VALUES (?, ?, ?, ?)';
  db.query(sql, [codigo, nome, valor, quantidade], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Produto cadastrado com sucesso' });
  });
});

// Listar produtos
app.get('/produtos', (req, res) => {
  const sql = 'SELECT * FROM produtos';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Excluir produto
app.delete('/produtos/:codigo', (req, res) => {
  const sql = 'DELETE FROM produtos WHERE codigo = ?';
  db.query(sql, [req.params.codigo], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Produto excluído com sucesso' });
  });
});

// Editar produto
app.put('/produtos/:codigo', (req, res) => {
  const { nome, valor, quantidade } = req.body;
  const sql = 'UPDATE produtos SET nome = ?, valor = ?, quantidade = ? WHERE codigo = ?';
  db.query(sql, [nome, valor, quantidade, req.params.codigo], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Produto editado com sucesso' });
  });
});

// Vender produto
app.post('/vender/:codigo', (req, res) => {
  const { quantidadeVendida } = req.body;
  const getProductSql = 'SELECT * FROM produtos WHERE codigo = ?';

  db.query(getProductSql, [req.params.codigo], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });

    const produto = results[0];

    if (produto.quantidade < quantidadeVendida) {
      return res.status(400).json({ error: 'Estoque insuficiente' });
    }

    const novaQuantidade = produto.quantidade - quantidadeVendida;
    const updateSql = 'UPDATE produtos SET quantidade = ? WHERE codigo = ?';
    const vendaSql = 'INSERT INTO vendas (codigo, nome, valor, quantidade, data) VALUES (?, ?, ?, ?, NOW())';

db.query(updateSql, [novaQuantidade, req.params.codigo], (err) => {
  if (err) return res.status(500).json({ error: err.message });

  db.query(vendaSql, [produto.codigo, produto.nome, produto.valor, quantidadeVendida], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Produto vendido com sucesso' });
  });
});

  });
});

// Listar vendas
app.get('/vendas', (req, res) => {
  const sql = 'SELECT * FROM vendas ORDER BY data DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Excluir todas as vendas
app.delete('/vendas', (req, res) => {
  const sql = 'DELETE FROM vendas';
  db.query(sql, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Todas as vendas foram excluídas' });
  });
});

// Exportar vendas para Excel
const excelJS = require('exceljs');
const fs = require('fs');

app.get('/vendas/exportar', async (req, res) => {
  const sql = 'SELECT * FROM vendas ORDER BY data DESC';
  db.query(sql, async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vendas');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nome', key: 'nome', width: 25 },
      { header: 'Valor', key: 'valor', width: 15 },
      { header: 'Quantidade', key: 'quantidade', width: 15 },
      { header: 'Data', key: 'data', width: 25 }
    ];

    worksheet.addRows(results);

    const filePath = './vendas.xlsx';
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, 'vendas.xlsx', (err) => {
      if (err) console.error('Erro ao baixar o arquivo:', err);
      fs.unlinkSync(filePath); // Apaga o arquivo após o download
    });
  });
});

