const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const logger = morgan('tiny');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 内存数据
let count = 0;
const demands = [];

// 示例接口：计数+1
app.get('/api/count', (req, res) => {
  count++;
  res.json({ code: 0, data: count });
});

// 业主提交装修需求
app.post('/api/demand', (req, res) => {
  const { name, phone, community, area, style } = req.body || {};
  if (!name || !phone || !community) {
    return res.json({ code: 1, msg: '请填写姓名、电话和小区' });
  }
  const demand = {
    id: demands.length + 1,
    name, phone, community,
    area: area || '',
    style: style || '',
    createdAt: new Date().toISOString()
  };
  demands.push(demand);
  res.json({ code: 0, msg: '提交成功', data: demand });
});

// 查询所有装修需求
app.get('/api/demands', (req, res) => {
  res.json({ code: 0, data: demands });
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
