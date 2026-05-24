/* ===== OUTFIT_MAP (6단계, gender: 'm'|'f'|'b') ========================= */

const OUTFIT_MAP = [
  {
    stage: '매우 더움',
    min: 28, max: Infinity,
    tops: [
      { name: '반팔 셔츠',       tpos: ['work'],                   gender: 'm' },
      { name: '반팔 린넨 셔츠', tpos: ['date', 'casual'],         gender: 'm' },
      { name: '반팔 블라우스',   tpos: ['work'],                   gender: 'f' },
      { name: '크롭 티셔츠',     tpos: ['date', 'casual'],         gender: 'f' },
      { name: '반팔 티셔츠',     tpos: ['casual'],                 gender: 'b' },
      { name: '민소매',          tpos: ['casual', 'exercise'],     gender: 'f' },
      { name: '나시',            tpos: ['casual', 'exercise'],     gender: 'm' },
      { name: '스포츠 탑',       tpos: ['exercise'],               gender: 'f' },
      { name: '드라이핏 상의',   tpos: ['exercise'],               gender: 'm' },
    ],
    bottoms: [
      { name: '린넨 팬츠',       tpos: ['work', 'date', 'casual'], gender: 'b' },
      { name: '미니스커트',      tpos: ['date', 'casual'],         gender: 'f' },
      { name: '치노 반바지',     tpos: ['work', 'casual'],         gender: 'm' },
      { name: '숏팬츠',          tpos: ['casual', 'date'],         gender: 'f' },
      { name: '반바지',          tpos: ['casual'],                 gender: 'm' },
      { name: '러닝 레깅스',     tpos: ['exercise'],               gender: 'b' },
    ],
    outers: [],
  },
  {
    stage: '더움',
    min: 23, max: 27,
    tops: [
      { name: '얇은 셔츠',       tpos: ['work', 'casual'],         gender: 'm' },
      { name: '오픈카라 셔츠',  tpos: ['date'],                   gender: 'm' },
      { name: '반팔 블라우스',   tpos: ['work'],                   gender: 'f' },
      { name: '폴로 셔츠',       tpos: ['work', 'casual'],         gender: 'm' },
      { name: '니트 조끼',       tpos: ['work', 'date', 'casual'], gender: 'f' },
      { name: '반팔 티셔츠',     tpos: ['casual'],                 gender: 'b' },
      { name: '드라이핏 반팔',   tpos: ['exercise'],               gender: 'b' },
    ],
    bottoms: [
      { name: '슬랙스',          tpos: ['work', 'date'],           gender: 'b' },
      { name: '미디스커트',      tpos: ['work', 'date', 'casual'], gender: 'f' },
      { name: '청바지',          tpos: ['casual', 'date'],         gender: 'b' },
      { name: '치노 팬츠',       tpos: ['work', 'casual'],         gender: 'm' },
      { name: '미니스커트',      tpos: ['date', 'casual'],         gender: 'f' },
      { name: '면바지',          tpos: ['casual'],                 gender: 'm' },
      { name: '트레이닝 팬츠',   tpos: ['exercise'],               gender: 'b' },
    ],
    outers: [],
  },
  {
    stage: '선선함',
    min: 17, max: 22,
    tops: [
      { name: '긴팔 셔츠',       tpos: ['work', 'casual'],         gender: 'm' },
      { name: '슬림핏 니트',    tpos: ['date'],                   gender: 'm' },
      { name: '블라우스',        tpos: ['work', 'casual'],         gender: 'f' },
      { name: '가디건',          tpos: ['date', 'casual'],         gender: 'f' },
      { name: '얇은 니트',       tpos: ['work', 'date', 'casual'], gender: 'b' },
      { name: '맨투맨',          tpos: ['casual'],                 gender: 'b' },
      { name: '긴팔 티셔츠',     tpos: ['casual', 'exercise'],     gender: 'b' },
      { name: '집업 스웨트',     tpos: ['exercise', 'casual'],     gender: 'b' },
    ],
    bottoms: [
      { name: '슬랙스',          tpos: ['work', 'date'],           gender: 'b' },
      { name: '미디스커트',      tpos: ['work', 'date', 'casual'], gender: 'f' },
      { name: '와이드 팬츠',     tpos: ['date', 'casual'],         gender: 'f' },
      { name: '청바지',          tpos: ['casual', 'date'],         gender: 'b' },
      { name: '면바지',          tpos: ['casual'],                 gender: 'm' },
      { name: '트레이닝 팬츠',   tpos: ['exercise'],               gender: 'b' },
    ],
    outers: [
      { name: '얇은 자켓',       tpos: ['work', 'casual'],         gender: 'm' },
      { name: '데님 자켓',       tpos: ['casual', 'date'],         gender: 'b' },
      { name: '가디건',          tpos: ['work', 'date', 'casual'], gender: 'f' },
      { name: '윈드브레이커',    tpos: ['exercise', 'casual'],     gender: 'b' },
    ],
  },
  {
    stage: '쌀쌀함',
    min: 12, max: 16,
    tops: [
      { name: '니트',            tpos: ['work', 'casual'],         gender: 'b' },
      { name: '오버핏 니트',    tpos: ['date', 'casual'],         gender: 'b' },
      { name: '크루넥 스웨터',   tpos: ['work', 'casual'],         gender: 'f' },
      { name: '후드 집업',       tpos: ['casual', 'exercise'],     gender: 'b' },
      { name: '두꺼운 맨투맨',   tpos: ['casual'],                 gender: 'm' },
      { name: '플리스',          tpos: ['casual', 'exercise'],     gender: 'b' },
    ],
    bottoms: [
      { name: '울 슬랙스',       tpos: ['work', 'date'],           gender: 'b' },
      { name: '롱스커트',        tpos: ['work', 'date', 'casual'], gender: 'f' },
      { name: '코듀로이 팬츠',   tpos: ['casual', 'date'],         gender: 'b' },
      { name: '청바지',          tpos: ['casual', 'date'],         gender: 'b' },
      { name: '조거 팬츠',       tpos: ['exercise', 'casual'],     gender: 'b' },
    ],
    outers: [
      { name: '블레이저',        tpos: ['work', 'date'],           gender: 'b' },
      { name: '자켓',            tpos: ['work', 'casual'],         gender: 'm' },
      { name: '숏 코트',         tpos: ['work', 'date', 'casual'], gender: 'f' },
      { name: '가죽 자켓',       tpos: ['date', 'casual'],         gender: 'b' },
      { name: '트레이닝 자켓',   tpos: ['exercise'],               gender: 'b' },
    ],
  },
  {
    stage: '추움',
    min: 6, max: 11,
    tops: [
      { name: '터틀넥',          tpos: ['work', 'casual'],         gender: 'b' },
      { name: '케이블 니트',    tpos: ['date', 'casual'],         gender: 'b' },
      { name: '두꺼운 니트',     tpos: ['work', 'casual'],         gender: 'b' },
      { name: '기모 맨투맨',     tpos: ['casual'],                 gender: 'm' },
      { name: '기모 후드티',     tpos: ['casual', 'exercise'],     gender: 'b' },
      { name: '플리스',          tpos: ['casual', 'exercise'],     gender: 'b' },
    ],
    bottoms: [
      { name: '울 슬랙스',       tpos: ['work', 'date'],           gender: 'b' },
      { name: '두꺼운 청바지',   tpos: ['casual', 'date'],         gender: 'b' },
      { name: '롱스커트 + 레깅스', tpos: ['date', 'casual'],       gender: 'f' },
      { name: '기모 팬츠',       tpos: ['casual'],                 gender: 'm' },
      { name: '기모 레깅스',     tpos: ['exercise', 'casual'],     gender: 'f' },
      { name: '기모 조거 팬츠',  tpos: ['exercise', 'casual'],     gender: 'b' },
    ],
    outers: [
      { name: '코트',            tpos: ['work', 'date', 'casual'], gender: 'm' },
      { name: '울 코트',         tpos: ['work', 'date', 'casual'], gender: 'f' },
      { name: '트렌치코트',      tpos: ['work', 'date', 'casual'], gender: 'b' },
      { name: '기모 자켓',       tpos: ['casual'],                 gender: 'b' },
      { name: '기모 바람막이',   tpos: ['exercise', 'casual'],     gender: 'b' },
    ],
  },
  {
    stage: '매우 추움',
    min: -Infinity, max: 5,
    tops: [
      { name: '히트텍 + 터틀넥',      tpos: ['work'],                   gender: 'b' },
      { name: '히트텍 + 케이블 니트', tpos: ['date', 'casual'],         gender: 'b' },
      { name: '히트텍 + 두꺼운 니트', tpos: ['work', 'casual'],         gender: 'b' },
      { name: '기모 내의 + 맨투맨',   tpos: ['casual'],                 gender: 'm' },
      { name: '발열 내의 + 니트',     tpos: ['work', 'date', 'casual'], gender: 'f' },
      { name: '기모 내의 + 후드티',   tpos: ['casual', 'exercise'],     gender: 'b' },
    ],
    bottoms: [
      { name: '기모 슬랙스',          tpos: ['work', 'date'],           gender: 'b' },
      { name: '기모 레깅스 + 롱스커트', tpos: ['casual', 'date'],       gender: 'f' },
      { name: '방한 팬츠',            tpos: ['casual'],                 gender: 'm' },
      { name: '기모 청바지',          tpos: ['casual'],                 gender: 'b' },
      { name: '기모 레깅스',          tpos: ['exercise', 'casual'],     gender: 'f' },
    ],
    outers: [
      { name: '롱코트',          tpos: ['work', 'date'],           gender: 'm' },
      { name: '롱패딩',          tpos: ['work', 'date', 'casual'], gender: 'f' },
      { name: '패딩 코트',       tpos: ['work', 'date', 'casual'], gender: 'b' },
      { name: '패딩',            tpos: ['casual'],                 gender: 'm' },
      { name: '헤비 다운',       tpos: ['casual', 'exercise'],     gender: 'b' },
      { name: '스키 자켓',       tpos: ['exercise'],               gender: 'b' },
    ],
  },
];

