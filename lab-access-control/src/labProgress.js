/**
 * إرسال حالة إنجاز اللاب (الوصول لـ Admin Panel) إلى API الموقع الأساسي.
 */

const MAIN_SITE_API_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAIN_SITE_API_URL?.trim();

export async function reportLabObjective(objectiveId, payload = {}) {
  if (!MAIN_SITE_API_URL) return;

  const url = MAIN_SITE_API_URL.replace(/\/$/, '') + '/api/lab-progress';
  const body = {
    labId: 'access_control',
    objectiveId,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      mode: 'cors',
    });
  } catch (err) {
    console.warn('[Lab] Failed to report objective to main site:', err);
  }
}
