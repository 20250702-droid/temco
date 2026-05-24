/** 기상청 API 키 (공공데이터포털에서 발급 — Decoding 키 사용) */
const KMA_API_KEY = '8a92435885c50329a00ad8170bcbf2efe093d9c69e12ca81761c73031439bfd4';

/** OpenWeatherMap API 키 (지오코딩 전용) */
const OWM_API_KEY    = '0ceb846b27d23cc6ad5e838c95e8bdb1';
const OWM_BASE       = 'https://api.openweathermap.org';
const KMA_BASE       = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

/* ===== 캐시 ===== */
const CACHE_VERSION      = 'v2';          // API 변경 시 올리면 구 캐시 자동 무효화
const WEATHER_CACHE_KEY  = `temco_weather_cache_${CACHE_VERSION}`;
const FORECAST_CACHE_KEY = `temco_forecast_cache_${CACHE_VERSION}`;
const CACHE_TTL          = 600_000; // 10분 (API 호출 횟수 절감)

function clearWeatherCache() {
  localStorage.removeItem(WEATHER_CACHE_KEY);
  localStorage.removeItem(FORECAST_CACHE_KEY);
}

function readCache(key) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); }
  catch { return null; }
}
function writeCache(key, city, data) {
  localStorage.setItem(key, JSON.stringify({ city, data, timestamp: Date.now() }));
}
function isFresh(cache, city) {
  return cache !== null && cache.city === city && (Date.now() - cache.timestamp) < CACHE_TTL;
}

/* ===== 공통 fetch 래퍼 ===== */
async function apiFetch(url, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (e) {
    clearTimeout(timer);
    throw Object.assign(new Error('인터넷 연결을 확인해주세요.'), { code: 'NETWORK' });
  }
  clearTimeout(timer);
  if (res.status === 401) throw Object.assign(new Error('API 키가 올바르지 않습니다.'), { code: 'AUTH' });
  if (res.status === 404) throw Object.assign(new Error('위치를 찾을 수 없습니다.'), { code: 'NOT_FOUND' });
  if (res.status === 429) throw Object.assign(new Error('API 호출 한도 초과. 잠시 후 다시 시도해주세요.'), { code: 'RATE_LIMIT' });
  if (!res.ok) throw new Error(`요청 실패 (상태: ${res.status})`);
  return res.json();
}

