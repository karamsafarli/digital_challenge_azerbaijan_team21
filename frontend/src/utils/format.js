export const LEVELS = ['LOW', 'MEDIUM', 'HIGH'];

export const LEVEL_META = {
  LOW: { label: 'Aşağı', color: '#16a34a', badge: 'bg-green-100 text-green-800 ring-green-600/20' },
  MEDIUM: { label: 'Orta', color: '#d97706', badge: 'bg-amber-100 text-amber-800 ring-amber-600/20' },
  HIGH: { label: 'Yüksək', color: '#dc2626', badge: 'bg-red-100 text-red-800 ring-red-600/20' },
};

/** Occupancy ratio -> level, same thresholds as the backend density engine. */
export function occupancyLevel(occupancy, capacity) {
  const ratio = capacity > 0 ? occupancy / capacity : 0;
  if (ratio >= 0.7) return 'HIGH';
  if (ratio >= 0.4) return 'MEDIUM';
  return 'LOW';
}

export function formatEta(seconds) {
  if (seconds < 60) return 'İndi';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} dəq`;
  return `${Math.floor(minutes / 60)} saat ${minutes % 60} dəq`;
}

export function formatDistance(metres) {
  return metres < 1000 ? `${metres} m` : `${(metres / 1000).toFixed(1)} km`;
}

const MONTHS_AZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];

/** "31 oktyabr" — browsers often lack Azerbaijani month names, so format by hand. */
export function formatDate(value) {
  const d = new Date(value);
  return `${d.getDate()} ${MONTHS_AZ[d.getMonth()]}`;
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
