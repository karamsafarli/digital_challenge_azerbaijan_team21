# AI İstifadəsi haqqında Bəyannamə

**Layihə:** Smart Transit & Crowdsourcing Engine (Bakı) · **Komanda:** 21 · **Tarix:** 31 oktyabr 2026

Bu sənəd yarışın qaydalarına (5.1 — generativ AI platformaları və AI kod köməkçilərinə icazə verilir) uyğun olaraq AI alətlərindən **necə, nə üçün və hansı promptlarla** istifadə etdiyimizi, eləcə də işin hansı hissəsinin komanda, hansı hissəsinin AI tərəfindən görüldüyünü açıq şəkildə göstərir.

---

## 1. Qısa xülasə

Biz AI-ni **komandanın rəhbərliyi altında işləyən icraçı mühəndis** kimi istifadə etdik. Məhsulun nə olacağı, hansı tələblərin necə şərh ediləcəyi, texnologiya seçimi, prioritetlər, istifadəçi təcrübəsinə dair bütün qərarlar və keyfiyyətin yoxlanması komandaya məxsusdur. AI isə bu qərarları kod, test və sənədə çevirdi, alternativlər təklif etdi və öz işini avtomatik testlərlə yoxladı.

Kodun böyük hissəsi AI tərəfindən yazılıb — bunu gizlətmirik. Amma işin istiqaməti komanda tərəfindən müəyyən edilib: son məhsuldakı bir neçə mühüm funksiya (rol əsaslı giriş, dispetçer əməliyyatları, mobil/desktop UX düzəlişləri, Docker iş axını) birbaşa komandanın sistemi özü sınaqdan keçirərkən tapdığı problemlərdən və verdiyi tapşırıqlardan yaranıb.

---

## 2. İstifadə olunan alətlər

| Alət | Model | Nə üçün istifadə olundu |
|---|---|---|
| **Claude Code** (Claude desktop tətbiqi, «Code» bölməsi) | Claude Opus 5.5 | Qaydaların və tapşırığın təhlili, icra planı, kodun yazılması (backend, frontend, Docker), avtomatik testlər, brauzerdə yoxlama, sənədləşmə |
| Claude Code-un daxili brauzer paneli | — | Tətbiqin AI tərəfindən canlı sınaqdan keçirilməsi (ekran görüntüləri, konsol və şəbəkə sorğularının yoxlanması) |

Başqa AI aləti istifadə edilməyib. Bütün açıq mənbəli kitabxanalar (React, Express, Prisma, Leaflet və s.) rəsmi paket reyestrlərindən quraşdırılıb; əvvəlcədən hazırlanmış şablon və ya hazır həll istifadə edilməyib — layihə yarış zamanı sıfırdan yaradılıb.

---

## 3. Rol bölgüsü: komanda və AI

