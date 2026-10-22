export interface StoryChapter {
  id: string;
  title: { en: string; bn: string };
  camera: 'orbit' | 'low' | 'close' | 'top' | 'drift';
  lines: { en: string; bn: string }[];
}

// Facts grounded in NASA's official Mars Pathfinder / Sojourner mission record.
export const STORY: StoryChapter[] = [
  {
    id: 'journey',
    title: { en: 'Chapter 01 — The Journey to Mars', bn: 'অধ্যায় ০১ — মঙ্গলের পথে' },
    camera: 'drift',
    lines: [
      {
        en: 'I was built at NASA’s Jet Propulsion Laboratory, as part of the Mars Pathfinder mission.',
        bn: 'আমাকে তৈরি করেছিল নাসার জেট প্রপালশন ল্যাবরেটরি, মার্স পাথফাইন্ডার মিশনের অংশ হিসেবে।',
      },
      {
        en: 'On December 4, 1996, I left Earth aboard a Delta II rocket, folded up inside the Pathfinder lander.',
        bn: '১৯৯৬ সালের ৪ ডিসেম্বর, একটি ডেল্টা-২ রকেটে চেপে পৃথিবী ছাড়ি — পাথফাইন্ডার ল্যান্ডারের ভেতরে ভাঁজ করে রাখা অবস্থায়।',
      },
      {
        en: 'For seven months we travelled through the dark — almost 500 million kilometres.',
        bn: 'সাত মাস ধরে আমরা অন্ধকার মহাশূন্য পাড়ি দিলাম — প্রায় ৫০ কোটি কিলোমিটার।',
      },
      {
        en: 'I slept for almost the whole journey. I did not know what was waiting for me.',
        bn: 'প্রায় পুরো পথ আমি ঘুমিয়ে ছিলাম। সামনে কী অপেক্ষা করছে, তা আমি জানতাম না।',
      },
    ],
  },
  {
    id: 'arrival',
    title: { en: 'Chapter 02 — A Little Rover on a Big World', bn: 'অধ্যায় ০২ — বিশাল গ্রহে এক ছোট্ট রোভার' },
    camera: 'low',
    lines: [
      {
        en: 'On July 4, 1997, we hit the top of the Martian atmosphere at about 27,000 kilometres per hour.',
        bn: '১৯৯৭ সালের ৪ জুলাই, ঘণ্টায় প্রায় ২৭ হাজার কিলোমিটার বেগে আমরা ঢুকে পড়ি মঙ্গলের বায়ুমণ্ডলে।',
      },
      {
        en: 'A parachute opened. Rockets fired. Then the airbags inflated — and we bounced across the plain like a ball.',
        bn: 'প্যারাশুট খুলল। রকেট ফুঁসে উঠল। তারপর ফুলে উঠল এয়ারব্যাগ — আর আমরা বলের মতো লাফাতে লাফাতে গড়িয়ে গেলাম প্রান্তর জুড়ে।',
      },
      {
        en: 'We came to rest in Ares Vallis — an ancient plain once carved by colossal floods.',
        bn: 'আমরা থামলাম এরেস ভ্যালিসে — এক প্রাচীন সমভূমিতে, যা কোনোদিন খন্ড খন্ড হয়ে গেছিল বিশাল বন্যার পানিতে।',
      },
      {
        en: 'I weighed just 10.6 kilograms — about as much as a small dog. And I became the first wheeled robot ever to drive on another planet.',
        bn: 'আমার ওজন ছিল মাত্র ১০ দশমিক ৬ কেজি — প্রায় একটা ছোট কুকুরের সমান। আর আমিই হয়ে গেলাম প্রথম চাকাওয়ালা রোবট, যে চলল অন্য কোনো গ্রহের মাটিতে।',
      },
    ],
  },
  {
    id: 'exploring',
    title: { en: 'Chapter 03 — Exploring Mars', bn: 'অধ্যায় ০৩ — মঙ্গল অন্বেষণ' },
    camera: 'orbit',
    lines: [
      {
        en: 'I moved slowly — one centimetre per second. But slow was safe, and Mars had waited long enough.',
        bn: 'আমি ধীরে চলতাম — সেকেন্ডে এক সেন্টিমিটার। কিন্তু ধীর চলাই ছিল নিরাপদ, আর মঙ্গল তো অনেক কাল ধরেই অপেক্ষায় ছিল।',
      },
      {
        en: 'My six wheels, on a suspension called rocker-bogie, let me climb over rocks bigger than the wheels themselves.',
        bn: 'আমার ছয় চাকা আর “রকার-বগি” সাসপেনশন আমাকে চড়ে যেতে দিত চাকার চেয়েও বড় পাথরের ওপর দিয়ে।',
      },
      {
        en: 'With my Alpha Proton X-ray Spectrometer, I tasted the chemistry of Martian rocks. The team on Earth named them things like Barnacle Bill and Yogi.',
        bn: 'আমার আলফা প্রোটন এক্স-রে স্পেকট্রোমিটার দিয়ে আমি পরীক্ষা করতাম মঙ্গলের পাথরের রসায়ন। পৃথিবীর বিজ্ঞানীরা সেই পাথরগুলোর নাম দিয়েছিল “বার্নাকল বিল”, “ইয়োগি”-র মতো।',
      },
      {
        en: 'In all, I drove about a hundred metres, and never strayed far from my lander. She was my voice home.',
        bn: 'মোটামুটি একশো মিটার পথ আমি চলেছিলাম, আর ল্যান্ডার থেকে কখনো বেশি দূরে যাইনি। সে-ই ছিল পৃথিবীর সঙ্গে আমার কথা বলার গলা।',
      },
    ],
  },
  {
    id: 'pathfinder',
    title: { en: 'Chapter 04 — Pathfinder', bn: 'অধ্যায় ০৪ — পাথফাইন্ডার' },
    camera: 'close',
    lines: [
      {
        en: 'The lander carried me safely across space. After I rolled down her ramp, she became our weather station, our camera, our radio link to Earth.',
        bn: 'ল্যান্ডার আমাকে নিরাপদে পৌঁছে দিয়েছিল মহাশূন্য পেরিয়ে। আমি তার র‍্যাম্প বেয়ে নেমে যাওয়ার পর সে হয়ে উঠল আমাদের আবহাওয়া স্টেশন, ক্যামেরা, আর পৃথিবীর সঙ্গে রেডিও সংযোগ।',
      },
      {
        en: 'Together we sent home more than 17,000 images and millions of weather measurements.',
        bn: 'একসঙ্গে আমরা পৃথিবীতে পাঠিয়েছিলাম ১৭ হাজারেরও বেশি ছবি আর লক্ষ লক্ষ আবহাওয়ার পরিমাপ।',
      },
      {
        en: 'We found rounded pebbles and soil laid down by water — evidence that Mars was once warmer and wetter.',
        bn: 'আমরা পেয়েছিলাম পানিতে গড়িয়ে গোল হয়ে যাওয়া নুড়ি পাথর আর পলি — প্রমাণ যে মঙ্গল কোনোদিন ছিল উষ্ণতর আর সিক্ত।',
      },
      {
        en: 'After the mission, NASA named the lander the Carl Sagan Memorial Station.',
        bn: 'মিশন শেষে নাসা ল্যান্ডারটির নাম রাখে “কার্ল সেগান মেমোরিয়াল স্টেশন”।',
      },
    ],
  },
  {
    id: 'final',
    title: { en: 'Chapter 05 — The Final Communication', bn: 'অধ্যায় ০৫ — শেষ যোগাযোগ' },
    camera: 'top',
    lines: [
      {
        en: 'My mission was planned to last 7 days. I worked for 83.',
        bn: 'আমার মিশনের পরিকল্পনা ছিল মাত্র ৭ দিনের। আমি কাজ করেছিলাম ৮৩ দিন।',
      },
      {
        en: 'On September 27, 1997, we sent our last full transmission. After that, Earth called and called… but we never answered again.',
        bn: '১৯৯৭ সালের ২৭ সেপ্টেম্বর, আমরা পাঠালাম আমাদের শেষ পূর্ণ সংকেত। তারপর পৃথিবী বারবার ডেকেছিল… কিন্তু আমরা আর কখনো উত্তর দিইনি।',
      },
      {
        en: 'No one knows exactly why we fell silent. The cold Martian nights were hard on our batteries.',
        bn: 'ঠিক কেন আমরা চুপ করে গেছিলাম, কেউ জানে না। মঙ্গলের হিম রাত্রি আমাদের ব্যাটারির জন্য ছিল খুবই কঠিন।',
      },
      {
        en: 'I am still there, in Ares Vallis, near my lander. But my story did not end — every rover that came after me follows my tracks.',
        bn: 'আমি আজও সেখানেই আছি, এরেস ভ্যালিসে, আমার ল্যান্ডারের পাশে। কিন্তু আমার গল্প শেষ হয়নি — আমার পরে আসা প্রতিটি রোভার হেঁটেছে আমার চাকার দাগ ধরে।',
      },
    ],
  },
];

