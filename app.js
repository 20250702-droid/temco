/*
 * QA 체크리스트 (코드 레벨 검증)
 * ✓ GPS 위치 자동 감지         — requestGeolocation() + Geolocation API
 * ✓ 도시 이름 검색             — fetchWeatherByCity (한글/영문 모두 지원)
 * ✓ 체감온도 6단계 추천        — outfit.js OUTFIT_MAP 6단계 (feelsLike + bias)
 * ✓ TPO 4종류 탭 전환          — tpoBtns 이벤트 + renderOutfit 재호출
 * ✓ 피드백 3종류 저장·이력     — saveFeedback / getRecentFeedbacks(7)
 * ✓ 다크 테마 전환·설정 유지   — applyTheme + saveSettings({ theme })
 * ✓ 일교차 5°C 레이어드 배너   — needsLayering() diff ≥ 5°C
 * ✓ 오프라인 → 캐시 fallback   — weather.js NETWORK 오류 → _offline 플래그
 * ✓ 모바일 360px 레이아웃      — max-width 100% 기본 / 430px @768px
 */


/* ===== DOM 참조 ===== */
const cityForm      = document.getElementById('city-form');
const cityInput     = document.getElementById('city-input');
const locationBtn   = document.getElementById('location-btn');
const loadingEl     = document.getElementById('skeleton-section');
const weatherCard   = document.getElementById('weather-card');

const cityNameEl    = document.getElementById('city-name');
const countryEl     = document.getElementById('country-code');
const weatherStatus = document.getElementById('weather-status');
const tempEl        = document.getElementById('temp');
const feelsLikeEl   = document.getElementById('feels-like');
const humidityEl    = document.getElementById('humidity');
const windSpeedEl   = document.getElementById('wind-speed');

const genderBtns    = document.querySelectorAll('.gender-btn');
const tpoBtns       = document.querySelectorAll('.tpo-btn');
const outfitSection  = document.getElementById('outfit-section');
const outfitGrid     = document.getElementById('outfit-grid');
const tempStageBadge = document.getElementById('temp-stage-badge');
const outfitTopEl    = document.getElementById('outfit-top');
const outfitBottomEl = document.getElementById('outfit-bottom');
const outerRow       = document.getElementById('outer-row');
const outfitOuterEl  = document.getElementById('outfit-outer');
const outfitNotices  = document.getElementById('outfit-notices');

const feedbackBtns  = document.querySelectorAll('.feedback-btn');
const feedbackDoneMsg = document.getElementById('feedback-done-msg');
const historySection = document.getElementById('feedback-history');
const feedbackList  = document.getElementById('feedback-list');

const refreshBtn      = document.getElementById('refresh-btn');
const weatherUpdatedEl = document.getElementById('weather-updated');
const themeToggleBtn  = document.getElementById('theme-toggle');
const forecastSection = document.getElementById('forecast-section');
const forecastCardsEl = document.getElementById('forecast-cards');
const offlineBanner   = document.getElementById('offline-banner');
const toastEl         = document.getElementById('error-toast');
const toastMsgEl      = document.getElementById('error-toast-msg');
const retryBtn        = document.getElementById('retry-btn');

/* ===== Unsplash 이미지 API ===== */
const UNSPLASH_ACCESS_KEY = 'uP1AFEMgl-d1CpVvMzACsOyYuzZX0UUN-jriFJ3i07s';

const _imageCache = new Map();
const IMAGE_STORAGE_KEY = 'temco_image_cache_v9';
const IMAGE_CACHE_TTL   = 7 * 24 * 60 * 60 * 1000; // 7일

function readImageCache() {
  try { return JSON.parse(localStorage.getItem(IMAGE_STORAGE_KEY) ?? '{}'); }
  catch { return {}; }
}

function writeImageCache(store) {
  try { localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(store)); } catch {}
}

function getCachedImage(itemName) {
  if (_imageCache.has(itemName)) return _imageCache.get(itemName);
  const store = readImageCache();
  const entry = store[itemName];
  if (entry && Date.now() - entry.ts < IMAGE_CACHE_TTL) {
    _imageCache.set(itemName, entry.url);
    return entry.url;
  }
  return null;
}

function setCachedImage(itemName, url) {
  _imageCache.set(itemName, url);
  const store = readImageCache();
  store[itemName] = { url, ts: Date.now() };
  writeImageCache(store);
}