/* ===== 의상 이미지 검색어 (Unsplash API용) =============================== */

const OUTFIT_IMAGE_KEYWORDS = {
  // 상의
  '반팔 셔츠': 'short sleeve button shirt',
  '반팔 린넨 셔츠': 'linen short sleeve shirt',
  '오픈카라 셔츠': 'camp collar shirt',
  '반팔 블라우스': 'short sleeve blouse top outfit',
  '크롭 티셔츠': 'crop top',
  '반팔 티셔츠': 'short sleeve tshirt',
  '민소매': 'sleeveless top',
  '나시': 'tank top',
  '스포츠 탑': 'sports top activewear',
  '드라이핏 상의': 'athletic sport shirt workout',
  '얇은 셔츠': 'light linen shirt',
  '폴로 셔츠': 'polo shirt',
  '니트 조끼': 'knit vest outfit',
  '드라이핏 반팔': 'athletic short sleeve shirt workout',
  '긴팔 셔츠': 'long sleeve shirt',
  '슬림핏 니트': 'slim fit knit sweater',
  '블라우스': 'blouse elegant fashion',
  '얇은 니트': 'light knit sweater',
  '가디건': 'cardigan outfit fashion',
  '맨투맨': 'crew neck sweatshirt',
  '긴팔 티셔츠': 'long sleeve tshirt',
  '집업 스웨트': 'zip up sweatshirt',
  '니트': 'knit sweater pullover',
  '오버핏 니트': 'oversized knit sweater',
  '크루넥 스웨터': 'crew neck sweater',
  '후드 집업': 'zip up hoodie',
  '두꺼운 맨투맨': 'heavy sweatshirt',
  '플리스': 'fleece pullover',
  '터틀넥': 'turtleneck sweater',
  '케이블 니트': 'cable knit sweater',
  '두꺼운 니트': 'chunky knit sweater',
  '기모 맨투맨': 'cozy sweatshirt',
  '기모 후드티': 'fleece hoodie',
  '히트텍 + 터틀넥': 'turtleneck sweater winter',
  '히트텍 + 케이블 니트': 'cable knit sweater winter',
  '히트텍 + 두꺼운 니트': 'chunky knit sweater winter',
  '기모 내의 + 맨투맨': 'sweatshirt winter',
  '발열 내의 + 니트': 'knit sweater winter',
  '기모 내의 + 후드티': 'hoodie winter',
  // 하의
  '린넨 팬츠': 'linen trousers',
  '미니스커트': 'mini skirt',
  '치노 반바지': 'chino shorts',
  '숏팬츠': 'shorts fashion',
  '반바지': 'casual shorts',
  '러닝 레깅스': 'running leggings',
  '슬랙스': 'tailored trousers outfit lower half waist',
  '미디스커트': 'midi skirt',
  '청바지': 'blue denim jeans street style',
  '치노 팬츠': 'chino trousers',
  '면바지': 'cotton casual trousers',
  '트레이닝 팬츠': 'sweatpants',
  '와이드 팬츠': 'wide leg trousers',
  '울 슬랙스': 'wool trousers outfit lower half waist',
  '롱스커트': 'maxi skirt',
  '코듀로이 팬츠': 'corduroy trousers',
  '조거 팬츠': 'jogger pants',
  '롱스커트 + 레깅스': 'maxi skirt leggings winter',
  '기모 팬츠': 'sweatpants casual',
  '기모 레깅스': 'fleece leggings winter',
  '기모 조거 팬츠': 'fleece jogger pants winter',
  '두꺼운 청바지': 'dark denim jeans winter outfit',
  '기모 슬랙스': 'tailored trousers outfit lower half waist winter',
  '기모 레깅스 + 롱스커트': 'maxi skirt leggings winter',
  '방한 팬츠': 'winter pants warm',
  '기모 청바지': 'warm jeans winter outfit',
  // 아우터
  '얇은 자켓': 'spring jacket outfit',
  '데님 자켓': 'denim jacket',
  '윈드브레이커': 'windbreaker jacket casual',
  '블레이저': 'blazer jacket',
  '자켓': 'casual jacket',
  '숏 코트': 'short wool coat fashion',
  '가죽 자켓': 'leather jacket',
  '트레이닝 자켓': 'track jacket',
  '코트': 'wool overcoat',
  '울 코트': 'wool coat',
  '트렌치코트': 'trench coat',
  '기모 자켓': 'lined winter jacket',
  '기모 바람막이': 'anorak jacket winter',
  '롱코트': 'long overcoat',
  '롱패딩': 'long puffer jacket',
  '패딩 코트': 'puffer coat',
  '패딩': 'puffer down jacket',
  '헤비 다운': 'heavy down jacket',
  '스키 자켓': 'ski jacket',
};

