export interface PlanetData {
  id: string;
  name: { en: string; bn: string };
  type: { en: string; bn: string };
  radiusKm: number;
  distanceAu: number;
  orbitPeriod: { en: string; bn: string };
  moons: number;
  temp: string;
  color: number;
  radius3d: number;
  orbitRadius3d: number;
  orbitSpeed: number;
  description: { en: string; bn: string };
  missionStatus?: {
    available: boolean;
    badge: { en: string; bn: string };
    title: { en: string; bn: string };
    desc: { en: string; bn: string };
    actionText: { en: string; bn: string };
  };
}

export const SOLAR_BODIES: PlanetData[] = [
  {
    id: 'Sun',
    name: { en: 'The Sun', bn: 'সূর্য' },
    type: { en: 'Yellow Dwarf Star (G2V)', bn: 'হলুদ বামন নক্ষত্র (G2V)' },
    radiusKm: 696340,
    distanceAu: 0,
    orbitPeriod: { en: '230M years (Galactic)', bn: '২৩০ মিলিয়ন বছর (গ্যালাক্টিক)' },
    moons: 8,
    temp: '5,500 °C / 15M °C core',
    color: 0xffaa33,
    radius3d: 4.8,
    orbitRadius3d: 0,
    orbitSpeed: 0,
    description: {
      en: 'The heart of our solar system. An incandescent sphere of plasma generating intense heat, light, and gravitational binding for all planets.',
      bn: 'আমাদের সৌরজগতের প্রাণকেন্দ্র। উত্তপ্ত প্লাজমার এক বিশাল গোলক যা সমস্ত গ্রহকে আলোর সাথে মহাকর্ষীয় বন্ধনে ধরে রেখেছে।',
    },
  },
  {
    id: 'Mercury',
    name: { en: 'Mercury', bn: 'বুধ' },
    type: { en: 'Terrestrial Planet', bn: 'পাথুরে গ্রহ' },
    radiusKm: 2439,
    distanceAu: 0.39,
    orbitPeriod: { en: '88 Earth Days', bn: '৮৮ পার্থিব দিন' },
    moons: 0,
    temp: '-180 °C to 430 °C',
    color: 0x9a8f85,
    radius3d: 0.55,
    orbitRadius3d: 9.5,
    orbitSpeed: 0.55,
    description: {
      en: 'The smallest planet and closest to the Sun. Heavily cratered surface with extreme temperature fluctuations between scorching day and freezing night.',
      bn: 'সৌরজগতের ক্ষুদ্রতম ও সূর্যের নিকটতম গ্রহ। এর পৃষ্ঠে প্রচুর গহ্বর এবং প্রচণ্ড গরম ও চরম ঠান্ডার তীব্র বৈপরীত্য বিদ্যমান।',
    },
    missionStatus: {
      available: false,
      badge: { en: 'SURVEY DATA', bn: 'জরিপ তথ্য' },
      title: { en: 'MESSENGER / BepiColombo', bn: 'মেসেঞ্জার / বেপিকলম্বো' },
      desc: { en: 'Ancient volcanic plains and magnetic anomalies scanned by orbital probes.', bn: 'কক্ষপথীয় প্রোব দ্বারা স্ক্যান করা প্রাচীন আগ্নেয়গিরির সমভূমি।' },
      actionText: { en: 'ARCHIVED', bn: 'সংরক্ষিত' },
    },
  },
  {
    id: 'Venus',
    name: { en: 'Venus', bn: 'শুক্র' },
    type: { en: 'Terrestrial Planet', bn: 'পাথুরে গ্রহ' },
    radiusKm: 6051,
    distanceAu: 0.72,
    orbitPeriod: { en: '225 Earth Days', bn: '২২৫ পার্থিব দিন' },
    moons: 0,
    temp: '465 °C',
    color: 0xe5c18a,
    radius3d: 0.95,
    orbitRadius3d: 13.8,
    orbitSpeed: 0.42,
    description: {
      en: 'Earth’s twin in size, but shrouded in thick sulfuric clouds with runaway greenhouse heating. Atmospheric pressure is 92 times that of Earth.',
      bn: 'আকারে পৃথিবীর যমজ হলেও ঘন সালফিউরিক মেঘ ও তীব্র গ্রিনহাউস প্রভাবে এর তাপমাত্রা সীসা গলানোর মতো উত্তপ্ত।',
    },
    missionStatus: {
      available: false,
      badge: { en: 'EXTREME ENVIRONMENT', bn: 'চরম পরিবেশ' },
      title: { en: 'Venera Landers', bn: 'ভেনেরার ল্যান্ডার' },
      desc: { en: 'Crushed beneath crushing atmospheric pressure on the molten surface.', bn: 'উত্তপ্ত পৃষ্ঠের প্রচণ্ড বায়ুমণ্ডলীয় চাপে পিষ্ট হওয়া মানবদূত।' },
      actionText: { en: 'INACCESSIBLE', bn: 'অনধিগম্য' },
    },
  },
  {
    id: 'Earth',
    name: { en: 'Earth', bn: 'পৃথিবী' },
    type: { en: 'Terrestrial / Habitable', bn: 'বাসযোগ্য পাথুরে গ্রহ' },
    radiusKm: 6371,
    distanceAu: 1.0,
    orbitPeriod: { en: '365.25 Days', bn: '৩৬৫.২৫ দিন' },
    moons: 1,
    temp: '15 °C (Average)',
    color: 0x2b6cb0,
    radius3d: 1.05,
    orbitRadius3d: 18.2,
    orbitSpeed: 0.34,
    description: {
      en: 'Our home oasis. Abundant liquid water, dynamic nitrogen-oxygen atmosphere, and the cradle from which robotic explorers were launched.',
      bn: 'আমাদের প্রিয় নীল গ্রহ। তরল জল, সুরক্ষিত বায়ুমণ্ডল এবং যেখান থেকে রোবোটিক অভিযাত্রীরা মহাশূন্যে যাত্রা শুরু করেছিল।',
    },
    missionStatus: {
      available: false,
      badge: { en: 'ORIGIN POINT', bn: 'যাত্রা শুরু' },
      title: { en: 'Deep Space Network Array', bn: 'ডিপ স্পেস নেটওয়ার্ক' },
      desc: { en: 'Transmitting telemetry to historic rovers and probes across the cosmos.', bn: 'মহাকাশের ঐতিহাসিক রোভারগুলোর সাথে সংকেত বিনিময় করছে।' },
      actionText: { en: 'HOMELAND', bn: 'মাতৃভূমি' },
    },
  },
  {
    id: 'Moon',
    name: { en: 'The Moon', bn: 'চাঁদ' },
    type: { en: 'Natural Satellite', bn: 'প্রাকৃতিক উপগ্রহ' },
    radiusKm: 1737,
    distanceAu: 1.0,
    orbitPeriod: { en: '27.3 Earth Days', bn: '২৭.৩ দিন' },
    moons: 0,
    temp: '-130 °C to 120 °C',
    color: 0xaaaaaa,
    radius3d: 0.32,
    orbitRadius3d: 18.2,
    orbitSpeed: 0.34,
    description: {
      en: 'Earth’s only natural satellite. Holds ancient basalt maria, impact craters, and historical lunar footprints and landers.',
      bn: 'পৃথিবীর একমাত্র প্রাকৃতিক উপগ্রহ। এর পৃষ্ঠে রয়েছে প্রাচীন ব্যাসল্ট সাগর, গহ্বর এবং মানবযাত্রার স্মৃতিচিহ্ন।',
    },
    missionStatus: {
      available: false,
      badge: { en: 'LUNAR ARCHIVES', bn: 'চন্দ্র আর্কাইভ' },
      title: { en: 'Apollo & Surveyor Sites', bn: 'অ্যাপোলো ও সার্ভেয়ার সাইট' },
      desc: { en: 'Historic human footprints and scientific equipment preserved in eternal silence.', bn: 'চিরন্তন নীরবতায় সংরক্ষিত ঐতিহাসিক মানব পদচিহ্ন ও যন্ত্রপাতি।' },
      actionText: { en: 'CHAPTER 2 (LOCKED)', bn: 'অধ্যায় ২ (লক করা)' },
    },
  },
  {
    id: 'Mars',
    name: { en: 'Mars', bn: 'মঙ্গল' },
    type: { en: 'Terrestrial Planet', bn: 'পাথুরে গ্রহ' },
    radiusKm: 3389,
    distanceAu: 1.52,
    orbitPeriod: { en: '687 Earth Days', bn: '৬৮৭ পার্থিব দিন' },
    moons: 2,
    temp: '-63 °C (Average)',
    color: 0xcd5334,
    radius3d: 0.76,
    orbitRadius3d: 23.5,
    orbitSpeed: 0.28,
    description: {
      en: 'The Red Planet. Iron oxide sands, towering volcanic plateaus like Olympus Mons, canyon labyrinths, and the final resting site of legendary pioneers.',
      bn: 'লাল গ্রহ। আয়রন অক্সাইডের লাল বালুকা, সুবিশাল পর্বত অলিম্পাস মনস, এবং ইতিহাসের পথপ্রদর্শক রোভারদের অন্তিম আশ্রয়স্থল।',
    },
    missionStatus: {
      available: true,
      badge: { en: 'MISSION TARGET DETECTED', bn: 'মিশন লক্ষ্য শনাক্ত হয়েছে' },
      title: { en: 'Pathfinder & Sojourner (1997)', bn: 'পাথফাইন্ডার ও সোজার্নার (১৯৯৭)' },
      desc: { en: 'An abandoned pioneer rover resting in Ares Vallis floodplain awaits your arrival.', bn: 'এরিস ভ্যালিসে চিরনিদ্রায় শায়িত ছোট্ট অগ্রদূত রোভারটি আপনার অপেক্ষায়।' },
      actionText: { en: 'LAUNCH MISSION →', bn: 'মিশন শুরু করুন →' },
    },
  },
  {
    id: 'Jupiter',
    name: { en: 'Jupiter', bn: 'বৃহস্পতি' },
    type: { en: 'Gas Giant', bn: 'গ্যাসীয় দৈত্য গ্রহ' },
    radiusKm: 69911,
    distanceAu: 5.2,
    orbitPeriod: { en: '11.86 Earth Years', bn: '১১.৮৬ বছর' },
    moons: 95,
    temp: '-110 °C',
    color: 0xd9a46f,
    radius3d: 2.4,
    orbitRadius3d: 31.5,
    orbitSpeed: 0.18,
    description: {
      en: 'The undisputed monarch of planets. Massive hydrogen-helium atmosphere with swirling anticyclonic storm belts and the iconic centuries-old Great Red Spot.',
      bn: 'সৌরজগতের বৃহত্তম গ্রহ। হাইড্রোজেন ও হিলিয়ামের ঘূর্ণায়মান মেঘমালা এবং শতবর্ষী সুবিশাল গ্রেট রেড স্পট ঝড়ে ভরা এক রাজকীয় বিস্ময়।',
    },
    missionStatus: {
      available: false,
      badge: { en: 'DEEP SPACE TELEMETRY', bn: 'ডিপ স্পেস টেলিমেট্রি' },
      title: { en: 'Galileo & Juno Trajectory', bn: 'গ্যালিলিও ও জুনো ট্র্যাজেক্টরি' },
      desc: { en: 'Radiation belt readings and atmospheric probes recording magnetic pulses.', bn: 'তীব্র তেজস্ক্রিয় বলয় ও বায়ুমণ্ডলীয় চৌম্বকীয় স্পন্দন।' },
      actionText: { en: 'TELEMETRY ONLY', bn: 'শুধুমাত্র টেলিমেট্রি' },
    },
  },
  {
    id: 'Saturn',
    name: { en: 'Saturn', bn: 'শনি' },
    type: { en: 'Gas Giant (Ringed)', bn: 'বলয়যুক্ত গ্যাসীয় গ্রহ' },
    radiusKm: 58232,
    distanceAu: 9.58,
    orbitPeriod: { en: '29.45 Earth Years', bn: '২৯.৪৫ বছর' },
    moons: 146,
    temp: '-140 °C',
    color: 0xdfcb98,
    radius3d: 2.0,
    orbitRadius3d: 39.5,
    orbitSpeed: 0.14,
    description: {
      en: 'Jewel of the solar system. Adorned with dazzling rings composed of water ice chunks and cosmic dust, featuring the mysterious Cassini Division.',
      bn: 'সৌরজগতের সবচেয়ে দৃষ্টিনন্দন রত্ন। কোটি কোটি বরফখণ্ড ও ধূলিকণা দিয়ে তৈরি অসাধারণ বলয়ে মোড়ানো সোনালী গ্রহ।',
    },
    missionStatus: {
      available: false,
      badge: { en: 'FINAL PLUNGE', bn: 'অন্তিম আত্মাহুতি' },
      title: { en: 'Cassini-Huygens Legacy', bn: 'ক্যাসিনি-হাইগেনস স্মৃতি' },
      desc: { en: 'A grand finale dive into the golden clouds after 13 years orbiting the rings.', bn: 'শনির বলয় প্রদক্ষিণ শেষে সোনালী মেঘে বিলীন হয়ে যাওয়া কিংবদন্তি মহাকাশযান।' },
      actionText: { en: 'LEGACY DATA', bn: 'ঐতিহাসিক রেকর্ড' },
    },
  },
  {
    id: 'Uranus',
    name: { en: 'Uranus', bn: 'ইউরেনাস' },
    type: { en: 'Ice Giant', bn: 'বরফ দৈত্য গ্রহ' },
    radiusKm: 25362,
    distanceAu: 19.2,
    orbitPeriod: { en: '84 Earth Years', bn: '৮৪ বছর' },
    moons: 28,
    temp: '-195 °C',
    color: 0x9bd8e2,
    radius3d: 1.45,
    orbitRadius3d: 47.0,
    orbitSpeed: 0.1,
    description: {
      en: 'The cyan ice giant. Orbits on its side with a dramatic 98-degree axial tilt, causing extreme 42-year long polar seasons enveloped in pale methane clouds.',
      bn: 'হালকা নীলচে বরফ দৈত্য। এটি প্রায় ৯৮ ডিগ্রি হেলে নিজ কক্ষপথে আবর্তিত হয়, ফলে প্রতিটি মেরুতে ৪২ বছরের দীর্ঘ দিন ও রাত ঘটে।',
    },
    missionStatus: {
      available: false,
      badge: { en: 'OUTER RIM', bn: 'দূর সীমান্ত' },
      title: { en: 'Voyager 2 Encounter', bn: 'ভয়েজার ২ সাক্ষাৎ' },
      desc: { en: 'A historic high-speed flyby capturing faint rings and shepherd moons in 1986.', bn: '১৯৮৬ সালে ধারণ করা ক্ষীণ বলয় ও চাঁদের ঐতিহাসিক চিত্র।' },
      actionText: { en: 'UNEXPLORED', bn: 'অনাবিষ্কৃত' },
    },
  },
  {
    id: 'Neptune',
    name: { en: 'Neptune', bn: 'নেপচুন' },
    type: { en: 'Ice Giant', bn: 'বরফ দৈত্য গ্রহ' },
    radiusKm: 24622,
    distanceAu: 30.1,
    orbitPeriod: { en: '164.8 Earth Years', bn: '১৬৪.৮ বছর' },
    moons: 16,
    temp: '-200 °C',
    color: 0x4876d6,
    radius3d: 1.4,
    orbitRadius3d: 54.0,
    orbitSpeed: 0.08,
    description: {
      en: 'The azure sentinel at the edge of the major solar system. Whipped by supersonic winds exceeding 2,100 km/h, the fastest recorded anywhere in the realm.',
      bn: 'সৌরজগতের নীল দূরবর্তী প্রহরী। এখানে বয়ে যায় শব্দের চেয়েও দ্রুত গতিসম্পন্ন তীব্র বাতাস, যার গতিবেগ ঘণ্টায় ২১০০ কিমি ছাড়িয়ে যায়।',
    },
    missionStatus: {
      available: false,
      badge: { en: 'EDGE OF SUNLIGHT', bn: 'সূর্যালোকের শেষ সীমা' },
      title: { en: 'Voyager 2 Horizon', bn: 'ভয়েজার ২ দিগন্ত' },
      desc: { en: 'Triton cryovolcanoes and deep azure atmospheric storms scanned before heading interstellar.', bn: 'আন্তঃনাক্ষত্রিক যাত্রার আগে ট্রাইটনের বরফ আগ্নেয়গিরি পর্যবেক্ষণ।' },
      actionText: { en: 'OUTER REALM', bn: 'মহাশূন্য সীমা' },
    },
  },
];
