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
| 11:05 | Qaydalar və tapşırıq təqdim edildi; stack müəyyən edildi; «əvvəl plan, sonra addım-addım» tələb olundu | `PLAN.md`: qiymətləndirmə meyarlarına uyğun plan, vaxt bölgüsü, «kəsmə xətti» |
| 11:15 | Kompüterdə Node.js və Git olmadığı aşkarlandı — quraşdırmaya icazə verildi; Docker Desktop-u komanda özü quraşdırdı | İnkişaf mühiti hazır oldu |
| 11:45 | Hər addımdan sonra commit və GitHub-a push qərarı; repozitoriya yaradıldı | Mərhələli, izlənə bilən tarixçə |
| 12:08 | **İş axını qərarı:** backend + DB Docker-də, frontend lokal (canlı yenilənmə) | `docker compose up -d db backend` + Vite proksi |
| 12:12 | **Davranış sorğusu:** «Sərnişin Yüksək bildirəndə xətt dəyişmir — bu düzgündürmü?» | AI bunun qəsdən olduğunu real ölçmə ilə göstərdi (1 → 0.66, 3 bildiriş → 0.76 Yüksək) və bir istifadəçinin 30 saniyə fasilə ilə xətti «qırmızı» edə bilməsi zəifliyini qeyd etdi |
| 12:15 | **Təhlükəsizlik və UX qərarı:** sərnişinin operator səhifəsinə girə bilməsi qəbuledilməzdir — rollar üzrə giriş və tam yeni dizayn tələb edildi | JWT + bcrypt, server tərəfində rol yoxlaması, operator socket otağı; bildiriş limiti cihaz əvəzinə **hesab** üzrə (yuxarıdakı zəiflik də bağlandı); yeni dizayn |
| 12:40 | **UX problemi tapıldı:** üfüqi düymə zolaqları siçan çarxı ilə sürüşmür | Siçan çarxı və sürükləmə dəstəyi |
| 12:42 | **Vizual xəta tapıldı:** marşrut düymələrinin yuxarı kənarı kəsilir; «yoxlamadan, sürətli düzəliş» tələb olundu | Zolağa daxili boşluq əlavə edildi |
| 12:45 | **Məhsul qərarı:** operatorun əməliyyatları azdır; AI-dən təkliflər istənildi və 4 təklifin hamısı seçildi | Park və dispetçer, elanlar, bildiriş moderasiyası, tarixçə və qayda ayarları |
| 13:05 | **Təhvil tələbləri:** sistem jüri kompüterində sıfırdan problemsiz işləməlidir; sənədlər Azərbaycan dilində və hərtərəfli; AI bəyannaməsi insan işini də düzgün göstərməlidir | Təmiz Docker yoxlaması, port konfliktlərinə qarşı tədbirlər, bu sənədlər |

---

## 5. Prompt jurnalı

Komandanın AI-yə verdiyi əsas promptlar (orijinal dildə, qısaldılmış):

| # | Prompt | AI-nin gördüyü iş | Komandanın yoxlaması |
|---|---|---|---|
| 1 | «We are in a programming competition... Here are the rules (PDF) and the task. Analyze them and plan this task step by step, I don't want you to rush. Stack: JS, React, Tailwind; Node.js, Express, PostgreSQL, ORM; Docker» | Qaydaların və tapşırığın təhlili, `PLAN.md` | Plan oxundu və təsdiqləndi |
| 2 | «Start Step 0» | Layihə skeleti, Docker, nginx | — |
| 3 | «Yes, install Node + Git» | Node.js və Git quraşdırıldı, testlər işə salındı | İcazə komanda tərəfindən verildi |
| 4 | «I already installed Docker Desktop... run PostgreSQL on Docker» | Prisma sxemi, Bakı marşrutları ilə seed | Məlumatlar SQL ilə yoxlanıldı |
| 5 | «First commit... repo details: ...» | İlk commit və push | Repozitoriya komanda tərəfindən yaradıldı |
| 6 | «Start Step 2 / 3 / 4 / 5 / 6» | Analitika mühərriki, simulyator, API, sərnişin və operator interfeysləri | Hər addımın nəticəsi təsdiqləndikdən sonra növbəti addıma keçildi |
| 7 | «Up the server with Docker and let me run the frontend locally» | Hibrid inkişaf rejimi | Komanda saytı özü sınadı |
| 8 | «When a passenger sets a route as high, it does not change. Is it correct? Explain the entire flow» | Bütün axının izahı, real ölçmə | Komanda izahı qəbul etdi |
| 9 | «Enhance the UI/UX... passenger can enter the operator page — think about login pages for operator or passenger» | Rol əsaslı giriş, tam yeni dizayn, 18 yeni test | Komanda yeni dizaynı yoxladı |
| 10 | «Horizontally scrolled chips cannot be scrolled with a mouse wheel... think a simple solution» | Siçan çarxı / sürükləmə hook-u | — |
| 11 | «Top border of route chips is overflowed — fix, no need to check, fast update» | CSS düzəlişi | Problem komanda tərəfindən tapılıb |
| 12 | «Operators have very few actions... I am open to your suggestions» → 4 funksiyanın hamısı seçildi | Operator konsolu (6 səhifə), 20 yeni test | — |
| 13 | «Finalize the docs and check Docker from scratch... docs in Azerbaijani... AI declaration should show the human work» | Təmiz Docker yoxlaması, sənədlər | Tələblər komanda tərəfindən müəyyən edilib |

