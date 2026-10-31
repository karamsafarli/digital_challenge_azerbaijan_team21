// Engine settings an operator can change at runtime. Defaults come from env (config.js);
// saved values live in the Setting table and override them on startup.

import { prisma } from '../db.js';
import { config } from '../config.js';

export const EDITABLE_SETTINGS = ['alertWindowMinutes', 'alertMinReports', 'densityWindowMinutes', 'reportCooldownSeconds'];

export function currentSettings() {
  return Object.fromEntries(EDITABLE_SETTINGS.map((key) => [key, config[key]]));
}

export async function loadSettings() {
  const rows = await prisma.setting.findMany({ where: { key: { in: EDITABLE_SETTINGS } } });
  rows.forEach((row) => {
    config[row.key] = row.value;
  });
  return currentSettings();
}

export async function updateSettings(changes) {
  const entries = Object.entries(changes).filter(([key]) => EDITABLE_SETTINGS.includes(key));
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  );
  entries.forEach(([key, value]) => {
    config[key] = value;
  });
  return currentSettings();
}
