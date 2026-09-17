import { Product, Brand, NewsItem, Tenant, Category } from '../models';

export const TENANTS: Record<string, Tenant> = {
  'thomann-demo': { id: 'thomann-demo', name: 'Thomann Demo',    color: '#dc2626', icon: '♪' },
  'rockhouse':    { id: 'rockhouse',    name: 'Rockhouse Music', color: '#7c3aed', icon: '🎸' },
  'musicpro':     { id: 'musicpro',     name: 'MusicPro Store',  color: '#065f46', icon: '🎹' },
};

export const CATEGORIES: Category[] = [
  { slug: 'guitarras',   name: 'Guitarras',    emoji: '🎸', count: 4280 },
  { slug: 'bajos',       name: 'Bajos',        emoji: '🎵', count: 1840 },
  { slug: 'teclados',    name: 'Teclados',     emoji: '🎹', count: 2190 },
  { slug: 'baterias',    name: 'Baterías',     emoji: '🥁', count: 980  },
  { slug: 'audio',       name: 'Audio / PA',   emoji: '🔊', count: 3400 },
  { slug: 'dj',          name: 'DJ',           emoji: '🎧', count: 720  },
  { slug: 'estudio',     name: 'Estudio',      emoji: '🎙️', count: 1560 },
  { slug: 'microfonos',  name: 'Micrófonos',   emoji: '🎤', count: 890  },
  { slug: 'iluminacion', name: 'Iluminación',  emoji: '💡', count: 640  },
  { slug: 'accesorios',  name: 'Accesorios',   emoji: '🎵', count: 8900 },
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1', slug: 'fender-am-pro-ii-strat',
    emoji: '🎸', brand: 'Fender', name: 'American Professional II Stratocaster',
    desc: 'Strat americana con pastillas V-Mod II. Setup perfecto de fábrica.',
    price: 1299, oldPrice: 1499, discount: 13, rating: 4.7, reviews: 147,
    stock: 'lowStock', tags: ['deal', 'featured'], category: 'guitarras'
  },
  {
    id: 'p2', slug: 'gibson-les-paul-standard',
    emoji: '🎸', brand: 'Gibson', name: "Les Paul Standard '60s",
    desc: 'Burstbucker 61R/T. Réplica fiel de la Les Paul de los 60.',
    price: 2499, oldPrice: null, discount: 0, rating: 4.9, reviews: 214,
    stock: 'inStock', tags: ['topSeller', 'featured'], category: 'guitarras'
  },
  {
    id: 'p3', slug: 'ibanez-az2402-prestige',
    emoji: '🎸', brand: 'Ibanez', name: 'AZ2402 Prestige',
    desc: 'Serie Prestige japonesa. DiMarzio Hyperion. Cuerpo Alder seleccionado.',
    price: 1189, oldPrice: 1389, discount: 14, rating: 4.6, reviews: 89,
    stock: 'inStock', tags: ['deal', 'new'], category: 'guitarras'
  },
  {
    id: 'p4', slug: 'prs-se-custom-24',
    emoji: '🎸', brand: 'PRS', name: 'SE Custom 24',
    desc: 'Versatilidad americana a precio accesible. 85/15 S pickups, 24 trastes.',
    price: 749, oldPrice: null, discount: 0, rating: 4.5, reviews: 312,
    stock: 'inStock', tags: ['topSeller'], category: 'guitarras'
  },
  {
    id: 'p5', slug: 'yamaha-pacifica-612vii',
    emoji: '🎸', brand: 'Yamaha', name: 'Pacifica 612VII FM',
    desc: 'Guitarra profesional con tapa de arce flameado. HSH, tremolo Gotoh.',
    price: 879, oldPrice: 999, discount: 12, rating: 4.7, reviews: 98,
    stock: 'inStock', tags: ['deal'], category: 'guitarras'
  },
  {
    id: 'p6', slug: 'gretsch-g5622t',
    emoji: '🎸', brand: 'Gretsch', name: 'G5622T Electromatic Center Block',
    desc: "Semi-hollow con cuerpo de arce laminado. Broad'Tron BT-2S pickups.",
    price: 699, oldPrice: null, discount: 0, rating: 4.4, reviews: 67,
    stock: 'inStock', tags: ['new'], category: 'guitarras'
  },
  {
    id: 'p7', slug: 'roland-fantom-7',
    emoji: '🎹', brand: 'Roland', name: 'Fantom-7 · Ex-demo',
    desc: 'Sintetizador workstation 76 teclas. ZEN-Core engine. Pantalla táctil.',
    price: 1424, oldPrice: 1899, discount: 25, rating: 4.8, reviews: 45,
    stock: 'lowStock', tags: ['deal', 'outlet'], category: 'teclados'
  },
  {
    id: 'p8', slug: 'korg-minilogue-xd',
    emoji: '🎹', brand: 'Korg', name: 'Minilogue XD',
    desc: 'Sintetizador analógico polifónico 4 voces. Osciladores multi-engine.',
    price: 549, oldPrice: null, discount: 0, rating: 4.6, reviews: 203,
    stock: 'inStock', tags: ['topSeller'], category: 'teclados'
  },
  {
    id: 'p9', slug: 'shure-sm7b',
    emoji: '🎤', brand: 'Shure', name: 'SM7B',
    desc: 'El micrófono de podcasters y streamers pro. Respuesta plana y uniforme.',
    price: 399, oldPrice: null, discount: 0, rating: 4.9, reviews: 892,
    stock: 'inStock', tags: ['topSeller', 'featured'], category: 'microfonos'
  },
  {
    id: 'p10', slug: 'sennheiser-e906',
    emoji: '🎤', brand: 'Sennheiser', name: 'E906',
    desc: 'Dinámico para guitarra, diseñado para amplificadores. 3 selectores de timbre.',
    price: 149, oldPrice: 179, discount: 17, rating: 4.7, reviews: 156,
    stock: 'inStock', tags: ['deal'], category: 'microfonos'
  },
  {
    id: 'p11', slug: 'boss-katana-100',
    emoji: '🔊', brand: 'Boss', name: 'Katana-100 MkII',
    desc: '100W versátiles con 5 variaciones de amp. Power Control 0.5-50-100W.',
    price: 449, oldPrice: 499, discount: 10, rating: 4.8, reviews: 324,
    stock: 'inStock', tags: ['topSeller', 'deal'], category: 'audio'
  },
  {
    id: 'p12', slug: 'marshall-origin-50h',
    emoji: '🔊', brand: 'Marshall', name: 'Origin 50H',
    desc: 'Cabezal valve 50W. El sonido Marshall clásico en formato moderno.',
    price: 699, oldPrice: null, discount: 0, rating: 4.7, reviews: 88,
    stock: 'inStock', tags: [], category: 'audio'
  },
];