/* ===== 헬퍼 ============================================================= */

function toLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function extractDayTemps(forecastList) {
  const today = toLocalDateString();
  const getHour = (dt) => new Date(dt * 1000).getHours();
  const getDate = (dt) => toLocalDateString(new Date(dt * 1000));

  const morningItems = forecastList.filter(
    (item) => getDate(item.dt) === today && getHour(item.dt) >= 7 && getHour(item.dt) <= 9,
  );
  const eveningItems = forecastList.filter(
    (item) => getDate(item.dt) === today && getHour(item.dt) >= 17 && getHour(item.dt) <= 20,
  );

  const avg = (items) =>
    items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.main.temp, 0) / items.length)
      : null;

  return { morningTemp: avg(morningItems), eveningTemp: avg(eveningItems) };
}

/* ===== 공개 함수 ========================================================= */

function filterByTPO(outfitOptions, tpo, gender) {
  const gc = gender === 'female' ? 'f' : 'm';

  const sortItems = (items) => {
    const gItems  = items.filter((i) => i.gender === 'b' || i.gender === gc);
    const matched = gItems
      .filter((i) => i.tpos.includes(tpo))
      .sort((a, b) => a.tpos.length - b.tpos.length); // TPO 전용일수록 앞
    const rest    = gItems.filter((i) => !i.tpos.includes(tpo));
    return [...matched, ...rest].map((i) => i.name);
  };

  return {
    tops:    sortItems(outfitOptions.tops),
    bottoms: sortItems(outfitOptions.bottoms),
    outers:  sortItems(outfitOptions.outers),
  };
}

