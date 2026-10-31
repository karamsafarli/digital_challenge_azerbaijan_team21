# Texniki izah sənədi

**Layihə:** Smart Transit & Crowdsourcing Engine — Bakı ictimai nəqliyyatı üçün real vaxt marşrut və sıxlıq analitikası sistemi
**Müsabiqə:** Digital Azerbaijan Challenge 2026 — yarımfinal · **Komanda:** 21 · **Tarix:** 31 oktyabr 2026
**Mənbə kodu:** https://github.com/karamsafarli/digital_challenge_azerbaijan_team21

---

## 1. Məşğul olunan problem

Bakıda pik saatlarda avtobus xətləri qeyri-bərabər yüklənir: bəzi xətlərdə sərnişinlər dayanacaqlarda qalır, digərlərində isə avtobuslar demək olar ki, boş hərəkət edir. Bunun üç səbəbi var:

1. **Sərnişin informasiyasızdır** — avtobusun harada olduğunu, nə vaxt gələcəyini və nə qədər dolu olduğunu bilmir.
2. **Dispetçerin operativ məlumatı yoxdur** — xətlər üzrə real sıxlıq görünmür, problem gec aşkarlanır.
3. **Reaksiya mexanizmi yoxdur** — sıxlıq aşkarlansa belə, əlavə avtobusun ayrılması və sərnişinlərin məlumatlandırılması əl ilə, gec baş verir.

## 2. Həll konsepsiyası

Sistem iki məlumat mənbəyini birləşdirir — **GPS/sensor məlumatları** (avtobusun yeri, sürəti, doluluğu) və **crowdsourcing** (sərnişinlərin sıxlıq bildirişləri) — və onları iki istifadəçi qrupuna xidmət edən vahid platformada emal edir:

- **Sərnişin tətbiqi:** canlı xəritə, dayanacaq üzrə gəliş vaxtı (ETA), sıxlığı bildirmək (Aşağı / Orta / Yüksək), dispetçer elanları.
- **Operator konsolu:** xətlər üzrə canlı sıxlıq xəritəsi və siyahısı, avtomatik anomaliya xəbərdarlığı («Əlavə avtobus ehtiyatı ayrılmalıdır»), bir kliklə avtobus göndərmə və ya xətlər arası köçürmə, elanlar, bildirişlərin moderasiyası, xəbərdarlıq tarixçəsi və KPI-lar, qaydaların konfiqurasiyası.

Beləliklə sistem **«aşkarla → xəbərdar et → tədbir gör → məlumatlandır»** dövrəsini tam bağlayır: anomaliya aşkarlanır, dispetçer xəbərdar olur, avtobus göndərilir, xəbərdarlıq avtomatik həll olunur, sərnişinlər elan alır və sıxlıq azalır.

## 3. Layihənin strukturu və arxitekturası

### 3.1 Komponentlər

| Komponent | Texnologiya | Vəzifə |
|---|---|---|
| Frontend | React 18, Vite, Tailwind CSS, react-leaflet, Socket.IO client | Sərnişin tətbiqi və operator konsolu (SPA), rol əsaslı marşrutlaşdırma |
| Veb server | nginx (frontend konteynerində) | Statik fayllar, `/api` və `/socket.io` üçün proksi (WebSocket daxil) |
| Backend | Node.js 20, Express, Socket.IO, zod, JWT, bcrypt | REST API, real vaxt hadisələri, analitika mühərriki, GPS simulyatoru |
| Verilənlər bazası | PostgreSQL 16 + Prisma ORM | Marşrutlar, avtobuslar, bildirişlər, snapshot-lar, xəbərdarlıqlar, dispetçer jurnalı |
| Konteynerləşdirmə | Docker, Docker Compose | Bir əmrlə işə salınma, healthcheck-lər, ardıcıl start |

### 3.2 Backend qatları

