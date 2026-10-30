const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mysql = require('mysql2/promise');

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(morgan('tiny'));

// ============ 数据库连接（自动读环境变量） ============
const [MYSQL_HOST, MYSQL_PORT] = (process.env.MYSQL_ADDRESS || '127.0.0.1:3306').split(':');
const MYSQL_USER = process.env.MYSQL_USERNAME || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DB = 'nodejs_demo';

const pool = mysql.createPool({
  host: MYSQL_HOST,
  port: Number(MYSQL_PORT || 3306),
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 5
});

// ============ 启动时自动建表 ============
async function initTable() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS demands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        community VARCHAR(100) NOT NULL,
        area VARCHAR(50) DEFAULT '',
        style VARCHAR(50) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('demands table ready');
  } finally {
    conn.release();
  }
}
initTable();

// ============ 首页 ============
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============ 示例接口：计数+1（先保留） ============
let count = 0;
app.get('/api/count', (req, res) => {
  count++;
  res.json({ code: 0, data: count });
});

// ============ 业主提交装修需求 → 写入 MySQL ============
app.post('/api/demand', async (req, res) => {
  const { name, phone, community, area, style } = req.body || {};

  if (!name || !phone || !community) {
    return res.json({ code: 1, msg: '请填写姓名、电话和小区' });
  }

  try {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        'INSERT INTO demands (name, phone, community, area, style) VALUES (?, ?, ?, ?, ?)',
        [name, phone, community, area || '', style || '']
      );
      res.json({ code: 0, msg: '提交成功', data: { id: result.insertId } });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.json({ code: 1, msg: '服务器错误' });
  }
});

// ============ 查询所有装修需求 → 从 MySQL 读 ============
app.get('/api/demands', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT * FROM demands ORDER BY id DESC');
      res.json({ code: 0, data: rows });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.json({ code: 1, msg: '查询失败' });
  }
});

// ============ 启动服务 ============
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