function needsLayering(morningTemp, eveningTemp) {
  const diff = Math.abs(eveningTemp - morningTemp);
  return { layering: diff >= 5, diff: Math.round(diff) };
}

function getExtraInfo(weatherData) {
  const extra = {};
  if (['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(weatherData.main)) extra.umbrella = true;
  if (weatherData.humidity >= 80) extra.humidity_warning = true;
  if (weatherData.temp >= 30 && weatherData.main === 'Clear') extra.uv_warning = true;
  return extra;
}

function getOutfitRecommendation(weatherData, forecastList = null, tpo = 'casual', userBias = 0, gender = 'male') {
  const bias = Math.max(-3, Math.min(3, userBias));
  const adjustedFeelsLike = Math.round(weatherData.feelsLike + bias);

  const stage =
    OUTFIT_MAP.find((s) => adjustedFeelsLike >= s.min && adjustedFeelsLike <= s.max) ??
    OUTFIT_MAP[OUTFIT_MAP.length - 1];

  const filtered = filterByTPO(
    { tops: stage.tops, bottoms: stage.bottoms, outers: stage.outers },
    tpo, gender,
  );

  let layeringResult = { layering: false, diff: 0 };
  if (forecastList && forecastList.length > 0) {
    const { morningTemp, eveningTemp } = extractDayTemps(forecastList);
    if (morningTemp !== null && eveningTemp !== null) {
      layeringResult = needsLayering(morningTemp, eveningTemp);
    }
  }

  return {
    top:       filtered.tops[0]    ?? '티셔츠',
    bottom:    filtered.bottoms[0] ?? '청바지',
    outer:     filtered.outers[0]  ?? null,
    layering:  layeringResult,
    extra:     getExtraInfo(weatherData),
    tempStage: stage.stage,
  };
}