```
routes → middleware (validasiya, autentifikasiya, rate limit)
       → controllers (HTTP qatı)
       → services (sırf biznes məntiqi: density, eta, anomaly, fleet, simulator)
       → Prisma ORM → PostgreSQL
jobs: GPS simulyatoru (3 s) · Analitika mühərriki (30 s)
socket: ümumi kanallar + yalnız operatorlar üçün otaq
```

Biznes qaydaları verilənlər bazasından asılı olmayan **sırf funksiyalar** kimi yazılıb — bu, onları ayrıca test etməyə və gələcəkdə real məlumat mənbələri ilə dəyişmədən istifadə etməyə imkan verir.

### 3.3 Məlumat axını

1. **GPS simulyatoru** hər 3 saniyədə avtobusları marşrut boyunca hərəkət etdirir və bütün klientlərə mövqeləri göndərir.
2. **Sərnişin bildirişi** validasiya, rol və spam yoxlamasından keçir, saxlanılır və həmin xəttin sıxlığı dərhal yenidən hesablanır.
3. **Analitika mühərriki** hər 30 saniyədə bütün xətlər üçün sıxlıq snapshot-u yazır və anomaliya qaydasını yoxlayır; qayda ödənərsə xəbərdarlıq yaradılır və yalnız operatorlara göndərilir.
4. **Dispetçer** tövsiyəyə əməl edir: avtobus xəttə əlavə olunur, sərnişinlər paylanır, xəbərdarlıq həll olunur, sərnişinlərə elan gedir.

### 3.4 Verilənlər modeli

`User` (rol: sərnişin/operator, blok), `Route` (polilayn, uzunluq), `Stop`, `RouteStop` (sıra və marşrut başlanğıcından məsafə), `Bus` (status: xəttdə/ehtiyat, mövqe, istiqamət, sürət, doluluq), `GpsPing` (tarixçə), `CrowdReport` (səviyyə, müəllif, işarə), `DensitySnapshot` (sıxlığın zaman sırası), `Alert` (status, detallar, həll yolu), `DispatchAction` (dispetçer jurnalı), `Announcement` (elanlar), `Setting` (qaydaların runtime ayarları). Sxem 3 miqrasiya ilə versiyalanıb.

## 4. Alqoritmlər

### 4.1 Sıxlıq indeksi
Hər bildirişin dəyəri (Aşağı 0.2, Orta 0.55, Yüksək 0.9) yaşına görə çəkilir: çəki hər 5 dəqiqədə yarıya düşür, 15 dəqiqədən köhnə bildirişlər nəzərə alınmır. Nəticə avtobusların orta doluluğu ilə birləşdirilir: 3 və daha çox bildiriş olduqda sərnişin rəyinin payı 70%, az olduqda 50%. İndeks 0.40-dan aşağı — Aşağı, 0.70-dən aşağı — Orta, yuxarı — Yüksək. Bu yanaşma tək bir sərnişinin bütün xəttin vəziyyətini dəyişməsinin qarşısını alır, eyni zamanda kütləvi bildirişlərə tez reaksiya verir.

### 4.2 Gəliş vaxtı (ETA)
Avtobuslar marşrut boyunca gedib-qayıdır. Dayanacağa qalan məsafə istiqamət nəzərə alınaraq hesablanır (dayanacağı keçmiş avtobus son dayanacaqdan geri dönməlidir). Sürət xəttin sıxlığına görə azaldılır (Orta ×0.85, Yüksək ×0.7), hər aralıq dayanacaq üçün 20 saniyə əlavə olunur.

### 4.3 Anomaliya qaydası («10 dəqiqə ərzində Yüksək»)
Tapşırıqdakı tələb belə şərh edilib: xəttin sıxlığı **10 dəqiqə fasiləsiz** Yüksək olmalı və bu müddətdə ən azı 3 Yüksək sərnişin bildirişi daxil olmalıdır. Əlavə qoruyucu şərtlər: məlumatda 2 dəqiqədən uzun boşluq olmamalıdır (sistem dayansa belə yalançı «fasiləsiz» nəticə alınmır), eyni xətt üçün aktiv xəbərdarlıq təkrarlanmır, dispetçer xəbərdarlığı bağladıqdan sonra yenisi üçün tam yeni 10 dəqiqəlik dövr tələb olunur. Bütün parametrlər operator tərəfindən dəyişdirilə bilər.