/* ===== 날짜 포맷 헬퍼 (YYYYMMDD) ===== */
function formatKmaDate(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/* ===== 위경도 → 기상청 격자(nx, ny) 변환 ===== */
function latLonToGrid(lat, lon) {
  const RE = 6371.00877, GRID = 5.0, SLAT1 = 30.0, SLAT2 = 60.0;
  const OLON = 126.0, OLAT = 38.0, XO = 43, YO = 136;
  const DEGRAD = Math.PI / 180.0;
  const re    = RE / GRID;
  const slat1 = SLAT1 * DEGRAD, slat2 = SLAT2 * DEGRAD;
  const olon  = OLON  * DEGRAD, olat  = OLAT  * DEGRAD;

  const sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) /
             Math.log(Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5));
  const sf = Math.pow(Math.tan(Math.PI * 0.25 + slat1 * 0.5), sn) * Math.cos(slat1) / sn;
  const ro = re * sf / Math.pow(Math.tan(Math.PI * 0.25 + olat        * 0.5), sn);
  const ra = re * sf / Math.pow(Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5), sn);

  let theta = lon * DEGRAD - olon;
  if (theta >  Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

/* ===== 기상청 발표 시각 계산 (최신 → 이전 순 배열 반환) ===== */
function getUltraSrtNcstBaseTimes() {
  // 매시 :40분 업데이트, :50분 이후 안전하게 사용
  const now = new Date();
  let startHour = now.getHours();
  let startDate = now;
  if (now.getMinutes() < 50) {
    if (--startHour < 0) { startHour = 23; startDate = new Date(+now - 86_400_000); }
  }
  return Array.from({ length: 3 }, (_, back) => {
    let hour = startHour - back;
    let date = startDate;
    if (hour < 0) { hour += 24; date = new Date(+startDate - 86_400_000); }
    return { base_date: formatKmaDate(date), base_time: String(hour).padStart(2, '0') + '00' };
  });
}

function getUltraSrtFcstBaseTimes() {
  // 매시 :30분 발표, :50분 이후 안전하게 사용
  const now = new Date();
  let startHour = now.getHours();
  let startDate = now;
  if (now.getMinutes() < 50) {
    if (--startHour < 0) { startHour = 23; startDate = new Date(+now - 86_400_000); }
  }
  return Array.from({ length: 3 }, (_, back) => {
    let hour = startHour - back;
    let date = startDate;
    if (hour < 0) { hour += 24; date = new Date(+startDate - 86_400_000); }
    return { base_date: formatKmaDate(date), base_time: String(hour).padStart(2, '0') + '30' };
  });
}

function getVilageFcstBaseTimes() {
  // 02, 05, 08, 11, 14, 17, 20, 23시 발표, 30분 이후 사용 (버퍼 20→30분으로 확대)
  const HOURS = [2, 5, 8, 11, 14, 17, 20, 23];
  const now   = new Date();
  const h = now.getHours(), m = now.getMinutes();
  const candidates = [];

  // 최신 발표 시각 결정
  let latestHour, latestDate = now;
  for (let i = HOURS.length - 1; i >= 0; i--) {
    if (h > HOURS[i] || (h === HOURS[i] && m >= 30)) { latestHour = HOURS[i]; break; }
  }
  if (latestHour === undefined) { latestHour = 23; latestDate = new Date(+now - 86_400_000); }

  // 최신 포함 3개 후보 생성
  for (let back = 0; back <= 2; back++) {
    const idx  = HOURS.indexOf(latestHour) - back;
    if (idx >= 0) {
      candidates.push({ base_date: formatKmaDate(latestDate), base_time: String(HOURS[idx]).padStart(2, '0') + '00' });
    } else {
      const prevDate = new Date(+latestDate - 86_400_000);
      candidates.push({ base_date: formatKmaDate(prevDate), base_time: String(HOURS[HOURS.length + idx]).padStart(2, '0') + '00' });
    }
  }
  return candidates;
}

// 단일 시각 버전 (하위 호환)
function getUltraSrtNcstBaseTime() { return getUltraSrtNcstBaseTimes()[0]; }
function getUltraSrtFcstBaseTime() { return getUltraSrtFcstBaseTimes()[0]; }
function getVilageFcstBaseTime()   { return getVilageFcstBaseTimes()[0]; }

/* ===== 기상청 URL 생성 ===== */
function buildKmaUrl(endpoint, params) {
  const url = new URL(`${KMA_BASE}/${endpoint}`);
  url.searchParams.set('serviceKey', KMA_API_KEY);
  url.searchParams.set('dataType', 'JSON');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  return url.toString();
}

/* ===== 기상청 응답 아이템 추출 ===== */
function parseKmaItems(json, label) {
  const code = json?.response?.header?.resultCode;
  if (code && code !== '00') {
    const err = new Error(`기상청 ${label}: ${json.response.header.resultMsg ?? '오류'} (${code})`);
    err.kmaCode = code;
    throw err;
  }
  const items = json?.response?.body?.items?.item;
  if (!items || (Array.isArray(items) && items.length === 0)) {
    const err = new Error(`기상청 ${label}: 데이터 없음`);
    err.kmaCode = '03';
    throw err;
  }
  return Array.isArray(items) ? items : [items];
}

/* NO_DATA(03)인지 판별 */
function isNoData(err) {
  return err?.kmaCode === '03' || err?.kmaCode === '10';
}

/* ===== PTY/SKY 코드 → OWM 호환 날씨 상태 =====
   PTY: 0=없음, 1=비, 2=비/눈, 3=눈, 5=빗방울, 6=빗방울/눈날림, 7=눈날림
   SKY: 1=맑음, 3=구름많음, 4=흐림 */
function kmaToWeather(pty, sky) {
  if (pty === 1 || pty === 5) return { main: 'Rain',   weatherId: 500, clouds: 80 };
  if (pty === 2 || pty === 6) return { main: 'Rain',   weatherId: 616, clouds: 90 };
  if (pty === 3 || pty === 7) return { main: 'Snow',   weatherId: 600, clouds: 80 };
  if (sky === 1)               return { main: 'Clear',  weatherId: 800, clouds: 10 };
  if (sky === 3)               return { main: 'Clouds', weatherId: 803, clouds: 70 };
  if (sky === 4)               return { main: 'Clouds', weatherId: 804, clouds: 90 };
  return                              { main: 'Clear',  weatherId: 800, clouds: 0  };
}

/* ===== 체감온도 계산 (기상청 수식) ===== */
function calcFeelsLike(temp, windSpeedMs, humidity) {
  const v = windSpeedMs * 3.6; // m/s → km/h
  if (temp <= 10 && v > 4.8) {
    return Math.round(13.12 + 0.6215 * temp - 11.37 * v ** 0.16 + 0.3965 * temp * v ** 0.16);
  }
  if (temp >= 27 && humidity >= 40) {
    return Math.round(
      -8.78469475556 + 1.61139411 * temp + 2.33854883889 * humidity
      - 0.14611605 * temp * humidity - 0.012308094 * temp ** 2
      - 0.0164248277778 * humidity ** 2 + 0.002211732 * temp ** 2 * humidity
      + 0.00072546 * temp * humidity ** 2 - 0.000003582 * temp ** 2 * humidity ** 2,
    );
  }
  return Math.round(temp);
}

/* ===== WMO 날씨 코드 → 앱 호환 날씨 상태 (Open-Meteo용) =====
   https://open-meteo.com/en/docs — WMO Weather interpretation codes */
function wmoToWeather(code) {
  if (code === 0)                          return { main: 'Clear',        weatherId: 800, clouds: 0  };
  if (code === 1)                          return { main: 'Clear',        weatherId: 801, clouds: 15 };
  if (code === 2)                          return { main: 'Clouds',       weatherId: 802, clouds: 35 };
  if (code === 3)                          return { main: 'Clouds',       weatherId: 804, clouds: 90 };
  if (code === 45 || code === 48)          return { main: 'Fog',          weatherId: 741, clouds: 80 };
  if (code === 51 || code === 53)          return { main: 'Drizzle',      weatherId: 300, clouds: 70 };
  if (code === 55 || code === 56 || code === 57)
                                           return { main: 'Drizzle',      weatherId: 314, clouds: 80 };
  if (code === 61 || code === 80)          return { main: 'Rain',         weatherId: 500, clouds: 80 };
  if (code === 63 || code === 81)          return { main: 'Rain',         weatherId: 501, clouds: 85 };
  if (code === 65 || code === 82)          return { main: 'Rain',         weatherId: 502, clouds: 90 };
  if (code === 66 || code === 67)          return { main: 'Rain',         weatherId: 511, clouds: 85 };
  if (code === 71 || code === 77 || code === 85)
                                           return { main: 'Snow',         weatherId: 600, clouds: 80 };
  if (code === 73 || code === 86)          return { main: 'Snow',         weatherId: 601, clouds: 85 };
  if (code === 75)                         return { main: 'Snow',         weatherId: 602, clouds: 90 };
  if (code === 95)                         return { main: 'Thunderstorm', weatherId: 200, clouds: 90 };
  if (code === 96 || code === 99)          return { main: 'Thunderstorm', weatherId: 201, clouds: 95 };
  return                                          { main: 'Clear',        weatherId: 800, clouds: 0  };
}

/* ===== Open-Meteo 현재 날씨 (해외) ===== */
async function fetchOpenMeteoCurrentWeather(lat, lon) {
  const url = `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,cloud_cover` +
    `&wind_speed_unit=ms&timezone=UTC`;
  const json = await apiFetch(url);
  const c = json.current;
  const { main, weatherId, clouds } = wmoToWeather(c.weather_code);
  return {
    cityName:    '',
    country:     '',
    temp:        Math.round(c.temperature_2m),
    feelsLike:   calcFeelsLike(c.temperature_2m, c.wind_speed_10m, c.relative_humidity_2m),
    humidity:    Math.round(c.relative_humidity_2m),
    windSpeed:   Math.round(c.wind_speed_10m * 10) / 10,
    main,
    weatherId,
    description: '',
    clouds:      c.cloud_cover ?? clouds,
    _source:     'Open-Meteo',
  };
}

/* ===== Open-Meteo 시간별 예보 (해외, 2일치) ===== */
async function fetchOpenMeteoForecast(lat, lon) {
  const url = `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,weather_code&wind_speed_unit=ms&timezone=UTC&forecast_days=2`;
  const json = await apiFetch(url);
  return json.hourly.time.map((time, i) => {
    const w = wmoToWeather(json.hourly.weather_code[i]);
    return {
      dt:      Math.floor(new Date(time + 'Z').getTime() / 1000),
      main:    { temp: json.hourly.temperature_2m[i] },
      weather: [{ main: w.main, id: w.weatherId }],
    };
  });
}

/* ===== 한국 좌표 감지 ===== */
function isKoreanCoords(lat, lon) {
  return lat >= 33.0 && lat <= 38.9 && lon >= 124.0 && lon <= 132.0;
}

/* ===== 기상청 현재 날씨 (초단기실황 + 초단기예보 병렬, NO_DATA 시 이전 시각 재시도) ===== */
async function fetchKmaCurrentWeather(lat, lon) {
  const { nx, ny } = latLonToGrid(lat, lon);
  const ncstTimes  = getUltraSrtNcstBaseTimes();
  const fcstTimes  = getUltraSrtFcstBaseTimes();

  let ncstItems;
  for (const bt of ncstTimes) {
    try {
      const json = await apiFetch(buildKmaUrl('getUltraSrtNcst', { ...bt, nx, ny, numOfRows: 10 }));
      ncstItems  = parseKmaItems(json, '초단기실황');
      break;
    } catch (e) {
      if (!isNoData(e) || bt === ncstTimes.at(-1)) throw e;
    }
  }

  const getObs = (cat) => Number(ncstItems.find((i) => i.category === cat)?.obsrValue ?? 0);
  const temp      = getObs('T1H');
  const humidity  = getObs('REH');
  const windSpeed = getObs('WSD');
  const pty       = getObs('PTY');

  let sky = 1;
  for (const bt of fcstTimes) {
    try {
      const json     = await apiFetch(buildKmaUrl('getUltraSrtFcst', { ...bt, nx, ny, numOfRows: 60 }));
      const fcstItems = parseKmaItems(json, '초단기예보');
      const nowHhmm  = String(new Date().getHours()).padStart(2, '0') + '00';
      const skyItem  = fcstItems.find((i) => i.category === 'SKY' && i.fcstTime >= nowHhmm);
      if (skyItem) sky = Number(skyItem.fcstValue);
      break;
    } catch { break; }
  }

  const { main, weatherId, clouds } = kmaToWeather(pty, sky);
  return {
    cityName:    '',
    country:     'KR',
    temp:        Math.round(temp),
    feelsLike:   calcFeelsLike(temp, windSpeed, humidity),
    humidity:    Math.round(humidity),
    windSpeed:   Math.round(windSpeed * 10) / 10,
    main,
    weatherId,
    description: '',
    clouds,
    _source:     'KMA',
  };
}

/* ===== 기상청 단기예보 (1시간 간격, 3일치, NO_DATA 시 이전 발표 시각 재시도) ===== */
async function fetchKmaForecast(lat, lon) {
  const { nx, ny } = latLonToGrid(lat, lon);
  const times = getVilageFcstBaseTimes();
  let items;
  for (const bt of times) {
    try {
      const json = await apiFetch(buildKmaUrl('getVilageFcst', { ...bt, nx, ny, numOfRows: 1500 }));
      items      = parseKmaItems(json, '단기예보');
      break;
    } catch (e) {
      if (!isNoData(e) || bt === times.at(-1)) throw e;
    }
  }

  // (fcstDate, fcstTime) 단위로 그룹화
  const map = new Map();
  for (const item of items) {
    const key = `${item.fcstDate}_${item.fcstTime}`;
    if (!map.has(key)) map.set(key, { d: item.fcstDate, t: item.fcstTime });
    map.get(key)[item.category] = Number(item.fcstValue);
  }

  return Array.from(map.values())
    .map(({ d, t, TMP = 0, PTY = 0, SKY = 1 }) => {
      const w = kmaToWeather(PTY, SKY);
      return {
        dt:      Math.floor(new Date(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8), +t.slice(0, 2)).getTime() / 1000),
        main:    { temp: TMP },
        weather: [{ main: w.main, id: w.weatherId }],
      };
    })
    .sort((a, b) => a.dt - b.dt);
}

