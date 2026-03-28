// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — Karta e Studentit App
// Exact translation of the React web prototype data arrays.
// badgeColor  → hex values (mapped from Tailwind class names)
// btnGradient → [startColor, endColor] for expo-linear-gradient
// actionIconName → lucide-react-native icon component name (string)
// ─────────────────────────────────────────────────────────────────────────────

import { CardItem, Category, Business, CategoryPill, Raffle, DirectReward, VipStatus, ProfileApplication, ProfileCourse, ScanHistoryEntry, CourseCategory, HowItWorksStep, CourseItem, JobCategory, JobItem, StartupCategory, StartupStep, StartupItem, ActCategory, ActActivity, KvrGroup, KvrActivity, AppNotification } from '../types';

// ── Categories (horizontal pill scroll) ─────────────────────────────────────
export const CATEGORIES: Category[] = [
  { name: 'Kurse',     icon: '🎓', bgColor: '#EFF6FF'                },
  { name: 'Punë',      icon: '💼', bgColor: '#FAF5FF'                },
  { name: 'Startup',   icon: '🚀', bgColor: '#ECFDF5'                },
  { name: 'Vullnetar', icon: '🤝', bgColor: '#FFF7ED'                },
  { name: 'KVR',       icon: '🏛️', bgColor: '#F1F5F9'                },
];

// ── Businesses / Offers ──────────────────────────────────────────────────────
export const BUSINESSES: CardItem[] = [
  {
    id:             'b1',
    type:           'biznes',
    title:          'Restorant Rozafa',
    discount:       '-20%',
    rating:         '4.8',
    badgeColor:     '#f43f5e',
    img:            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    meta:           'Kuzhinë Tradicionale Shkodrane',
    fullDesc:       'Shijoni gatimet më të mira tradicionale shkodrane me një zbritje ekskluzive për studentët. E vlefshme çdo ditë!',
    actionText:     'Shiko Ofertën',
    actionIconName: 'QrCode',
    btnGradient:    ['#a3e635', '#65a30d'],
  },
  {
    id:             'b2',
    type:           'biznes',
    title:          'Kinema Republika',
    discount:       '1+1 Falas',
    rating:         '4.9',
    badgeColor:     '#3b82f6',
    img:            'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
    meta:           'Argëtim & Evente • 2.5 km',
    fullDesc:       'Paguaj 1 biletë dhe merr 1 tjetër falas për shoqëruesin tënd. Kthejeni fundjavën në festë!',
    actionText:     'Shiko Ofertën',
    actionIconName: 'QrCode',
    btnGradient:    ['#a3e635', '#65a30d'],
  },
];

// ── Opportunities (Jobs / Internships) ───────────────────────────────────────
export const OPPORTUNITIES: CardItem[] = [
  {
    id:             'o1',
    type:           'punë',
    title:          'UI/UX Designer',
    discount:       'Internship',
    badgeColor:     '#a855f7',
    img:            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    meta:           'TechSolutions AL • Zyrë',
    fullDesc:       "Kërkojmë 2 praktikantë të rinj për t'u bërë pjesë e ekipit tonë të dizajnit.",
    actionText:     'Apliko me 1 Klik',
    actionIconName: 'Briefcase',
    btnGradient:    ['#a855f7', '#7e22ce'],
  },
];

// ── Startups ─────────────────────────────────────────────────────────────────
export const STARTUPS: CardItem[] = [
  {
    id:             's1',
    type:           'startup',
    title:          'Startup Grant 2026',
    discount:       'Thirrje e Hapur',
    badgeColor:     '#10b981',
    img:            'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=800&q=80',
    meta:           'Bashkia Shkodër • Afati: 30 Prill',
    fullDesc:       'Programi "Shkodra Startups" ofron deri në 500,000 ALL për idetë më inovative.',
    actionText:     'Apliko Tani',
    actionIconName: 'ExternalLink',
    btnGradient:    ['#10b981', '#047857'],
  },
  {
    id:             's2',
    type:           'startup',
    title:          'Udhëzues: Si të hapni një NIPT',
    discount:       'Material',
    badgeColor:     '#6366f1',
    img:            'https://images.unsplash.com/photo-1432888117426-14660d13885b?auto=format&fit=crop&w=800&q=80',
    meta:           'Qendra e Biznesit • Udhëzues hap-pas-hapi',
    fullDesc:       'Gjithçka që duhet të dini për të hapur biznesin tuaj të parë — nga NIPT deri te llogaria bankare.',
    actionText:     'Lexo më shumë',
    actionIconName: 'FileText',
    btnGradient:    ['#6366f1', '#4338ca'],
  },
];

