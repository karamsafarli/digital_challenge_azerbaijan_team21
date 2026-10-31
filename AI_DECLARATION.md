# AI İstifadəsi haqqında Bəyannamə (AI Declaration)

## İstifadə olunan alətlər
| Alət | Model | Nə üçün |
|---|---|---|
| Claude Code (desktop app) | Claude Opus 5.5 | Tapşırığın təhlili, arxitektura planı, kodun yazılması, testlər, sənədləşmə |

## Necə istifadə etdik
- AI-ni **cüt proqramçı** kimi istifadə etdik: hər addımı əvvəlcə komanda olaraq müzakirə etdik, AI-dən konkret addım üçün kod istədik, nəticəni oxuyub yoxladıq və işə saldıq.
- Biznes qaydaları (anomaliya qaydası, sıxlıq hesablanması, ETA) bizim tərəfimizdən müəyyənləşdirildi; AI onları koda çevirdi və unit testlər yazdı.
- AI-nin yaratdığı hər kod parçası testlər və əl ilə yoxlama ilə təsdiqləndi.

## Prompt jurnalı (xronoloji)
| Vaxt | Addım | Prompt (qısa) | Nəticə / bizim qərarımız |
|---|---|---|---|
| 11:0x | Təhlil və plan | "Yarışın qaydalarını və tapşırığı təhlil et, addım-addım icra planı qur. Stack: React, Tailwind, Node/Express, PostgreSQL, ORM, Docker." | `PLAN.md` yaradıldı: qiymətləndirmə meyarlarına uyğunlaşdırılmış plan, data modeli, API, vaxt cədvəli. Anomaliya qaydasının şərhini və GPS simulyatorunu qəbul etdik. |
| 11:xx | Addım 0 — layihə skeleti | "Start Step 0" (layihə strukturu, Express health endpoint, Vite+React+Tailwind, docker-compose, Postgres) | Backend/frontend skeletləri, Dockerfile-lar, nginx proxy (API + WebSocket), docker-compose yaradıldı. |
| 11:2x | Mühit qurulumu | "Yes, install Node + Git" | AI Node LTS və Git-i winget ilə quraşdırdı, npm 11-in bloklədığı Prisma/esbuild install script-lərini təsdiqlədi. Health testləri (2/2) keçdi, frontend build və dev server yoxlanıldı. |
| 11:3x | Addım 1 — DB sxemi və seed | "Postgres-i docker-də qaldır" → AI Addım 1-i icra etdi | Prisma sxemi (Route, Stop, RouteStop, Bus, GpsPing, CrowdReport, DensitySnapshot, Alert), real Bakı məkanları əsasında 5 marşrut / 21 dayanacaq / 18 avtobus seed, haversine geo util + 3 unit test. Biz yoxladıq: miqrasiya tətbiq olundu, SQL ilə məlumat yoxlanıldı (marşrut uzunluqları 5.7–10.6 km). |
| 11:4x | Addım 2 — analitika mühərriki | "Start Step 2" (ETA, sıxlıq və anomaliya servisləri + testlər) | Təmiz funksiyalar: `density.js` (yeni bildirişlər daha çox çəki alır, yarımömür 5 dəq + avtobus doluluğu), `eta.js` (gediş-qayıdış marşrut, sıxlığa görə sürət əmsalı, dayanacaq gözləmə vaxtı), `anomaly.js` (10 dəq fasiləsiz HIGH + min. 3 HIGH bildiriş, məlumat boşluğu yoxlaması, təkrar alert yoxdur). 35 unit test. Testlərdən biri test datasında səhv tapdı (1 dəq pəncərədə bildirişlər pəncərədən kənarda idi) — test düzəldildi, qayda dəyişmədi. |
| 12:0x | Addım 3 — simulyator, analitika job-ları, Socket.IO | "Start Step 3" | GPS simulyatoru (marşrut boyu hərəkət, sıxlığa görə yavaşlama, doluluq), 3 s-lik simulyator və 30 s-lik analitika job-ları, `bus:positions` / `density:update` / `alert:new` hadisələri, marşrut üzrə kilid (təkrar alert olmasın). 7 yeni test (cəmi 44). Biz yoxladıq: socket klienti ilə hadisələr alındı; real DB üzərində 12 dəqiqəlik HIGH dövrü təkrar oynadıldı — alert dəqiq 10 dəqiqə sonra və yalnız bir dəfə yarandı. Baza sıxlığın hər yerdə "Orta" olduğunu görüb simulyatorun tipik yük əmsallarını azaltdıq. |
| 12:2x | Addım 4 — REST API | "push this one and proceed with step 4" | Sərnişin API (marşrutlar, avtobuslar, dayanacaqlar, ETA, bildiriş) və operator API (sıxlıq, alertlər + status keçidləri, statistika, pik saat ssenarisi). zod validasiyası, IP üzrə rate limit, cihaz üzrə 30 s cooldown, mərkəzi xəta emalı, DB-ni yoxlayan health. Pik saat ssenarisi saxta tarixli məlumat yaratmır — real vaxtda HIGH bildirişlər göndərir, alert yalnız qayda ödəndikdə yaranır (bunu biz tələb etdik). 22 yeni API testi (mock DB, cəmi 66). Biz bütün endpoint-ləri canlı serverdə curl ilə yoxladıq. |
| 12:4x | Addım 5 — Sərnişin interfeysi | "Start Step 5" | React + Leaflet xəritə (marşrut xətləri, dayanacaqlar, doluluğa görə rənglənən canlı avtobuslar), marşrut seçimi + sıxlıq nişanları, dayanacaq üzrə ETA siyahısı (5 s yenilənmə), Aşağı/Orta/Yüksək bildiriş düymələri, Socket.IO ilə canlı yeniləmə, "Canlı" göstəricisi. Biz brauzerdə yoxladıq: ETA, bildiriş (marşrut 65 HIGH oldu), 429 cooldown mesajı, mobil görünüş (üfüqi scroll yoxdur). |
| 13:0x | Addım 6 — Operator paneli | "Start Step 6" | Statistik kartlar, xətlər üzrə sıxlıq cədvəli (indeks, son 30 dəq sparkline, bildiriş sayı, doluluq), sıxlığa görə rənglənən xəritə, canlı anomaliya paneli (Qəbul et / Bağla) və yeni alert üçün bildiriş banneri, pik saat demo düyməsi. Biz 1 dəqiqəlik pəncərə ilə canlı test etdik: alert qaydaya uyğun yarandı və UI-da dərhal göründü. **Testdə tapdığımız problem:** operator alerti bağlayan kimi, xətt hələ Yüksək olduğu üçün yeni alert dərhal yenidən yarandı. Qaydaya düzəliş etdik: bağlanmadan sonra yeni alert üçün tam yeni pəncərə tələb olunur (+2 test, cəmi 68). Düymənin əlçatanlıq adını da düzəltdik. |

<!-- Hər yeni addımdan sonra bura bir sətir əlavə edin. -->

## AI-nin etmədiyi / bizim yoxladığımız
- Kodun işlədiyini lokal olaraq və `docker compose up` ilə yoxladıq.
- Testlərin nəticələrini özümüz işə salıb yoxladıq.
