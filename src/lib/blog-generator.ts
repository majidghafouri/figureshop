import prisma from "@/lib/db";
import { Locale } from "@/lib/i18n";
import { notifySubscribersOfNewPost } from "@/lib/newsletter";

export type LocalizedText = { fa: string; en: string; ar: string };

type BlogSection = {
  h: LocalizedText;
  paras: LocalizedText[];
  list?: LocalizedText[];
};

type Topic = {
  id: string;
  category: string;
  icon: string;
  tag: LocalizedText;
  title: LocalizedText;
  excerpt: LocalizedText;
  intro: LocalizedText;
  sections: BlogSection[];
  tip: LocalizedText;
  outro: LocalizedText;
};

const TOPICS: Topic[] = [
  {
    id: "anime-figure-care",
    category: "care",
    icon: "✨",
    tag: { fa: "مراقبت", en: "Care", ar: "العناية" },
    title: {
      fa: "مراقبت از فیگورهای انیمه؛ ماندگاری و شفافیت",
      en: "Caring for Anime Figures: Lasting Shine",
      ar: "العناية بتماثيل الأنمي: لمعة تدوم",
    },
    excerpt: {
      fa: "با چند عادت ساده، فیگورهای انیمه‌ای خود را سال‌ها مثل روز اول نگه دارید.",
      en: "Keep your anime figures looking brand new for years with a few simple habits.",
      ar: "حافظ على تماثيل الأنمي وكأنها جديدة لسنوات من خلال عادات بسيطة.",
    },
    intro: {
      fa: "فیگورهای انیمه سرمایه‌ی احساسی و مالی کلکسیون شما هستند. گرد و غبار، نور خورشید و دست‌زدن‌های مکرر، آرام‌آرام به رنگ و سطح فیگور آسیب می‌زند. خبر خوب این است که با مراقبت درست، فیگور شما ده‌ها سال درخشان می‌ماند.",
      en: "Anime figures are the heart of your collection. Dust, sunlight and frequent handling slowly damage the paint and surface. The good news: with proper care your figure can stay pristine for decades.",
      ar: "تماثيل الأنمي هي قلب مجموعتك. الغبار وأشعة الشمس والتعامل المتكرر يضرّران بالطلاء والسطح تدريجيًا. الخبر الجيد: مع العناية الصحيحة يبقى التمثال رائعًا لعقود.",
    },
    sections: [
      {
        h: { fa: "گردگیری بدون آسیب", en: "Dusting Without Damage", ar: "تنظيف الغبار دون ضرر" },
        paras: [
          {
            fa: "هرگز فیگور را با پارچه‌ی خیس یا مواد شیمیایی تمیز نکنید. بهترین راه، برس نرم مخصوص عکاسی یا دمنده‌ی هوای سرد است.",
            en: "Never clean a figure with a wet cloth or chemicals. Use a soft camera brush or a can of cold air instead.",
            ar: "لا تنظّف التمثال أبدًا بقطعة مبللة أو مواد كيميائية. استخدم فرشاة ناعمة أو هواء بارد.",
          },
        ],
        list: [
          {
            fa: "برس نرم مخصوص گردگیری را هر دو هفته یک‌بار استفاده کنید",
            en: "Use a soft dusting brush every two weeks",
            ar: "استخدم فرشاة ناعمة كل أسبوعين",
          },
          {
            fa: "برای درزها و جزئیات ریز از گوش‌پاک‌کن استفاده کنید",
            en: "Clean tight details with cotton swabs",
            ar: "نظّف التفاصيل الدقيقة بأعواد قطنية",
          },
        ],
      },
      {
        h: { fa: "دور از نور مستقیم خورشید", en: "Keep Away from Direct Sunlight", ar: "ابتعد عن ضوء الشمس المباشر" },
        paras: [
          {
            fa: "اشعه‌ی فرابنفش رنگ را محو می‌کند و برخی پلاستیک‌ها را زرد می‌کند. فیگورها را در محلی با نور غیرمستقیم و دمای ثابت نگه دارید.",
            en: "UV rays fade paint and yellow certain plastics. Display figures in indirect light with a stable temperature.",
            ar: "تتلاش الألوان تحت الأشعة فوق البنفسجية وتتحول بعض البلاستيكات إلى الأصفر. اعرض التماثيل في إضاءة غير مباشرة ودرجة حرارة ثابتة.",
          },
        ],
      },
      {
        h: { fa: "نگهداری جعبه و اکسسوری", en: "Keeping Boxes and Accessories", ar: "الاحتفاظ بالصناديق والملحقات" },
        paras: [
          {
            fa: "جعبه‌ی اصلی ارزش کلکسیونی فیگور را افزایش می‌دهد. جعبه‌ها را در جایی خشک و به‌صورت افقی نگه دارید و اکسسوری‌های یدکی را جداگانه در پاکت نگهداری کنید.",
            en: "The original box boosts a figure's collectible value. Store boxes flat in a dry place and keep spare accessories in separate bags.",
            ar: "يزيد الصندوق الأصلي من القيمة الجمعية. خزّن الصناديق بشكل مسطح في مكان جاف واحفظ الملحقات في أكياس منفصلة.",
          },
        ],
      },
    ],
    tip: {
      fa: "اگر قصد فروش داری، جعبه و پلاستیک داخلی را دور نریز؛ بخش بزرگی از قیمت، در بسته‌بندی اصلی است.",
      en: "If you ever plan to sell, keep the box and inner plastic — a large part of the value lives in the original packaging.",
      ar: "إذا خططت للبيع يومًا، احتفظ بالصندوق والبلاستيك الداخلي — جزء كبير من القيمة في التغليف الأصلي.",
    },
    outro: {
      fa: "مراقبت از فیگور سخت نیست؛ فقط به عادت و کمی وسواس سالم نیاز دارد. با این چند کار ساده، کلکسیونت سال‌ها چشمگیر باقی می‌ماند.",
      en: "Caring for figures is easy — it just takes habit and healthy attention. With these small steps your collection stays impressive for years.",
      ar: "العناية بالتماثيل سهلة — تحتاج فقط إلى عادة وانتباه صحي. بهذه الخطوات البسيطة تبقى مجموعتك مذهلة لسنوات.",
    },
  },
  {
    id: "display-and-shelving",
    category: "guide",
    icon: "📐",
    tag: { fa: "چیدمان", en: "Display", ar: "العرض" },
    title: {
      fa: "ایده‌های چیدمان و ویترین برای کلکسیون فیگور",
      en: "Display and Shelving Ideas for a Figure Collection",
      ar: "أفكار عرض ورفوف لمجموعة التماثيل",
    },
    excerpt: {
      fa: "نحوه‌ی چیدن فیگورها، قفسه‌ها و نورپردازی می‌تواند کلکسیون شما را به یک ویترین حرفه‌ای تبدیل کند.",
      en: "How you arrange figures, shelves and lighting can turn your collection into a professional showcase.",
      ar: "كيفية ترتيب التماثيل والرفوف والإضاءة يمكن أن تحول مجموعتك إلى عرض احترافي.",
    },
    intro: {
      fa: "یک کلکسیون خوب فقط مجموعه‌ای از خرید نیست؛ یک ترکیب بصری است. با کمی برنامه‌ریزی، همان فیگورها می‌توانند در یک ویترین مرتب، ده برابر بهتر دیده شوند.",
      en: "A great collection isn't just a set of purchases — it's a visual composition. With a little planning, the same figures can look ten times better in a tidy showcase.",
      ar: "المجموعة الجيدة ليست مجرد مشتريات — إنها تكوين بصري. بقليل من التخطيط يمكن لنفس التماثيل أن تبدو أفضل بعشر مرات في عرض منظم.",
    },
    sections: [
      {
        h: { fa: "گروه‌بندی بر اساس تم", en: "Group by Theme", ar: "التجميع حسب الموضوع" },
        paras: [
          {
            fa: "فیگورهای یک سری یا شخصیت‌های یک دنیا را کنار هم بگذارید. گروه‌های هم‌رنگ و هم‌دنیا، چشم را هدایت می‌کنند و داستان تعریف می‌کنند.",
            en: "Place figures from the same series or universe together. Color-matched, story-driven groups guide the eye and tell a narrative.",
            ar: "ضع تماثيل نفس السلسلة أو الكون معًا. المجموعات المتناسقة تحكي قصة وتوجه العين.",
          },
        ],
        list: [
          {
            fa: "شخصیت‌های یک انیمه را یکجا بچین",
            en: "Keep characters from the same anime together",
            ar: "اجمع شخصيات نفس الأنمي معًا",
          },
          {
            fa: "فیگورهای بزرگ را پشت و بلندها را در مرکز قرار بده",
            en: "Place tall figures behind, center pieces in the middle",
            ar: "ضع التماثيل الطويلة في الخلف والأبرز في المنتصف",
          },
        ],
      },
      {
        h: { fa: "نورپردازی لایه‌ای", en: "Layered Lighting", ar: "إضاءة متعددة الطبقات" },
        paras: [
          {
            fa: "نور LED سفید گرم بالای قفسه، جزئیات را برجسته می‌کند و سایه‌های نرم ایجاد می‌کند. از نور مستقیم سقف که سایه‌ی کوتاه و خشن می‌سازد پرهیز کنید.",
            en: "Warm white LED strips above each shelf highlight detail and create soft shadows. Avoid harsh overhead ceiling light.",
            ar: "شرائط LED بيضاء دافئة فوق الرفوف تُبرز التفاصيل وتخلق ظلالًا ناعمة. تجنّب إضاءة السقف القاسية.",
          },
        ],
      },
      {
        h: { fa: "چرخش دوره‌ای کلکسیون", en: "Rotate Your Collection", ar: "تدوير المجموعة" },
        paras: [
          {
            fa: "اگر فیگورهای بیشتری از ظرفیت قفسه دارید، هر چند ماه ترکیب را عوض کنید. این کار هم به فیگورها استراحت می‌دهد و هم حس تازگی به فضا می‌بخشد.",
            en: "If you own more figures than shelf space, rotate the layout every few months. It rests the figures and keeps the room feeling fresh.",
            ar: "إذا كان لديك تماثيل أكثر من سعة الرفوف، غيّر التخطيط كل بضعة أشهر. يريح التماثيل ويجدد الإحساس بالمكان.",
          },
        ],
      },
    ],
    tip: {
      fa: "از پایه‌های شفاف آکریلیک برای ارتفاع‌های متفاوت استفاده کن تا ردیف‌ها دیده شوند و قفسه عمق پیدا کند.",
      en: "Use clear acrylic risers for varied heights so every row is visible and the shelf gains depth.",
      ar: "استخدم رفوفًا فرعية شفافة من الأكريليك لارتفاعات مختلفة حتى يظهر كل صف ويكتسب الرف عمقًا.",
    },
    outro: {
      fa: "چیدمان، ابزار کم‌هزینه‌ای است که ارزش کلکسیون را چند برابر می‌کند. از قفسه‌ی ساده شروع کنید و به‌مرور ویترین رویایی‌تان را بسازید.",
      en: "Display is a low-cost tool that multiplies the value of your collection. Start with a simple shelf and build your dream showcase over time.",
      ar: "العرض أداة منخفضة التكلفة تضاعف قيمة مجموعتك. ابدأ برف بسيط وابنِ عرض أحلامك تدريجيًا.",
    },
  },
  {
    id: "spotting-knockoffs",
    category: "guide",
    icon: "🔍",
    tag: { fa: "اصالت", en: "Authenticity", ar: "الأصالة" },
    title: {
      fa: "چگونه فیگور تقلبی را از اورجینال تشخیص دهیم؟",
      en: "How to Spot a Knockoff Figure",
      ar: "كيف تميّز التمثال المقلد عن الأصلي؟",
    },
    excerpt: {
      fa: "با چند بررسی ساده روی جعبه، بسته‌بندی و جزئیات فیگور، از خرید نسخه‌ی تقلبی در امان بمانید.",
      en: "Stay safe from fakes by checking the box, packaging and figure details with a few simple steps.",
      ar: "تجنّب المقلّدات من خلال فحص الصندوق والتغليف وتفاصيل التمثال بخطوات بسيطة.",
    },
    intro: {
      fa: "فیگورهای تقلبی هر سال بهتر جعبه‌سازی می‌شوند و تشخیص آن‌ها سخت‌تر از قبل است. اما چند نشانه‌ی همیشگی وجود دارد که در بیشتر موارد، نسخه‌ی اصلی را لو می‌دهد.",
      en: "Counterfeit figures have better packaging every year, making them harder to spot. But a few constant markers usually give a fake away.",
      ar: "تتحسّن تغليفات التماثيل المقلدة كل عام. لكن هناك علامات ثابتة تكشف المقلد في معظم الحالات.",
    },
    sections: [
      {
        h: { fa: "جعبه و چاپ", en: "The Box and Print", ar: "الصندوق والطباعة" },
        paras: [
          {
            fa: "چاپ هولوگرام‌ها، بارکدها و لوگوها را دقیق بررسی کنید. در نسخه‌های اورجینال، رنگ‌ها شفاف و خطوط تیز هستند؛ در کپی‌ها معمولاً محو و مات.",
            en: "Inspect holograms, barcodes and logos closely. Original packaging has crisp lines and vivid colors; fakes look washed out and blurry.",
            ar: "افحص الهولوجرام والباركود والشعارات بدقة. التغليف الأصلي حاد الألوان والخطوط؛ المقلد باهت وغامض.",
          },
        ],
        list: [
          {
            fa: "هولوگرام و برچسب اصالت را با زاویه ببین",
            en: "Tilt holograms and authenticity stickers to verify",
            ar: "أمِل الهولوجرام وملصق الأصالة للتأكد",
          },
          {
            fa: "بوی پلاستیک تند و زننده می‌تواند نشانه‌ی کپی باشد",
            en: "A strong chemical plastic smell can signal a copy",
            ar: "رائحة البلاستيك الكيميائية القوية قد تدل على التقليد",
          },
        ],
      },
      {
        h: { fa: "جزئیات صورت و رنگ", en: "Face Details and Paint", ar: "تفاصيل الوجه والطلاء" },
        paras: [
          {
            fa: "چشم‌ها، خطوط دهان و درزهای رنگ در فیگور اورجینال تمیز و متقارن است. بین رنگ بخش‌های مجاور نباید خط خیالی دیده شود.",
            en: "Eyes, mouth lines and paint seams are clean and symmetrical on originals. There should be no bleeding between adjacent colors.",
            ar: "العيون وخطوط الفم وطبقات الطلاء نظيفة ومتناظرة في الأصل. لا يظهر طلاء متداخل بين الألوان المتجاورة.",
          },
        ],
      },
      {
        h: { fa: "خرید از فروشگاه معتبر", en: "Buy from Trusted Sellers", ar: "الشراء من بائعين موثوقين" },
        paras: [
          {
            fa: "مطمئن‌ترین راه، خرید از فروشگاه‌هایی است که ضمانت اصالت می‌دهند، سابقه و بازخورد واقعی دارند و قیمت‌شان هم غیرواقعی پایین نیست.",
            en: "The safest route is buying from stores that guarantee authenticity, have a real track record and don't price impossibly low.",
            ar: "الطريق الآمن هو الشراء من متاجر تضمن الأصالة ولديها سجل حقيقي وأسعار غير منخفضة بشكل مستحيل.",
          },
        ],
      },
    ],
    tip: {
      fa: "قیمت خیلی کمتر از میانگین بازار، بزرگ‌ترین پرچم قرمز است؛ برند معتبر، سود کمی روی فیگورهای اورجینال می‌گذارد.",
      en: "A price far below market average is the biggest red flag — legitimate brands make little margin on originals.",
      ar: "السعر الأقل كثيرًا من متوسط السوق هو أكبر إشارة خطر — الهوامش على الأصل ضئيلة.",
    },
    outro: {
      fa: "کمی دقت در خرید، هم از پول شما محافظت می‌کند و هم از کلکسیون واقعی و خوش‌آتیه شما. همیشه از مسیرهای معتبر خرید کنید.",
      en: "A little care at purchase time protects both your money and your collection's future. Always buy through verified channels.",
      ar: "القليل من الحذر عند الشراء يحمي أموالك ومستقبل مجموعتك. اشترِ دائمًا عبر قنوات موثوقة.",
    },
  },
  {
    id: "marvel-figures-guide",
    category: "movies",
    icon: "🦸",
    tag: { fa: "مارول", en: "Marvel", ar: "مارفل" },
    title: {
      fa: "راهنمای شروع کلکسیون فیگورهای مارول",
      en: "Getting Started with Marvel Figure Collecting",
      ar: "البدء في جمع تماثيل مارفل",
    },
    excerpt: {
      fa: "از شخصیت‌های اصلی تا نسخه‌های کمیاب؛ نقشه‌ی راه دنیای کلکسیون فیگور مارول را اینجا بخوانید.",
      en: "From core characters to rare variants — here's the roadmap to the Marvel figure collecting world.",
      ar: "من الشخصيات الأساسية إلى النسخ النادرة — إليك خريطة عالم جمع تماثيل مارفل.",
    },
    intro: {
      fa: "دنیای فیگورهای مارول آن‌قدر گسترده است که شاید اولش گیج‌کننده باشد. تعداد زیاد سری‌ها، برندها و نسخه‌ها هر کسی را سردرگم می‌کند. در این راهنما مسیر را روشن می‌کنیم.",
      en: "The world of Marvel figures is so vast it can feel overwhelming at first. With so many lines, brands and variants, anyone can get lost. Let's map the way.",
      ar: "عالم تماثيل مارفل واسع لدرجة قد تربك في البداية. مع كل هذه السلاسل والعلامات والنسخ، يسهل أن تضل. لنرسم الطريق معًا.",
    },
    sections: [
      {
        h: { fa: "از شخصیت محبوب شروع کن", en: "Start with Your Favorite", ar: "ابدأ بشخصيتك المفضلة" },
        paras: [
          {
            fa: "بهترین کلکسیون آن است که به سلیقه‌ی شما نزدیک باشد. از شخصیتی شروع کنید که به آن واقعاً علاقه دارید؛ بعداً می‌توانید سری‌ها را گسترش دهید.",
            en: "The best collection mirrors your taste. Begin with a character you genuinely love, then expand your lineup over time.",
            ar: "أفضل مجموعة تعكس ذوقك. ابدأ بشخصية تحبها فعلًا، ثم وسّع تشكيلتك لاحقًا.",
          },
        ],
        list: [
          {
            fa: "شخصیت‌های اصلی مثل مرد عنکبوتی، آیرون‌من و ولورین نقطه‌ی شروع خوبی هستند",
            en: "Core heroes like Spider-Man, Iron Man and Wolverine are great starting points",
            ar: "الأبطال الأساسيون مثل سبايدرمان وآيرون مان وولفرين نقاط بداية جيدة",
          },
          {
            fa: "نسخه‌های «کلاسیک» معمولاً ارزش کلکسیونی پایدارتری دارند",
            en: "Classic-style variants usually hold stable collectible value",
            ar: "النسخ الكلاسيكية تحتفظ غالبًا بقيمة جمعية مستقرة",
          },
        ],
      },
      {
        h: { fa: "برندها را بشناس", en: "Know the Brands", ar: "تعرّف على العلامات" },
        paras: [
          {
            fa: "مارول لجندز (Marvel Legends) برای شروع اقتصادی‌ترین گزینه است، S.H.Figuarts جزئیات بیشتری دارد و برندهایی مثل Mafex و Play Arts نسخه‌های پریمیوم ارائه می‌دهند.",
            en: "Marvel Legends is the most affordable entry, S.H.Figuarts adds more detail, while brands like Mafex and Play Arts deliver premium pieces.",
            ar: "مارفل ليجندز هي الأنسب للبداية الاقتصادية، وS.H.Figuarts تقدم تفاصيل أكثر، بينما تقدم Mafex وPlay Arts قطعًا فاخرة.",
          },
        ],
      },
      {
        h: { fa: "بین کلکسیون و سرمایه‌گذاری", en: "Collecting vs. Investing", ar: "بين الجمع والاستثمار" },
        paras: [
          {
            fa: "اول از همه برای لذت جمع کنید. نسخه‌های محدود و شخصیت‌های کلیدی گاهی ارزش بیشتری پیدا می‌کنند، اما قیمت هر فیگور در بلندمدت به محبوبیت آن وابسته است.",
            en: "Collect for joy first. Limited editions and key characters sometimes appreciate, but long-term value depends on a figure's popularity.",
            ar: "اجمع من أجل المتعة أولًا. النسخ المحدودة والشخصيات الرئيسية ترتفع أحيانًا، لكن القيمة طويلة المدى تعتمد على شعبية التمثال.",
          },
        ],
      },
    ],
    tip: {
      fa: "یک «شخصیت پرچم» انتخاب کن و نسخه‌های مختلفش را دنبال کن؛ این بهترین الگو برای کلکسیون‌های متمرکز و ارزشمند است.",
      en: "Pick one flagship character and chase its variants — the best pattern for a focused, valuable collection.",
      ar: "اختر شخصية رئيسية واحدة وتابع نسخها — أفضل نمط لمجموعة مركّزة وقيمة.",
    },
    outro: {
      fa: "مارول یک دنیای بی‌پایان است؛ با یک انتخاب درست شروع کنید تا مسیر روشن، لذت‌بخش و متناسب با بودجه‌تان باشد.",
      en: "Marvel is an endless universe; start with one right choice so the path stays clear, enjoyable and within budget.",
      ar: "مارفل عالم لا ينتهي؛ ابدأ باختيار صحيح واحد ليظل الطريق واضحًا وممتعًا وداخل ميزانيتك.",
    },
  },
  {
    id: "preorder-tips",
    category: "guide",
    icon: "📦",
    tag: { fa: "پیش‌فروش", en: "Preorder", ar: "الطلب المسبق" },
    title: {
      fa: "پیش‌خرید فیگور؛ مزایا، ریسک‌ها و نکات طلایی",
      en: "Preordering Figures: Benefits, Risks and Golden Tips",
      ar: "الطلب المسبق للتماثيل: الفوائد والمخاطر والنصائح",
    },
    excerpt: {
      fa: "چطور بدون پشیمانی پیش‌خرید کنیم؟ نکات طلایی برای جلوگیری از ریسک‌های رایج را بخوانید.",
      en: "How to preorder without regret? Read the golden tips to avoid the common pitfalls.",
      ar: "كيف تطلب مسبقًا دون ندم؟ اقرأ النصائح الذهبية لتجنّب الأخطاء الشائعة.",
    },
    intro: {
      fa: "پیش‌خرید راهی است برای آن‌که فیگور محبوب‌تان را قبل از نایاب‌شدن رزرو کنید. اما همین کار اگر بدون آگاهی انجام شود، می‌تواند تجربه‌ی تلخی رقم بزند. در این مطلب همه‌چیز را شفاف می‌گوییم.",
      en: "Preordering is how you reserve your favorite figure before it sells out. But done without research, it can leave a bitter taste. Let's be transparent about it.",
      ar: "الطلب المسبق هو طريقة حجز تمثالك المفضل قبل نفاد المخزون. لكن بدون بحث قد يتحول لتجربة مريرة. لنتحدث بشفافية.",
    },
    sections: [
      {
        h: { fa: "چرا پیش‌خرید کنیم؟", en: "Why Preorder?", ar: "لماذا الطلب المسبق؟" },
        paras: [
          {
            fa: "برخی فیگورها بعد از عرضه دوباره تولید نمی‌شوند یا قیمت‌شان جهشی بالا می‌رود. پیش‌خرید هم قیمت بهتری دارد و هم تضمین می‌کند که نسخه‌ی خودتان را از دست نمی‌دهید.",
            en: "Some figures never get reissued and spike in price. Preordering usually locks a better price and guarantees you don't miss out.",
            ar: "بعض التماثيل لا يعاد إصدارها وترتفع أسعارها. يثبّت الطلب المسبق سعرًا أفضل ويضمن عدم خسارة نسختك.",
          },
        ],
      },
      {
        h: { fa: "ریسک‌های رایج", en: "Common Risks", ar: "المخاطر الشائعة" },
        paras: [
          {
            fa: "تأخیر در تولید، تغییر طراحی در نسخه‌ی نهایی و غیرقابل‌بازگشت‌بودن بیعانه، مهم‌ترین ریسک‌ها هستند. همیشه شرایط لغو را قبل از پرداخت بخوانید.",
            en: "Production delays, final-design changes and non-refundable deposits are the main risks. Always read the cancellation terms before paying.",
            ar: "تأخر الإنتاج وتغيّر التصميم النهائي والودائع غير القابلة للاسترداد هي المخاطر الرئيسية. اقرأ شروط الإلغاء قبل الدفع.",
          },
        ],
        list: [
          {
            fa: "فروشنده‌ای را انتخاب کن که سابقه‌ی تحویل به‌موقع دارد",
            en: "Pick a seller with a record of on-time delivery",
            ar: "اختر بائعًا لديه سجل تسليم في الوقت المحدد",
          },
          {
            fa: "تاریخ تخمینی عرضه را با فروشنده‌ی بین‌المللی مقایسه کن",
            en: "Compare the estimated release date with official sources",
            ar: "قارن تاريخ الإصدار المتوقع مع المصادر الرسمية",
          },
        ],
      },
      {
        h: { fa: "نکات طلایی", en: "Golden Tips", ar: "نصائح ذهبية" },
        paras: [
          {
            fa: "قبل از پیش‌خرید، عکس‌های رسمی نمونه‌ی اولیه و نظرات کلکسیونرهای باتجربه را ببینید. نسخه‌ی نهایی همیشه با نمونه‌ی اولیه فرق دارد.",
            en: "Before committing, study official prototype photos and experienced collectors' reviews. The final product always differs slightly from the prototype.",
            ar: "قبل الالتزام، ادرس صور النموذج الأولي الرسمية وآراء الجامعين المخضرمين. المنتج النهائي يختلف دائمًا قليلًا عن النموذج.",
          },
        ],
      },
    ],
    tip: {
      fa: "اگر نسخه‌ی تولید دوباره (Reissue) اعلام شد، معمولاً هوشمندانه‌ترین زمان برای خرید است؛ بازار اغلب بعد از اعلام بازتولید آرام می‌شود.",
      en: "When a reissue is announced, it's often the smartest time to buy — prices usually settle once a re-release is confirmed.",
      ar: "عند الإعلان عن إعادة إصدار، غالبًا يكون الوقت الأنسب للشراء — تستقر الأسعار عادة بعد تأكيد إعادة الإصدار.",
    },
    outro: {
      fa: "پیش‌خرید با آگاهی، یکی از بهترین راه‌های کلکسیون‌سازی است. تحقیق کنید، شرایط را بخوانید و با خیال راحت رزرو کنید.",
      en: "Informed preordering is one of the best ways to build a collection. Research, read the terms, then reserve with confidence.",
      ar: "الطلب المسبق الواعي من أفضل طرق بناء المجموعة. ابحث، واقرأ الشروط، ثم احجز بثقة.",
    },
  },
  {
    id: "gift-guide-collectors",
    category: "guide",
    icon: "🎁",
    tag: { fa: "هدیه", en: "Gifts", ar: "هدايا" },
    title: {
      fa: "انتخاب فیگور به عنوان هدیه؛ راهنمای کامل",
      en: "Choosing a Figure as a Gift: The Complete Guide",
      ar: "اختيار التمثال كهدية: الدليل الكامل",
    },
    excerpt: {
      fa: "اگر برای یک کلکسیونر هدیه می‌خرید، این نکات به شما کمک می‌کند تا هدیه‌ای درست و به‌یادماندنی انتخاب کنید.",
      en: "Buying for a collector? These tips help you choose a gift that's spot-on and memorable.",
      ar: "هل تشتري لمقتنٍ؟ هذه النصائح تساعدك في اختيار هدية مناسبة ولا تُنسى.",
    },
    intro: {
      fa: "خرید هدیه برای کلکسیونر کمی متفاوت است. او سلیقه‌ی دقیقی دارد و نسخه‌های تکراری برایش بی‌ارزش‌اند. با کمی تحقیق، می‌توانید هدیه‌ای بدهید که سال‌ها در قفسه‌اش بدرخشد.",
      en: "Gifting a collector is different. They have precise taste and duplicates mean nothing. With a little research you can give a gift that shines on their shelf for years.",
      ar: "إهداء مقتنٍ مختلف. له ذوق دقيق والمكرر لا يعني شيئًا. بقليل من البحث يمكنك تقديم هدية تلمع على رفه لسنوات.",
    },
    sections: [
      {
        h: { fa: "مخفیانه سلیقه را کشف کن", en: "Secretly Learn Their Taste", ar: "اكتشف ذوقه سرًا" },
        paras: [
          {
            fa: "به قفسه‌ی او نگاه کنید: کدام شخصیت‌ها، برندها و سری‌ها تکرار می‌شوند؟ به همین دسته‌ها وفادار بمانید و از سراغ موضوعاتی که در کلکسیونش نیست بروید.",
            en: "Study their shelf: which characters, brands and series repeat? Stay loyal to those categories and avoid themes absent from their collection.",
            ar: "ادرس رفه: ما الشخصيات والعلامات والسلاسل المتكررة؟ التزم بتلك الفئات وتجنّب المواضيع الغائبة عن مجموعته.",
          },
        ],
        list: [
          {
            fa: "شخصیت محبوب او را جستجو کن؛ ممکن است نسخه‌ی جدیدی منتشر شده باشد",
            en: "Search their favorite character — a new variant may exist",
            ar: "ابحث عن شخصيته المفضلة — ربما صدرت نسخة جديدة",
          },
          {
            fa: "اگر شک داری، اکسسوری یا قاب محافظ کلکسیونی بخر",
            en: "When unsure, buy an accessory or protective display case",
            ar: "عند الشك، اشترِ ملحقًا أو علبة عرض واقية",
          },
        ],
      },
      {
        h: { fa: "به بودجه احترام بگذار", en: "Respect the Budget", ar: "احترم الميزانية" },
        paras: [
          {
            fa: "یک فیگور کوچک اما دقیق و اورجینال، از یک نسخه‌ی بزرگ و کپی بهتر است. کیفیت و اصالت را به اندازه ترجیح بدهید.",
            en: "A small, accurate original beats a large knockoff. Prioritize quality and authenticity over size.",
            ar: "الأصلي الصغير والدقيق أفضل من المقلد الكبير. قدّم الجودة والأصالة على الحجم.",
          },
        ],
      },
      {
        h: { fa: "بسته‌بندی را دریاب", en: "Remember the Packaging", ar: "لا تنسَ التغليف" },
        paras: [
          {
            fa: "بسیاری از کلکسیونرها فیگور را «جعبه‌بسته» نگه می‌دارند. اگر جعبه آسیب ببیند، هدیه‌ی شما ارزشش را از دست می‌دهد؛ جعبه را سالم و جدا از فیگور بپیچید.",
            en: "Many collectors keep figures boxed. If the box is damaged the gift loses value — wrap it carefully and separately.",
            ar: "يحتفظ كثيرون بالتماثيل داخل صناديقها. إذا تضرر الصندوق تفقد الهدية قيمتها — اغلفها بعناية وبشكل منفصل.",
          },
        ],
      },
    ],
    tip: {
      fa: "وقت خرید، به دنبال نسخه‌های «ویژه» یا «پایان سال» باش؛ این‌ها هدیه‌ای‌تر و کمیاب‌تر از نسخه‌های عادی‌اند.",
      en: "Look for special or end-of-year editions when buying — they feel more gift-like and are rarer than standard releases.",
      ar: "ابحث عن الإصدارات الخاصة عند الشراء — تبدو كهدايا أكثر وهي أندر من الإصدارات العادية.",
    },
    outro: {
      fa: "یک هدیه‌ی درست، نشانه‌ی این است که هدیه‌دهنده به سلیقه‌ی او اهمیت می‌دهد. با همین چند نکته، هدیه‌ای ماندگار انتخاب کنید.",
      en: "The right gift shows the giver cared about their taste. With these tips, choose a gift that lasts.",
      ar: "الهدية الصحيحة تُظهر اهتمام المهدي بذوقه. بهذه النصائح، اختر هدية تدوم.",
    },
  },
  {
    id: "photographing-figures",
    category: "guide",
    icon: "📷",
    tag: { fa: "عکاسی", en: "Photography", ar: "التصوير" },
    title: {
      fa: "عکاسی از فیگورها؛ نور، زاویه و پس‌زمینه",
      en: "Photographing Figures: Light, Angle and Background",
      ar: "تصوير التماثيل: الإضاءة والزاوية والخلفية",
    },
    excerpt: {
      fa: "با یک گوشی ساده هم می‌توانید از کلکسیون خود عکس‌های حرفه‌ای بگیرید؛ فقط کافی است اصول را بدانید.",
      en: "Even with a simple phone you can shoot professional photos of your collection — you just need to know the basics.",
      ar: "حتى بهاتف بسيط يمكنك التقاط صور احترافية لمجموعتك — تحتاج فقط إلى الأساسيات.",
    },
    intro: {
      fa: "عکاسی از فیگورها لذتی متفاوت دارد؛ شخصیت‌های محبوب شما می‌توانند ستاره‌ی عکس‌های تازه باشند. خبر خوب این است که برای شروع به دوربین گران‌قیمت نیاز ندارید.",
      en: "Photographing figures is its own kind of joy — your favorite characters can star in fresh photos. The good news: you don't need an expensive camera to begin.",
      ar: "تصوير التماثيل متعة مختلفة — شخصياتك المفضلة يمكن أن تكون نجمة صور جديدة. الخبر الجيد: لا تحتاج كاميرا باهظة للبدء.",
    },
    sections: [
      {
        h: { fa: "نور پنجره را دریاب", en: "Master Window Light", ar: "أتقن ضوء النافذة" },
        paras: [
          {
            fa: "نور طبیعی کنار پنجره، نرم‌ترین و واقعی‌ترین نور برای فیگور است. از فلاش مستقیم که سایه‌ی خشن و انعکاس زشت می‌سازد اجتناب کنید.",
            en: "Natural window light is the softest, most realistic light for figures. Avoid direct flash, which creates harsh shadows and ugly reflections.",
            ar: "ضوء النافذة الطبيعي هو الأنعم والأكثر واقعية للتماثيل. تجنّب الفلاش المباشر الذي يخلق ظلالًا قاسية وانعكاسات قبيحة.",
          },
        ],
      },
      {
        h: { fa: "در سطح چشم فیگور عکاسی کن", en: "Shoot at Eye Level", ar: "صوّر عند مستوى العين" },
        paras: [
          {
            fa: "به‌جای عکاسی از بالا، دوربین را هم‌تراز صورت فیگور بگیرید. این زاویه او را باوقارتر و واقعی‌تر نشان می‌دهد.",
            en: "Instead of shooting from above, hold the camera level with the figure's face. This angle makes it look grander and more lifelike.",
            ar: "بدلًا من التصوير من الأعلى، اجعل الكاميرا بمستوى وجه التمثال. هذه الزاوية تجعله أبهى وأكثر واقعية.",
          },
        ],
        list: [
          {
            fa: "از زوایای مختلف عکس بگیر و بینشان انتخاب کن",
            en: "Shoot from several angles and pick the best",
            ar: "صوّر من عدة زوايا واختر الأفضل",
          },
          {
            fa: "پس‌زمینه‌ی ساده و هم‌رنگ، توجه را روی فیگور نگه می‌دارد",
            en: "A simple, matching background keeps focus on the figure",
            ar: "خلفية بسيطة متناسقة تُبقي التركيز على التمثال",
          },
        ],
      },
      {
        h: { fa: "ادیتور گوشی کافی است", en: "Your Phone Editor Is Enough", ar: "محرّر الهاتف كافٍ" },
        paras: [
          {
            fa: "درخشش (Highlights)، کنتراست و کراپ دقیق را در ادیتور گوشی تنظیم کنید. چند تنظیم ساده می‌تواند یک عکس معمولی را حرفه‌ای کند.",
            en: "Adjust highlights, contrast and crop in your phone's editor. A few simple tweaks can turn an average shot professional.",
            ar: "اضبط الإضاءات والتباين والقص في محرر هاتفك. تعديلات بسيطة تحول صورة عادية إلى احترافية.",
          },
        ],
      },
    ],
    tip: {
      fa: "یک ورق مقوای مات به‌عنوان پس‌زمینه و یک بازتاب‌دهنده‌ی ساده (مثل کاغذ سفید) همه‌چیز عکاسی از فیگور را تغییر می‌دهد.",
      en: "A sheet of matte card as background and a simple white-card reflector change everything about figure photography.",
      ar: "ورقة مقوى غير لامعة كخلفية وعاكس أبيض بسيط يغيّران كل شيء في تصوير التماثيل.",
    },
    outro: {
      fa: "عکاسی از کلکسیون نه‌تنها سرگرمی است، بلکه سند زیبای سفر کلکسیونی شماست. هر هفته چند عکس تازه بگیرید.",
      en: "Photographing your collection is fun and a beautiful record of your collecting journey. Take a few fresh shots every week.",
      ar: "تصوير مجموعتك ممتع وهو أيضًا سجل جميل لرحلة جمعك. التقط بضع صور جديدة كل أسبوع.",
    },
  },
  {
    id: "starter-collection-2026",
    category: "news",
    icon: "🚀",
    tag: { fa: "شروع", en: "Starter", ar: "بداية" },
    title: {
      fa: "شروع کلکسیون فیگور در سال ۲۰۲۶؛ نقشه راه",
      en: "Starting a Figure Collection in 2026: The Roadmap",
      ar: "بدء مجموعة تماثيل في 2026: خارطة الطريق",
    },
    excerpt: {
      fa: "بودجه، برند، مقیاس و ترتیب خرید؛ همه‌چیز برای شروعی درست در دنیای کلکسیون در یک مطلب.",
      en: "Budget, brand, scale and order of purchase — everything you need for a proper start in the collecting world.",
      ar: "الميزانية والعلامة والمقياس وترتيب الشراء — كل ما تحتاجه لبداية صحيحة في عالم الجمع.",
    },
    intro: {
      fa: "سال ۲۰۲۶ سال خوبی برای شروع کلکسیون فیگور است؛ تنوع برندها بیشتر شده و گزینه‌های اقتصادی‌تری هم وجود دارد. اما یک شروع درست به کمی برنامه‌ریزی نیاز دارد.",
      en: "2026 is a great year to start collecting — brands are more diverse and budget options have grown. But a proper start needs a little planning.",
      ar: "عام 2026 رائع لبدء الجمع — التنوع أكبر والخيارات الاقتصادية أكثر. لكن البداية الصحيحة تحتاج تخطيطًا.",
    },
    sections: [
      {
        h: { fa: "بودجه را مشخص کن", en: "Set Your Budget", ar: "حدد ميزانيتك" },
        paras: [
          {
            fa: "به‌جای چند خرید احساسی، یک بودجه‌ی ماهانه مشخص کنید. فیگورهای اقتصادی برندهایی مثل Banpresto برای شروع ایده‌آل هستند.",
            en: "Instead of several impulse buys, set a clear monthly budget. Budget-friendly lines like Banpresto are ideal to start.",
            ar: "بدلًا من مشتريات اندفاعية، حدد ميزانية شهرية واضحة. سلاسل اقتصادية مثل Banpresto مثالية للبداية.",
          },
        ],
        list: [
          {
            fa: "با ۱ تا ۲ فیگور در ماه شروع کن تا کلکسیون کنترل‌شده بماند",
            en: "Start with 1–2 figures per month to keep the collection controlled",
            ar: "ابدأ بتمثالين شهريًا لإبقاء المجموعة تحت السيطرة",
          },
          {
            fa: "اول روی شخصیت‌های محبوب تمرکز کن، نه نسخه‌های گران",
            en: "Focus on favorite characters first, not the expensive variants",
            ar: "ركّز أولًا على الشخصيات المفضلة لا النسخ باهظة الثمن",
          },
        ],
      },
      {
        h: { fa: "مقیاس و فضای قفسه", en: "Scale and Shelf Space", ar: "المقياس ومساحة الرف" },
        paras: [
          {
            fa: "همه‌ی فیگورها هم‌اندازه نیستند. مقیاس ۱/۷ و ۱/۸ پرطرفدارترین‌اند و مقیاس‌های بزرگ ۴۰ سانتی‌متری فضای بیشتری می‌خواهند. قبل از خرید، قفسه را اندازه بگیرید.",
            en: "Figures aren't all the same size. 1/7 and 1/8 scales are the most popular, while 40cm statues demand more room. Measure your shelf before buying.",
            ar: "التماثيل ليست بنفس الحجم. مقاييس 1/7 و1/8 هي الأشهر، بينما تماثيل 40سم تحتاج مساحة أكبر. قس رفك قبل الشراء.",
          },
        ],
      },
      {
        h: { fa: "ترتیب خرید هوشمند", en: "A Smart Buying Order", ar: "ترتيب شراء ذكي" },
        paras: [
          {
            fa: "اول سراغ «شخصیت پرچم» بروید، بعد مکمل‌های همان دنیا را اضافه کنید و در پایان به سراغ نسخه‌های محدود بروید که قیمت بالاتری دارند.",
            en: "Buy your flagship character first, add complementary pieces from the same universe, then chase limited editions with premium pricing.",
            ar: "اشترِ شخصيتك الرئيسية أولًا، ثم أضف قطعًا مكملة من نفس الكون، وأخيرًا طارد الإصدارات المحدودة الباهظة.",
          },
        ],
      },
    ],
    tip: {
      fa: "یک «لیست آرزو» بنویس و قبل از هر خرید دو روز صبر کن؛ این عادت هم از خرید احساسی جلوگیری می‌کند و هم کلکسیون‌ات را منظم نگه می‌دارد.",
      en: "Keep a wishlist and wait two days before each purchase — it stops impulse buying and keeps your collection focused.",
      ar: "احتفظ بقائمة أمنيات وانتظر يومين قبل كل شراء — يمنع الشراء الاندفاعي ويبقي مجموعتك مركّزة.",
    },
    outro: {
      fa: "کلکسیونی که با برنامه شروع شود، سال‌ها لذت می‌بخشد و پشیمانی ندارد. همین امسال، اولین فیگور خود را هوشمندانه انتخاب کنید.",
      en: "A collection that starts with a plan brings years of joy and zero regret. Choose your first figure wisely this year.",
      ar: "المجموعة التي تبدأ بخطة تمنح سنوات من المتعة بلا ندم. اختر تمثالك الأول بحكمة هذا العام.",
    },
  },
];

