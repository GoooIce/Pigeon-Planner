/**
 * Pigeon Planner - 模拟数据
 * 基于原始Pigeon Planner的数据库结构生成测试数据
 */

// 全局数据对象
const MockData = {
  pigeons: [],
  results: [],
  breeding: [],
  medication: [],
  media: [],
  addresses: [],
  racepoints: []
};

// 颜色列表
const colours = [
  '灰色', '深灰', '浅灰', '红轮', '银色', '白色', '黑色', '绛色',
  '花色', '斑点', '瓦灰', '石板', '麒麟花', '银白', '雨点', '深雨点'
];

// 品系列表
const strains = [
  '詹森', '霍夫肯', '杨阿腾', '威廉', '凡布利安娜', '戈登', '贝林考克斯',
  '西弗', '奥斯曼', '李种', '国血', '外籍', '地方品种', '杂交', '未知'
];

// 鸽舍列表
const lofts = [
  '主鸽舍', '种鸽舍', '赛鸽舍', '幼鸽舍', '备用鸽舍', '隔离鸽舍', '医院鸽舍'
];

// 比赛地点
const racepoints = [
  '北京', '天津', '上海', '广州', '深圳', '成都', '重庆', '西安', '武汉', '南京',
  '杭州', '济南', '青岛', '大连', '沈阳', '长春', '哈尔滨', '石家庄', '太原', '郑州'
];

// 比赛类型
const raceTypes = [
  '500公里', '700公里', '1000公里', '1500公里', '300公里', '200公里', '鸽王赛', '团体赛'
];

// 天气状况
const weatherConditions = [
  '晴朗', '多云', '阴天', '小雨', '中雨', '大风', '雾霾', '高温', '低温'
];

// 风向
const windDirections = [
  '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风', '北风', '无风'
];

// 生成随机环号
function generateBandNumber() {
  const countries = ['NL', 'BE', 'DE', 'GB', 'FR', 'CN'];
  const country = countries[Math.floor(Math.random() * countries.length)];
  const year = 2018 + Math.floor(Math.random() * 6);
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `${country}-${year}-${number}`;
}

// 生成随机日期
function generateRandomDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

// 生成鸽子数据
function generatePigeons(count) {
  const pigeons = [];
  const sexes = ['male', 'female', 'young'];
  const statuses = ['active', 'sold', 'lost', 'dead', 'breeder'];

  for (let i = 0; i < count; i++) {
    const sex = sexes[Math.floor(Math.random() * sexes.length)];
    const status = Math.random() > 0.8 ? statuses[Math.floor(Math.random() * (statuses.length - 1)) + 1] : 'active';

    const pigeon = {
      id: generateBandNumber(),
      name: sex === 'young' ? `幼鸽${i + 1}` : (Math.random() > 0.3 ? `${['闪电', '飞鹰', '疾风', '风暴', '彩虹', '星星', '月亮', '太阳', '云雀', '雄鹰'][Math.floor(Math.random() * 10)]}${['号', '王', '后', '龙', '凤', '虎', '豹', '狮', '鹰', '鸽'][Math.floor(Math.random() * 10)]}` : ''),
      sex: sex,
      year: sex === 'young' ? 2023 + Math.floor(Math.random() * 2) : 2018 + Math.floor(Math.random() * 6),
      colour: colours[Math.floor(Math.random() * colours.length)],
      strain: strains[Math.floor(Math.random() * strains.length)],
      loft: lofts[Math.floor(Math.random() * lofts.length)],
      status: status,
      image: `assets/images/pigeon${(i % 10) + 1}.jpg`,
      extra1: '',
      extra2: '',
      extra3: '',
      extra4: '',
      extra5: '',
      extra6: ''
    };

    // 设置父母关系 (对于非幼鸽)
    if (sex !== 'young' && Math.random() > 0.3) {
      pigeon.sire = generateBandNumber();
      pigeon.yearsire = pigeon.year - (1 + Math.floor(Math.random() * 4));
      pigeon.dam = generateBandNumber();
      pigeon.yeardam = pigeon.year - (1 + Math.floor(Math.random() * 4));
    }

    pigeons.push(pigeon);
  }

  return pigeons;
}