async function fetchOutfitImage(itemName, gender = 'male') {
  if (UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY_HERE') return null;
  const baseKeyword = OUTFIT_IMAGE_KEYWORDS[itemName];
  if (!baseKeyword) return null;

  const cacheKey = `${itemName}_${gender}`;
  const cached = getCachedImage(cacheKey);
  if (cached) return cached;

  const genderWord = gender === 'female' ? 'women' : 'men';
  const keyword = `${genderWord} ${baseKeyword}`;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=5&orientation=portrait&content_filter=high&order_by=relevance`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } },
    );
    if (!res.ok) {
      console.warn(`[Unsplash] ${itemName}: HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    const results = data.results ?? [];
    if (results.length === 0) {
      console.warn(`[Unsplash] ${itemName}: 결과 없음 (keyword: "${keyword}")`);
      return null;
    }
    const pick = results[Math.floor(Math.random() * results.length)];
    const url = pick?.urls?.small ?? null;
    if (url) setCachedImage(cacheKey, url);
    return url;
  } catch (err) {
    console.warn(`[Unsplash] ${itemName}: 요청 실패`, err);
    return null;
  }
}

let _renderGen = 0;

async function loadOutfitImage(itemName, imgId, skelId, gen, gender = 'male') {
  const imgEl  = document.getElementById(imgId);
  const skelEl = document.getElementById(skelId);
  if (!imgEl || !skelEl) return;

  imgEl.classList.add('hidden');
  skelEl.classList.remove('hidden', 'no-image');

  const url = await fetchOutfitImage(itemName, gender);
  if (_renderGen !== gen) return;

  if (url) {
    imgEl.onload  = () => { if (_renderGen === gen) { imgEl.classList.remove('hidden'); skelEl.classList.add('hidden'); } };
    imgEl.onerror = () => { if (_renderGen === gen) { skelEl.classList.add('no-image'); } };
    imgEl.src    = url;
    if (imgEl.complete && imgEl.naturalWidth > 0) {
      if (_renderGen === gen) { imgEl.classList.remove('hidden'); skelEl.classList.add('hidden'); }
    }
  } else {
    skelEl.classList.add('no-image');
  }
}

/* ===== 앱 상태 ===== */
let currentTPO          = 'casual';
let currentGender       = 'male';
let currentWeatherData  = null;
let currentForecastList = null;
let currentTempStage    = '';
let _lastLoadFn         = null;
let _toastTimer         = null;
let _lastUpdated        = null;
let _isRefreshing       = false;

/* ===== 유틸 ===== */
function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

/* ===== 테마 ===== */
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/* ===== 설정 복원 ===== */
function initSettings() {
  const settings = getSettings();
  currentTPO    = settings.tpo;
  currentGender = settings.gender ?? 'male';
  applyTheme(settings.theme);
  tpoBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tpo === currentTPO);
  });
  genderBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.gender === currentGender);
  });
}

/* ===== 에러 토스트 ===== */
function showToast(message, persistent = false) {
  toastMsgEl.textContent = message;
  retryBtn.classList.toggle('hidden', !persistent);
  toastEl.classList.remove('hidden');
  clearTimeout(_toastTimer);
  if (!persistent) {
    _toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 3000);
  }
}

function hideToast() {
  toastEl.classList.add('hidden');
  clearTimeout(_toastTimer);
}

/* ===== 오프라인 배너 ===== */
function showOfflineBanner() { offlineBanner.classList.remove('hidden'); }
function hideOfflineBanner() { offlineBanner.classList.add('hidden'); }

/* ===== 스켈레톤 로딩 ===== */
function setLoadingState(isLoading) {
  loadingEl.classList.toggle('hidden', !isLoading);
  if (isLoading) {
    weatherCard.classList.add('hidden');
    forecastSection.classList.add('hidden');
    outfitSection.classList.add('hidden');
  }
}

function showLoading() {
  hideToast();
  setLoadingState(true);
}

function hideLoading() {
  setLoadingState(false);
}

/* ===== 날씨 업데이트 시간 ===== */
function renderUpdatedTime() {
  if (!weatherUpdatedEl || !_lastUpdated) return;
  const mins = Math.floor((Date.now() - _lastUpdated) / 60_000);
  const timeText = mins === 0 ? '방금 업데이트' : `${mins}분 전 업데이트`;
  const source = currentWeatherData?._source ?? '';
  weatherUpdatedEl.textContent = source ? `${timeText} · ${source}` : timeText;
}

