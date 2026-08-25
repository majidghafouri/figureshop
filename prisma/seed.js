const { PrismaClient } = require("@prisma/client");
const { BLOG_POSTS } = require("./blog-data");

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    slug: "anime-figure",
    image: "/uploads/products/20211066900-01.jpg",
    name: { fa: "فیگور انیمه", en: "Anime Figures", ar: "تماثيل أنمي" },
    desc: { fa: "فیگورهای انیمه اورجینال", en: "Original anime figures", ar: "تماثيل أنمي أصلية" },
  },
  {
    slug: "gaming-figure",
    image: "/uploads/categories/gaming.svg",
    name: { fa: "فیگور گیمینگ", en: "Gaming Figures", ar: "تماثيل الألعاب" },
    desc: { fa: "فیگورهای بازی‌های ویدیویی", en: "Video game figures", ar: "تماثيل ألعاب الفيديو" },
  },
  {
    slug: "movies-series",
    image: "/uploads/products/starwars-2-edited.jpg",
    name: { fa: "فیگور سینمایی و سریالی", en: "Movies & Series", ar: "تماثيل السينما والمسلسلات" },
    desc: { fa: "فیگورهای شخصیت‌های سینما و سریال", en: "Movie and series characters", ar: "شخصيات السينما والمسلسلات" },
  },
  {
    slug: "disney-pixar",
    image: "/uploads/products/WALL.E.gif-07.gif",
    name: { fa: "فیگور دیزنی و پیکسار", en: "Disney & Pixar", ar: "تماثيل ديزني وبيكسار" },
    desc: { fa: "فیگورهای دیزنی و پیکسار", en: "Disney and Pixar figures", ar: "تماثيل ديزني وبيكسار" },
  },
];

// eslint-disable-next-line no-unused-vars
const U = (s) => s;

const PRODUCT_MUSIC = {
  "baby-yoda-grogu": "Enchanted Valley",
  "baby-yoda-robotic-25": "Infados",
  "baby-yoda-robotic-40": "Wholesome",
  "spider-man-miles-morales": "Prelude and Action",
  "spider-man-peter-parker-spiderverse": "Crypto",
  "walle-disney": "Carefree",
  "assassins-creed-3-conner": "Five Armies",
  "assassins-creed-bayek": "Lotus",
  "assassins-creed-altair": "Crusade",
  "assassins-creed-aya": "Ritual",
  "godzilla-vs-kong": "Strength of the Titans",
  "tintin-and-milou": "Sneaky Adventure",
  "mandalorian-and-child": "Galway",
  "hannibal-lecter-neca": "Darkest Child",
  "sulley-monsters-inc": "Monkeys Spinning Monkeys",
  "war-machine-mk1-zd": "Danger Storm",
  "iron-man-mk5-zd": "Heroic Age",
  "alien-xenomorph-neca": "Unseen Horrors",
  "john-wick-mafex": "Volatile Reaction",
  "venom-play-arts": "Corruption",
  "kakashi-hatake-40cm": "Eastern Thought",
  "kratos-god-of-war": "Achilles",
  "geralt-witcher-3": "Rynos Theme",
  "darth-vader-kaidoyo": "Dark Times",
  "harry-potter-1": "Hedwig's Theme",
  "hermione-granger": "Hedwig's Theme",
  "ron-weasley": "Hedwig's Theme",
  "gandalf-the-grey": "The Bridge of Khazad Dum",
  "frodo-baggins": "Concerning Hobbits",
  "walter-white-heisenberg": "Come Alive",
};