// ── Courses / Training (used in Bento Box grid) ──────────────────────────────
export const COURSES: CardItem[] = [
  {
    id:             'c1',
    type:           'kurs',
    title:          'Gjuhë të Huaja',
    discount:       'Falas',
    badgeColor:     '#0ea5e9',
    img:            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    meta:           '-50% për gjermanisht & anglisht.',
    fullDesc:       'Përmirësoni aftësitë tuaja në gjuhën angleze dhe gjermane me çmime speciale për studentë.',
    actionText:     'Regjistrohu',
    actionIconName: 'Globe',
    btnGradient:    ['#0ea5e9', '#2563eb'],
  },
  {
    id:             'c2',
    type:           'kurs',
    title:          'Praktika Verore',
    discount:       '12 Pozicione',
    badgeColor:     '#f97316',
    img:            'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=800&q=80',
    meta:           'Pozicione të lira IT & Design.',
    fullDesc:       'Programi i praktikës verore ofron mundësi reale për studentët në kompanitë partnere.',
    actionText:     'Regjistrohu',
    actionIconName: 'Briefcase',
    btnGradient:    ['#fb923c', '#ea580c'],
  },
  {
    id:             'c3',
    type:           'kurs',
    title:          'Startup Grants',
    discount:       'Bursa',
    badgeColor:     '#6366f1',
    img:            'https://images.unsplash.com/photo-1432888117426-14660d13885b?auto=format&fit=crop&w=800&q=80',
    meta:           'Fito deri në €5,000 për idenë.',
    fullDesc:       'Bursa inovative për studentët me ide revolucionare që ndikojnë në komunitetin lokal.',
    actionText:     'Apliko Tani',
    actionIconName: 'Rocket',
    btnGradient:    ['#6366f1', '#4338ca'],
  },
];

// ── ACT4Shkodra / Volunteer Activities ───────────────────────────────────────
export const ACT4: CardItem[] = [
  {
    id:             'a1',
    type:           'vullnetarizëm',
    title:          'Pyllëzimi i Shirokës',
    discount:       'Gjelbërim',
    badgeColor:     '#f43f5e',
    img:            'https://images.unsplash.com/photo-1618477461853-cf6ed80fbfc9?auto=format&fit=crop&w=800&q=80',
    meta:           '12 Prill • Liqeni Shkodrës',
    fullDesc:       'Bëhu pjesë e aksionit të mbjelljes së pemëve pranë liqenit. Fito statusin Vullnetar!',
    actionText:     'Bëhu Vullnetar',
    actionIconName: 'Heart',
    btnGradient:    ['#f43f5e', '#be123c'],
  },
];

// ── KVR (Këshilli Vendor i Rinisë) ────────────────────────────────────────────
export const KVR: CardItem[] = [
  {
    id:             'k1',
    type:           'kvr lajm',
    title:          'Mbledhja e Parë e KVR 2026',
    discount:       'Takim',
    badgeColor:     '#334155',
    img:            'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80',
    meta:           'Bashkia Shkodër • Sot',
    fullDesc:       'Diskutuam planet dhe strategjitë e reja rinore me fokus rritjen e punësimit dhe inovacionit.',
    actionText:     'Lexo Më Shumë',
    actionIconName: 'FileText',
    btnGradient:    ['#334155', '#0f172a'],
  },
];

// ── Offers module: Category Pills ────────────────────────────────────────────
export const CATEGORY_PILLS: CategoryPill[] = [
  { id: 'all',      name: 'Të gjitha',        icon: '' },
  { id: 'fastfood', name: 'Ushqim i Shpejtë', icon: '🍔' },
  { id: 'pizza',    name: 'Piceri',            icon: '🍕' },
  { id: 'coffee',   name: 'Kafe & Lounge',     icon: '☕' },
  { id: 'health',   name: 'Klinika & Shëndet', icon: '🏥' },
  { id: 'beauty',   name: 'Estetikë',          icon: '💇' },
  { id: 'tech',     name: 'Teknologji',        icon: '💻' },
  { id: 'books',    name: 'Librari',           icon: '📚' },
  { id: 'public',   name: 'Shërbime Publike',  icon: '🏛️' },
  { id: 'sport',    name: 'Sport & Palestër',  icon: '🏋️' },
];

export const REKOMANDUAT: Business[] = [
  {
    id: 'r1', title: 'Opa Shkodër', category: 'Ushqim i Shpejtë',
    discount: '-20% në gjithçka', badgeColor: '#f59e0b',
    rating: '4.8', scans: 1250, time: '15-25 min',
    img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    desc: 'Mrekullia e mishit e mbështjellë në një pite!',
    rules: 'Zbritje 20% për studentët. Vlen çdo ditë gjatë gjithë muajit.',
    address: 'Pedonale, Shkodër', phone: '067 457 3012', recommendations: 142,
  },
  {
    id: 'r2', title: 'Cliché Bar & Bistro', category: 'Kafe & Lounge',
    discount: '-15% në pije', badgeColor: '#0ea5e9',
    rating: '4.9', scans: 890, time: 'Hapur Tani',
    img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    desc: 'Flavors that inspire! Vendi perfekt pasdite.',
    rules: 'Vlen pas orës 16:00. Shfaq kartën para porosisë.',
    address: 'Rruga 13 Dhjetori', phone: '069 111 2222', recommendations: 89,
  },
];

