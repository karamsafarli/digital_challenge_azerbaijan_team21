// Demo data: real Baku landmarks / metro-station areas with approximate coordinates.
// Route numbers are illustrative; stop sequences are simplified for the prototype.

export const stops = {
  sahil: { name: 'Sahil', lat: 40.3717, lng: 49.8443 },
  may28: { name: '28 May', lat: 40.3797, lng: 49.8486 },
  fountains: { name: 'Fəvvarələr meydanı', lat: 40.3707, lng: 49.8366 },
  nizami: { name: 'Nizami', lat: 40.3797, lng: 49.8302 },
  academy: { name: 'Elmlər Akademiyası', lat: 40.3753, lng: 49.815 },
  inshaatchilar: { name: 'İnşaatçılar', lat: 40.3913, lng: 49.8027 },
  yanvar20: { name: '20 Yanvar', lat: 40.404, lng: 49.8085 },
  memarAjami: { name: 'Memar Əcəmi', lat: 40.4113, lng: 49.8143 },
  nasimi: { name: 'Nəsimi', lat: 40.4245, lng: 49.8253 },
  azadliq: { name: 'Azadlıq prospekti', lat: 40.4256, lng: 49.8423 },
  darnagul: { name: 'Dərnəgül', lat: 40.4256, lng: 49.8616 },
  ganjlik: { name: 'Gənclik', lat: 40.4006, lng: 49.8522 },
  narimanov: { name: 'Nəriman Nərimanov', lat: 40.4029, lng: 49.8706 },
  ulduz: { name: 'Ulduz', lat: 40.4148, lng: 49.8913 },
  koroglu: { name: 'Koroğlu', lat: 40.421, lng: 49.918 },
  qaraQarayev: { name: 'Qara Qarayev', lat: 40.4178, lng: 49.934 },
  neftchilar: { name: 'Neftçilər', lat: 40.4095, lng: 49.943 },
  xalqlar: { name: 'Xalqlar Dostluğu', lat: 40.3975, lng: 49.9525 },
  ahmadli: { name: 'Əhmədli', lat: 40.385, lng: 49.9545 },
  haziAslanov: { name: 'Həzi Aslanov', lat: 40.3725, lng: 49.9535 },
  xatai: { name: 'Xətai', lat: 40.383, lng: 49.872 },
};

export const routes = [
  {
    number: '1',
    name: '20 Yanvar – Sahil',
    color: '#2563eb',
    stops: ['yanvar20', 'inshaatchilar', 'academy', 'nizami', 'may28', 'sahil'],
    buses: 4,
  },
  {
    number: '3',
    name: 'Sahil – Koroğlu',
    color: '#16a34a',
    stops: ['sahil', 'may28', 'ganjlik', 'narimanov', 'ulduz', 'koroglu'],
    buses: 4,
  },
  {
    number: '65',
    name: 'Dərnəgül – 20 Yanvar',
    color: '#9333ea',
    stops: ['darnagul', 'azadliq', 'nasimi', 'memarAjami', 'yanvar20'],
    buses: 3,
  },
  {
    number: '88',
    name: 'Həzi Aslanov – Koroğlu',
    color: '#ea580c',
    stops: ['haziAslanov', 'ahmadli', 'xalqlar', 'neftchilar', 'qaraQarayev', 'koroglu'],
    buses: 4,
  },
  {
    number: '14',
    name: 'Fəvvarələr meydanı – Əhmədli',
    color: '#dc2626',
    stops: ['fountains', 'sahil', 'may28', 'xatai', 'ahmadli'],
    buses: 3,
  },
];