### 4.4 Dispetçer məntiqi
Əlavə avtobus depodan və ya sakit xətdən götürülə bilər. Köçürmə üçün yalnız Yüksək olmayan və 2-dən çox avtobusu olan xətlər, ən az sıx olandan başlayaraq təklif olunur; həmin xəttin ən boş avtobusu seçilir. Avtobus əlavə olunduqda xəttin ümumi sərnişin sayı avtobuslar arasında bərabər bölünür, göndərişdən əvvəlki bildirişlər isə köhnəlmiş sayılır.

## 5. Seçilmiş texnologiyalar və səbəbləri

| Texnologiya | Niyə seçildi |
|---|---|
| **React + Vite** | Komponent əsaslı UI, sürətli inkişaf və build; geniş ekosistem |
| **Tailwind CSS** | Vahid dizayn sistemi, responsiv (mobil-first) interfeysin sürətli qurulması |
| **Leaflet + OpenStreetMap** | Açıq mənbəli, API açarı tələb etmir, Bakı xəritəsi üçün kifayət qədər detallı |
| **Node.js + Express** | Real vaxt və I/O yüklü sistemlər üçün uyğun, frontend ilə eyni dil |
| **Socket.IO** | Avtobus mövqeləri və xəbərdarlıqlar üçün iki tərəfli real vaxt əlaqə, avtomatik yenidən qoşulma, otaqlar (rol əsaslı paylama) |
| **PostgreSQL** | Etibarlı relyasiya bazası, indekslər, tranzaksiyalar, JSON sahələri |
| **Prisma ORM** | Tip-təhlükəsiz sorğular, miqrasiyalar, seed; SQL injection riskini aradan qaldırır |
| **zod** | Bütün daxil olan məlumatların sxem əsaslı validasiyası |
| **JWT + bcrypt** | Stateless autentifikasiya, şifrələrin təhlükəsiz saxlanması |
| **Vitest + Supertest** | Sürətli unit və API testləri |
| **Docker Compose** | Jüri kompüterində bir əmrlə, mühitdən asılı olmadan işə salınma |

## 6. Təhlükəsizlik

- Şifrələr bcrypt ilə hash-lənir; sessiyalar 12 saatlıq JWT ilə.
- **Rol əsaslı giriş server tərəfində** yoxlanılır: operator API-ləri digər istifadəçilər üçün 401/403 qaytarır; operator hadisələri (xəbərdarlıqlar, bildiriş axını) yalnız autentifikasiya olunmuş operator socket otağına göndərilir.
- Operator hesabları qeydiyyatla yaradıla bilməz.
- Bütün girişlər zod ilə validasiya olunur; JSON ölçüsü məhduddur.
- Spam/sui-istifadəyə qarşı: IP üzrə rate limit (bildiriş 20/dəq, giriş 10/dəq), hesab üzrə bildiriş fasiləsi, operator tərəfindən bildirişlərin işarələnməsi və istifadəçilərin bloklanması (işarələnmiş bildirişlər analitikaya daxil edilmir).

## 7. Test və etibarlılıq