export const TE_PERDORURAT: Business[] = [
  {
    id: 'p1', title: 'Fast Food Shkreli', category: 'Ushqim i Shpejtë',
    discount: 'Menu 300 L', badgeColor: '#ef4444',
    rating: '4.7', scans: 2450, time: '10-20 min',
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    desc: 'Zgjedhja e parë e studentëve për drekën!',
    rules: 'Menu speciale studentore vetëm me kartë.',
    address: 'Pranë Rektoratit', phone: '068 222 3333', recommendations: 312,
  },
  {
    id: 'p2', title: 'Librari Universitare', category: 'Materiale Studimi',
    discount: '-30% Kopje', badgeColor: '#6366f1',
    rating: '4.9', scans: 1890, time: 'Hapur',
    img: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80',
    desc: 'Librat dhe printimet me çmimin më të lirë.',
    rules: 'Zbritje në çdo shërbim printimi/fotokopje.',
    address: 'Pranë Fakultetit Ekonomik', phone: 'N/A', recommendations: 205,
  },
];

export const SHERBIME_PRIVATE: Business[] = [
  {
    id: 'sp1', title: 'Klinika Dentare "Buzëqeshja"', category: 'Shëndet & Kujdes',
    discount: '-40% Pastrim', badgeColor: '#14b8a6',
    rating: '5.0', scans: 120, time: 'Me Orar',
    img: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
    desc: 'Kujdesuni për shëndetin tuaj dentar me tarifa studentore.',
    rules: 'Zbritja aplikohet për pastrim gurëzash dhe konsulta.',
    address: 'Rruga Skënderbeu', phone: '069 444 5555', recommendations: 45,
  },
  {
    id: 'sp2', title: 'Optika "Vizioni"', category: 'Shëndet & Kujdes',
    discount: 'Syze Falas', badgeColor: '#a855f7',
    rating: '4.8', scans: 340, time: 'Hapur',
    img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
    desc: 'Kontroll falas i syve dhe skeleti falas.',
    rules: 'Bleni xhamat dhe skeletin e merrni falas.',
    address: 'Rruga Parrucë', phone: '067 888 9999', recommendations: 120,
  },
];

export const SHERBIME_PUBLIKE: Business[] = [
  {
    id: 'pu1', title: 'Kalaja e Shkodrës', category: 'Histori / Muze',
    discount: '70% Zbritje', badgeColor: '#f43f5e',
    rating: '4.9', scans: 400, time: '09:00 - 18:00',
    img: 'https://images.unsplash.com/photo-1600588665044-672ce00cb36a?auto=format&fit=crop&w=800&q=80',
    desc: 'Parku Kombëtar Arkeologjik. Zbuloni historinë.',
    rules: 'Hyrja për studentët me tarifë të reduktuar.',
    address: 'Kala, Shkodër', phone: 'N/A', recommendations: 256,
  },
  {
    id: 'pu2', title: 'Mensa e Qytetit Shkodër', category: 'Shërbime Publike',
    discount: 'Ekskluzive', badgeColor: '#f97316',
    rating: '4.6', scans: 5120, time: '11:30 - 15:00',
    img: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
    desc: 'Vakte të plota me çmime të subvencionuara.',
    rules: 'Hyrja vetëm me Kartë Studenti.',
    address: 'Kampusi Universitar', phone: 'N/A', recommendations: 480,
  },
];

// ── Rewards module ────────────────────────────────────────────────────────────
export const RAFFLES: Raffle[] = [
  {
    id: 'r1', title: 'Biletë Vajtje-Ardhje Theth',
    image: 'https://images.unsplash.com/photo-1596884698501-8b38740c2106?auto=format&fit=crop&w=800&q=80',
    cost: 10, timeLeft: 'Mbyllet në 2 Ditë', participants: 145, badgeColor: '#f43f5e',
    desc: 'Hidh emrin në short për të fituar një udhëtim fantastik fundjave në Theth. Transporti i mbuluar plotësisht!',
  },
  {
    id: 'r2', title: 'Kufje Bluetooth JBL',
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
    cost: 25, timeLeft: 'Mbyllet në 5 Ditë', participants: 320, badgeColor: '#f59e0b',
    desc: 'Kufje origjinale JBL me noise-cancelling. Ideale për të dëgjuar muzikë gjatë studimit.',
  },
];