/* ===== 날씨 상태 텍스트 매핑 ===== */
// OWM description 대신 clouds.all(%) 기반으로 직접 매핑해 정확도를 높인다
function getWeatherDesc(main, clouds, weatherId) {
  if (main === 'Thunderstorm') return '천둥번개';
  if (main === 'Snow')         return '눈';
  if (main === 'Rain')         return '비';
  if (main === 'Drizzle')      return '이슬비';
  if (['Mist', 'Fog', 'Haze', 'Smoke', 'Dust', 'Sand', 'Ash'].includes(main)) return '안개';
  if (main === 'Squall')       return '돌풍';
  if (main === 'Tornado')      return '토네이도';
  if (main === 'Clear')        return '맑음';
  // OWM weather ID 기준 (clouds.all보다 신뢰도 높음)
  // 800: 맑음  801: 구름조금(11-25%)  802: 구름조금(25-50%)  803: 구름많음(51-84%)  804: 흐림(85-100%)
  if (weatherId === 800 || weatherId === 801) return '맑음';
  if (weatherId === 802)                       return '구름 조금';
  if (weatherId === 803)                       return '구름 많음';
  if (weatherId === 804)                       return '흐림';
  // fallback: clouds.all 기준
  const c = clouds ?? 0;
  if (c <= 25) return '맑음';
  if (c <= 50) return '구름 조금';
  if (c <= 80) return '구름 많음';
  return '흐림';
}

/* ===== 날씨 렌더링 ===== */
function renderWeather(data) {
  cityNameEl.textContent    = data.cityName;
  countryEl.textContent     = data.country;
  weatherStatus.textContent = getWeatherDesc(data.main, data.clouds, data.weatherId);
  tempEl.textContent        = data.temp;
  feelsLikeEl.textContent   = data.feelsLike;
  humidityEl.textContent    = data.humidity;
  windSpeedEl.textContent   = data.windSpeed;
  _lastUpdated = Date.now();
  console.log(`[TEMCO] 날씨 소스: ${data._source ?? '?'} | 온도: ${data.temp}°C | 체감: ${data.feelsLike}°C`);
  renderUpdatedTime();
  weatherCard.classList.remove('hidden');
}

/* ===== 코디 렌더링 ===== */
function renderOutfit(weatherData, forecastList) {
  const gen            = ++_renderGen;
  const bias           = calcUserBias(getFeedbacks());
  const recommendation = getOutfitRecommendation(weatherData, forecastList, currentTPO, bias, currentGender);

  currentTempStage           = recommendation.tempStage;
  tempStageBadge.textContent = recommendation.tempStage;
  outfitTopEl.textContent    = recommendation.top;
  outfitBottomEl.textContent = recommendation.bottom;

  if (recommendation.outer) {
    outfitOuterEl.textContent = recommendation.outer;
    outerRow.classList.remove('hidden');
    outfitGrid.classList.add('three-col');
  } else {
    outerRow.classList.add('hidden');
    outfitGrid.classList.remove('three-col');
  }

  const notices = [];
  if (recommendation.layering.layering) {
    notices.push(`🧣 일교차 ${recommendation.layering.diff}°C — 겉옷을 챙기세요`);
  }
  if (recommendation.extra.umbrella)         notices.push('☂️ 우산을 챙기세요');
  if (recommendation.extra.humidity_warning) notices.push('💧 습도가 높습니다. 통기성 좋은 옷을 입으세요');
  if (recommendation.extra.uv_warning)       notices.push('☀️ 자외선 지수가 높습니다. 선크림을 바르세요');

  outfitNotices.innerHTML = notices.map((n) => `<p class="outfit-notice">${n}</p>`).join('');
  outfitSection.classList.remove('hidden');
  updateFeedbackUI();

  loadOutfitImage(recommendation.top,    'outfit-top-img',    'outfit-top-skeleton',    gen, currentGender);
  loadOutfitImage(recommendation.bottom, 'outfit-bottom-img', 'outfit-bottom-skeleton', gen, currentGender);
  if (recommendation.outer) {
    loadOutfitImage(recommendation.outer, 'outfit-outer-img', 'outfit-outer-skeleton', gen, currentGender);
  }
}

/* ===== 시간대별 예보 스크롤 ===== */
const WEATHER_ICONS = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Smoke: '🌫️',
  Haze: '🌫️', Dust: '🌫️', Fog: '🌫️', Squall: '💨', Tornado: '🌪️',
};