const PRODUCTS = [
  {
    slug: "baby-yoda-grogu",
    sku: "FG-001",
    cat: "movies-series",
    brand: "Hasbro",
    price: 2400000,
    compare: 2900000,
    stock: 12,
    feat: true,
    special: true,
    height: "15 cm",
    material: "PVC",
    weight: 180,
    images: [
      "/uploads/products/2020480785-01.jpg",
      "/uploads/products/2020480785-02.jpg",
    ],
    name: { fa: "اکشن فیگور بیبی یودا (گرگو)", en: "Baby Yoda (Grogu) Action Figure", ar: "تمثال بيبي يودا (جروجو)" },
    short: {
      fa: "بیبی یودای محبوب سریال مندالوریان با طراحی دقیق و جزئیات بالا.",
      en: "The beloved Grogu from The Mandalorian with detailed sculpting.",
      ar: "الطفل الشهير من مسلسل الماندلوري بتفاصيل عالية.",
    },
    features: {
      fa: ["طراحی دقیق مطابق سریال", "جنس باکیفیت و بادوام", "بسته‌بندی کلکسیونی"],
      en: ["Screen-accurate sculpt", "Durable high quality material", "Collector packaging"],
      ar: ["تصميم دقيق مطابق للمسلسل", "مادة عالية الجودة", "تغليف جامعي"],
    },
  },
  {
    slug: "spider-man-miles-morales",
    sku: "FG-002",
    cat: "movies-series",
    brand: "Marvel Legends",
    price: 3100000,
    stock: 8,
    feat: true,
    height: "18 cm",
    material: "PVC",
    weight: 210,
    images: [
      "/uploads/products/2021923437.jpg",
      "/uploads/products/2021923437-01.jpg",
    ],
    name: { fa: "اکشن فیگور اسپایدرمن مایلز مورالس", en: "Spider-Man Miles Morales Action Figure", ar: "تمثال سبايدرمان مايلز موراليس" },
    short: {
      fa: "اسپایدرمن جوان و محبوب مایلز مورالس با بدن مفصلی.",
      en: "The fan-favorite Miles Morales with articulated joints.",
      ar: "مايلز موراليس المحبوب بمفاصل متحركة.",
    },
    features: {
      fa: ["بدن مفصلی با حرکت‌پذیری بالا", "جزئیات طراحی کمیک‌بوکی"],
      en: ["Highly articulated body", "Comic-accurate detailing"],
      ar: ["مفاصل متحركة بمرونة عالية", "تفاصيل دقيقة مستوحاة من القصص المصورة"],
    },
  },
  {
    slug: "baby-yoda-robotic-25",
    sku: "FG-003",
    cat: "movies-series",
    brand: "Hasbro",
    price: 5600000,
    compare: 6400000,
    stock: 5,
    special: true,
    height: "28 cm",
    material: "Plastic / Electronics",
    weight: 620,
    images: [
      "/uploads/products/____-____-______-______-___-Star-Wars-_____-25-____-____-_-_____-102.jpg",
    ],
    name: { fa: "بیبی یودای رباتیک هاسبرو (۲۵ افکت صوتی و حرکتی)", en: "Robotic Baby Yoda Hasbro (25 Sounds & Movements)", ar: "بيبي يودا الروبوتي من هاسبرو (25 مؤثرًا)" },
    short: {
      fa: "بیبی یودای رباتیک با ۲۵ افکت صوتی و حرکتی از سری جنگ ستارگان.",
      en: "Robotic Grogu with 25 sound and motion effects from Star Wars.",
      ar: "جروجو الروبوتي مع 25 مؤثرًا صوتيًا وحركيًا من حرب النجوم.",
    },
    features: {
      fa: ["۲۵ افکت صوتی و حرکتی", "طراحی رباتیک تعاملی", "مناسب برای کلکسیون و هدیه"],
      en: ["25 sound and motion effects", "Interactive robotic design", "Great for collectors and gifts"],
      ar: ["25 مؤثرًا صوتيًا وحركيًا", "تصميم تفاعلي", "مثالي للمقتنين والهدايا"],
    },
  },
  {
    slug: "walle-disney",
    sku: "FG-004",
    cat: "disney-pixar",
    brand: "Disney Pixar",
    price: 1850000,
    stock: 15,
    feat: true,
    height: "12 cm",
    material: "PVC",
    weight: 140,
    images: [
      "/uploads/products/WALL.E.gif-07.gif",
    ],
    name: { fa: "اکشن فیگور دیزنی وال-ای", en: "Disney WALL-E Action Figure", ar: "تمثال ديزني وال-إي" },
    short: {
      fa: "ربات کوچک و دوست‌داشتنی وال-ای از انیمیشن محبوب پیکسار.",
      en: "The adorable trash-collecting robot from Pixar.",
      ar: "الروبوت المحبوب من فيلم بيكسار.",
    },
    features: {
      fa: ["طراحی دقیق از انیمیشن", "جزئیات چشم‌های رسا"],
      en: ["Accurate movie design", "Expressive eye details"],
      ar: ["تصميم دقيق من الفيلم", "تفاصيل العيون التعبيرية"],
    },
  },
  {
    slug: "spider-man-peter-parker-spiderverse",
    sku: "FG-005",
    cat: "movies-series",
    brand: "S.H.Figuarts",
    price: 4200000,
    stock: 6,
    feat: true,
    height: "16 cm",
    material: "PVC",
    weight: 190,
    images: [
      "/uploads/products/2020701813-02.jpg",
      "/uploads/products/2020701813-01.jpg",
    ],
    name: { fa: "اکشن فیگور پیتر پارکر (اسپایدر ورس)", en: "Peter Parker Action Figure (Into the Spider-Verse)", ar: "تمثال بيتر باركر (إلى سبايدر-فرس)" },
    short: {
      fa: "پیتر پارکر از انیمیشن اسپایدرمن: به درون اسپایدر ورس.",
      en: "Peter Parker from Spider-Man: Into the Spider-Verse.",
      ar: "بيتر باركر من فيلم سبايدرمان: إلى سبايدر-فرس.",
    },
    features: {
      fa: ["طراحی سبک انیمیشن", "مفاصل متعدد برای ژست‌های پویا"],
      en: ["Animated-style design", "Multiple joints for dynamic poses"],
      ar: ["تصميم بأسلوب الأنميشن", "مفاصل متعددة لحركات ديناميكية"],
    },
  },
  {
    slug: "baby-yoda-robotic-40",
    sku: "FG-006",
    cat: "movies-series",
    brand: "Hasbro",
    price: 6200000,
    stock: 4,
    height: "30 cm",
    material: "Plastic / Electronics",
    weight: 700,
    images: [
      "/uploads/products/____-____-______-______-___-Star-Wars-105.jpg",
    ],
    name: { fa: "بیبی یودای رباتیک هاسبرو (۴۰ افکت صوتی و حرکتی)", en: "Robotic Baby Yoda Hasbro (40 Sounds & Movements)", ar: "بيبي يودا الروبوتي هاسبرو (40 مؤثرًا)" },
    short: {
      fa: "نسخه کامل‌تر بیبی یودای رباتیک با ۴۰ افکت صوتی و حرکتی.",
      en: "The upgraded robotic Grogu with 40 sound and motion effects.",
      ar: "نسخة متطورة من جروجو الروبوتي مع 40 مؤثرًا.",
    },
    features: {
      fa: ["۴۰ افکت صوتی و حرکتی", "حرکت چشم و گوش", "بسته‌بندی هدیه"],
      en: ["40 sound and motion effects", "Moving eyes and ears", "Gift packaging"],
      ar: ["40 مؤثرًا صوتيًا وحركيًا", "حركة العينين والأذنين", "تغليف هدايا"],
    },
  },
  {
    slug: "assassins-creed-3-conner",
    sku: "FG-007",
    cat: "gaming-figure",
    brand: "McFarlane",
    price: 3600000,
    stock: 7,
    feat: true,
    height: "20 cm",
    material: "PVC",
    weight: 240,
    images: [
      "/uploads/products/202078492-01_.jpg",
      "/uploads/products/202078492-03.jpg",
      "/uploads/products/202078492-04.jpg",
    ],
    name: { fa: "اکشن فیگور اساسین کرید ۳ کانر", en: "Assassin's Creed 3 Conner Action Figure", ar: "تمثال أساسنز كريد 3 كونر" },
    short: {
      fa: "کانر کنوی، اساسین بومی‌آمریکایی از بازی اساسین کرید ۳.",
      en: "Conner Kenway, the assassin from Assassin's Creed 3.",
      ar: "كونر كينواي، القاتل من أساسنز كريد 3.",
    },
    features: {
      fa: ["جزئیات لباس و تجهیزات بومی", "حالت‌های نمایشی مختلف"],
      en: ["Detailed outfit and gear", "Multiple display poses"],
      ar: ["تفاصيل الملابس والمعدات", "أوضاع عرض متعددة"],
    },
  },
  {
    slug: "godzilla-vs-kong",
    sku: "FG-008",
    cat: "movies-series",
    brand: "NECA",
    price: 4400000,
    stock: 5,
    feat: true,
    height: "25 cm",
    material: "PVC",
    weight: 320,
    images: [
      "/uploads/products/godzila-1.jpg",
    ],
    name: { fa: "اکشن فیگور گودزیلا علیه کونگ ۲۰۲۱", en: "Godzilla vs Kong 2021 Action Figure", ar: "تمثال جودزيلا ضد كونغ 2021" },
    short: {
      fa: "گودزیلای قدرتمند از فیلم گودزیلا علیه کونگ.",
      en: "The mighty Godzilla from Godzilla vs Kong.",
      ar: "جودزيلا العظيم من فيلم جودزيلا ضد كونغ.",
    },
    features: {
      fa: ["جزئیات پوسته و بدن هیولایی", "قد مناسب برای نمایش"],
      en: ["Detailed monstrous body", "Great display size"],
      ar: ["تفاصيل الجسم الوحشي", "حجم مثالي للعرض"],
    },
  },
  {
    slug: "tintin-and-milou",
    sku: "FG-009",
    cat: "movies-series",
    brand: "Moulinsart",
    price: 2200000,
    stock: 10,
    height: "20 cm",
    material: "PLA",
    weight: 280,
    images: [
      "/uploads/products/_____-__-__-_-____-____-______-4.jpg",
    ],
    name: { fa: "فیگور تنتن و میلو با سطل", en: "Tintin & Milou Figure with Bucket", ar: "تمثال تان تان وميلو مع دلو" },
    short: {
      fa: "تنتن و سگ وفادارش میلو در حالتی دوست‌داشتنی.",
      en: "Tintin and his loyal dog Milou in a charming pose.",
      ar: "تان تان وكلبه الوفي ميلو في وضع ساحر.",
    },
    features: {
      fa: ["طراحی باکیفیت", "پایه نمایش همراه"],
      en: ["High quality sculpt", "Display base included"],
      ar: ["نحت عالي الجودة", "قاعدة عرض مرفقة"],
    },
  },
  {
    slug: "assassins-creed-bayek",
    sku: "FG-010",
    cat: "gaming-figure",
    brand: "Ubisoft",
    price: 3900000,
    stock: 6,
    feat: true,
    height: "32 cm",
    material: "PVC",
    weight: 380,
    images: [
      "/uploads/products/201000179875-01.jpg",
      "/uploads/products/201000179875-08.jpg",
    ],
    name: { fa: "فیگور اساسین کرید بایک (ارتفاع ۳۲ سانتی‌متر)", en: "Assassin's Creed Bayek Figure (32cm)", ar: "تمثال أساسنز كريد بايك (32 سم)" },
    short: {
      fa: "بایک از سیوا، اساسین موسس برادری از بازی اساسین کرید اوریجینز.",
      en: "Bayek of Siwa, founder assassin from Assassin's Creed Origins.",
      ar: "بايك من سيوا، القاتل المؤسس من أساسنز كريد أوريجنز.",
    },
    features: {
      fa: ["ارتفاع ۳۲ سانتی‌متر", "جزئیات سلاح عقاب", "مناسب کلکسیونرها"],
      en: ["32cm tall", "Detailed eagle weapon", "Collector grade"],
      ar: ["ارتفاع 32 سم", "سلاح النسر المفصل", "درجة جامعية"],
    },
  },
  {
    slug: "assassins-creed-altair",
    sku: "FG-011",
    cat: "gaming-figure",
    brand: "McFarlane",
    price: 3700000,
    stock: 6,
    height: "22 cm",
    material: "PVC",
    weight: 260,
    images: [
      "/uploads/products/_____-______-_____-___-Altair-Assassins-Creed.jpg",
    ],
    name: { fa: "فیگور اساسین کرید ناقوس آلتایر", en: "Assassin's Creed Altair Figure", ar: "تمثال أساسنز کريد ألتير" },
    short: {
      fa: "آلتایر ابن لا آحاد، اولین قهرمان اساسین کرید.",
      en: "Altaïr Ibn-La'Ahad, the first Assassin's Creed hero.",
      ar: "ألتير بن لا أحد، أول أبطال أساسنز كريد.",
    },
    features: {
      fa: ["طراحی لباس سفید کلاسیک", "شمشیر و تیغه پنهان"],
      en: ["Classic white robe design", "Sword and hidden blade"],
      ar: ["تصميم العباءة البيضاء الكلاسيكية", "السيف والنصل الخفي"],
    },
  },
  {
    slug: "mandalorian-and-child",
    sku: "FG-012",
    cat: "movies-series",
    brand: "Hasbro",
    price: 3200000,
    compare: 3800000,
    stock: 9,
    feat: true,
    height: "15 cm",
    material: "PVC",
    weight: 200,
    images: [
      "/uploads/products/starwars-2-edited.jpg",
    ],
    name: { fa: "فیگور هاسبرو ماندالوریان و کودک (بسته دوتایی)", en: "Hasbro Mandalorian & The Child 2-Pack", ar: "تمثال الماندلوري والطفل (مجموعة من قطعتين)" },
    short: {
      fa: "ماندالوری و بیبی یودا در یک بسته دوتایی ویژه.",
      en: "The Mandalorian and Grogu in a special 2-pack.",
      ar: "الماندلوري وجروجو في مجموعة خاصة من قطعتين.",
    },
    features: {
      fa: ["بسته دوتایی ماندو و گرگو", "جزئیات زره بسکار", "هدیه ایده‌آل برای طرفداران"],
      en: ["Mando & Grogu 2-pack", "Beskar armor details", "Ideal gift for fans"],
      ar: ["مجموعة ماندو وجروجو", "تفاصيل درع البيسكار", "هدية مثالية للجمهور"],
    },
  },
  {
    slug: "hannibal-lecter-neca",
    sku: "FG-013",
    cat: "movies-series",
    brand: "NECA",
    price: 1750000,
    stock: 14,
    feat: true,
    height: "18 cm",
    material: "PVC",
    weight: 220,
    images: [
      "/uploads/products/____-_____-_______-____-NECA-Dr.-Hannibal-Lecter-Prison-Escape-03.jpg",
    ],
    name: { fa: "اکشن فیگور هانیبال لکتر NECA", en: "NECA Hannibal Lecter Action Figure", ar: "تمثال هانيبال ليكتر من NECA" },
    short: {
      fa: "دکتر هانیبال لکتر در حالت فرار از زندان، از برند نکا.",
      en: "Dr. Hannibal Lecter Prison Escape by NECA.",
      ar: "الدكتور هانيبال ليكتر في وضع الهروب من السجن.",
    },
    features: {
      fa: ["طراحی سینمایی دقیق", "اکسسوری ماسک زندان"],
      en: ["Movie-accurate design", "Prison mask accessory"],
      ar: ["تصميم دقيق من الفيلم", "ملحق قناع السجن"],
    },
  },
  {
    slug: "sulley-monsters-inc",
    sku: "FG-014",
    cat: "disney-pixar",
    brand: "Disney Pixar",
    price: 2600000,
    stock: 8,
    height: "22 cm",
    material: "PVC",
    weight: 300,
    images: [
      "/uploads/products/c3268513629735759e88d51060c3b2766e423fd8-1732904918.jpg",
      "/uploads/products/68f8fdd8acab5150a5b890580f400b51.jpg",
    ],
    name: { fa: "فیگور پایه‌دار سالیوان (کارخانه هیولاها)", en: "Sulley Figure with Base (Monsters Inc)", ar: "تمثال سولي مع قاعدة (شركة المرعبين)" },
    short: {
      fa: "سالیوان مهربان از انیمیشن کارخانه هیولاها با پایه نمایش.",
      en: "The gentle Sulley from Monsters Inc with display base.",
      ar: "سولي اللطيف من شركة المرعبين مع قاعدة عرض.",
    },
    features: {
      fa: ["پایه نمایش همراه", "طراحی خز و چهره بامزه"],
      en: ["Display base included", "Fur and expressive face detail"],
      ar: ["قاعدة عرض مرفقة", "تفاصيل الفراء والوجه التعبيرية"],
    },
  },
  {
    slug: "war-machine-mk1-zd",
    sku: "FG-015",
    cat: "gaming-figure",
    brand: "ZD Toys",
    price: 2900000,
    stock: 7,
    feat: true,
    height: "18 cm",
    material: "PVC",
    weight: 230,
    images: [
      "/uploads/products/201000757558-06.jpg",
      "/uploads/products/2020757558-02.jpg",
    ],
    name: { fa: "اکشن فیگور وار ماشین Mk1 (ZD Toys)", en: "War Machine Mk1 Action Figure (ZD Toys)", ar: "تمثال وار ماشين Mk1 (ZD Toys)" },
    short: {
      fa: "وار ماشین جنگجوی زرهی از دنیای مارول با جزئیات فوقالعاده.",
      en: "The armored warrior War Machine from Marvel.",
      ar: "وار ماشين المدرع من عالم مارفل.",
    },
    features: {
      fa: ["جزئیات زره سبک کامیک", "مفاصل پویا"],
      en: ["Comic-style armor details", "Dynamic articulation"],
      ar: ["تفاصيل درع بأسلوب القصص المصورة", "مفاصل ديناميكية"],
    },
  },
  {
    slug: "iron-man-mk5-zd",
    sku: "FG-016",
    cat: "gaming-figure",
    brand: "ZD Toys",
    price: 3050000,
    stock: 6,
    feat: true,
    height: "18 cm",
    material: "PVC",
    weight: 230,
    images: [
      "/uploads/products/201000757520-01.jpg",
      "/uploads/products/2020757520-02.jpg",
    ],
    name: { fa: "اکشن فیگور آیرون من Mk5 (ZD Toys)", en: "Iron Man Mk5 Action Figure (ZD Toys)", ar: "تمثال آيرون مان Mk5 (ZD Toys)" },
    short: {
      fa: "آیرون من مارک ۵ با زره قرمز طلایی کلاسیک.",
      en: "Iron Man Mark 5 in classic red-and-gold armor.",
      ar: "آيرون مان مارك 5 بالدرع الأحمر والذهبي الكلاسيكي.",
    },
    features: {
      fa: ["زره قرمز طلایی", "پنل‌های ریاکتور سینمایی"],
      en: ["Red and gold armor", "Movie-accurate arc reactor"],
      ar: ["درع أحمر وذهبي", "مفاعل القوس الدقيق"],
    },
  },
  {
    slug: "alien-xenomorph-neca",
    sku: "FG-017",
    cat: "movies-series",
    brand: "NECA",
    price: 2300000,
    compare: 2800000,
    stock: 10,
    height: "20 cm",
    material: "PVC",
    weight: 250,
    images: [
      "/uploads/products/2020195623-02.jpg",
      "/uploads/products/2020195623-01.jpg",
    ],
    name: { fa: "اکشن فیگور بیگانه (زنومورف) نکا", en: "Alien Xenomorph Action Figure (NECA)", ar: "تمثال الكائن الغريب (زينومورف) من NECA" },
    short: {
      fa: "زنومورف ترسناک از سری فیلم‌های بیگانه با طراحی وحشتناک دقیق.",
      en: "The terrifying Xenomorph from the Alien films.",
      ar: "الزينومورف المرعب من أفلام Alien.",
    },
    features: {
      fa: ["طراحی وحشت‌ناک دقیق", "دم و آرواره متحرک"],
      en: ["Screen-accurate horror design", "Articulated tail and jaw"],
      ar: ["تصميم رعب دقيق", "ذيل وفك متحركان"],
    },
  },
  {
    slug: "john-wick-mafex",
    sku: "FG-018",
    cat: "movies-series",
    brand: "Mafex",
    price: 5400000,
    stock: 4,
    special: true,
    height: "16 cm",
    material: "PVC",
    weight: 200,
    images: [
      "/uploads/products/____-_____-___-___-Mafex-___-Chapter-2-04.jpg",
    ],
    name: { fa: "اکشن فیگور جان ویک مافکس (فصل ۲)", en: "John Wick Mafex Action Figure (Chapter 2)", ar: "تمثال جون ويك من مافكس (الفصل 2)" },
    short: {
      fa: "جان ویک با کت و شلوار سیاه و تفنگ‌هایش از فیلم فصل ۲.",
      en: "John Wick in his black suit from Chapter 2.",
      ar: "جون ويك ببدلته السوداء من الفصل 2.",
    },
    features: {
      fa: ["اکسسوری اسلحه متعدد", "جزئیات صورت کیانو ریوز", "برند مافکس باکیفیت"],
      en: ["Multiple gun accessories", "Keanu Reeves likeness", "Premium Mafex quality"],
      ar: ["ملحقات أسلحة متعددة", "شبه كيانو ريفز", "جودة مافكس الفاخرة"],
    },
  },
  {
    slug: "venom-play-arts",
    sku: "FG-019",
    cat: "movies-series",
    brand: "Play Arts Kai",
    price: 4900000,
    compare: 5600000,
    stock: 5,
    feat: true,
    special: true,
    height: "28 cm",
    material: "PVC",
    weight: 420,
    images: [
      "/uploads/products/____-_____-___-____-___-Venom-Marvel-101.jpg",
    ],
    name: { fa: "اکشن فیگور ونوم (پلی آرتس)", en: "Venom Action Figure (Play Arts)", ar: "تمثال فينوم (بلاي آرتس)" },
    short: {
      fa: "ونوم مارول با طراحی اغراق‌شده و جزئیات عضلات.",
      en: "Marvel's Venom with exaggerated muscular detail.",
      ar: "فينوم مارفل بتفاصيل عضلية مبالغ فيها.",
    },
    features: {
      fa: ["ارتفاع ۲۸ سانتی‌متری", "طراحی هنری اغراق‌شده", "جزئیات سیبیوت"],
      en: ["28cm tall", "Stylized art design", "Symbiote details"],
      ar: ["ارتفاع 28 سم", "تصميم فني مميز", "تفاصيل السيمبيوت"],
    },
  },
  {
    slug: "assassins-creed-aya",
    sku: "FG-020",
    cat: "gaming-figure",
    brand: "Ubisoft",
    price: 3400000,
    stock: 6,
    height: "24 cm",
    material: "PVC",
    weight: 280,
    images: [
      "/uploads/products/2020727194.jpg",
      "/uploads/products/aya-4-edited.jpg",
    ],
    name: { fa: "اکشن فیگور اساسین کرید اوریجینز ایا", en: "Assassin's Creed Origins Aya Action Figure", ar: "تمثال أساسنز كريد أوريجنز آيا" },
    short: {
      fa: "آیا، همسر بایک و یکی از بنیان‌گذاران برادری اساسین‌ها.",
      en: "Aya, wife of Bayek and founder of the Assassins.",
      ar: "آيا، زوجة بايك ومؤسسة جماعة الأساسنز.",
    },
    features: {
      fa: ["طراحی لباس مصر باستان", "تیغه پنهان و خنجر"],
      en: ["Ancient Egypt outfit", "Hidden blade and dagger"],
      ar: ["زي مصر القديمة", "النصل الخفي والخنجر"],
    },
  },
  {
    slug: "kakashi-hatake-40cm",
    sku: "FG-021",
    cat: "anime-figure",
    brand: "Banpresto",
    price: 4200000,
    compare: 4800000,
    stock: 8,
    feat: true,
    special: true,
    height: "40 cm",
    material: "PVC",
    weight: 500,
    images: [
      "/uploads/products/20211066900-01.jpg",
    ],
    name: { fa: "فیگور کاکاشی هاتاکه (ارتفاع ۴۰ سانتی‌متر)", en: "Kakashi Hatake Figure (40cm)", ar: "تمثال كاكاشي هاتاكي (40 سم)" },
    short: {
      fa: "کاکاشی نینجای کپیکن ناروتو با قد ۴۰ سانتی‌متر.",
      en: "The Copy Ninja Kakashi from Naruto, 40cm tall.",
      ar: "كاكاشي نينجا النسخ من ناروتو بارتفاع 40 سم.",
    },
    features: {
      fa: ["ارتفاع ۴۰ سانتی‌متر", "جزئیات جالباو و باندانا", "ژست‌پذیری عالی"],
      en: ["40cm tall", "Sharingan & headband details", "Great presence"],
      ar: ["ارتفاع 40 سم", "تفاصيل الشارينجان والعصابة", "حضور رائع"],
    },
  },
  {
    slug: "kratos-god-of-war",
    sku: "FG-022",
    cat: "gaming-figure",
    brand: "NECA",
    price: 1900000,
    stock: 12,
    feat: true,
    height: "18 cm",
    material: "PVC",
    weight: 240,
    images: [
      "/uploads/products/201001019418.jpg111.jpg",
    ],
    name: { fa: "فیگور کریتوس (God of War Ascension)", en: "Kratos Figure (God of War Ascension)", ar: "تمثال كراتوس (غود أوف وور)" },
    short: {
      fa: "کریتوس خدای جنگ با تیغه‌های آشوب.",
      en: "Kratos, the God of War, with his Blades of Chaos.",
      ar: "كراتوس إله الحرب مع شفرات الفوضى.",
    },
    features: {
      fa: ["تیغه‌های آشوب همراه", "طراحی عضلانی دقیق", "قیمت مناسب برای شروع کلکسیون"],
      en: ["Blades of Chaos included", "Detailed muscular build", "Great starter price"],
      ar: ["شفرات الفوضى مرفقة", "بنية عضلية مفصلة", "سعر مناسب للمبتدئين"],
    },
  },
  {
    slug: "geralt-witcher-3",
    sku: "FG-023",
    cat: "gaming-figure",
    brand: "McFarlane",
    price: 4400000,
    compare: 5000000,
    stock: 5,
    feat: true,
    height: "18 cm",
    material: "PVC",
    weight: 250,
    images: [
      "/uploads/products/2021939034.jpg",
    ],
    name: { fa: "فیگور گرالت (The Witcher Wild Hunt 3)", en: "Geralt Figure (The Witcher Wild Hunt 3)", ar: "تمثال جيرالت (ذا ويتشر)" },
    short: {
      fa: "گرالت از ریویا، ویتچر سفیدمو از بازی ویتچر ۳.",
      en: "Geralt of Rivia, the White Wolf from The Witcher 3.",
      ar: "جيرالت من ريفيا، الذئب الأبيض من ذا ويتشر 3.",
    },
    features: {
      fa: ["شمشیر نقره و فولاد", "جزئیات زره و مدالیون", "طراحی دقیق بازی"],
      en: ["Silver and steel swords", "Armor & medallion detail", "Game-accurate design"],
      ar: ["سيف الفضة والفولاذ", "تفاصيل الدرع والميدالية", "تصميم دقيق للعبة"],
    },
  },
  {
    slug: "darth-vader-kaidoyo",
    sku: "FG-024",
    cat: "movies-series",
    brand: "Kaidoyo",
    price: 3300000,
    stock: 6,
    height: "18 cm",
    material: "PVC",
    weight: 230,
    images: [
      "/uploads/products/20101067849-02.jpg",
    ],
    name: { fa: "اکشن فیگور دارث ویدر (جنگ ستارگان)", en: "Darth Vader Action Figure (Star Wars)", ar: "تمثال دارث فيدر (حرب النجوم)" },
    short: {
      fa: "دارث ویدر ارباب سیث با شنل مشکی و شمشیر نورانی قرمز.",
      en: "Darth Vader with black cape and red lightsaber.",
      ar: "دارث فيدر سيد السيث مع عباءته السوداء وسيف الضوء الأحمر.",
    },
    features: {
      fa: ["شمشیر نورانی قرمز", "شنل پارچه‌ای", "جزئیات ماسک و زره"],
      en: ["Red lightsaber", "Cloth cape", "Mask & armor details"],
      ar: ["سيف ضوئي أحمر", "عباءة قماشية", "تفاصيل القناع والدرع"],
    },
  },
  {
    slug: "harry-potter-1",
    sku: "FG-025",
    cat: "movies-series",
    brand: "Iron Studios",
    price: 3500000,
    compare: 4000000,
    stock: 8,
    feat: true,
    height: "18 cm",
    material: "PLA",
    weight: 250,
    images: [
      "/uploads/products/harry-potter-01.jpg",
      "/uploads/products/harry-potter-02.jpg",
      "/uploads/products/harry-potter-03.png",
    ],
    name: { fa: "فیگور هری پاتر", en: "Harry Potter Action Figure", ar: "تمثال هاري بوتر" },
    short: {
      fa: "فیگور اکشن هری پاتر با طراحی دقیق از فیلم‌های محبوب هری پاتر.",
      en: "The iconic Harry Potter action figure with detailed sculpting.",
      ar: "تمثال هاري بوتر الأيقوني بتفاصيل دقيقة.",
    },
    features: {
      fa: ["طراحی دقیق از فیلم", "جنس باکیفیت", "بسته‌بندی کلکسیونی"],
      en: ["Movie-accurate design", "Premium quality material", "Collector packaging"],
      ar: ["تصميم دقيق من الفيلم", "مادة فاخرة", "تغليف جامعي"],
    },
  },
  {
    slug: "hermione-granger",
    sku: "FG-026",
    cat: "movies-series",
    brand: "Iron Studios",
    price: 3500000,
    compare: 4000000,
    stock: 8,
    feat: true,
    height: "18 cm",
    material: "PLA",
    weight: 250,
    images: [
      "/uploads/products/hermione-granger-01.jpg",
    ],
    name: { fa: "فیگور هرمیون گرنجر", en: "Hermione Granger Action Figure", ar: "تمثال هرميوني غرينجر" },
    short: {
      fa: "فیگور اکشن هرمیون گرنجر با طراحی دقیق از فیلم‌های هری پاتر.",
      en: "The iconic Hermione Granger action figure with detailed sculpting.",
      ar: "تمثال هرميوني غرينجر الأيقوني بتفاصيل دقيقة.",
    },
    features: {
      fa: ["طراحی دقیق از فیلم", "جزئیات بالای مو و لباس", "پایه نمایش همراه"],
      en: ["Movie-accurate design", "Detailed hair and outfit", "Display base included"],
      ar: ["تصميم دقيق من الفيلم", "تفاصيل الشعر والملابس", "قاعدة عرض مرفقة"],
    },
  },
  {
    slug: "ron-weasley",
    sku: "FG-027",
    cat: "movies-series",
    brand: "Iron Studios",
    price: 3500000,
    compare: 4000000,
    stock: 8,
    feat: true,
    height: "18 cm",
    material: "PLA",
    weight: 250,
    images: [
      "/uploads/products/ron-weasley-01.jpg",
    ],
    name: { fa: "فیگور ران ویزلی", en: "Ron Weasley Action Figure", ar: "تمثال رون ويزلي" },
    short: {
      fa: "فیگور اکشن ران ویزلی با طراحی دقیق از فیلم‌های هری پاتر.",
      en: "The iconic Ron Weasley action figure with detailed sculpting.",
      ar: "تمثال رون ويزلي الأيقوني بتفاصيل دقيقة.",
    },
    features: {
      fa: ["طراحی دقیق از فیلم", "جنس باکیفیت", "بسته‌بندی کلکسیونی"],
      en: ["Movie-accurate design", "Premium quality material", "Collector packaging"],
      ar: ["تصميم دقيق من الفيلم", "مادة فاخرة", "تغليف جامعي"],
    },
  },
  {
    slug: "gandalf-the-grey",
    sku: "FG-028",
    cat: "movies-series",
    brand: "Iron Studios",
    price: 3500000,
    compare: 4000000,
    stock: 8,
    feat: true,
    height: "12 cm",
    material: "PLA",
    weight: 200,
    images: [
      "/uploads/products/gandalf99.jpg",
    ],
    name: { fa: "فیگور گندالف خاکستری", en: "Gandalf the Grey Figure", ar: "تمثال غاندالف الرمادي" },
    short: {
      fa: "گندالف خاکستری، جادوگر بزرگ از ارباب حلقه‌ها با عصا و کلاه جادویی.",
      en: "Gandalf the Grey, the great wizard from The Lord of the Rings with staff and pointed hat.",
      ar: "غاندالف الرمادي، الساحر العظيم من سيد الخواتم مع العصا والقبعة.",
    },
    features: {
      fa: ["طراحی دقیق از فیلم", "عصا و کلاه جادویی", "جنس باکیفیت"],
      en: ["Movie-accurate design", "Staff and pointed hat included", "Premium quality material"],
      ar: ["تصميم دقيق من الفيلم", "عصا وقبعة سحرية مرفقة", "مادة فاخرة"],
    },
  },
  {
    slug: "frodo-baggins",
    sku: "FG-029",
    cat: "movies-series",
    brand: "Iron Studios",
    price: 3500000,
    compare: 4000000,
    stock: 8,
    feat: true,
    height: "10 cm",
    material: "PLA",
    weight: 180,
    images: [
      "/uploads/products/frodo99.jpg",
    ],
    name: { fa: "فیگور فرودو بگینز", en: "Frodo Baggins Figure", ar: "تمثال فرودو باجينز" },
    short: {
      fa: "فرودو بگینز، هابیت شجاع حامل حلقه یگانه از ارباب حلقه‌ها.",
      en: "Frodo Baggins, the brave hobbit and bearer of the One Ring from The Lord of the Rings.",
      ar: "فرودو باجينز، الهوبيت الشجاع وحامل الخاتمة الواحدة من سيد الخواتم.",
    },
    features: {
      fa: ["طراحی دقیق از فیلم", "حلقه یگانه و سنجاق برگ", "پاهای بزرگ هابیتی"],
      en: ["Movie-accurate design", "One Ring and leaf brooch", "Signature hobbit feet"],
      ar: ["تصميم دقيق من الفيلم", "الخاتمة الواحدة وبروش ورق", "قدم الهوبيت المميزة"],
    },
  },
  {
    slug: "walter-white-heisenberg",
    sku: "FG-030",
    cat: "movies-series",
    brand: "Iron Studios",
    price: 3500000,
    compare: 4000000,
    stock: 8,
    feat: true,
    height: "10 cm",
    material: "PLA",
    weight: 180,
    images: [
      "/uploads/products/walter99.jpg",
    ],
    name: { fa: "فیگور والتر وایت (هایزنبرگ)", en: "Walter White (Heisenberg) Figure", ar: "تمثال والتر وايت (هايزنبرغ)" },
    short: {
      fa: "والتر وایت مع لباس زرد شیمیایی از سریال بریکینگ بد.",
      en: "Walter White in his iconic yellow hazmat suit from Breaking Bad.",
      ar: "والتر وايت ببذلة الهazard الصفراء الأيقونية من مسلسل بريكنغ باد.",
    },
    features: {
      fa: ["لباس زرد شیمیایی", "عینک و کلاه گیس", "طراحی دقیق از سریال"],
      en: ["Yellow hazmat suit", "Glasses and bald cap", "Show-accurate design"],
      ar: ["بذلة هazard صفراء", "نظارات ورأس أصلع", "تصميم دقيق من المسلسل"],
    },
  },
];