export const DIRECT_REWARDS: DirectReward[] = [
  {
    id: 'd1', title: 'Kafe Falas', business: 'Cliché Bar & Bistro',
    cost: 30, icon: '☕', bgColor: '#fff7ed',
    desc: 'Tërhiq një kupon për një kafe ose kapuçino falas te Cliché Bar. E vlefshme për 7 ditë.',
  },
  {
    id: 'd2', title: '1 Biletë Kinemaje', business: 'Kinema Republika',
    cost: 100, icon: '🍿', bgColor: '#faf5ff',
    desc: 'Fito një biletë falas për çdo film të hënave ose të mërkurave. Ktheje pikën tënde në argëtim!',
  },
  {
    id: 'd3', title: 'Menu Fast Food', business: 'Opa Shkodër',
    cost: 150, icon: '🍔', bgColor: '#fef2f2',
    desc: 'Një menu e plotë (Pite + Pije + Patate) falas te Opa Shkodër. Tregoni kodin në arkë.',
  },
  {
    id: 'd4', title: 'Abonim 1 Mujor', business: 'Palestër "FitLife"',
    cost: 400, icon: '🏋️', bgColor: '#eff6ff',
    desc: 'Një muaj abonim falas në palestër për t\'u mbajtur në formë! Ofertë e limituar.',
  },
];

export const VIP_STATUS: VipStatus[] = [
  {
    id: 'v1', business: 'Kinema Republika', totalScans: 7,
    logo: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=150&q=80',
    rewards: [
      { title: 'Biletë Falas',    required: 1,  current: 1, unlocked: true  },
      { title: 'Biletë 2 Falas',  required: 10, current: 7, unlocked: false },
    ],
  },
];

// ── Mock student (used before real API is connected) ─────────────────────────
export const MOCK_STUDENT = {
  name:         'Beni Shkodrani',
  emri:         'Beni',
  mbiemri:      'Shkodrani',
  age:          '21',
  avatarUrl:    'https://ui-avatars.com/api/?name=Beni+Shkodrani&background=a3e635&color=3f6212&bold=true',
  points:       1250,
  vipCount:     1,
  nr_karte:     'KS-2026-0042',
  // ── Profile screen extras ──────────────────────────────────────────────────
  nim:          'SH541A123451',
  expiry:       '31.12.2029',
  idStatus:     'E VLEFSHME',
  scans:        8,
  targetScans:  10,
  act4Status:   'Vullnetar i Çertifikuar',
  act4Count:    2,
  phone:        '0697721467',
  email:        'beni@gmail.com',
};

// ── Profile — Activity history arrays ────────────────────────────────────────
export const APPLICATIONS: ProfileApplication[] = [
  {
    id: 1, title: 'Praktikë IT', company: 'Bashkia Shkodër',
    date: '22 Mar 2026', status: 'Pranuar', type: 'accepted',
  },
  {
    id: 2, title: 'Punë me orar të pjeshëm', company: 'OPA',
    date: '17 Mar 2026', status: 'Në Shqyrtim', type: 'pending',
  },
];

export const COURSE_ACTIVITIES: ProfileCourse[] = [
  {
    id: 1, title: 'Gjuhë Angleze (B2)', location: 'Qendra Rinore',
    date: '21.03.2026', session: 1, status: 'Përfunduar', type: 'done',
  },
  {
    id: 2, title: 'Marketing Digjital', location: 'Arka',
    date: '25.03.2026', session: 3, status: 'Aktiv', type: 'active',
  },
];

export const SCAN_HISTORY: ScanHistoryEntry[] = [
  { id: 1, action: 'Skanim Karta', place: 'Cliché Bar & Bistro',  date: '23 Mar 2026, 09:53', icon: '🛍️' },
  { id: 2, action: 'Skanim Karta', place: 'Opa Shkodër',          date: '22 Mar 2026, 22:15', icon: '🍔' },
  { id: 3, action: 'Aktivitet ACT4', place: 'Pastrim Shirokë',    date: '20 Mar 2026, 14:53', icon: '🤝' },
  { id: 4, action: 'Skanim Karta', place: 'Kinema Republika',     date: '18 Mar 2026, 19:30', icon: '🍿' },
];

// ── Courses module ────────────────────────────────────────────────────────────
export const COURSE_CATEGORIES: CourseCategory[] = [
  { id: 'all',    name: 'Të gjitha',      icon: ''   },
  { id: 'tech',   name: 'Teknologji',     icon: '💻' },
  { id: 'career', name: 'Karrierë',       icon: '💼' },
  { id: 'soft',   name: 'Soft Skills',    icon: '🗣️' },
  { id: 'lang',   name: 'Gjuhë të Huaja', icon: '🌍' },
];

export const HOW_IT_WORKS: HowItWorksStep[] = [
  { id: 1, num: '1', title: 'Zgjidh kursin',     desc: 'Gjej temën që të duhet: digjitale, gjuhë, soft skills.' },
  { id: 2, num: '2', title: 'Shiko datat',        desc: 'Orari, vendi, niveli dhe kohëzgjatja — të gjitha të qarta.' },
  { id: 3, num: '3', title: 'Regjistrohu',        desc: 'Me 1 klikim përmes Kartës së Studentit.' },
  { id: 4, num: '4', title: 'Përfito certifikim', desc: 'Pjesëmarrja verifikohet me skaner dhe gjeneron certifikatë.' },
];