---

## 6. Keyfiyyətə nəzarət: necə yoxladıq

- **Avtomatik testlər:** 106 test (alqoritmlər, API, autentifikasiya, rol yoxlaması, dispetçer). Testlər hər mərhələdən sonra işə salınıb; uğursuz test olduqda səbəb araşdırılıb.
- **Canlı sistemdə yoxlama:** hər API endpoint-i curl ilə; Socket.IO hadisələri ayrıca klientlə; 10 dəqiqəlik anomaliya qaydası real bazada 12 dəqiqəlik dövrün təkrar oynadılması ilə (alert dəqiq 10 dəqiqədən sonra, yalnız bir dəfə yarandı).
- **Brauzer testləri:** hər iki rolun tam ssenarisi, mobil və desktop görünüş, xəta mesajları, giriş icazələri.
- **Komandanın əl ilə sınağı:** sayt komanda tərəfindən istifadəçi kimi sınanıb və tapılan problemlər (§4) düzəldilib.
- **Təmiz quraşdırma:** `docker compose down -v` → `build --no-cache` → `up`; miqrasiyalar, seed, demo hesablar, restart idempotentliyi və nginx üzərindən WebSocket yoxlanılıb.

---

## 7. AI-nin səhvləri və düzəlişlər (şəffaflıq üçün)

AI-nin işi qüsursuz olmayıb; aşağıdakılar test və yoxlama zamanı aşkarlanıb və düzəldilib:

| Problem | Necə aşkarlandı | Düzəliş |
|---|---|---|
| Test datasında səhv (1 dəqiqəlik pəncərədə bildirişlər pəncərədən kənarda idi) | Avtomatik test | Test düzəldildi, qayda dəyişmədi |
| Bütün xətlər daim «Orta» görünürdü | Canlı ölçmə | Simulyatorun yük əmsalları kalibrləndi |
| Operator alerti bağlayan kimi eyni alert dərhal yenidən yaranırdı | Brauzerdə canlı ssenari | Qayda: bağlanmadan sonra tam yeni pəncərə tələb olunur (+2 test) |
| Xəritə provayderi (CARTO) API açarı tələb edirdi | Brauzer ekran görüntüsü | OpenStreetMap-ə qayıdıldı |
| Tarix «M10 31» kimi görünürdü (brauzerdə az-AZ ay adları yoxdur) | Ekran görüntüsü | Azərbaycan ay adları əlavə edildi |
| 1280px ekranda cədvəl sığmırdı; dialoq üzərində başlıq görünürdü | Ekran görüntüsü | Responsiv düzəliş; dialoq portal ilə render edildi |
| Siçan çarxı ilə üfüqi sürüşdürmə yox idi; düymə kənarı kəsilirdi | **Komanda tərəfindən tapıldı** | Hook və CSS düzəlişi |
| Sərnişin operator səhifəsinə girə bilirdi | **Komanda tərəfindən tapıldı** | Rol əsaslı giriş (server və klient tərəfində) |

---

## 8. Məsuliyyət bəyanatı

- Təqdim edilən bütün kod komanda tərəfindən nəzərdən keçirilib, işə salınıb və sınaqdan keçirilib; nəticəyə görə məsuliyyəti komanda daşıyır.
- Layihə yarış müddətində (31.10.2026, 11:00–15:00) sıfırdan yaradılıb; kənar şəxslərdən kömək alınmayıb, digər komandalarla kod paylaşılmayıb.
- Demo hesabların şifrələri yalnız test məqsədlidir; real istifadədə `JWT_SECRET` və şifrələr dəyişdirilməlidir.