async function main() {
  console.log("Seeding figureforge...");

  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { image: c.image, sortOrder: CATEGORIES.findIndex((x) => x.slug === c.slug) },
      create: {
        slug: c.slug,
        image: c.image,
        sortOrder: CATEGORIES.findIndex((x) => x.slug === c.slug),
      },
    });
    const cat = await prisma.category.findUnique({ where: { slug: c.slug } });
    for (const loc of ["fa", "en", "ar"]) {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: cat.id, locale: loc } },
        update: { name: c.name[loc], description: c.desc[loc] },
        create: { categoryId: cat.id, locale: loc, name: c.name[loc], description: c.desc[loc] },
      });
    }
  }

  for (const p of PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) continue;

    const cat = await prisma.category.findUnique({ where: { slug: p.cat } });
    const product = await prisma.product.create({
      data: {
        slug: p.slug,
        sku: p.sku,
        categoryId: cat?.id ?? null,
        brand: p.brand,
        price: p.price,
        compareAtPrice: p.compare ?? null,
        stock: p.stock,
        isActive: true,
        isFeatured: p.feat ?? false,
        isSpecial: p.special ?? false,
        hasDiscount: !!p.compare,
        heightCm: p.height,
        material: p.material,
        weightGrams: p.weight,
        images: p.images,
        musicUrl: p.musicUrl ?? `/music/${p.slug}.mp3`,
        musicTitle: p.musicTitle ?? PRODUCT_MUSIC[p.slug] ?? null,
      },
    });
    for (const loc of ["fa", "en", "ar"]) {
      await prisma.productTranslation.create({
        data: {
          productId: product.id,
          locale: loc,
          name: p.name[loc],
          shortDescription: p.short[loc],
          features: JSON.stringify(p.features[loc]),
        },
      });
    }
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@figureforge.ir").trim().toLowerCase();
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: { email: adminEmail, role: "ADMIN", name: "مدیر" },
  });

  let publishedCount = 0;
  let bankCount = 0;
  for (const b of BLOG_POSTS) {
    const publishedAt = b.published
      ? new Date(Date.now() - b.daysAgo * 86400000)
      : null;
    const existingPost = await prisma.blogPost.findUnique({ where: { slug: b.slug } });
    if (existingPost) {
      if (b.published) publishedCount++;
      else bankCount++;
      continue;
    }

    const createdAt = new Date(Date.now() - b.createdDaysAgo * 86400000);
    const post = await prisma.blogPost.create({
      data: {
        slug: b.slug,
        coverImage: `/blog/${b.slug}.svg`,
        category: b.category,
        readingTime: b.readingTime,
        isPublished: b.published,
        publishedAt,
        createdAt,
      },
    });
    for (const loc of ["fa", "en", "ar"]) {
      await prisma.blogPostTranslation.create({
        data: {
          postId: post.id,
          locale: loc,
          tag: b.tag[loc],
          title: b.title[loc],
          excerpt: b.excerpt[loc],
          body: b.body[loc],
        },
      });
    }
    if (b.published) publishedCount++;
    else bankCount++;
  }

  console.log(
    `Seeded ${CATEGORIES.length} categories, ${PRODUCTS.length} products, admin user (${adminEmail}), ${publishedCount} published + ${bankCount} bank blog posts.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