export const ALL_COURSES: CourseItem[] = [
  {
    id: 'kurs1',
    title: 'Frymëzojmë, me Rrjetin e Kampionëve',
    category: 'Teknologji', badgeColor: '#dc2626',
    date: '21 Mars 2026', location: 'Qendra Rinore',
    duration: '4 Javë (2 seanca/javë)', cert: 'Po, pas përfundimit', seats: '19 / 20',
    img: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80',
    desc: 'Të gjithë jemi kampionë, të lidhur në Rrjetin Nr.1 në Shqipëri. Një kurs praktik mbi teknologjitë e reja 5G, Realitetin Virtual (VR) dhe Inovacionin Dixhital i mbështetur nga Vodafone.',
  },
  {
    id: 'kurs2',
    title: 'Aftësi në Prezantim (Public Speaking)',
    category: 'Soft Skills', badgeColor: '#f59e0b',
    date: '05 Prill 2026', location: 'Teatri Migjeni',
    duration: '3 Javë (1 seancë/javë)', cert: 'Po, pas përfundimit', seats: '5 / 15',
    img: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    desc: 'Mësoni si të flisni me vetëbesim para një publiku, si të strukturoni një fjalim dhe si të përdorni gjuhën e trupit për të lënë gjurmë.',
  },
  {
    id: 'kurs3',
    title: 'Hyrje në Marketing Digjital',
    category: 'Karrierë', badgeColor: '#0ea5e9',
    date: '12 Prill 2026', location: 'Arka Youth Center',
    duration: '6 Javë (2 seanca/javë)', cert: 'Po, pas përfundimit', seats: '25 / 30',
    img: 'https://images.unsplash.com/photo-1432888117426-14660d13885b?auto=format&fit=crop&w=800&q=80',
    desc: 'Zbuloni bazat e menaxhimit të rrjeteve sociale, krijimit të përmbajtjes me Canva dhe optimizimit të fushatave reklamuese.',
  },
];

// ── Opportunities / Jobs module ───────────────────────────────────────────────
export const JOB_CATEGORIES: JobCategory[] = [
  { id: 'all',       name: 'Të gjitha Kategoritë', icon: '📁' },
  { id: 'praktike',  name: 'Praktika',              icon: '🎓' },
  { id: 'part-time', name: 'Punë Part-Time',        icon: '⏱️' },
  { id: 'full-time', name: 'Punë Full-Time',        icon: '💼' },
  { id: 'vullnetar', name: 'Vullnetarizëm',         icon: '🤝' },
];

export const JOBS: JobItem[] = [
  {
    id: 'j1',
    title: 'Praktikë IT',
    company: 'Bashkia Shkodër',
    type: 'PRAKTIKË',
    badgeBg: '#f3e8ff', badgeText: '#7e22ce', badgeBorder: '#e9d5ff',
    date: '24 Mar 2026', location: 'Bashkia Shkodër',
    salary: 'Certifikatë', duration: '3 Muaj',
    img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    desc: 'Mundësi e shkëlqyer për studentët e informatikës për të fituar përvojë praktike në sektorin publik. Do të punoni drejtpërdrejt me ekipin e TIK-ut të Bashkisë Shkodër.',
  },
  {
    id: 'j2',
    title: 'Punë me orar të pjesshëm',
    company: 'OPA Shkodër',
    type: 'PART-TIME',
    badgeBg: '#fff1f2', badgeText: '#be123c', badgeBorder: '#fecdd3',
    date: '25 Mar 2026', location: 'Shkodër',
    salary: '25,000 ALL / Muaj', duration: 'Fleksibël',
    img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    desc: 'Kërkojmë studentë energjikë për t\'u bërë pjesë e stafit tonë me orar të pjesshëm. Orare të përshtatshme me leksionet tuaja dhe mundësi për të fituar të ardhura shtesë.',
  },
  {
    id: 'j3',
    title: 'Asistent Marketingu Digjital',
    company: 'TechSolutions AL',
    type: 'FULL-TIME',
    badgeBg: '#ecfdf5', badgeText: '#065f46', badgeBorder: '#a7f3d0',
    date: '30 Prill 2026', location: 'Remote / Zyrë',
    salary: 'Konkurruese', duration: 'Pa afat',
    img: 'https://images.unsplash.com/photo-1432888117426-14660d13885b?auto=format&fit=crop&w=800&q=80',
    desc: 'Një mundësi e shkëlqyer për studentët e vitit të fundit në Marketing. Do të ndihmoni në menaxhimin e fushatave tona sociale dhe krijimin e përmbajtjes.',
  },
];

// ── Startup module ────────────────────────────────────────────────────────────
export const STARTUP_CATEGORIES: StartupCategory[] = [
  { id: 'all',      name: 'Të gjitha',       icon: '📁' },
  { id: 'thirrje',  name: 'Thirrje të Hapura', icon: '🚀' },
  { id: 'udhezues', name: 'Udhëzues',        icon: '📖' },
  { id: 'fonde',    name: 'Fonde & Grante',  icon: '💰' },
  { id: 'mentor',   name: 'Mentorship',      icon: '🤝' },
];

