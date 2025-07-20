const express = require('express');
const router = express.Router();
const db = require('../database');

// Rota para cadastrar produto
router.post('/produtos', (req, res) => {
  const { codigo, nome, valor, quantidade } = req.body;
  const sql = 'INSERT INTO produtos (codigo, nome, valor, quantidade) VALUES (?, ?, ?, ?)';
  db.query(sql, [codigo, nome, valor, quantidade], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.sendStatus(201);
  });
});

// Rota para listar produtos
router.get('/produtos', (req, res) => {
  const sql = 'SELECT * FROM produtos';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Rota para excluir produto
router.delete('/produtos/:codigo', (req, res) => {
  const sql = 'DELETE FROM produtos WHERE codigo = ?';
  db.query(sql, [req.params.codigo], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.sendStatus(200);
  });
});

// Rota para editar produto
router.put('/produtos/:codigo', (req, res) => {
  const { nome, valor, quantidade } = req.body;
  const sql = 'UPDATE produtos SET nome = ?, valor = ?, quantidade = ? WHERE codigo = ?';
  db.query(sql, [nome, valor, quantidade, req.params.codigo], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.sendStatus(200);
  });
});

// Rota para vender produto (baixa no estoque e registro da venda)
router.post('/vender/:codigo', (req, res) => {
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
    const vendaSql = 'INSERT INTO vendas (nome, valor, quantidade, data) VALUES (?, ?, ?, NOW())';

    db.query(updateSql, [novaQuantidade, req.params.codigo], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query(vendaSql, [produto.nome, produto.valor, quantidadeVendida], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.sendStatus(200);
      });
    });
  });
});

// Rota para listar vendas
router.get('/vendas', (req, res) => {
  const sql = 'SELECT * FROM vendas ORDER BY data DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

module.exports = router;