const LOCALES: Locale[] = ["fa", "en", "ar"];

function dayNumber(date: Date): number {
  return Math.floor(date.getTime() / 86_400_000);
}

export function pickTopic(date: Date): Topic {
  return TOPICS[Math.abs(dayNumber(date)) % TOPICS.length];
}

function mdEscape(s: string): string {
  return s.replace(/[*`]/g, "");
}

function buildBody(topic: Topic, locale: Locale): string {
  const lines: string[] = [topic.intro[locale]];
  for (const section of topic.sections) {
    lines.push("");
    lines.push(`## ${section.h[locale]}`);
    for (const para of section.paras) {
      lines.push("");
      lines.push(para[locale]);
    }
    if (section.list?.length) {
      lines.push("");
      for (const item of section.list) {
        lines.push(`- ${mdEscape(item[locale])}`);
      }
    }
  }
  lines.push("");
  lines.push(`> ${mdEscape(topic.tip[locale])}`);
  lines.push("");
  lines.push(topic.outro[locale]);
  return lines.join("\n");
}

function readingMinutes(topic: Topic, locale: Locale): number {
  const words = buildBody(topic, locale).split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
}

export function dateSlug(topicId: string, date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${topicId}-${y}-${m}-${d}`;
}

export async function generateDailyPost(
  date = new Date(),
): Promise<{ slug: string; title: string } | null> {
  const topic = pickTopic(date);
  const slug = dateSlug(topic.id, date);
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing && existing.isPublished) return null;

  const title = topic.title.fa;

  const post = await prisma.blogPost.upsert({
    where: { slug },
    update: {
      coverImage: null,
      coverSvg: null,
      category: topic.category,
      readingTime: readingMinutes(topic, "fa"),
      isPublished: true,
      isTrending: true,
      publishedAt: date,
    },
    create: {
      slug,
      coverImage: null,
      coverSvg: null,
      category: topic.category,
      readingTime: readingMinutes(topic, "fa"),
      isPublished: true,
      isTrending: true,
      publishedAt: date,
      createdAt: date,
    },
  });

  for (const locale of LOCALES) {
    await prisma.blogPostTranslation.upsert({
      where: { postId_locale: { postId: post.id, locale } },
      update: {
        tag: topic.tag[locale],
        title: topic.title[locale],
        excerpt: topic.excerpt[locale],
        body: buildBody(topic, locale),
      },
      create: {
        postId: post.id,
        locale,
        tag: topic.tag[locale],
        title: topic.title[locale],
        excerpt: topic.excerpt[locale],
        body: buildBody(topic, locale),
      },
    });
  }

  await notifySubscribersOfNewPost(post.id);

  return { slug, title };
}

export async function generateBlogPosts(count: number) {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(Date.now() - i * 86_400_000);
    const result = await generateDailyPost(date);
    if (result) results.push(result.slug);
  }
  return results;
}