export const STARTUP_STEPS: StartupStep[] = [
  { id: 1, num: '1', title: 'Zgjidh thirrjen', desc: 'Shiko thirrjet aktive dhe kriteret e pranimit.' },
  { id: 2, num: '2', title: 'Përgatit idenë',  desc: 'Plotëso formularin e aplikimit me idenë tënde.' },
  { id: 3, num: '3', title: 'Apliko',           desc: 'Dërgo aplikimin me 1 klikim përmes Kartës.' },
  { id: 4, num: '4', title: 'Merr mbështetje', desc: 'Programi ofron mentor, fond dhe certifikim.' },
];

export const STARTUP_ITEMS: StartupItem[] = [
  {
    id: 'st1',
    title: 'Shkodra Startup Grant 2026',
    type: 'FOND',
    category: 'thirrje',
    badgeBg: '#ecfdf5', badgeText: '#065f46', badgeBorder: '#a7f3d0',
    date: '30 Prill 2026',
    img: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=800&q=80',
    desc: 'Programi "Shkodra Startups" ofron deri në 500,000 ALL për idetë më inovative të studentëve të Universitetit të Shkodrës.',
    fullDesc: 'Bashkia Shkodër në bashkëpunim me Agjencinë Rajonale të Biznesit hap thirrjen vjetore për studentët sipërmarrës. Projektet fituese marrin financim, mentorship dhe hapësirë pune falas për 6 muaj.',
    criteria: [
      'Student aktiv i Universitetit të Shkodrës.',
      'Ide inovative me impakt lokal ose rajonal.',
      'Ekip prej 1 deri 3 personash.',
      'Prezantim 5-minutësh para jurisë.',
    ],
    actionText: 'Apliko për Fondin',
  },
  {
    id: 'st2',
    title: 'Youth Innovation Challenge',
    type: 'KONKURS',
    category: 'thirrje',
    badgeBg: '#fff7ed', badgeText: '#9a3412', badgeBorder: '#fed7aa',
    date: '15 Maj 2026',
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    desc: 'Konkursi ndërkombëtar i inovacionit për të rinj, i organizuar nga UN Albania. Çmimi i parë: €3,000 + mentorship 6-mujor.',
    fullDesc: 'Youth Innovation Challenge është platforma më e madhe e inovacionit për të rinjtë ballkanikë. Aplikantët paraqesin zgjidhje teknologjike për sfida lokale si turizmi, mjedisi apo edukimi.',
    criteria: [
      'Mosha 18–30 vjeç.',
      'Ide apo prototip ekzistues.',
      'Aplikim online me video 3-minutëshe.',
      'Gjuhë: Shqip ose Anglisht.',
    ],
    actionText: 'Apliko për Fondin',
  },
  {
    id: 'st3',
    title: 'Si të hapni një NIPT — Hap pas Hapi',
    type: 'UDHËZUES',
    category: 'udhezues',
    badgeBg: '#eff6ff', badgeText: '#1e40af', badgeBorder: '#bfdbfe',
    date: 'Gjithmonë i disponueshëm',
    img: 'https://images.unsplash.com/photo-1432888117426-14660d13885b?auto=format&fit=crop&w=800&q=80',
    desc: 'Gjithçka që duhet të dini për të hapur biznesin tuaj të parë — nga NIPT deri te llogaria bankare dhe sigurimet.',
    fullDesc: 'Ky udhëzues i hartuar nga Qendra e Biznesit Shkodër mbulon çdo hap të nevojshëm: regjistrimin në QKB, hapjen e llogarisë bankare, procedurat tatimore dhe marrjen e licencave të nevojshme.',
    criteria: [
      'Nuk nevojitet asnjë kusht paraprak.',
      'Të disponueshëm falas për të gjithë studentët.',
    ],
    actionText: '',
  },
  {
    id: 'st4',
    title: 'Modelet e Biznesit: Lean Canvas',
    type: 'UDHËZUES',
    category: 'udhezues',
    badgeBg: '#f5f3ff', badgeText: '#5b21b6', badgeBorder: '#ddd6fe',
    date: 'Gjithmonë i disponueshëm',
    img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    desc: 'Mëso si të strukturosh idenë tënde biznesi me Lean Canvas — mjeti standard i startup-eve botërore.',
    fullDesc: 'Lean Canvas është versioni startup i Business Model Canvas. Ky material interaktiv të çon hap pas hapi nëpër 9 blloqet kryesore: problemi, segmentet, propozimi unik i vlerës, zgjidhja, kanalet, metrikat dhe kostot.',
    criteria: [
      'Material falas për të gjithë studentët.',
      'Kërkohet 30–60 minuta lexim.',
    ],
    actionText: '',
  },
];