function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// API는 3시간 간격 → 인접 두 점 사이를 선형 보간해 1시간 간격으로 채운다
function interpolateForecastHourly(forecastList) {
  if (!forecastList || forecastList.length < 2) return forecastList ?? [];
  const result = [];
  for (let i = 0; i < forecastList.length - 1; i++) {
    const a     = forecastList[i];
    const b     = forecastList[i + 1];
    const steps = Math.round((b.dt - a.dt) / 3600); // 보통 3
    result.push(a);
    for (let h = 1; h < steps; h++) {
      const t = h / steps;
      result.push({
        dt:      a.dt + h * 3600,
        main:    { temp: a.main.temp + t * (b.main.temp - a.main.temp) },
        weather: t < 0.5 ? a.weather : b.weather, // 가까운 쪽 날씨 아이콘 사용
      });
    }
  }
  result.push(forecastList[forecastList.length - 1]);
  return result;
}

function renderForecastScroll(forecastList) {
  if (!forecastList) return;

  const todayStr   = localDateStr(new Date());
  const hourly     = interpolateForecastHourly(forecastList);
  const todayItems = hourly.filter((item) =>
    localDateStr(new Date(item.dt * 1000)) === todayStr,
  );

  if (todayItems.length === 0) {
    forecastSection.classList.add('hidden');
    return;
  }

  forecastCardsEl.innerHTML = todayItems.map((item) => {
    const d      = new Date(item.dt * 1000);
    const hour   = d.getHours();
    const temp   = Math.round(item.main.temp);
    const icon   = WEATHER_ICONS[item.weather[0].main] ?? '🌡️';
    const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
    return `<div class="forecast-card${isPeak ? ' peak-hours' : ''}">
      <span class="forecast-time">${String(hour).padStart(2, '0')}시</span>
      <span class="forecast-emoji">${icon}</span>
      <span class="forecast-temp">${temp}°</span>
    </div>`;
  }).join('');

  forecastSection.classList.remove('hidden');
}

/* ===== 피드백 UI ===== */
function updateFeedbackUI() {
  const today   = new Date().toISOString().slice(0, 10);
  const todayFb = getFeedbacks().find((f) => f.date === today);

  feedbackBtns.forEach((btn) => {
    btn.disabled = !!todayFb;
    btn.classList.toggle('selected', !!todayFb && btn.dataset.value === todayFb.feedback);
  });

  feedbackDoneMsg.classList.toggle('hidden', !todayFb);
}

/* ===== 피드백 이력 렌더링 ===== */
const FEEDBACK_EMOJI = { hot: '🔥', ok: '✅', cold: '🥶' };

function renderFeedbackHistory() {
  const recent = getRecentFeedbacks(7).sort((a, b) => b.date.localeCompare(a.date));

  feedbackList.innerHTML = recent.length === 0
    ? '<li class="feedback-empty">기록 없음</li>'
    : recent.map((f) => `
      <li class="feedback-item">
        <span class="feedback-item-date">${f.date}</span>
        <span class="feedback-item-stage">${f.tempStage}</span>
        <span class="feedback-item-temp">${f.feelsLike}°C</span>
        <span class="feedback-item-emoji">${FEEDBACK_EMOJI[f.feedback] ?? ''}</span>
      </li>`).join('');

  historySection.classList.remove('hidden');
}

/* ===== 날씨 + 예보 병렬 로드 ===== */
async function loadWeatherByCoords(lat, lon) {
  _lastLoadFn = () => loadWeatherByCoords(lat, lon);
  showLoading();

  let weatherData, forecastList, geoResult;
  try {
    [weatherData, forecastList, geoResult] = await Promise.all([
      fetchWeatherByCoords(lat, lon),
      fetchForecastByCoords(lat, lon),
      reverseGeocode(lat, lon),
    ]);
  } catch (err) {
    handleFetchError(err);
    hideLoading();
    return;
  }

  if (geoResult?.city)    weatherData = { ...weatherData, cityName: geoResult.city };
  if (geoResult?.country) weatherData = { ...weatherData, country:  geoResult.country };
  currentWeatherData  = weatherData;
  currentForecastList = forecastList;
  if (weatherData._offline) showOfflineBanner(); else hideOfflineBanner();

  hideLoading();
  renderWeather(weatherData);
  renderForecastScroll(forecastList);
  renderOutfit(weatherData, forecastList);
  renderFeedbackHistory();
}