| Sahə | Komanda | AI (Claude Code) |
|---|---|---|
| **Tələblərin təhlili** | Tapşırığı və qaydaları təqdim etdi, «tələsmədən, addım-addım» iş prinsipini qoydu, hər addımı təsdiqlədi | Qaydaları (qiymətləndirmə meyarları, təhvil siyahısı) və tapşırığı təhlil edib plan təklif etdi |
| **Texnologiya seçimi** | Stack-i müəyyən etdi: React + Tailwind, Node.js + Express, PostgreSQL, ORM, Docker | ORM kimi Prisma-nı, real vaxt üçün Socket.IO-nu, xəritə üçün Leaflet-i təklif etdi və əsaslandırdı |
| **Biznes qaydaları** | Şərhləri qəbul etdi (GPS simulyatoru, «10 dəqiqə fasiləsiz Yüksək» qaydası); sistemin davranışını sorğuladı («bir Yüksək bildiriş niyə xətti dəyişmir?») | Sıxlıq, ETA və anomaliya alqoritmlərini təklif edib kodlaşdırdı və izah etdi |
| **Məhsul və UX qərarları** | Dizaynın «sadə tapşırıq nəticəsi kimi» göründüyünü qiymətləndirib yenidən dizayn tələb etdi; sərnişinin operator səhifəsinə girə bilməsini **təhlükəsizlik problemi** kimi aşkarladı və giriş sistemi tələb etdi; operatorun funksiyalarının az olduğunu müəyyən etdi və təklif olunan 4 funksiyadan hamısını seçdi | Dizayn sistemini, səhifələri və komponentləri hazırladı; rol əsaslı giriş arxitekturasını və dispetçer funksiyalarını təklif edib həyata keçirdi |
| **Keyfiyyətin yoxlanması** | Saytı özü istifadə edərək problemləri tapdı (siçan çarxı ilə üfüqi sürüşdürmə işləmirdi, marşrut düymələrinin kənarı kəsilirdi), nəticələri qəbul etdi | Avtomatik testlər (106 ədəd), API-nin curl ilə yoxlanması, brauzerdə ssenari testləri |
| **İnfrastruktur** | Docker Desktop-u quraşdırdı, Node.js/Git-in quraşdırılmasına icazə verdi, GitHub repozitoriyasını yaratdı, «backend Docker-də, frontend lokal canlı yenilənmə ilə» iş axınını tələb etdi | Dockerfile-lar, docker-compose, nginx proksi, miqrasiyalar, idempotent seed |
| **Yekun yoxlama və təhvil** | Sistemin jüri kompüterində sıfırdan işləməsini əsas tələb kimi qoydu, sənədlərin Azərbaycan dilində və hərtərəfli olmasını tələb etdi | Təmiz Docker yoxlaması, README, texniki izah sənədi |

---

## 4. Komandanın qərarları və müdaxilələri (xronoloji)

Saatlar git commit tarixçəsinə əsasən təxminidir.

| Vaxt | Komandanın qərarı / müdaxiləsi | Nəticə |
|---|---|---|
| 11:05 | Qaydalar və tapşırıq təqdim edildi; texnologiya stack-i müəyyən edildi; mərhələli icra metodologiyası (əvvəl plan, sonra təsdiqlənmiş addımlar) qəbul edildi | `PLAN.md`: qiymətləndirmə meyarlarına uyğun plan, vaxt bölgüsü, «kəsmə xətti» |
| 11:15 | Kompüterdə Node.js və Git olmadığı aşkarlandı — quraşdırmaya icazə verildi; Docker Desktop-u komanda özü quraşdırdı | İnkişaf mühiti hazır oldu |
| 11:45 | Hər addımdan sonra commit və GitHub-a push qərarı; repozitoriya yaradıldı | Mərhələli, izlənə bilən tarixçə |
| 12:08 | **İş axını qərarı:** backend + DB Docker-də, frontend lokal (canlı yenilənmə) | `docker compose up -d db backend` + Vite proksi |
| 12:12 | **Davranış auditi:** tək «Yüksək» bildirişin xəttin səviyyəsini dəyişmədiyi müşahidə edildi və bunun gözlənilən davranış olub-olmadığının əsaslandırılması, eləcə də bildirişdən xəbərdarlığa qədər bütün axının izahı tələb edildi | AI bunun qəsdən olduğunu real ölçmə ilə göstərdi (1 → 0.66, 3 bildiriş → 0.76 Yüksək) və bir istifadəçinin 30 saniyə fasilə ilə xətti «qırmızı» edə bilməsi zəifliyini qeyd etdi |
| 12:15 | **Təhlükəsizlik və UX qərarı:** sərnişin rolunun operator funksiyalarına çıxışı təhlükəsizlik riski kimi qiymətləndirildi; rol əsaslı autentifikasiya və interfeysin peşəkar səviyyədə yenidən dizaynı tələb edildi | JWT + bcrypt, server tərəfində rol yoxlaması, operator socket otağı; bildiriş limiti cihaz əvəzinə **hesab** üzrə (yuxarıdakı zəiflik də bağlandı); yeni dizayn |
| 12:40 | **UX problemi aşkarlandı:** desktopda üfüqi seçim zolaqları siçan çarxı ilə idarə olunmurdu (yalnız touchpad/toxunma) | Siçan çarxı və sürükləmə dəstəyi |
| 12:42 | **Vizual xəta aşkarlandı:** marşrut düymələrinin yuxarı kənarı konteyner tərəfindən kəsilirdi; lokal CSS düzəlişi tələb edildi | Zolağa daxili boşluq əlavə edildi |
| 12:45 | **Məhsul qərarı:** operator konsolunun funksional imkanlarının dispetçer iş prosesi üçün kifayət etmədiyi qiymətləndirildi; alternativlər təhlil edilərək 4 istiqamətin hamısının həyata keçirilməsi qərara alındı | Park və dispetçer, elanlar, bildiriş moderasiyası, tarixçə və qayda ayarları |
| 13:05 | **Təhvil tələbləri:** sistem jüri kompüterində sıfırdan problemsiz işləməlidir; sənədlər Azərbaycan dilində və hərtərəfli; AI bəyannaməsi insan işini də düzgün göstərməlidir | Təmiz Docker yoxlaması, port konfliktlərinə qarşı tədbirlər, bu sənədlər |