// ── ACT4Shkodra / Vullnetarizëm module ───────────────────────────────────────
export const ACT_CATEGORIES: ActCategory[] = [
  { id: 'all',       name: 'Të gjitha',  icon: '🌍' },
  { id: 'gjelberim', name: 'Gjelbërim',  icon: '🌱' },
  { id: 'pastrim',   name: 'Pastrim',    icon: '🧹' },
  { id: 'bamiresi',  name: 'Bamirësi',   icon: '🤝' },
  { id: 'kulture',   name: 'Art & Kulturë', icon: '🎭' },
];

export const ACT_ACTIVITIES: ActActivity[] = [
  {
    id: 'ac1',
    title: 'Aksion vullnetar: Pyllëzimi i Zonës së Shirokës',
    category: 'Gjelbërim',
    catId: 'gjelberim',
    badgeColor: '#003366',
    dateStr: '20 MAR',
    fullDate: '20 Mars 2026',
    time: '09:00 - 13:00',
    location: 'Shirokë, Shkodër',
    img: 'https://images.unsplash.com/photo-1618477461853-cf6ed80fbfc9?auto=format&fit=crop&w=800&q=80',
    desc: 'Bashkohu me ne për të mbjellë 200 fidanë të rinj përgjatë vijës liqenore. Mjetet ofrohen nga Bashkia.',
    fullDesc: 'Këtë fundjavë, të rinjtë shkodranë dhe studentët e Universitetit "Luigj Gurakuqi" do të bëhen bashkë për t\'i dhënë frymëmarrje një prej zonave më të bukura turistike të qytetit tonë, Shirokës. Aksioni do të fokusohet në mbjelljen e fidanëve të rinj dhe pastrimin e mbetjeve plastike. Në përfundim të aktivitetit, të gjithë pjesëmarrësit do të pajisen me certifikata vullnetarizmi.',
  },
  {
    id: 'ac2',
    title: 'Ndihmë për Komunitetin: Shpërndarje Pakosh',
    category: 'Bamirësi',
    catId: 'bamiresi',
    badgeColor: '#9b59b6',
    dateStr: '25 MAR',
    fullDate: '25 Mars 2026',
    time: '10:00 - 14:00',
    location: 'Qendra Sociale',
    img: 'https://images.unsplash.com/photo-1593113563332-e147f4f144bf?auto=format&fit=crop&w=800&q=80',
    desc: 'Ndihmo në paketimin dhe shpërndarjen e ndihmave ushqimore për familjet në nevojë në prag të festave.',
    fullDesc: 'Një nismë solidare për t\'i qëndruar pranë familjeve në nevojë. Kërkojmë vullnetarë për të ndihmuar në paketimin e kutive me ushqime dhe veshje, si dhe asistencë në shpërndarjen e tyre në terren sipas listave të miratuara nga shërbimi social.',
  },
  {
    id: 'ac3',
    title: 'Pastrimi i Plazhit të Velipojës',
    category: 'Pastrim',
    catId: 'pastrim',
    badgeColor: '#2980b9',
    dateStr: '02 PRI',
    fullDate: '02 Prill 2026',
    time: '08:30 - 15:00',
    location: 'Velipojë',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    desc: 'Përgatitemi për sezonin veror! Aksion madhor për pastrimin e bregdetit nga mbetjet plastike.',
    fullDesc: 'Plazhi i Velipojës ka nevojë për ne para nisjes së sezonit turistik. Transporti nga Shkodra në Velipojë do të mbulohet nga organizatorët. Mjetet e punës, dorezat dhe thasët e mbeturinave do t\'ju shpërndahen në vendngjarje. Ejani me rroba të rehatshme!',
  },
];

// ── KVR module ────────────────────────────────────────────────────────────────
export const KVR_GROUPS: KvrGroup[] = [
  {
    id: 'sport', name: 'Sporti dhe Kultura',
    iconName: 'Trophy', color: '#e11d48', bg: '#fff1f2', border: '#fecdd3',
    desc: 'Aktivitete kulturore, evente sportive dhe promovim i jetesës së shëndetshme mes të rinjve.',
  },
  {
    id: 'inovacion', name: 'Inovacioni dhe Sipërmarrja',
    iconName: 'Lightbulb', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    desc: 'Nxitja e ideve të reja, start-up, teknologji dhe zhvillim i aftësive profesionale e digjitale.',
  },
  {
    id: 'eco', name: 'Eco dhe Mjedisi',
    iconName: 'Leaf', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0',
    desc: 'Fushata ndërgjegjësimi, aksione pastrimi dhe promovimi i hapësirave të gjelbra në qytet.',
  },
  {
    id: 'sociale', name: 'Shkodra Sociale',
    iconName: 'Users', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
    desc: 'Vullnetarizëm, barazi, gjithëpërfshirje dhe mbështetje për grupet rinore me nevoja specifike.',
  },
];