/* ===== OWM 좌표 기반 현재 날씨 / 예보 (해외) ===== */
async function fetchOWMCurrentWeather(lat, lon) {
  const url = `${OWM_BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric&lang=kr`;
  return normalizeOWM(await apiFetch(url));
}

async function fetchOWMForecast(lat, lon) {
  const url = `${OWM_BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric&lang=kr`;
  const raw = await apiFetch(url);
  return raw.list ?? [];
}

/* ===== OWM 정규화 (해외 fallback) ===== */
function normalizeOWM(raw) {
  const w = raw.weather?.[0] ?? {};
  return {
    cityName:    raw.name ?? '',
    country:     raw.sys?.country ?? '',
    temp:        Math.round(raw.main?.temp ?? 0),
    feelsLike:   Math.round(raw.main?.feels_like ?? raw.main?.temp ?? 0),
    humidity:    raw.main?.humidity ?? 0,
    windSpeed:   Math.round((raw.wind?.speed ?? 0) * 10) / 10,
    main:        w.main        ?? 'Clear',
    weatherId:   w.id          ?? 800,
    description: w.description ?? '',
    clouds:      raw.clouds?.all ?? 0,
    _source:     'OWM',
  };
}

/* ===== 현재 날씨 (한국: KMA → CORS 실패 시 Open-Meteo / 해외: Open-Meteo) ===== */
async function fetchWeatherByCoords(lat, lon) {
  const city  = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cache = readCache(WEATHER_CACHE_KEY);
  if (isFresh(cache, city)) return cache.data;

  try {
    let data;
    if (isKoreanCoords(lat, lon)) {
      try {
        data = await fetchKmaCurrentWeather(lat, lon);
      } catch {
        data = await fetchOpenMeteoCurrentWeather(lat, lon);
      }
    } else {
      try {
        data = await fetchOWMCurrentWeather(lat, lon);
      } catch {
        data = await fetchOpenMeteoCurrentWeather(lat, lon);
      }
    }
    writeCache(WEATHER_CACHE_KEY, city, data);
    return data;
  } catch (err) {
    if (err.code === 'NETWORK' && cache) return { ...cache.data, _offline: true };
    throw err;
  }
}