export interface Hotspot {
  id: string;
  label: { en: string; bn: string };
  pos: [number, number, number];
  did: { en: string; bn: string };
  mattered: { en: string; bn: string };
  event: { en: string; bn: string };
}

export const HOTSPOTS: Hotspot[] = [
  {
    id: 'wheels',
    label: { en: 'Wheels', bn: 'চাকা' },
    pos: [0.35, 0.22, 0.15],
    did: {
      en: 'Six aluminium wheels on a “rocker-bogie” suspension let me roll over rocks bigger than the wheels themselves.',
      bn: '“রকার-বগি” সাসপেনশনে বসানো ছয়টি অ্যালুমিনিয়ামের চাকা আমাকে গড়িয়ে যেতে দিত চাকার চেয়েও বড় পাথর টপকে।',
    },
    mattered: {
      en: 'Mars is covered in rocks. Without wheels like these, I could never have left the lander’s side.',
      bn: 'মঙ্গল ভরা পাথরে। এমন চাকা ছাড়া ল্যান্ডারের পাশ থেকে আমি কখনোই সরতে পারতাম না।',
    },
    event: {
      en: 'The rocker-bogie design worked so well that every NASA Mars rover since — including Curiosity and Perseverance — still uses it.',
      bn: 'রকার-বগি নকশা এত ভালো কাজ করেছিল যে পরের প্রতিটি নাসা রোভার — কিউরিওসিটি, পারসেভারেন্সসহ — আজও সেটাই ব্যবহার করে।',
    },
  },
  {
    id: 'comms',
    label: { en: 'Communication', bn: 'যোগাযোগ' },
    pos: [-0.55, 0.78, -0.28],
    did: {
      en: 'I could not reach Earth directly. I whispered to my lander by radio, and she relayed everything home.',
      bn: 'পৃথিবীর সঙ্গে সরাসরি কথা বলার ক্ষমতা আমার ছিল না। রেডিওতে আমি ফিসফিস করে ল্যান্ডারকে বলতাম, আর সে সব পৌঁছে দিত পৃথিবীতে।',
    },
    mattered: {
      en: 'Every photo I took and every rock I tasted travelled through that link.',
      bn: 'আমার তোলা প্রতিটি ছবি, পরীক্ষা করা প্রতিটি পাথরের তথ্য — সব গিয়েছিল এই সংযোগ দিয়েই।',
    },
    event: {
      en: 'When the lander fell silent in September 1997, I lost my voice too. Earth never heard from either of us again.',
      bn: '১৯৯৭-এর সেপ্টেম্বরে ল্যান্ডার চুপ করে যাওয়ায় আমিও হারিয়ে ফেলি আমার গলা। পৃথিবী আর কখনো আমাদের কারও উত্তর পায়নি।',
    },
  },
  {
    id: 'cameras',
    label: { en: 'Cameras', bn: 'ক্যামেরা' },
    pos: [0, 0.95, 0.42],
    did: {
      en: 'Two black-and-white cameras in front helped me steer around rocks. A colour camera at the back watched where I had been.',
      bn: 'সামনের দুটি শ্বেতশ্যামল ক্যামেরা আমাকে পাথর এড়িয়ে পথ খুঁজে দিত। পেছনের রঙিন ক্যামেরা দেখত আমি কোন পথ পেরিয়ে এলাম।',
    },
    mattered: {
      en: 'They were my eyes — 550 pictures of Mars, taken from just a few centimetres above the ground.',
      bn: 'সেগুলোই ছিল আমার চোখ — মাটি থেকে মাত্র কয়েক সেন্টিমিটার উঁচু থেকে তোলা মঙ্গলের ৫৫০টি ছবি।',
    },
    event: {
      en: 'My images helped scientists on Earth plan where to send me each day — and gave people their first rover’s-eye view of another world.',
      bn: 'আমার ছবি দেখে বিজ্ঞানীরা ঠিক করতেন প্রতিদিন আমাকে কোথায় পাঠাবেন — আর মানুষ পেল অন্য গ্রহের প্রথম “রোভারের চোখে” দেখা দৃশ্য।',
    },
  },
  {
    id: 'power',
    label: { en: 'Power', bn: 'শক্তি' },
    pos: [0.1, 0.86, 0],
    did: {
      en: 'A small solar panel on my back — about 0.22 square metres — charged my batteries each Martian day.',
      bn: 'আমার পিঠের ওপর ছোট্ট এক সৌরপ্যানেল — প্রায় ০ দশমিক ২২ বর্গমিটার — প্রতিটি মঙ্গল-দিবসে চার্জ করত আমার ব্যাটারি।',
    },
    mattered: {
      en: 'Dust slowly settled on the panel, and the freezing nights drained me. Energy decided how long I could live.',
      bn: 'ধীরে ধীরে প্যানেলে জমতে থাকে ধুলো, আর হিম রাত্রি নিংড়ে নিত আমার শক্তি। আমি কতদিন বাঁচব, তা ঠিক করত এই শক্তিই।',
    },
    event: {
      en: 'I was designed for 7 days of sunlight. I kept working for 83 — twelve times longer than anyone expected.',
      bn: 'আমাকে বানানো হয়েছিল ৭ দিনের রোদের জন্য। আমি কাজ করেছিলাম ৮৩ দিন — সবার ধারণার বারো গুণ বেশি।',
    },
  },
];

export const HOTSPOT_ORDER = ['wheels', 'comms', 'cameras', 'power'];