async function loadWeatherByCity(city) {
  _lastLoadFn = () => loadWeatherByCity(city);
  showLoading();

  const isKorean = /[가-힣]/.test(city);
  let lat, lon, canonicalName, weatherData, forecastList, geoResult;
  try {
    ({ lat, lon, canonicalName } = await geocodeCity(city));
    [weatherData, forecastList, geoResult] = await Promise.all([
      fetchWeatherByCoords(lat, lon),
      fetchForecastByCoords(lat, lon),
      reverseGeocode(lat, lon),
    ]);
  } catch (err) {
    handleFetchError(err);
    hideLoading();
    return;
  }

  const isKoreanCity = geoResult?.country === 'KR';
  const displayName = canonicalName
    ?? ((isKorean && !isKoreanCity) ? city : (geoResult?.city || (isKorean ? city : city)));
  weatherData = { ...weatherData, cityName: displayName, country: geoResult?.country ?? '' };
  currentWeatherData  = weatherData;
  currentForecastList = forecastList;
  if (weatherData._offline) showOfflineBanner(); else hideOfflineBanner();

  hideLoading();
  renderWeather(weatherData);
  renderForecastScroll(forecastList);
  renderOutfit(weatherData, forecastList);
  renderFeedbackHistory();
}

/* ===== 에러 핸들러 ===== */
function handleFetchError(err) {
  const isNetwork = err.code === 'NETWORK';
  const msg = err.message ?? '알 수 없는 오류가 발생했습니다.';
  showToast(msg, isNetwork);
}

/* ===== 위치 정보 ===== */
async function getLocationByIP() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return null;
    const { latitude, longitude } = await res.json();
    return (latitude && longitude) ? { lat: latitude, lon: longitude } : null;
  } catch {
    return null;
  }
}

async function tryIPLocation() {
  const loc = await getLocationByIP();
  if (loc) {
    showToast('IP 기반 위치를 사용합니다 (대략적).');
    loadWeatherByCoords(loc.lat, loc.lon);
  } else {
    hideLoading();
    showToast('위치를 가져올 수 없습니다. 도시명으로 검색해 주세요.');
    cityInput.focus();
  }
}

function requestGeolocation() {
  showLoading();

  if (!navigator.geolocation) {
    tryIPLocation();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      loadWeatherByCoords(position.coords.latitude, position.coords.longitude);
    },
    () => {
      tryIPLocation();
    },
    { timeout: 10000 },
  );
}


/* ===== 이벤트 바인딩 ===== */

themeToggleBtn.addEventListener('click', () => {
  const settings = getSettings();
  const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  saveSettings({ theme: newTheme });
});

cityForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = cityInput.value.trim();
  if (!raw) {
    showToast('도시명을 입력해 주세요.');
    cityInput.focus();
    return;
  }
  loadWeatherByCity(raw);
});

locationBtn.addEventListener('click', requestGeolocation);

retryBtn.addEventListener('click', () => {
  hideToast();
  if (_lastLoadFn) _lastLoadFn();
});

genderBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentGender = btn.dataset.gender;
    genderBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    saveSettings({ gender: currentGender });
    if (currentWeatherData) renderOutfit(currentWeatherData, currentForecastList);
  });
});

tpoBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentTPO = btn.dataset.tpo;
    tpoBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    saveSettings({ tpo: currentTPO });
    if (currentWeatherData) renderOutfit(currentWeatherData, currentForecastList);
  });
});

feedbackBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!currentWeatherData) return;
    const today = new Date().toISOString().slice(0, 10);
    if (getFeedbacks().find((f) => f.date === today)) return;

    saveFeedback({
      date:       today,
      feelsLike:  currentWeatherData.feelsLike,
      tpo:        currentTPO,
      feedback:   btn.dataset.value,
      tempStage:  currentTempStage,
    });

    updateFeedbackUI();
    renderFeedbackHistory();
  });
});

/* ===== 새로고침 ===== */
function forceRefresh() {
  if (_isRefreshing) return;
  _isRefreshing = true;
  clearWeatherCache();
  if (_lastLoadFn) {
    Promise.resolve(_lastLoadFn()).finally(() => { _isRefreshing = false; });
  } else {
    _isRefreshing = false;
  }
}

refreshBtn.addEventListener('click', forceRefresh);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && _lastLoadFn && _lastUpdated) {
    if (Date.now() - _lastUpdated > 120_000) forceRefresh();
  }
});

/* ===== 자동 갱신 ===== */
// "X분 전 업데이트" 텍스트를 30초마다 갱신
setInterval(renderUpdatedTime, 30_000);

// 탭이 보이는 상태에서 데이터가 15분 이상 오래됐으면 자동 새로고침
setInterval(() => {
  if (_lastLoadFn && _lastUpdated && document.visibilityState === 'visible') {
    if (Date.now() - _lastUpdated > 900_000) forceRefresh();
  }
}, 60_000);

/* ===== 초기화 ===== */
clearOldFeedbacks();
initSettings();
renderFeedbackHistory();
requestGeolocation();