- **106 avtomatik test** (Vitest + Supertest): sıxlıq, ETA, anomaliya qaydasının kənar halları (9 dəqiqə kifayət etmir, ortada düşmə, məlumat boşluğu, təkrar xəbərdarlıq), simulyator, dispetçer məntiqi, bütün API endpoint-lərinin validasiyası və status kodları, autentifikasiya və rol yoxlaması.
- **İnteqrasiya yoxlamaları:** canlı bazada 12 dəqiqəlik Yüksək dövrün təkrar oynadılması — xəbərdarlıq dəqiq 10 dəqiqədən sonra və yalnız bir dəfə yarandı; Socket.IO hadisələrinin ayrıca klientlə yoxlanması; brauzerdə hər iki rolun tam ssenarisi.
- **İşə salınma etibarlılığı:** konteyner healthcheck-ləri və ardıcıl start (db → backend → frontend), avtomatik miqrasiya, idempotent seed (restart məlumatı təkrarlamır), fon proseslərinin üst-üstə düşməsinin qarşısı, xətt üzrə kilid (paralel təkrar xəbərdarlıq yoxdur), təmiz `docker compose down -v` → `up --build` ilə yoxlanılıb.

## 8. İstifadə rahatlığı

- Azərbaycan dilində interfeys, mobil-first dizayn (mobil cihazda xəritə + aşağıdan açılan panel, desktopda üzən panel).
- Rəng kodlaşdırması bütün sistemdə vahiddir: yaşıl — Aşağı, narıncı — Orta, qırmızı — Yüksək.
- Toast bildirişləri, yüklənmə skeletləri, aydın xəta mesajları, siçan çarxı ilə üfüqi sürüşdürmə.
- Operator üçün: bütün səhifələrdə görünən yeni xəbərdarlıq banneri, bir kliklə avtobus göndərmə, hazır elan şablonları, KPI-lar.

## 9. Məhdudiyyətlər

- GPS və doluluq məlumatları simulyasiya olunur (simulyator ayrıca moduldur və real lentlə əvəz edilə bilər).
- Marşrutlar real Bakı məkanları əsasında sadələşdirilib; yol şəbəkəsi əvəzinə dayanacaqlar arasında düz xətlər istifadə olunur.
- Xəritə plitələri internet bağlantısı tələb edir.

## 10. Gələcək inkişaf imkanları

1. **Real məlumat inteqrasiyası:** avtobusların AVL/GPS cihazları, BakıKart validatorlarından sərnişin axını, kameralarla sərnişin sayımı.
2. **Proqnozlaşdırma:** tarixi snapshot-lar əsasında maşın öyrənməsi ilə 15–30 dəqiqəlik sıxlıq proqnozu və anomaliyanın baş verməzdən əvvəl xəbərdarlığı.
3. **Avtomatik dispetçer tövsiyələri:** optimallaşdırma alqoritmi ilə ehtiyat avtobusların paylanması, interval (headway) idarəetməsi.
4. **Marşrut planlaşdırma:** sərnişinə daha az sıx alternativ marşrut təklifi, yol şəbəkəsi üzrə (OSRM) dəqiq ETA.
5. **Mobil tətbiq və push bildirişlər:** seçilmiş dayanacaq/xətt üçün fərdi bildirişlər.
6. **Çoxdilli interfeys** (AZ/EN/RU) və əlçatanlıq təkmilləşdirmələri.
7. **Analitika və hesabat:** dövlət qurumları üçün dövri hesabatlar, açıq məlumat (GTFS-Realtime) ixracı.
8. **Miqyaslanma:** Redis adapteri ilə çoxlu backend instansiyası, ayrıca analitika servisi, zaman sıraları üçün TimescaleDB.

## 11. Nəticə

Prototip tapşırığın bütün funksional tələblərini — real vaxt avtobus mövqeyi və ETA, sərnişin sıxlıq bildirişləri, crowdsourcing və GPS əsasında xətlər üzrə sıxlıq xəritəsi, 10 dəqiqəlik anomaliya qaydası ilə avtomatik xəbərdarlıq — yerinə yetirir və onu tövsiyədən real tədbirə (avtobus göndərmə, sərnişinlərin məlumatlandırılması) qədər genişləndirir. Sistem bir əmrlə işə salınır, avtomatik testlərlə əhatə olunub və real məlumat mənbələrinə qoşulmağa hazır arxitekturaya malikdir.