async function fetchWeatherByCity(city) {
  const cache = readCache(WEATHER_CACHE_KEY);
  if (isFresh(cache, city)) return cache.data;
  const url = `${OWM_BASE}/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OWM_API_KEY}&units=metric&lang=kr`;
  try {
    const data = normalizeOWM(await apiFetch(url));
    writeCache(WEATHER_CACHE_KEY, city, data);
    return data;
  } catch (err) {
    if (err.code === 'NETWORK' && cache) return { ...cache.data, _offline: true };
    throw err;
  }
}

/* ===== 예보 (한국: KMA → CORS 실패 시 Open-Meteo / 해외: Open-Meteo) ===== */
async function fetchForecastByCoords(lat, lon) {
  const city  = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cache = readCache(FORECAST_CACHE_KEY);
  if (isFresh(cache, city)) return cache.data;

  try {
    let list;
    if (isKoreanCoords(lat, lon)) {
      try {
        list = await fetchKmaForecast(lat, lon);
      } catch {
        list = await fetchOpenMeteoForecast(lat, lon);
      }
    } else {
      try {
        list = await fetchOWMForecast(lat, lon);
      } catch {
        list = await fetchOpenMeteoForecast(lat, lon);
      }
    }
    writeCache(FORECAST_CACHE_KEY, city, list);
    return list;
  } catch (err) {
    if (err.code === 'NETWORK') return cache ? cache.data : null;
    throw err;
  }
}