// 生成比赛结果数据
function generateResults(pigeons) {
  const results = [];

  pigeons.filter(p => p.sex !== 'young' && p.status === 'active').forEach(pigeon => {
    const resultCount = Math.floor(Math.random() * 8) + 2; // 每只鸽子2-9个成绩

    for (let i = 0; i < resultCount; i++) {
      const out = Math.floor(Math.random() * 2000) + 500; // 参赛鸽数量
      const place = Math.floor(Math.random() * out) + 1; // 名次
      const distance = 300 + Math.floor(Math.random() * 1200); // 距离
      const time = 2 + Math.random() * 8; // 飞行时间(小时)
      const speed = (distance / time).toFixed(1); // 速度

      results.push({
        id: results.length + 1,
        pigeonId: pigeon.id,
        date: generateRandomDate(2022, 2024),
        point: racepoints[Math.floor(Math.random() * racepoints.length)],
        distance: distance,
        place: place,
        out: out,
        speed: parseFloat(speed),
        sector: raceTypes[Math.floor(Math.random() * raceTypes.length)],
        type: raceTypes[Math.floor(Math.random() * raceTypes.length)],
        category: ['成年鸽', '幼鸽', '一岁鸽', '老鸽'][Math.floor(Math.random() * 4)],
        wind: windDirections[Math.floor(Math.random() * windDirections.length)],
        windspeed: `${Math.floor(Math.random() * 30)}km/h`,
        weather: weatherConditions[Math.floor(Math.random() * weatherConditions.length)],
        temperature: `${Math.floor(Math.random() * 20) + 10}°C`,
        ownplace: place,
        ownout: out,
        comment: Math.random() > 0.7 ? ['天气良好', '逆风飞行', '状态不错', '表现优异', '略有失误'][Math.floor(Math.random() * 5)] : ''
      });
    }
  });

  // 按日期排序
  results.sort((a, b) => new Date(b.date) - new Date(a.date));

  return results;
}

// 生成育种记录数据
function generateBreeding(pigeons) {
  const breeding = [];
  const activeMales = pigeons.filter(p => p.sex === 'male' && p.status === 'active');
  const activeFemales = pigeons.filter(p => p.sex === 'female' && p.status === 'active');

  for (let i = 0; i < Math.min(30, activeMales.length * 2); i++) {
    if (activeMales.length === 0 || activeFemales.length === 0) break;

    const sire = activeMales[Math.floor(Math.random() * activeMales.length)];
    const dam = activeFemales[Math.floor(Math.random() * activeFemales.length)];

    const date = generateRandomDate(2021, 2024);
    const laid1 = generateRandomDate(parseInt(date.split('-')[0]), parseInt(date.split('-')[0]) + 1);
    const hatched1 = generateRandomDate(parseInt(laid1.split('-')[0]), parseInt(laid1.split('-')[0]) + 1);

    const hasSecondEgg = Math.random() > 0.3;
    const laid2 = hasSecondEgg ? generateRandomDate(parseInt(laid1.split('-')[0]), parseInt(laid1.split('-')[0]) + 1) : '';
    const hatched2 = hasSecondEgg ? generateRandomDate(parseInt(laid2.split('-')[0]), parseInt(laid2.split('-')[0]) + 1) : '';

    breeding.push({
      id: breeding.length + 1,
      sire: sire.id,
      dam: dam.id,
      date: date,
      laid1: laid1,
      hatched1: hatched1,
      pindex1: Math.random() > 0.2 ? generateBandNumber() : '',
      success1: Math.random() > 0.2 ? 1 : 0,
      laid2: laid2,
      hatched2: hatched2,
      pindex2: hasSecondEgg && Math.random() > 0.2 ? generateBandNumber() : '',
      success2: hasSecondEgg && Math.random() > 0.2 ? 1 : 0,
      clutch: `${2021 + Math.floor(Math.random() * 4)}年第${Math.floor(Math.random() * 6) + 1}窝`,
      box: `A${Math.floor(Math.random() * 20) + 1}`,
      comment: Math.random() > 0.6 ? ['配对成功', '孵化良好', '健康幼鸽', '需加强营养'][Math.floor(Math.random() * 4)] : ''
    });
  }

  // 按日期排序
  breeding.sort((a, b) => new Date(b.date) - new Date(a.date));

  return breeding;
}

// 生成用药记录数据
function generateMedication(pigeons) {
  const medication = [];
  const medications = [
    '疫苗接种', '驱虫', '维生素补充', '呼吸道治疗', '消化道治疗',
    '外伤处理', '预防性用药', '营养补充', '抗生素治疗', '滴虫治疗'
  ];

  pigeons.filter(p => p.status !== 'dead').forEach(pigeon => {
    const medCount = Math.floor(Math.random() * 5); // 每只鸽子0-4条记录

    for (let i = 0; i < medCount; i++) {
      const medType = medications[Math.floor(Math.random() * medications.length)];
      const date = generateRandomDate(2022, 2024);

      medication.push({
        id: medication.length + 1,
        pigeonId: pigeon.id,
        date: date,
        type: medType,
        medicine: ['抗生素', '维生素', '疫苗', '驱虫药', '消炎药', '营养剂'][Math.floor(Math.random() * 6)],
        dosage: Math.random() > 0.5 ? `1片/天` : `${Math.floor(Math.random() * 5) + 1}ml/天`,
        duration: `${Math.floor(Math.random() * 10) + 3}天`,
        purpose: ['预防', '治疗', '保健', '营养补充'][Math.floor(Math.random() * 4)],
        notes: Math.random() > 0.6 ? ['治疗有效', '恢复良好', '需继续观察', '无明显副作用'][Math.floor(Math.random() * 4)] : ''
      });
    }
  });

  // 按日期排序
  medication.sort((a, b) => new Date(b.date) - new Date(a.date));

  return medication;
}