---

## 5. Prompt jurnalı

Komanda AI-yə tapşırıqları mərhələli texniki tapşırıqlar şəklində verib. Aşağıda hər bir promptun məzmunu, qəbul meyarı və nəticəsi ümumiləşdirilmiş formada göstərilir (tam söhbət tarixçəsi tələb olunarsa təqdim edilə bilər).

| # | Mərhələ | Tapşırığın məzmunu (prompt) | Qəbul meyarı | Nəticə |
|---|---|---|---|---|
| 1 | Təhlil və planlaşdırma | Müsabiqə qaydalarını (PDF) və tapşırığı təhlil et; qiymətləndirmə meyarlarını nəzərə alaraq mərhələli icra planı hazırla. Stack: React, Tailwind CSS, Node.js, Express, PostgreSQL, ORM, Docker Compose | Tələblərin tam əhatəsi, vaxt bölgüsü, risklərin idarəsi | `PLAN.md` — 9 mərhələ, arxitektura, API layihəsi, «kəsmə xətti» |
| 2 | Mühit və skelet | Layihə strukturunu, backend/frontend skeletini, Dockerfile-ları və docker-compose-u qur; çatışmayan alətləri (Node.js, Git) quraşdır; PostgreSQL-i Docker-də işə sal | Health endpoint və frontend işləyir, testlər keçir | Skelet, nginx proksi, ilk testlər |
| 3 | Verilənlər modeli | Prisma sxemini (marşrut, dayanacaq, avtobus, GPS, bildiriş, snapshot, xəbərdarlıq) və real Bakı məkanları əsasında seed yarat | Miqrasiya tətbiq olunur, məlumatlar SQL ilə təsdiqlənir | 5 marşrut, 21 dayanacaq, 18 avtobus |
| 4 | Versiya nəzarəti | Hər mərhələni ayrıca commit kimi qeyd et və komandanın GitHub repozitoriyasına göndər | İzlənə bilən tarixçə | 11 mərhələli commit |
| 5 | Analitika mühərriki | Sıxlıq indeksi, ETA və «10 dəqiqə fasiləsiz Yüksək» anomaliya qaydasını DB-dən asılı olmayan funksiyalar kimi, kənar hallarla birlikdə test edərək yaz | Bütün kənar hallar testlə əhatə olunub | 35 unit test |
| 6 | Real vaxt qatı | GPS simulyatoru, dövri analitika prosesi və Socket.IO hadisələri; qaydanı real bazada yoxla | Xəbərdarlıq dəqiq 10 dəqiqədən sonra, bir dəfə | Canlı inteqrasiya testi |
| 7 | API | Sərnişin və operator REST API-ləri; validasiya, spam qoruması, mərkəzi xəta emalı | Bütün endpoint-lər testlə və canlı yoxlanılır | 22 API testi |
| 8 | İstifadəçi interfeysləri | Sərnişin tətbiqi (xəritə, ETA, bildiriş) və operator paneli (sıxlıq cədvəli, xəritə, xəbərdarlıqlar) | Brauzerdə tam ssenari, mobil görünüş | Hər iki modul |
| 9 | İnkişaf iş axını | Backend və DB-ni Docker-də, frontend-i lokal canlı yenilənmə rejimində işə sal | Kod dəyişiklikləri yenidən build olmadan görünür | Hibrid rejim |
| 10 | Davranış auditi | Tək bildirişin xəttin səviyyəsini dəyişməməsinin səbəbini əsaslandır, bildirişdən xəbərdarlığa qədər bütün axını izah et | Rəqəmlərlə təsdiqlənmiş izah | Real ölçmə; spam zəifliyi müəyyən edildi |
| 11 | Təhlükəsizlik və dizayn | Rol əsaslı autentifikasiya (sərnişin/operator) tətbiq et — sərnişin operator funksiyalarına çıxış əldə etməməlidir; interfeysi peşəkar səviyyədə yenidən dizayn et | Server tərəfində 401/403, brauzerdə rol yönləndirməsi | JWT + bcrypt, yeni dizayn sistemi, 18 test |
| 12 | UX düzəlişləri | Desktopda üfüqi seçim zolaqlarının siçan çarxı ilə idarəsini təmin et; düymə kənarının kəsilməsini aradan qaldır | Siçan çarxı ilə sürüşdürmə işləyir | Təkrar istifadə olunan hook, CSS düzəlişi |
| 13 | Operator funksionallığı | Dispetçer iş prosesi üçün əlavə funksiyalar təklif et; seçilmiş 4 istiqaməti (park və dispetçer, elanlar, moderasiya, tarixçə/ayarlar) həyata keçir | Xəbərdarlıqdan real tədbirə qədər qapalı dövrə | Operator konsolu (6 səhifə), 20 test |
| 14 | Təhvil hazırlığı | Sistemi təmiz mühitdə sıfırdan yoxla (seed, demo hesablar daxil); bütün sənədləri Azərbaycan dilində, jüri üçün hərtərəfli hazırla; AI bəyannaməsində rol bölgüsünü şəffaf göstər | Jüri kompüterində bir əmrlə problemsiz işə salınma | Təmiz Docker yoxlaması, README, texniki izah, bu bəyannamə |

