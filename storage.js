const FEEDBACKS_KEY = 'temco_feedbacks';
const SETTINGS_KEY  = 'temco_settings';

/** @type {{ tpo: string, theme: string }} */
const DEFAULT_SETTINGS = { tpo: 'casual', theme: 'light', gender: 'male' };

const FEEDBACK_AGE_LIMIT_DAYS = 30;
const BIAS_WINDOW_DAYS        = 14;

/* ===== 내부 헬퍼 ===== */

/**
 * 날짜 문자열(YYYY-MM-DD)에서 N일 이전 날짜 문자열을 반환한다.
 * @param {number} days
 * @returns {string}
 */
function daysAgoString(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @typedef {Object} FeedbackEntry
 * @property {string} date       - ISO 날짜 (YYYY-MM-DD)
 * @property {number} feelsLike  - 당시 체감온도 (°C)
 * @property {string} tpo        - 선택한 TPO
 * @property {'hot'|'ok'|'cold'} feedback - 피드백 값
 * @property {string} tempStage  - 추천 단계명
 */

/* ===== 피드백 저장/읽기 ===== */

/**
 * 피드백 항목을 배열에 추가하고 저장한다.
 * 저장 전 30일 이상 된 항목을 자동으로 정리한다.
 * @param {FeedbackEntry} feedbackObj
 */
function saveFeedback(feedbackObj) {
  clearOldFeedbacks();
  const list = getFeedbacks();
  list.push(feedbackObj);
  localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(list));
}

/**
 * 저장된 전체 피드백 배열을 반환한다.
 * @returns {FeedbackEntry[]}
 */
function getFeedbacks() {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACKS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

/**
 * 최근 N일 이내 피드백만 필터링해 반환한다.
 * @param {number} days
 * @returns {FeedbackEntry[]}
 */
function getRecentFeedbacks(days) {
  const cutoff = daysAgoString(days);
  return getFeedbacks().filter((f) => f.date >= cutoff);
}

/**
 * 저장된 날짜 기준 30일 초과 항목을 삭제한다.
 */
function clearOldFeedbacks() {
  const cutoff = daysAgoString(FEEDBACK_AGE_LIMIT_DAYS);
  const fresh = getFeedbacks().filter((f) => f.date >= cutoff);
  localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(fresh));
}

/* ===== 설정 저장/읽기 ===== */

/**
 * 앱 설정을 저장한다. 기존 설정과 병합(merge)한다.
 * @param {Partial<typeof DEFAULT_SETTINGS>} settingsObj
 */
function saveSettings(settingsObj) {
  const current = getSettings();
  const merged  = { ...current, ...settingsObj };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
}

/**
 * 앱 설정을 반환한다. 누락된 키는 기본값으로 채워진다.
 * @returns {typeof DEFAULT_SETTINGS}
 */
function getSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/* ===== 체온 보정 알고리즘 ===== */

/**
 * 최근 14일 피드백을 분석해 개인 체온 보정값을 계산한다.
 *
 * - hot  → +1점
 * - ok   →  0점
 * - cold → −1점
 * - 평균을 반올림한 뒤 −3 ~ +3으로 clamp
 *
 * @param {FeedbackEntry[]} feedbacks - getFeedbacks() 반환값
 * @returns {number} 정수 보정값 (−3 ~ +3)
 */
function calcUserBias(feedbacks) {
  const cutoff = daysAgoString(BIAS_WINDOW_DAYS);
  const recent = feedbacks.filter((f) => f.date >= cutoff);

  if (recent.length === 0) return 0;

  const SCORE = { hot: 1, ok: 0, cold: -1 };
  const sum   = recent.reduce((acc, f) => acc + (SCORE[f.feedback] ?? 0), 0);
  const avg   = sum / recent.length;

  return Math.max(-3, Math.min(3, Math.round(avg)));
}