export const BRANDS: Brand[] = [
  { name: 'Fender',             emoji: '🎸', count: 842  },
  { name: 'Gibson',             emoji: '🎸', count: 614  },
  { name: 'Ibanez',             emoji: '🎸', count: 528  },
  { name: 'Yamaha',             emoji: '🎵', count: 487  },
  { name: 'Roland',             emoji: '🎹', count: 312  },
  { name: 'Korg',               emoji: '🎹', count: 248  },
  { name: 'Shure',              emoji: '🎤', count: 198  },
  { name: 'Sennheiser',         emoji: '🎧', count: 176  },
  { name: 'Boss',               emoji: '🎛️', count: 156  },
  { name: 'Marshall',           emoji: '🔊', count: 142  },
  { name: 'PRS',                emoji: '🎸', count: 118  },
  { name: 'Gretsch',            emoji: '🎸', count: 94   },
  { name: 'AKG',                emoji: '🎤', count: 88   },
  { name: 'Behringer',          emoji: '🎛️', count: 284  },
  { name: 'Casio',              emoji: '🎹', count: 176  },
  { name: 'Moog',               emoji: '🎛️', count: 62   },
  { name: 'Native Instruments', emoji: '💻', count: 94   },
  { name: 'Pioneer DJ',         emoji: '🎧', count: 78   },
  { name: 'Focusrite',          emoji: '🎙️', count: 112  },
  { name: 'Universal Audio',    emoji: '🎙️', count: 68   },
  { name: 'API',                emoji: '🎛️', count: 42   },
  { name: 'SSL',                emoji: '🎛️', count: 38   },
  { name: 'Neumann',            emoji: '🎤', count: 56   },
  { name: 'DPA',                emoji: '🎤', count: 34   },
  { name: 'Line 6',             emoji: '🎸', count: 86   },
  { name: 'Kemper',             emoji: '🔊', count: 44   },
];

export const NEWS_ITEMS: NewsItem[] = [
  {
    cat: 'PRODUCTO', emoji: '🎸',
    title: 'Fender lanza la nueva American Vintage II Telecaster 1951: la Tele más auténtica jamás fabricada',
    date: '7 mayo 2025', slug: 'fender-avii-telecaster-1951'
  },
  {
    cat: 'GUÍA', emoji: '📖',
    title: 'Guía completa para elegir tu primera guitarra eléctrica: tipos, marcas y presupuesto recomendado',
    date: '5 mayo 2025', slug: 'guia-primera-guitarra-electrica'
  },
  {
    cat: 'NOTICIA', emoji: '🎵',
    title: 'Gibson anuncia colaboración con Slash para nueva línea Les Paul Standard Anaconda Burst Limited Edition',
    date: '3 mayo 2025', slug: 'gibson-slash-anaconda-burst'
  },
  {
    cat: 'TECNOLOGÍA', emoji: '💻',
    title: 'Roland presenta el Jupiter-X2: sintetizador que emula 8 máquinas clásicas simultáneamente con motor ZEN-Core',
    date: '2 mayo 2025', slug: 'roland-jupiter-x2'
  },
  {
    cat: 'EVENTO', emoji: '📅',
    title: 'Music Live Madrid 2025: los mejores stands y novedades presentadas en el salón internacional de la música',
    date: '30 abr 2025', slug: 'music-live-madrid-2025'
  },
  {
    cat: 'GUÍA', emoji: '🎧',
    title: 'Los 10 mejores micrófonos dinámicos para grabar guitarras en estudio y en directo — comparativa completa 2025',
    date: '28 abr 2025', slug: 'mejores-microfonos-dinamicos-guitarra-2025'
  },
];