async function fetchForecastByCity(city) {
  const cache = readCache(FORECAST_CACHE_KEY);
  if (isFresh(cache, city)) return cache.data;
  const url = `${OWM_BASE}/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OWM_API_KEY}&units=metric&lang=kr`;
  try {
    const raw = await apiFetch(url);
    writeCache(FORECAST_CACHE_KEY, city, raw.list);
    return raw.list;
  } catch (err) {
    if (err.code === 'NETWORK') return cache ? cache.data : null;
    throw err;
  }
}

/* ===== Nominatim 전용 fetch (타임아웃 8초) ===== */
async function nominatimFetch(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return res.json();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/* ===== 역지오코딩 (좌표 → 도시명 + 국가코드) ===== */
async function reverseGeocode(lat, lon) {
  try {
    const json = await nominatimFetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ko`,
    );
    if (!json) return null;
    const a       = json.address ?? {};
    const city    = (a.city || a.town || a.village || a.county || '')
      .replace(/(특별시|광역시|특별자치시|특별자치도)$/, '');
    const country = (a.country_code ?? '').toUpperCase();
    if (a.country_code === 'kr') {
      const district = a.city_district || a.suburb || '';
      if (city && district) return { city: `${city} ${district}`, country };
    }
    return { city: city || null, country };
  } catch {
    return null;
  }
}

/* ===== 한국 도시 좌표 직접 매핑 ===== */
const KR_CITY_MAP = {
  서울: [37.5665, 126.9780], 부산: [35.1796, 129.0756],
  인천: [37.4563, 126.7052], 대구: [35.8714, 128.6014],
  광주: [35.1595, 126.8526], 대전: [36.3504, 127.3845],
  울산: [35.5384, 129.3114], 세종: [36.4800, 127.2890],
  수원: [37.2636, 127.0286], 고양: [37.6584, 126.8320],
  경기광주: [37.4294, 127.2553],
  용인: [37.2410, 127.1775], 성남: [37.4449, 127.1388],
  부천: [37.5034, 126.7660], 화성: [37.2002, 126.8316],
  남양주: [37.6361, 127.2165], 안산: [37.3236, 126.8219],
  안양: [37.3943, 126.9568], 평택: [36.9921, 127.1127],
  시흥: [37.3800, 126.8030], 파주: [37.7609, 126.7800],
  의정부: [37.7382, 127.0337], 김포: [37.6150, 126.7157],
  광명: [37.4784, 126.8648], 하남: [37.5396, 127.2147],
  군포: [37.3613, 126.9350], 이천: [37.2724, 127.4350],
  안성: [37.0080, 127.2800], 오산: [37.1498, 127.0769],
  여주: [37.2980, 127.6372], 양평: [37.4914, 127.4875],
  가평: [37.8315, 127.5099], 연천: [38.0969, 127.0742],
  포천: [37.8947, 127.2005], 동두천: [37.9036, 127.0612],
  구리: [37.5966, 127.1296], 과천: [37.4292, 126.9876],
  의왕: [37.3447, 126.9683],
  춘천: [37.8813, 127.7298], 원주: [37.3422, 127.9201],
  강릉: [37.7519, 128.8761], 속초: [38.2070, 128.5918],
  동해: [37.5246, 129.1143], 삼척: [37.4500, 129.1650],
  태백: [37.1642, 128.9856], 정선: [37.3808, 128.6605],
  홍천: [37.6974, 127.8882], 횡성: [37.4920, 127.9850],
  영월: [37.1838, 128.4615], 평창: [37.3706, 128.3918],
  인제: [38.0707, 128.1696], 양구: [38.1082, 127.9899],
  화천: [38.1050, 127.7095], 철원: [38.1467, 127.3136],
  강원고성: [38.3796, 128.4676], 양양: [38.0762, 128.6194],
  청주: [36.6424, 127.4890], 충주: [36.9910, 127.9259],
  제천: [37.1324, 128.1905], 단양: [36.9849, 128.3651],
  음성: [36.9405, 127.6898], 진천: [36.8560, 127.4347],
  괴산: [36.8145, 127.7874], 보은: [36.4897, 127.7292],
  옥천: [36.3064, 127.5722], 영동: [36.1746, 127.7783],
  증평: [36.7857, 127.5829],
  천안: [36.8151, 127.1139], 아산: [36.7897, 127.0018],
  서산: [36.7848, 126.4503], 당진: [36.8930, 126.6280],
  홍성: [36.6009, 126.6601], 예산: [36.6840, 126.8481],
  공주: [36.4466, 127.1192], 논산: [36.1868, 127.0987],
  보령: [36.3331, 126.6126], 서천: [36.0803, 126.6913],
  부여: [36.2759, 126.9101], 청양: [36.4583, 126.8025],
  금산: [36.1095, 127.4876], 계룡: [36.2740, 127.2488],
  태안: [36.7456, 126.2980],
  전주: [35.8242, 127.1480], 익산: [35.9483, 126.9577],
  군산: [35.9676, 126.7367], 정읍: [35.5700, 126.8560],
  남원: [35.4165, 127.3893], 김제: [35.8033, 126.8801],
  완주: [35.9063, 127.1610], 무주: [35.9045, 127.6600],
  진안: [35.7921, 127.4242], 장수: [35.6477, 127.5213],
  임실: [35.6175, 127.2856], 순창: [35.3741, 127.1395],
  고창: [35.4354, 126.7022], 부안: [35.7316, 126.7330],
  목포: [34.8118, 126.3922], 여수: [34.7604, 127.6622],
  순천: [34.9507, 127.4871], 나주: [35.0160, 126.7108],
  광양: [34.9407, 127.6956], 담양: [35.3216, 126.9882],
  곡성: [35.2819, 127.2910], 구례: [35.2025, 127.4621],
  고흥: [34.6097, 127.2822], 보성: [34.7713, 127.0785],
  화순: [35.0644, 126.9853], 장흥: [34.6816, 126.9073],
  강진: [34.6425, 126.7692], 해남: [34.5735, 126.5990],
  영암: [34.8004, 126.6963], 무안: [34.9904, 126.4816],
  함평: [35.0656, 126.5169], 영광: [35.2779, 126.5122],
  장성: [35.3016, 126.7873], 완도: [34.3106, 126.7548],
  진도: [34.4868, 126.2623], 신안: [34.8313, 126.1079],
  포항: [36.0190, 129.3435], 경주: [35.8562, 129.2247],
  김천: [36.1399, 128.1136], 안동: [36.5684, 128.7294],
  구미: [36.1195, 128.3444], 영주: [36.8057, 128.6239],
  영천: [35.9732, 128.9382], 상주: [36.4108, 128.1590],
  문경: [36.5867, 128.1861], 경산: [35.8251, 128.7413],
  의성: [36.3527, 128.6977], 청송: [36.4354, 129.0569],
  영양: [36.6666, 129.1127], 영덕: [36.4155, 129.3655],
  청도: [35.6473, 128.7355], 고령: [35.7298, 128.2660],
  성주: [35.9178, 128.2836], 칠곡: [35.9955, 128.4016],
  예천: [36.6515, 128.4538], 봉화: [36.8931, 128.7323],
  울진: [36.9930, 129.4003], 울릉: [37.4844, 130.9054],
  군위: [36.2398, 128.5722],
  창원: [35.2280, 128.6817], 진주: [35.1800, 128.1076],
  통영: [34.8544, 128.4334], 사천: [35.0734, 128.0643],
  김해: [35.2281, 128.8890], 밀양: [35.5036, 128.7462],
  거제: [34.8801, 128.6211], 양산: [35.3350, 129.0367],
  의령: [35.3231, 128.2617], 함안: [35.2735, 128.4060],
  창녕: [35.5457, 128.4925], 고성: [34.9769, 128.3223],
  남해: [34.8374, 127.8924], 하동: [35.0672, 127.7516],
  산청: [35.4149, 127.8740], 함양: [35.5208, 127.7262],
  거창: [35.6866, 127.9098], 합천: [35.5661, 128.1658],
  제주: [33.4996, 126.5312], 서귀포: [33.2541, 126.5600],
};

const KR_CITY_ALIAS = {
  제주도: '제주', 거제도: '거제', 울릉도: '울릉', 독도: '울릉',
  서울특별시: '서울', 서울시: '서울',
  부산광역시: '부산', 부산시: '부산',
  인천광역시: '인천', 인천시: '인천',
  대구광역시: '대구', 대구시: '대구',
  광주광역시: '광주', 광주시: '광주',
  대전광역시: '대전', 대전시: '대전',
  울산광역시: '울산', 울산시: '울산',
  세종특별자치시: '세종', 세종시: '세종',
  '경기광주시': '경기광주', '광주시(경기)': '경기광주', '광주군': '경기광주',
  '강원도고성': '강원고성', '고성(강원)': '강원고성', '강원 고성': '강원고성',
  '경남고성': '고성', '고성(경남)': '고성',
};

/* ===== 지오코딩 ===== */
async function geocodeCityKorean(city) {
  const normalized = KR_CITY_ALIAS[city] ?? city;
  const coords = KR_CITY_MAP[normalized];
  if (coords) return { lat: coords[0], lon: coords[1], canonicalName: normalized };
  for (const [name, coord] of Object.entries(KR_CITY_MAP)) {
    if (normalized.startsWith(name) && normalized.length > name.length)
      return { lat: coord[0], lon: coord[1], canonicalName: name };
  }
  const results = await nominatimFetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
  );
  if (!results) throw Object.assign(new Error('인터넷 연결을 확인해주세요.'), { code: 'NETWORK' });
  if (!results.length) throw Object.assign(new Error(`'${city}'을(를) 찾을 수 없습니다.`), { code: 'NOT_FOUND' });
  const lat = parseFloat(results[0].lat);
  const lon = parseFloat(results[0].lon);
  if (isNaN(lat) || isNaN(lon)) throw Object.assign(new Error(`'${city}'을(를) 찾을 수 없습니다.`), { code: 'NOT_FOUND' });
  return { lat, lon };
}

async function geocodeCity(city) {
  if (/[가-힣]/.test(city)) return geocodeCityKorean(city);
  // featuretype=settlement: 도시·읍·마을만 반환 (도로·건물 제외)
  const results = await nominatimFetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=1&featuretype=settlement`,
  );
  if (!results) throw Object.assign(new Error('인터넷 연결을 확인해주세요.'), { code: 'NETWORK' });
  if (!results.length) throw Object.assign(new Error(`'${city}'을(를) 찾을 수 없습니다.`), { code: 'NOT_FOUND' });
  const lat = parseFloat(results[0].lat);
  const lon = parseFloat(results[0].lon);
  if (isNaN(lat) || isNaN(lon)) throw Object.assign(new Error(`'${city}'을(를) 찾을 수 없습니다.`), { code: 'NOT_FOUND' });
  return { lat, lon };
}