export const KVR_ACTIVITIES: KvrActivity[] = [
  {
    id: 'kv1',
    title: 'Mbledhja e parë e KVR për vitin 2026',
    category: 'Inovacioni dhe Sipërmarrja', catId: 'inovacion',
    date: '22 Mars 2026',
    img: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80',
    desc: 'KVR zhvilloi mbledhjen e parë vjetore ku u diskutuan buxhetet dhe prioritetet për projektet rinore.',
    fullDesc: 'Këshilli Vendor i Rinisë zhvilloi mbledhjen e parë vjetore në sallën e Këshillit Bashkiak. Gjatë këtij takimi, anëtarët prezantuan planin e veprimit për vitin 2026, duke theksuar mbështetjen për idetë inovative të të rinjve dhe ngritjen e fondeve për start-up-et lokale. Takimi ishte i hapur për çdo student të pajisur me Kartën e Studentit.',
    location: 'Salla e Këshillit Bashkiak',
  },
  {
    id: 'kv2',
    title: 'Aktivitete sociale dhe rinore në pedonale',
    category: 'Sporti dhe Kultura', catId: 'sport',
    date: '20 Mars 2026',
    img: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    desc: 'Evente, trajnime, diskutime, art & kulturë — hapësira ku të rinjtë shprehen dhe bashkëpunojnë.',
    fullDesc: 'Fundjava ishte plot gjallëri në pedonalen "Kolë Idromeno". Grupi tematik i Sportit dhe Kulturës organizoi një sërë aktivitetesh, nga ekspozita e pikturave të studentëve të arteve deri te një mini-kampionat shahu dhe ping-pongu. Qëllimi ishte krijimi i një hapësire ku të rinjtë mund të kalojnë kohën e lirë në mënyrë cilësore.',
    location: 'Pedonalja e Qytetit',
  },
  {
    id: 'kv3',
    title: 'Fushata ndërgjegjësuese për mjedisin',
    category: 'Eco dhe Mjedisi', catId: 'eco',
    date: '15 Mars 2026',
    img: 'https://images.unsplash.com/photo-1618477461853-cf6ed80fbfc9?auto=format&fit=crop&w=800&q=80',
    desc: 'Grupi Eco shpërndau materiale edukative dhe organizoi një diskutim të hapur me gjimnazistët.',
    fullDesc: 'Me sloganin "Qyteti im, Shtëpia ime", grupi Eco dhe Mjedisi vizitoi disa nga gjimnazet kryesore të Shkodrës për të ndarë materiale edukative mbi riciklimin. Të rinjtë diskutuan rreth ndikimit të plastikës njëpërdorimshe dhe planifikuan aksionin e radhës për pastrimin e bregut të liqenit.',
    location: 'Gjimnazet e Shkodrës',
  },
];

// ── Notifications ─────────────────────────────────────────────────────────────
export const NOTIFICATIONS: AppNotification[] = [
  {
    id:         'n1',
    type:       'points',
    title:      'Urime! Ke fituar pikë 🟡',
    message:    'Skanimi yt tek "Opa Shkodër" ishte i suksesshëm. Ke fituar +5 SCoins në llogarinë tënde.',
    time:       'Para 10 minutash',
    isRead:     false,
    iconName:   'Gift',
    iconColor:  '#f59e0b',
    iconBg:     '#fef3c7',
    iconBorder: '#fde68a',
  },
  {
    id:         'n2',
    type:       'job',
    title:      'Aplikimi u pranua! 🎉',
    message:    'Aplikimi juaj për pozicionin "Praktikë IT" tek Bashkia Shkodër është pranuar. Shih detajet.',
    time:       'Para 2 orësh',
    isRead:     false,
    iconName:   'Briefcase',
    iconColor:  '#10b981',
    iconBg:     '#d1fae5',
    iconBorder: '#a7f3d0',
  },
  {
    id:         'n3',
    type:       'course',
    title:      'Rikujtesë për Kursin',
    message:    'Nesër në orën 17:00 fillon seanca e parë e kursit "Hyrje në Marketing Digjital". Mos mungo!',
    time:       'Dje',
    isRead:     true,
    iconName:   'Calendar',
    iconColor:  '#3b82f6',
    iconBg:     '#dbeafe',
    iconBorder: '#bfdbfe',
  },
  {
    id:         'n4',
    type:       'offer',
    title:      'Ofertë e Re Ekskluzive 🔥',
    message:    'Kinema Republika sapo ka shtuar ofertën 1+1 Falas për të gjithë studentët gjatë kësaj fundjave.',
    time:       'Para 2 ditësh',
    isRead:     true,
    iconName:   'Tag',
    iconColor:  '#a855f7',
    iconBg:     '#f3e8ff',
    iconBorder: '#e9d5ff',
  },
  {
    id:         'n5',
    type:       'act4',
    title:      'Aksion i Ri Vullnetar',
    message:    'Një aksion i ri pastrimi është shtuar në kategorinë Eco. Regjistrohu tani për të kontribuar.',
    time:       'Para 3 ditësh',
    isRead:     true,
    iconName:   'Heart',
    iconColor:  '#f43f5e',
    iconBg:     '#ffe4e6',
    iconBorder: '#fecdd3',
  },
];