---

## 6. Keyfiyyətə nəzarət: necə yoxladıq

- **Avtomatik testlər:** 106 test (alqoritmlər, API, autentifikasiya, rol yoxlaması, dispetçer). Testlər hər mərhələdən sonra işə salınıb; uğursuz test olduqda səbəb araşdırılıb.
- **Canlı sistemdə yoxlama:** hər API endpoint-i curl ilə; Socket.IO hadisələri ayrıca klientlə; 10 dəqiqəlik anomaliya qaydası real bazada 12 dəqiqəlik dövrün təkrar oynadılması ilə (alert dəqiq 10 dəqiqədən sonra, yalnız bir dəfə yarandı).
- **Brauzer testləri:** hər iki rolun tam ssenarisi, mobil və desktop görünüş, xəta mesajları, giriş icazələri.
- **Komandanın əl ilə sınağı:** sayt komanda tərəfindən istifadəçi kimi sınanıb və tapılan problemlər (§4) düzəldilib.
- **Təmiz quraşdırma:** `docker compose down -v` → `build --no-cache` → `up`; miqrasiyalar, seed, demo hesablar, restart idempotentliyi və nginx üzərindən WebSocket yoxlanılıb.

---

## 7. Məsuliyyət bəyanatı

- Təqdim edilən bütün kod komanda tərəfindən nəzərdən keçirilib, işə salınıb və sınaqdan keçirilib; nəticəyə görə məsuliyyəti komanda daşıyır.
- Layihə yarış müddətində (31.10.2026, 11:00–15:00) sıfırdan yaradılıb; kənar şəxslərdən kömək alınmayıb, digər komandalarla kod paylaşılmayıb.
- Demo hesabların şifrələri yalnız test məqsədlidir; real istifadədə `JWT_SECRET` və şifrələr dəyişdirilməlidir.
