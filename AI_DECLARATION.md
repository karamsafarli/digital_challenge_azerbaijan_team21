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

<!-- Hər yeni addımdan sonra bura bir sətir əlavə edin. -->

## AI-nin etmədiyi / bizim yoxladığımız
- Kodun işlədiyini lokal olaraq və `docker compose up` ilə yoxladıq.
- Testlərin nəticələrini özümüz işə salıb yoxladıq.