// 生成媒体数据
function generateMedia(pigeons) {
  const media = [];
  const mediaTypes = ['photo', 'video', 'document'];

  pigeons.forEach(pigeon => {
    const mediaCount = Math.floor(Math.random() * 6); // 每只鸽子0-5个媒体文件

    for (let i = 0; i < mediaCount; i++) {
      const type = mediaTypes[Math.floor(Math.random() * mediaTypes.length)];
      const date = generateRandomDate(2022, 2024);

      media.push({
        id: media.length + 1,
        pigeonId: pigeon.id,
        name: type === 'photo' ? `${pigeon.name || '鸽子'}照片${i + 1}` :
              type === 'video' ? `${pigeon.name || '鸽子'}视频${i + 1}` :
              `${pigeon.name || '鸽子'}文档${i + 1}`,
        type: type,
        filePath: `assets/${type}s/${type === 'photo' ? 'pigeon' + (Math.floor(Math.random() * 10) + 1) : 'placeholder'}.${type === 'photo' ? 'jpg' : type === 'video' ? 'mp4' : 'pdf'}`,
        fileSize: type === 'photo' ? `${Math.floor(Math.random() * 5) + 1}MB` :
                 type === 'video' ? `${Math.floor(Math.random() * 100) + 10}MB` :
                 `${Math.floor(Math.random() * 2) + 1}MB`,
        uploadDate: date,
        description: Math.random() > 0.6 ? ['比赛照片', '训练视频', '血统证书', '获奖证明', '健康记录'][Math.floor(Math.random() * 5)] : ''
      });
    }
  });

  // 按上传日期排序
  media.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

  return media;
}

// 生成地址簿数据
function generateAddresses() {
  return [
    {
      id: 1,
      name: '北京市鸽会',
      address: '北京市朝阳区某某街道123号',
      phone: '010-12345678',
      email: 'beijing@pigeon.com',
      type: '鸽会',
      contact: '张先生'
    },
    {
      id: 2,
      name: '上海赛鸽中心',
      address: '上海市浦东新区某某路456号',
      phone: '021-87654321',
      email: 'shanghai@pigeon.com',
      type: '比赛组织',
      contact: '李女士'
    },
    {
      id: 3,
      name: '广州鸽具店',
      address: '广州市天河区某某大道789号',
      phone: '020-11111111',
      email: 'guangzhou@pigeon.com',
      type: '鸽具供应商',
      contact: '王老板'
    }
  ];
}

// 生成比赛点数据
function generateRacepoints() {
  return racepoints.map((point, index) => ({
    id: index + 1,
    name: point,
    latitude: (30 + Math.random() * 20).toFixed(6),
    longitude: (100 + Math.random() * 30).toFixed(6),
    distance: Math.floor(Math.random() * 1000) + 200,
    direction: ['东北', '东', '东南', '南', '西南', '西', '西北', '北'][Math.floor(Math.random() * 8)]
  }));
}

// 初始化所有模拟数据
function initializeMockData() {
  console.log('正在生成模拟数据...');

  // 生成50只鸽子的数据
  MockData.pigeons = generatePigeons(50);
  console.log(`生成了 ${MockData.pigeons.length} 只鸽子的数据`);

  // 生成比赛结果
  MockData.results = generateResults(MockData.pigeons);
  console.log(`生成了 ${MockData.results.length} 条比赛结果记录`);

  // 生成育种记录
  MockData.breeding = generateBreeding(MockData.pigeons);
  console.log(`生成了 ${MockData.breeding.length} 条育种记录`);

  // 生成用药记录
  MockData.medication = generateMedication(MockData.pigeons);
  console.log(`生成了 ${MockData.medication.length} 条用药记录`);

  // 生成媒体数据
  MockData.media = generateMedia(MockData.pigeons);
  console.log(`生成了 ${MockData.media.length} 个媒体文件`);

  // 生成地址簿数据
  MockData.addresses = generateAddresses();
  console.log(`生成了 ${MockData.addresses.length} 个地址记录`);

  // 生成比赛点数据
  MockData.racepoints = generateRacepoints();
  console.log(`生成了 ${MockData.racepoints.length} 个比赛点记录`);

  console.log('模拟数据生成完成！');

  // 返回统计信息
  return {
    pigeonCount: MockData.pigeons.length,
    resultCount: MockData.results.length,
    breedingCount: MockData.breeding.length,
    medicationCount: MockData.medication.length,
    mediaCount: MockData.media.length
  };
}

