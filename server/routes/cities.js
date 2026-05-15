import { Router } from 'express';

export const cityRoutes = Router();

// Default Chinese cities
const DEFAULT_CITIES = [
  { code: '010', name: '北京', province: '北京' },
  { code: '021', name: '上海', province: '上海' },
  { code: '020', name: '广州', province: '广东' },
  { code: '0755', name: '深圳', province: '广东' },
  { code: '022', name: '天津', province: '天津' },
  { code: '023', name: '重庆', province: '重庆' },
  { code: '024', name: '沈阳', province: '辽宁' },
  { code: '027', name: '武汉', province: '湖北' },
  { code: '028', name: '成都', province: '四川' },
  { code: '029', name: '西安', province: '陕西' },
  { code: '025', name: '南京', province: '江苏' },
  { code: '0571', name: '杭州', province: '浙江' },
  { code: '0574', name: '宁波', province: '浙江' },
  { code: '0532', name: '青岛', province: '山东' },
  { code: '0531', name: '济南', province: '山东' },
  { code: '0411', name: '大连', province: '辽宁' },
  { code: '0451', name: '哈尔滨', province: '黑龙江' },
  { code: '0431', name: '长春', province: '吉林' },
  { code: '0771', name: '南宁', province: '广西' },
  { code: '0591', name: '福州', province: '福建' },
  { code: '0592', name: '厦门', province: '福建' },
  { code: '0371', name: '郑州', province: '河南' },
  { code: '0731', name: '长沙', province: '湖南' },
  { code: '024', name: '沈阳', province: '辽宁' },
  { code: '0871', name: '昆明', province: '云南' },
  { code: '0991', name: '乌鲁木齐', province: '新疆' },
  { code: '0471', name: '呼和浩特', province: '内蒙古' },
  { code: '0451', name: '哈尔滨', province: '黑龙江' },
  { code: '0431', name: '长春', province: '吉林' },
  { code: '0931', name: '兰州', province: '甘肃' },
  { code: '0971', name: '西宁', province: '青海' },
  { code: '0951', name: '银川', province: '宁夏' },
  { code: '0891', name: '拉萨', province: '西藏' },
];

cityRoutes.get('/', (req, res) => {
  res.json(DEFAULT_CITIES);
});

cityRoutes.get('/search', (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  if (!query) {
    return res.json(DEFAULT_CITIES);
  }

  const results = DEFAULT_CITIES.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.province.toLowerCase().includes(query)
  );

  res.json(results.slice(0, 20));
});