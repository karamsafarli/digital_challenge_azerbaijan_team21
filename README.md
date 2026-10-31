# Smart Transit & Crowdsourcing Engine — Bakı

**Bakı ictimai nəqliyyatı üçün real vaxt marşrut, gəliş vaxtı (ETA) və sıxlıq analitikası sistemi.**
Sərnişinlər avtobusların harada olduğunu, nə vaxt gələcəyini və nə qədər dolu olduğunu görür, sıxlığı özləri bildirir; dispetçerlər isə xətlər üzrə sıxlığı canlı izləyir, anomaliya xəbərdarlıqlarına reaksiya verir və əlavə avtobusu bir kliklə xəttə göndərir.

> Digital Azerbaijan Challenge 2026 — yarımfinal tapşırığı · Komanda 21

---

## Mündəricat
1. [Problem və həll](#1-problem-və-həll)
2. [Tapşırıq tələblərinin qarşılanması](#2-tapşırıq-tələblərinin-qarşılanması)
3. [Sürətli başlanğıc (Docker)](#3-sürətli-başlanğıc-docker)
4. [Demo hesablar](#4-demo-hesablar)
5. [Jüri üçün 5 dəqiqəlik demo ssenarisi](#5-jüri-üçün-5-dəqiqəlik-demo-ssenarisi)
6. [İstifadə təlimatı — Sərnişin](#6-istifadə-təlimatı--sərnişin)
7. [İstifadə təlimatı — Operator (dispetçer)](#7-istifadə-təlimatı--operator-dispetçer)
8. [Arxitektura](#8-arxitektura)
9. [Analitika mühərriki: alqoritmlər](#9-analitika-mühərriki-alqoritmlər)
10. [API arayışı](#10-api-arayışı)
11. [Real vaxt hadisələri (Socket.IO)](#11-real-vaxt-hadisələri-socketio)
12. [Bütün əmrlər](#12-bütün-əmrlər)
13. [Konfiqurasiya (mühit dəyişənləri)](#13-konfiqurasiya-mühit-dəyişənləri)
14. [Testlər və etibarlılıq](#14-testlər-və-etibarlılıq)
15. [Layihənin strukturu](#15-layihənin-strukturu)
16. [Problemlərin həlli (troubleshooting)](#16-problemlərin-həlli-troubleshooting)
17. [Məhdudiyyətlər və gələcək inkişaf](#17-məhdudiyyətlər-və-gələcək-inkişaf)
18. [Sənədlər](#18-sənədlər)

---

## 1. Problem və həll

**Problem.** Pik saatlarda bəzi avtobus xətləri həddindən artıq sıx olur, digərlərində isə avtobuslar demək olar ki, boş gedir. Sərnişinlər sıxlığı və real gəliş vaxtını görmür, dispetçerlər isə avtobusları dinamik bölüşdürmək üçün operativ məlumatdan məhrumdur.

**Həll.** Sistem iki moduldan ibarətdir:

| Modul | Kim üçün | Nə edir |
|---|---|---|
| **Sərnişin tətbiqi** | Sərnişinlər (mobil və desktop) | Canlı xəritə, dayanacaq üzrə ETA, sıxlığın bildirilməsi (Aşağı / Orta / Yüksək), xidmət elanları |
| **Operator konsolu + Analitika mühərriki** | Dispetçerlər / dövlət qurumu | Xətlər üzrə canlı sıxlıq xəritəsi və siyahısı, 10 dəqiqəlik anomaliya qaydası ilə avtomatik xəbərdarlıq, avtobus göndərmə və xətlər arası köçürmə, elanlar, bildirişlərin moderasiyası, tarixçə, qayda ayarları |

Real GPS lenti olmadığı üçün backend **GPS simulyatoru** ilə işləyir: 18 avtobus 5 real Bakı marşrutu boyunca hərəkət edir, sürət və sərnişin sayı (validator/sensor məlumatı) yaradılır. Simulyator ayrı moduldur — real AVL/GPS lenti ilə əvəz oluna bilər.

---

## 2. Tapşırıq tələblərinin qarşılanması

| Tələb | Həll | Harada |
|---|---|---|
| Marşrut və ya dayanacaq seçildikdə avtobusların real vaxt yerləşməsi | Leaflet xəritəsində canlı avtobuslar (3 saniyədən bir Socket.IO ilə yenilənir) | Sərnişin → xəritə |
| Gözlənilən gəliş vaxtı (ETA) | Marşrut boyu qalan məsafə ÷ sıxlığa görə düzəldilmiş sürət + dayanacaq gözləmələri | Sərnişin → *Dayanacaq* paneli |
| Sərnişinin sıxlıq səviyyəsini bildirməsi (Aşağı/Orta/Yüksək) | Üç böyük düymə, istəyə görə konkret avtobus seçimi, spam qoruması | Sərnişin → *Avtobus nə qədər doludur?* |
| Crowdsourcing + GPS əsasında xətlər üzrə sıxlıq xəritəsi/siyahısı | Bildirişlər (yaxın vaxta daha çox çəki) + avtobus doluluğu → sıxlıq indeksi; canlı cədvəl və rənglənmiş xəritə | Operator → *İcmal* |
| 10 dəqiqə ərzində Yüksək → «Əlavə avtobus ehtiyatı ayrılmalıdır» | Anomaliya qaydası: sıxlıq 10 dəqiqə fasiləsiz Yüksək + ən azı 3 Yüksək bildiriş → avtomatik xəbərdarlıq (banner + kart) | Operator → *Anomaliya xəbərdarlıqları* |
| **Əlavə:** tövsiyəyə əməl etmək | Depodan ehtiyat avtobus göndərmək və ya sakit xətdən köçürmək; xəbərdarlıq avtomatik həll olunur, sərnişinlərə elan gedir | Operator → *Park və dispetçer* |
| Docker ilə işə salınma | `docker compose up --build` — bir əmrlə DB + API + veb | §3 |

---

## 3. Sürətli başlanğıc (Docker)

### Tələblər
- **Docker Desktop** (Windows/macOS) və ya Docker Engine + Compose v2 (Linux). Başqa heç nə tələb olunmur.
- Boş portlar: **8080** (veb), **4000** (API), **5432** (PostgreSQL). Port məşğuldursa — §16.

### İşə salma
```bash
git clone https://github.com/karamsafarli/digital_challenge_azerbaijan_team21.git
cd digital_challenge_azerbaijan_team21
docker compose up --build
```

İlk işə salınma 2–4 dəqiqə çəkir (image-lər yığılır). Konteynerlər ardıcıllıqla qalxır: **db → backend → frontend** (hər biri əvvəlkinin sağlam olmasını gözləyir). Backend başlayanda avtomatik olaraq:
1. verilənlər bazası miqrasiyalarını tətbiq edir;
2. seed məlumatlarını yaradır (5 marşrut, 21 dayanacaq, 18 avtobus, depoda 4 ehtiyat avtobus, 2 demo hesab);
3. GPS simulyatorunu və analitika mühərrikini işə salır.

| Ünvan | Nə var |
|---|---|
| **http://localhost:8080** | Veb tətbiq (giriş səhifəsi) |
| http://localhost:4000/api/health | API sağlamlıq yoxlaması (`{"status":"ok","db":"up"}`) |

Hazır olub-olmadığını yoxlamaq üçün:
```bash
docker compose ps
```
Hər üç servis `healthy`/`Up` olmalıdır.

### Dayandırma və sıfırlama
```bash
docker compose down        # dayandır (məlumatlar qalır)
docker compose down -v     # dayandır və bazanı tam sil (növbəti işə salmada seed yenidən yaranır)
```

---

## 4. Demo hesablar

Seed avtomatik yaradır (dəyərlər `backend/.env.example` faylında da göstərilib):

| Rol | E-poçt | Şifrə | Giriş tabı |
|---|---|---|---|
| **Operator (dispetçer)** | `operator@smarttransit.az` | `Operator2026!` | *Operator* |
| **Sərnişin** | `sernisin@smarttransit.az` | `Sernisin2026!` | *Sərnişin* |

- Sərnişinlər giriş səhifəsində **özləri qeydiyyatdan keçə bilər** (*Qeydiyyatdan keçin*).
- Operator hesabı **qeydiyyatla yaradıla bilməz** — yalnız agentlik (seed) tərəfindən verilir.
- Sərnişin hesabı ilə *Operator* tabından daxil olmaq mümkün deyil; sərnişin `/operator` ünvanını açsa, öz səhifəsinə yönləndirilir, API isə `403` qaytarır.

> Bir neçə sərnişin kimi bildiriş göndərməyi yoxlamaq üçün ikinci brauzerdə (və ya gizli pəncərədə) yeni sərnişin hesabı yaradın.

---

## 5. Jüri üçün 5 dəqiqəlik demo ssenarisi

1. **Operator kimi daxil olun** (http://localhost:8080 → *Operator* tabı). *İcmal* səhifəsində 5 xəttin canlı sıxlığını, 30 dəqiqəlik qrafikləri və rənglənmiş xəritəni görəcəksiniz.
2. **Qaydanı demo üçün qısaldın:** *Qayda ayarları* → *Anomaliya pəncərəsi* = `1` dəq → *Yadda saxla*. (Tapşırıq tələbi 10 dəqiqədir; dəyişiklik dərhal, restart-sız tətbiq olunur. Demodan sonra `10`-a qaytarın.)
3. **Pik saatı simulyasiya edin:** *İcmal* → *Xətlər üzrə sıxlıq* cədvəlində məsələn xətt **14** sətrində ▶ (*Pik saat*) düyməsi. Sistem real vaxtda Yüksək bildirişlər göndərir və avtobusları doldurur — sıxlıq bir neçə saniyədə yüksəlir.
4. **~1–2 dəqiqə gözləyin:** qırmızı banner və kart çıxacaq — *«Xətt №14: 1 dəqiqədir sıxlıq Yüksəkdir. Əlavə avtobus ehtiyatı ayrılmalıdır.»*
5. **Tövsiyəyə əməl edin:** kartda **Avtobus göndər** → *Depodan ehtiyat avtobus* → *Göndər*. Xəbərdarlıq avtomatik bağlanır, xəttin doluluğu azalır, *Park və dispetçer* jurnalına qeyd düşür.
6. **Sərnişin tərəfi:** ikinci pəncərədə sərnişin kimi daxil olun → xətt **14**-ü seçin → yuxarıda avtomatik elanı görəcəksiniz (*«Xətt №14-ə əlavə avtobus çıxdı...»*). Dayanacaq seçib ETA-ya baxın, *Yüksək* bildirin.
7. **Operator → Sərnişin bildirişləri:** göndərdiyiniz bildiriş canlı axında görünür — onu *İşarələ* (spam) və ya müəllifi *Blokla* edə bilərsiniz.
8. **Xəbərdarlıq tarixçəsi:** reaksiya və həll müddətləri, həll yolu (hansı avtobusla).

---

## 6. İstifadə təlimatı — Sərnişin

Giriş: http://localhost:8080 → *Sərnişin* tabı → daxil olun və ya qeydiyyatdan keçin. Desktopda xəritə tam ekrandır, panel solda üzür; mobil cihazda xəritə yuxarıda, panel aşağıdan açılan vərəq kimidir.

| Funksiya | Necə istifadə olunur |
|---|---|
| **Canlı xəritə** | Avtobus nişanında xətt nömrəsi, kənar rəngi isə doluluğu göstərir (yaşıl — Aşağı, narıncı — Orta, qırmızı — Yüksək). Üzərinə gətirdikdə: nömrə nişanı, doluluq %, sürət. |
| **Marşrut seçimi** | *Marşrut* zolağında xətt düyməsinə klikləyin (siçan çarxı və ya sürükləmə ilə sürüşdürülür). Hər düymədəki rəngli nöqtə xəttin cari sıxlığıdır. Seçilmiş xətt xəritədə yaxınlaşdırılır, uzunluğu və avtobus sayı göstərilir. |
| **Dayanacaq və ETA** | Xətt seçilibsə, dayanacaqlar şaquli xətt şəklində görünür; seçilməyibsə — açılan siyahıdan seçin və ya xəritədə dayanacağa toxunun. *Yaxınlaşan avtobuslar* siyahısı ən yaxın avtobusu vurğulayır, dəqiqə, məsafə və doluluq göstərir; hər 5 saniyədə yenilənir. |
| **Sıxlığı bildirmək** | Xətt seçin → (istəyə görə) konkret avtobusu seçin → **Aşağı / Orta / Yüksək**. Təsdiq bildirişi xəttin yeni sıxlığını göstərir. Eyni xətt üçün 30 saniyədə bir bildiriş göndərmək olar. |
| **Elanlar** | Dispetçer elanları panelin yuxarısında rəngli kartlarla görünür (məlumat / xəbərdarlıq / təcili) və canlı yenilənir. |
| **Çıxış** | Sağ yuxarıda adınızın yanındakı çıxış düyməsi. |

> **Niyə bir «Yüksək» bildirişi xətti dərhal qırmızı etmir?** Bir sərnişinin fikri bütün xəttin vəziyyətini dəyişməməlidir. 1–2 bildiriş sıxlıq indeksini artırır, 3 və daha çox bildiriş olduqda sərnişin rəyi üstünlük qazanır (§9).

---

## 7. İstifadə təlimatı — Operator (dispetçer)

Giriş: *Operator* tabı. Sol paneldə (mobil cihazda — başlıq altında) 6 bölmə var; yeni anomaliya istənilən bölmədə qırmızı banner kimi görünür.

### 7.1 İcmal
- **Statistik kartlar:** aktiv xəbərdarlıqlar, Yüksək sıxlıqlı xətlər, son 1 saatın bildirişləri, xəttdəki avtobuslar və orta doluluq.
- **Anomaliya qaydası** cari ayarlarla açıq mətnlə göstərilir.
- **Xətlər üzrə sıxlıq** cədvəli (ən sıx xətt yuxarıda): səviyyə, sıxlıq indeksi, son 30 dəqiqənin qrafiki (qırmızı qırıq xətt — Yüksək həddi), bildiriş sayı, doluluq, **▶ Pik saat** demo düyməsi (aktiv olduqda ■ ilə dayandırılır).
- **Sıxlıq xəritəsi:** xətlərin rəngi sıxlıq səviyyəsini göstərir.
- **Anomaliya xəbərdarlıqları:** hər kartda göstəricilər (Yüksək bildiriş sayı, indeks, doluluq, nə vaxtdan Yüksəkdir) və əməliyyatlar:
  - **Avtobus göndər** — dispetçer dialoqu (§7.2);
  - **Qəbul et** — status *İcradadır* olur (reaksiya vaxtı qeydə alınır);
  - **Bağla** — əlavə tədbirsiz bağlamaq.

### 7.2 Park və dispetçer
- Xəttdəki və depodakı avtobusların sayı, hər xətt üzrə avtobuslar, orta doluluq, sıxlıq.
- **Avtobus göndər** dialoqu:
  - *Depodan ehtiyat avtobus* (4 ehtiyat avtobus: `10-EH-001…004`);
  - *Xətt №X-dən köçür* — sistem yalnız sakit (Yüksək olmayan) və ən azı 3 avtobusu olan xətləri, ən az sıx olanı birinci təklif edir; köçürülən avtobus o xəttin ən boş avtobusudur.
- Göndərmədən sonra: avtobus xəttin başlanğıcından hərəkətə başlayır, sərnişinlər avtobuslar arasında bərabər paylanır, xəttin açıq xəbərdarlıqları həll edilmiş kimi bağlanır (həll yolu qeyd olunur), sərnişinlərə 30 dəqiqəlik avtomatik elan dərc edilir, köhnə (göndərmədən əvvəlki) bildirişlər sıxlıq hesabından çıxarılır.
- **Avtobuslar → Depoya** — avtobusu xətdən çıxarıb depoya qaytarmaq (hər xəttdə ən azı 2 avtobus qalmalıdır).
- **Dispetçer jurnalı** — bütün əməliyyatlar: kim, nə vaxt, hansı avtobus, haradan → haraya.

### 7.3 Sərnişin bildirişləri
- Daxil olan bildirişlərin **canlı axını** (yeni bildiriş vurğulanır): vaxt, xətt, səviyyə, avtobus, müəllif.
- Filtrlər: *Hamısı / Yüksək / İşarələnmiş*.
- **İşarələ** — bildirişi spam/saxta kimi qeyd edir; sıxlıq dərhal yenidən hesablanır. *Bərpa et* geri qaytarır.
- **Blokla** — sərnişin hesabı daha bildiriş göndərə bilmir, son 1 saatın bildirişləri avtomatik işarələnir. *Blokdan çıxar* ilə bərpa olunur.

### 7.4 Elanlar
- Hədəf: konkret xətt və ya *Bütün xətlər*; növ: *Məlumat / Xəbərdarlıq / Təcili*; müddət: 30 dəq / 1 saat / 3 saat / müddətsiz; hazır mətn şablonları.
- **Dərc et** — elan bütün açıq sərnişin ekranlarında dərhal görünür. Zibil qutusu ilə elanı götürmək olar.

### 7.5 Xəbərdarlıq tarixçəsi
- Bütün xəbərdarlıqlar: yaranma vaxtı, status, **reaksiya müddəti** (yaranma → qəbul), **həll müddəti** (yaranma → bağlanma), həll yolu (depodan avtobus / xətlər arası köçürmə / əl ilə).
- Yuxarıda orta göstəricilər — dispetçer xidmətinin KPI-ları.

### 7.6 Qayda ayarları
| Ayar | Default | Mənası |
|---|---|---|
| Anomaliya pəncərəsi | 10 dəq | Xətt bu qədər fasiləsiz Yüksək qalarsa xəbərdarlıq yaranır |
| Minimum Yüksək bildiriş | 3 | Pəncərə ərzində ən azı bu qədər «Yüksək» bildiriş olmalıdır |
| Bildirişlərin aktuallıq müddəti | 15 dəq | Daha köhnə bildirişlər nəzərə alınmır |
| Bildiriş fasiləsi | 30 san | Eyni sərnişin eyni xətt üçün bu müddətdə bir bildiriş |

Ayarlar bazada saxlanılır, restart-sız tətbiq olunur və konteyner yenidən başladıqda da qalır.

---

## 8. Arxitektura

```
┌───────────────────────────── Brauzer ─────────────────────────────┐
│  React 18 + Vite + Tailwind CSS + react-leaflet (OpenStreetMap)   │
│  /login · /app (sərnişin) · /operator/* (dispetçer konsolu)        │
└───────────────┬───────────────────────────────▲───────────────────┘
                │ REST (JSON, JWT Bearer)        │ Socket.IO (WebSocket)
                ▼                                │
┌──────────── nginx (frontend konteyneri, :8080) ┴──────────────────┐
│  statik fayllar · /api/* və /socket.io/* → backend:4000 proxy     │
└───────────────┬───────────────────────────────────────────────────┘
                ▼
┌──────────────────── Node.js 20 + Express (backend, :4000) ─────────┐
│ routes → middleware (zod validasiya, JWT/rol, rate limit) →        │
│ controllers → services (sırf funksiyalar: density, eta, anomaly,   │
│ fleet, simulator) → Prisma ORM                                     │
│ Fon prosesləri: GPS simulyatoru (3 s) · Analitika mühərriki (30 s) │
└───────────────┬───────────────────────────────────────────────────┘
                ▼
        PostgreSQL 16 (db konteyneri)
```

**Məlumat axını (bildirişdən xəbərdarlığa qədər):**
1. Sərnişin `POST /api/reports` göndərir → validasiya, rol və spam yoxlaması → `CrowdReport` yazılır.
2. Həmin xətt üçün sıxlıq dərhal yenidən hesablanır (`analyzeRoute`) → `DensitySnapshot` → bütün ekranlara `density:update`.
3. Analitika mühərriki hər 30 saniyədə bütün xətləri hesablayır və anomaliya qaydasını yoxlayır → qayda ödənərsə `Alert` yaranır → yalnız operatorlara `alert:new`.
4. Dispetçer *Avtobus göndər* edir → `DispatchAction`, avtobus yerdəyişməsi, xəbərdarlığın həlli, `Announcement` → `alert:updated`, `fleet:update`, `announcements:update`.
5. GPS simulyatoru hər 3 saniyədə avtobusları hərəkət etdirir → `bus:positions`; hər 15 saniyədə `GpsPing` tarixçəsi yazılır.

**Verilənlər modeli (Prisma):** `User` (rol, blok), `Route` (polilayn, uzunluq), `Stop`, `RouteStop` (sıra, marşrut başlanğıcından məsafə), `Bus` (status: xəttdə/ehtiyat, mövqe, istiqamət, sürət, doluluq), `GpsPing`, `CrowdReport` (səviyyə, müəllif, işarə), `DensitySnapshot`, `Alert` (status, detallar, həll), `DispatchAction`, `Announcement`, `Setting`.

**Təhlükəsizlik:** bcrypt ilə şifrə hash-i, JWT (12 saat), server tərəfində rol yoxlaması (operator API-ləri `401/403`), operator hadisələri yalnız autentifikasiya olunmuş operator socket otağına, zod validasiyası, IP üzrə rate limit (bildiriş: 20/dəq, giriş: 10/dəq), hesab üzrə bildiriş fasiləsi, parametrləşdirilmiş SQL (Prisma).

---

## 9. Analitika mühərriki: alqoritmlər

Bütün qaydalar `backend/src/services/` qovluğunda DB-dən asılı olmayan sırf funksiyalardır və unit testlərlə əhatə olunub.

### Sıxlıq indeksi (`density.js`)
- Bildirişin dəyəri: Aşağı = 0.2, Orta = 0.55, Yüksək = 0.9.
- Yaxın vaxta çəki: bildirişin çəkisi hər 5 dəqiqədə yarıya düşür; 15 dəqiqədən köhnə bildirişlər nəzərə alınmır.
- Avtobus doluluğu: xəttdəki avtobusların orta `sərnişin / tutum` nisbəti.
- Birləşdirmə: 3+ bildiriş varsa `0.7 × bildiriş + 0.3 × doluluq`, 1–2 bildirişdə `0.5 / 0.5`, bildiriş yoxdursa yalnız doluluq.
- Səviyyə: `< 0.40` Aşağı, `< 0.70` Orta, `≥ 0.70` Yüksək.
- İşarələnmiş bildirişlər və son avtobus göndərişindən əvvəlki bildirişlər hesablanmır.

### ETA (`eta.js`)
- Avtobuslar marşrut boyu gedib-qayıdır; dayanacağı keçmiş avtobus son dayanacağa çatıb geri dönməlidir.
- Sürət: avtobusun cari sürəti (dayanıbsa orta 22 km/s), sıxlığa görə əmsal: Orta ×0.85, Yüksək ×0.7, minimum 8 km/s.
- `ETA = qalan məsafə / sürət + 20 san × aradakı dayanacaq sayı`.

### Anomaliya qaydası (`anomaly.js`)
Xəbərdarlıq yalnız bütün şərtlər ödəndikdə yaranır:
1. Pəncərə (default 10 dəq) boyunca bütün sıxlıq snapshot-ları **Yüksək**-dir (pəncərənin başlanğıcındakı snapshot daxil);
2. məlumatda 2 dəqiqədən uzun boşluq yoxdur (mühərrik dayanıbsa yalançı «fasiləsiz» nəticə alınmır);
3. pəncərədə ən azı 3 **Yüksək** sərnişin bildirişi var;
4. xəttin aktiv xəbərdarlığı yoxdur (təkrar yoxdur);
5. əvvəlki xəbərdarlıq bağlanıbsa, Yüksək dövr tamamilə bağlanmadan sonradır (dispetçer tədbir görən kimi təkrar xəbərdarlıq yaranmır).

Nəticə səbəbi ilə qaytarılır (`SUSTAINED_HIGH_DENSITY`, `NOT_CONSISTENTLY_HIGH`, `DATA_GAP`, ...).

### Dispetçer (`fleet.js`)
- Sərnişinlərin yenidən paylanması: ümumi sərnişin sayı yeni avtobus sayına bərabər bölünür (heç bir sərnişin «itmir»).
- Köçürmə üçün mənbə: Yüksək olmayan, 2-dən çox avtobusu olan xətlər, ən az sıx olandan başlayaraq; xəttdən ən boş avtobus götürülür.

### GPS simulyatoru (`simulator.js`)
- Hər 3 saniyədə avtobus 18–38 km/s sürətlə (10% ehtimalla svetoforda dayanır) marşrut boyu hərəkət edir, sıxlıqda yavaşlayır, son dayanacaqda geri dönür.
- Doluluq xəttin tipik yükünə doğru təsadüfi dəyişir; xəttə əlavə avtobus gəldikdə tipik yük avtobus sayına mütənasib azalır.

---

## 10. API arayışı

Baza ünvan: `http://localhost:8080/api` (nginx vasitəsilə) və ya `http://localhost:4000/api`. Qorunan endpoint-lər `Authorization: Bearer <token>` başlığı tələb edir. Xətalar `{ "error": "...", "details": [...] }` formatındadır.

| Metod | Yol | Rol | Təsvir |
|---|---|---|---|
| GET | `/health` | — | API və DB vəziyyəti |
| POST | `/auth/register` | — | Sərnişin qeydiyyatı `{name, email, password}` |
| POST | `/auth/login` | — | Giriş `{email, password, role?}` → `{token, user}` |
| GET | `/auth/me` | istənilən | Cari istifadəçi |
| GET | `/routes` | — | Marşrutlar, dayanacaqlar, cari sıxlıq |
| GET | `/routes/:id` | — | Bir marşrut |
| GET | `/routes/:id/buses` | — | Xəttdəki avtobuslar |
| GET | `/stops` | — | Bütün dayanacaqlar və onlardan keçən xətlər |
| GET | `/stops/:id/eta?routeId=` | — | Dayanacağa yaxınlaşan avtobuslar və ETA |
| GET | `/announcements` | — | Aktiv elanlar |
| POST | `/reports` | Sərnişin | Sıxlıq bildirişi `{routeId, level, busId?, stopId?}` |
| GET | `/operator/density` | Operator | Xətlər üzrə cari sıxlıq |
| GET | `/operator/stats` | Operator | Son 1 saatın bildirişləri, 30 dəq sıxlıq tarixçəsi |
| GET | `/operator/alerts?status=ACTIVE\|OPEN\|ACKNOWLEDGED\|RESOLVED\|ALL` | Operator | Xəbərdarlıqlar |
| PATCH | `/operator/alerts/:id` | Operator | `{status: ACKNOWLEDGED\|RESOLVED}` |
| GET / PATCH | `/operator/config` | Operator | Qayda ayarları (oxu / dəyiş) |
| GET | `/operator/fleet` | Operator | Park, ehtiyat avtobuslar, donor təklifləri, jurnal |
| POST | `/operator/dispatch` | Operator | `{toRouteId, fromRouteId?, busId?}` — avtobus göndər/köçür |
| POST | `/operator/fleet/:busId/return` | Operator | Avtobusu depoya qaytar |
| POST | `/operator/announcements` | Operator | `{routeId?, message, severity, durationMinutes?}` |
| DELETE | `/operator/announcements/:id` | Operator | Elanı götür |
| GET | `/operator/reports?limit=` | Operator | Bildiriş axını |
| PATCH | `/operator/reports/:id` | Operator | `{flagged: true\|false}` |
| PATCH | `/operator/users/:id` | Operator | `{blocked: true\|false}` (yalnız sərnişinlər) |
| POST | `/operator/simulate-rush` | Operator | Demo: `{routeId, durationMinutes?}` |
| DELETE | `/operator/simulate-rush/:routeId` | Operator | Demonu dayandır |

**Nümunə (curl):**
```bash
# operator kimi token al
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"operator@smarttransit.az\",\"password\":\"Operator2026!\",\"role\":\"OPERATOR\"}"

# xətlər üzrə sıxlıq (TOKEN yuxarıdakı cavabdan)
curl -s http://localhost:8080/api/operator/density -H "Authorization: Bearer TOKEN"
```

---

## 11. Real vaxt hadisələri (Socket.IO)

| Hadisə | Kimə | Məzmun |
|---|---|---|
| `bus:positions` | hamıya | Bütün avtobusların mövqeyi, sürəti, doluluğu (3 s) |
| `density:update` | hamıya | Xətlər üzrə sıxlıq (30 s və hər bildirişdən sonra) |
| `announcements:update` | hamıya | Aktiv elanlar siyahısı |
| `alert:new`, `alert:updated` | yalnız operatorlar | Xəbərdarlıq yaranması / statusu |
| `report:new` | yalnız operatorlar | Yeni sərnişin bildirişi |
| `fleet:update` | yalnız operatorlar | Park dəyişikliyi |

Socket bağlantısı JWT ilə autentifikasiya olunur (`auth.token`); operator tokeni olan bağlantılar `operators` otağına qoşulur.

---

## 12. Bütün əmrlər

### Docker (tövsiyə olunan)
| Əmr | Nə edir |
|---|---|
| `docker compose up --build` | Hər şeyi yığ və işə sal (ön planda, loglarla) |
| `docker compose up -d --build` | Eyni, fonda |
| `docker compose ps` | Servislərin vəziyyəti |
| `docker compose logs -f backend` | Backend logları (seed, alertlər) |
| `docker compose restart backend` | Backend-i yenidən başlat (məlumat qalır) |
| `docker compose up -d --build backend` | Yalnız backend-i yenidən yığ |
| `docker compose down` | Dayandır |
| `docker compose down -v` | Dayandır və bazanı sil (tam sıfırlama) |
| `docker compose exec backend node prisma/seed.js --force` sonra `docker compose restart backend` | Marşrut məlumatlarını sıfırla, yenidən seed et və yaddaşdakı keşi təmizlə (hesablar və ayarlar qalır) |
| `docker compose exec db psql -U transit -d transit` | Bazaya SQL konsolu |
| `ALERT_WINDOW_MINUTES=2 docker compose up -d` | Qaydanı başlanğıcda dəyişmək (Linux/macOS; Windows PowerShell: `$env:ALERT_WINDOW_MINUTES=2; docker compose up -d`) |

### Lokal inkişaf (frontend canlı yenilənmə ilə)
Backend və DB Docker-də, frontend Vite dev serverdə (kod dəyişiklikləri dərhal görünür):
```bash
docker compose up -d --build db backend
cd frontend
npm install
npm run dev            # http://localhost:5173 (/api və /socket.io → localhost:4000)
```

### Tam lokal inkişaf (yalnız DB Docker-də)
```bash
docker compose up -d db
cd backend
cp .env.example .env   # Windows: copy .env.example .env
npm install
npx prisma migrate deploy
npm run seed
npm run dev            # http://localhost:4000, nodemon ilə
```
Ayrı terminalda: `cd frontend && npm install && npm run dev`.

### Backend npm skriptləri (`backend/`)
| Skript | Nə edir |
|---|---|
| `npm run dev` | API + fon prosesləri, fayl dəyişəndə yenidən başlayır |
| `npm start` | API (production) |
| `npm test` | Bütün testlər (Vitest) |
| `npm run test:watch` | Testlər izləmə rejimində |
| `npm run seed` | Seed (mövcud məlumatı saxlayır); `node prisma/seed.js --force` — sıfırla |
| `npm run prisma:migrate` | Yeni miqrasiya yarat (inkişaf) |
| `npm run prisma:generate` | Prisma client-i yenidən yarat |

### Frontend npm skriptləri (`frontend/`)
| Skript | Nə edir |
|---|---|
| `npm run dev` | Vite dev server (:5173) |
| `npm run build` | Production build (`dist/`) |
| `npm run preview` | Build-in lokal önizləməsi |

---

## 13. Konfiqurasiya (mühit dəyişənləri)

Backend (`backend/.env.example`; Docker-də `docker-compose.yml` ilə ötürülür):

| Dəyişən | Default | Təsvir |
|---|---|---|
| `PORT` | 4000 | API portu |
| `DATABASE_URL` | `postgresql://transit:transit@localhost:5432/transit` | PostgreSQL bağlantısı |
| `JWT_SECRET` | demo dəyər | Token imzası (production-da mütləq dəyişin) |
| `JWT_EXPIRES_IN` | 12h | Sessiya müddəti |
| `ALERT_WINDOW_MINUTES` | 10 | Anomaliya pəncərəsi |
| `ALERT_MIN_REPORTS` | 3 | Pəncərədə minimum Yüksək bildiriş |
| `DENSITY_WINDOW_MINUTES` | 15 | Bildirişlərin aktuallıq müddəti |
| `REPORT_COOLDOWN_SECONDS` | 30 | Hesab üzrə bildiriş fasiləsi |
| `REPORT_RATE_LIMIT_PER_MINUTE` | 20 | IP üzrə bildiriş limiti |
| `SIMULATOR_TICK_MS` / `ANALYTICS_TICK_MS` | 3000 / 30000 | Fon proseslərinin intervalı |
| `GPS_PING_EVERY_TICKS` | 5 | GPS tarixçəsinin yazılma tezliyi |
| `JOBS_ENABLED` | true | Simulyator və analitikanı söndürmək üçün |
| `OPERATOR_EMAIL` / `OPERATOR_PASSWORD` | bax §4 | Seed-in yaratdığı operator |
| `DEMO_PASSENGER_EMAIL` / `DEMO_PASSENGER_PASSWORD` | bax §4 | Seed-in yaratdığı sərnişin |

Docker portları: `WEB_PORT` (8080), `API_PORT` (4000), `DB_PORT` (5432). Operator *Qayda ayarları* səhifəsində dəyişdirilən dəyərlər bazada saxlanılır və env dəyərlərindən üstündür.

---

## 14. Testlər və etibarlılıq

```bash
cd backend
npm install
npm test
```
**106 avtomatik test** (Vitest + Supertest), DB tələb etmir (Prisma mock):

| Fayl | Nəyi yoxlayır |
|---|---|
| `density.test.js` | Sıxlıq hədləri, yaxın vaxta çəki, doluluqla birləşdirmə |
| `eta.test.js` | Gediş-qayıdış məsafəsi, sıxlıq əmsalı, dayanacaq gözləmələri, sıralama |
| `anomaly.test.js` | 10 dəq qayda, 9 dəqiqə kifayət etmir, ortada düşmə, məlumat boşluğu, təkrar xəbərdarlıq yoxdur, bağlanmadan sonra təkrar yoxdur |
| `simulator.test.js`, `geo.test.js`, `fleet.test.js` | Hərəkət və geri dönmə, koordinat hesabları, sərnişin paylanması, donor seçimi |
| `api.test.js` | Validasiya, 404/400/409/429, ETA endpoint-i, alert status keçidləri |
| `auth.test.js` | Qeydiyyat, giriş, rol yoxlaması (401/403), dəyişdirilmiş/vaxtı keçmiş token |
| `console.test.js` | Dispetçer, elanlar, moderasiya, bloklama, ayarlar |
| `health.test.js` | DB sağlamlığı, xəta formatı |

Bundan əlavə, komanda tərəfindən canlı sistemdə əl ilə yoxlanılıb: təmiz `docker compose down -v && up --build`, seed və demo hesablar, nginx üzərindən WebSocket, 10 dəqiqəlik qaydanın real DB-də təkrar oynadılması (alert dəqiq 10 dəqiqədən sonra, bir dəfə), brauzerdə hər iki rolun tam ssenarisi, mobil görünüş.

**Etibarlılıq tədbirləri:** konteyner healthcheck-ləri və ardıcıl işə salınma, idempotent seed (restart məlumatı təkrarlamır), fon proseslərinin üst-üstə düşməməsi, marşrut üzrə kilid (paralel təkrar alert yoxdur), mərkəzi xəta emalı, sessiyanın server tərəfindən təsdiqi.

---

## 15. Layihənin strukturu

```
├── docker-compose.yml          # db + backend + frontend
├── README.md                   # bu sənəd
├── AI_DECLARATION.md           # AI istifadəsi haqqında bəyannamə
├── docs/
│   ├── TEXNIKI_IZAH.md         # texniki izah sənədi
│   └── TEXNIKI_IZAH.docx       # eyni sənəd Word formatında
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma       # verilənlər modeli
│   │   ├── migrations/         # SQL miqrasiyaları
│   │   ├── data/baku.js        # marşrut və dayanacaq məlumatları
│   │   └── seed.js             # idempotent seed (hesablar, şəbəkə, ehtiyat avtobuslar)
│   ├── src/
│   │   ├── server.js · app.js · config.js · socket.js · db.js
│   │   ├── routes/             # API marşrutları
│   │   ├── middleware/         # validasiya, autentifikasiya
│   │   ├── controllers/        # HTTP qatı
│   │   ├── services/           # biznes məntiqi (density, eta, anomaly, fleet, simulator, ...)
│   │   ├── jobs/               # simulyator və analitika fon prosesləri
│   │   └── validation/         # zod sxemləri
│   └── tests/                  # 106 test
└── frontend/
    ├── Dockerfile · nginx.conf
    └── src/
        ├── pages/              # Login, Passenger, operator/* (6 səhifə)
        ├── layouts/            # sərnişin və operator çərçivələri
        ├── components/         # xəritə, panellər, dialoqlar
        ├── context/            # auth, toast, operator məlumatları
        ├── hooks/              # socket, məlumat, sürüşdürmə
        └── api/client.js       # API klienti
```

---

## 16. Problemlərin həlli (troubleshooting)

| Simptom | Həll |
|---|---|
| `port is already allocated` (8080/4000/5432) | Başqa port verin: `WEB_PORT=8081 API_PORT=4001 DB_PORT=5433 docker compose up --build` (PowerShell: `$env:WEB_PORT=8081; $env:DB_PORT=5433; docker compose up --build`) |
| `Cannot connect to the Docker daemon` | Docker Desktop-u işə salın və yaşıl «Running» statusunu gözləyin |
| Səhifə açılır, amma məlumat yoxdur | `docker compose ps` — backend `healthy` olmalıdır; `docker compose logs backend` |
| Xəritə plitələri görünmür | İnternet bağlantısı tələb olunur (OpenStreetMap); avtobuslar və xətlər yenə də göstərilir |
| Demo üçün alert gec yaranır | Operator → *Qayda ayarları* → pəncərəni 1–2 dəqiqə edin |
| Tam təmiz başlanğıc lazımdır | `docker compose down -v` sonra `docker compose up --build` |
| Daxil olduqdan sonra səhifə boşdur | Səhifəni yeniləyin; sessiya köhnədirsə çıxış edib yenidən daxil olun |

---

## 17. Məhdudiyyətlər və gələcək inkişaf

**Məhdudiyyətlər (prototip):** GPS və doluluq məlumatları simulyasiyadır; marşrut nömrələri və dayanacaq ardıcıllığı real Bakı məkanları əsasında sadələşdirilib; xəritə plitələri üçün internet lazımdır.

**Gələcək inkişaf:** real AVL/GPS və BakıKart validator inteqrasiyası, tarixi məlumatlarla sıxlıq proqnozu (ML), avtomatik dispetçer tövsiyələri, push bildirişlər və mobil tətbiq, çoxdilli interfeys (AZ/EN/RU), ətraflı hesabat və ixrac. Ətraflı: [docs/TEXNIKI_IZAH.md](docs/TEXNIKI_IZAH.md).

---

## 18. Sənədlər

| Sənəd | Məzmun |
|---|---|
| [README.md](README.md) | İşə salma, istifadə, arxitektura, API, əmrlər |
| [docs/TEXNIKI_IZAH.md](docs/TEXNIKI_IZAH.md) / `.docx` | Texniki izah: problem, struktur, texnologiyalar, alqoritmlər, gələcək inkişaf |
| [AI_DECLARATION.md](AI_DECLARATION.md) | AI alətlərindən istifadə haqqında bəyannamə, komanda və AI rolları, prompt jurnalı |
| [PLAN.md](PLAN.md) | Yarışın əvvəlində hazırlanmış ilkin icra planı (ingiliscə) |