// 根据ID获取鸽子信息
function getPigeonById(id) {
  return MockData.pigeons.find(p => p.id === id);
}

// 根据ID获取鸽子的比赛结果
function getResultsByPigeonId(pigeonId) {
  return MockData.results.filter(r => r.pigeonId === pigeonId);
}

// 根据ID获取鸽子的育种记录
function getBreedingByPigeonId(pigeonId) {
  return MockData.breeding.filter(b => b.sire === pigeonId || b.dam === pigeonId);
}

// 根据ID获取鸽子的用药记录
function getMedicationByPigeonId(pigeonId) {
  return MockData.medication.filter(m => m.pigeonId === pigeonId);
}

// 根据ID获取鸽子的媒体文件
function getMediaByPigeonId(pigeonId) {
  return MockData.media.filter(m => m.pigeonId === pigeonId);
}

// 获取鸽子统计信息
function getPigeonStats() {
  const stats = {
    total: MockData.pigeons.length,
    active: 0,
    male: 0,
    female: 0,
    young: 0,
    sold: 0,
    lost: 0,
    dead: 0,
    breeder: 0
  };

  MockData.pigeons.forEach(pigeon => {
    if (pigeon.status === 'active') stats.active++;
    if (pigeon.sex === 'male') stats.male++;
    if (pigeon.sex === 'female') stats.female++;
    if (pigeon.sex === 'young') stats.young++;
    if (pigeon.status === 'sold') stats.sold++;
    if (pigeon.status === 'lost') stats.lost++;
    if (pigeon.status === 'dead') stats.dead++;
    if (pigeon.status === 'breeder') stats.breeder++;
  });

  return stats;
}

// 获取亲戚关系
function getRelatives(pigeonId) {
  const pigeon = getPigeonById(pigeonId);
  if (!pigeon) return { parents: [], siblings: [], children: [] };

  const parents = [];
  const siblings = [];
  const children = [];

  // 父母
  if (pigeon.sire) {
    const sire = getPigeonById(pigeon.sire);
    if (sire) parents.push({ ...sire, relation: '父亲' });
  }
  if (pigeon.dam) {
    const dam = getPigeonById(pigeon.dam);
    if (dam) parents.push({ ...dam, relation: '母亲' });
  }

  // 兄弟姐妹 (同父同母)
  MockData.pigeons.forEach(p => {
    if (p.id !== pigeonId && p.sire === pigeon.sire && p.dam === pigeon.dam) {
      siblings.push({ ...p, relation: p.sex === 'male' ? '兄弟' : (p.sex === 'female' ? '姐妹' : '同胞') });
    }
  });

  // 子女
  MockData.breeding.forEach(b => {
    if (b.sire === pigeonId && b.pindex1) {
      const child = getPigeonById(b.pindex1);
      if (child) children.push({ ...child, relation: '子女', breedingRecord: b });
    }
    if (b.sire === pigeonId && b.pindex2) {
      const child = getPigeonById(b.pindex2);
      if (child) children.push({ ...child, relation: '子女', breedingRecord: b });
    }
    if (b.dam === pigeonId && b.pindex1) {
      const child = getPigeonById(b.pindex1);
      if (child) children.push({ ...child, relation: '子女', breedingRecord: b });
    }
    if (b.dam === pigeonId && b.pindex2) {
      const child = getPigeonById(b.pindex2);
      if (child) children.push({ ...child, relation: '子女', breedingRecord: b });
    }
  });

  return {
    parents: parents,
    siblings: siblings,
    children: children
  };
}

// 导出数据对象和函数
window.MockData = MockData;
window.DataHelpers = {
  initializeMockData,
  getPigeonById,
  getResultsByPigeonId,
  getBreedingByPigeonId,
  getMedicationByPigeonId,
  getMediaByPigeonId,
  getPigeonStats,
  getRelatives
};

// 页面加载完成后自动初始化数据
document.addEventListener('DOMContentLoaded', function() {
  const stats = initializeMockData();

  // 更新统计信息显示
  const totalElement = document.getElementById('totalCount');
  const maleElement = document.getElementById('maleCount');
  const femaleElement = document.getElementById('femaleCount');
  const youngElement = document.getElementById('youngCount');

  if (totalElement) totalElement.textContent = stats.pigeonCount;
  if (maleElement) maleElement.textContent = stats.maleCount;
  if (femaleElement) femaleElement.textContent = stats.femaleCount;
  if (youngElement) youngElement.textContent = stats.youngCount;
});