import { Player } from '../types';

// Real top players info to bootstrap highly authentic data
const REAL_MALES = [
  { first: "Arturo", last: "Coello", city: "Valladolid, España", points: 14200, country: "España" },
  { first: "Agustín", last: "Tapia", city: "Catamarca, Argentina", points: 13950, country: "Argentina" },
  { first: "Alejandro", last: "Galán", city: "Madrid, España", points: 13100, country: "España" },
  { first: "Federico", last: "Chingotto", city: "Olavarría, Argentina", points: 10450, country: "Argentina" },
  { first: "Martín", last: "Di Nenno", city: "Ezeiza, Argentina", points: 9500, country: "Argentina" },
  { first: "Franco", last: "Stupaczuk", city: "Chaco, Argentina", points: 9200, country: "Argentina" },
  { first: "Juan", last: "Lebrón", city: "Cádiz, España", points: 8900, country: "España" },
  { first: "Francisco (Paquito)", last: "Navarro", city: "Sevilla, España", points: 8100, country: "España" },
  { first: "Javier", last: "Garrido", city: "Córdoba, España", points: 6400, country: "España" },
  { first: "Miguel", last: "Yanguas", city: "Málaga, España", points: 6150, country: "España" },
  { first: "Jerónimo (Momo)", last: "González", city: "Antequera, España", points: 5800, country: "España" },
  { first: "Jon", last: "Sanz", city: "Pamplona, España", points: 5550, country: "España" },
  { first: "Jorge (Coki)", last: "Nieto", city: "Madrid, España", points: 5300, country: "España" },
  { first: "Alejandro", last: "Ruiz", city: "Málaga, España", points: 4950, country: "España" },
  { first: "Fernando", last: "Belasteguín", city: "Pehuajó, Argentina", points: 4600, country: "Argentina" },
  { first: "Carlos Daniel (Sanyo)", last: "Gutiérrez", city: "San Luis, Argentina", points: 4400, country: "Argentina" },
  { first: "Juan", last: "Tello", city: "Córdoba, Argentina", points: 4100, country: "Argentina" },
  { first: "Luciano (Lucho)", last: "Capra", city: "Quilmes, Argentina", points: 3800, country: "Argentina" },
  { first: "Lucas", last: "Campagnolo", city: "Alegrete, Brasil", points: 3600, country: "Brasil" },
  { first: "Maximiliano", last: "Sánchez", city: "Villa Mercedes, Argentina", points: 3450, country: "Argentina" },
  { first: "Gonzalo", last: "Rubio", city: "Sevilla, España", points: 3200, country: "España" },
  { first: "Álex", last: "Arroyo", city: "Valencia, España", points: 3050, country: "España" },
  { first: "Eduardo", last: "Alonso", city: "Valencia, España", points: 2900, country: "España" },
  { first: "José Antonio", last: "García Diestro", city: "Badajoz, España", points: 2800, country: "España" },
  { first: "Javier", last: "Leal", city: "Cádiz, España", points: 2700, country: "España" },
  { first: "Javier", last: "Rico", city: "Valencia, España", points: 2550, country: "España" },
  { first: "Teodoro (Teo)", last: "Zapata", city: "Badajoz, España", points: 2450, country: "España" },
  { first: "Francisco", last: "Guerrero", city: "Málaga, España", points: 2350, country: "España" },
  { first: "Ramiro", last: "Moyano", city: "La Plata, Argentina", points: 2250, country: "Argentina" },
  { first: "Juan Cruz", last: "Belluati", city: "Buenos Aires, Argentina", points: 2150, country: "Argentina" },
  { first: "Antonio (Pincho)", last: "Fernández", city: "Badajoz, España", points: 2050, country: "España" },
  { first: "Lucas", last: "Bergamini", city: "Bento Gonçalves, Brasil", points: 1980, country: "Brasil" },
  { first: "Pablo", last: "Cardona", city: "Mérida, España", points: 1920, country: "España" },
  { first: "Víctor", last: "Ruiz", city: "Cartagena, España", points: 1850, country: "España" },
  { first: "José", last: "Solano", city: "Málaga, España", points: 1780, country: "España" },
  { first: "Javier", last: "Barahona", city: "Madrid, España", points: 1710, country: "España" },
  { first: "Iván", last: "Ramírez", city: "Madrid, España", points: 1650, country: "España" },
  { first: "Jaime", last: "Muñoz", city: "Madrid, España", points: 1590, country: "España" },
  { first: "Mario", last: "Del Castillo", city: "Sevilla, España", points: 1530, country: "España" },
  { first: "Denis", last: "Perino", city: "Córdoba, Argentina", points: 1480, country: "Argentina" }
];

const REAL_FEMALES = [
  { first: "Ariana", last: "Sánchez", city: "Reus, España", points: 14500, country: "España" },
  { first: "Paula", last: "Josemaría", city: "Cáceres, España", points: 14500, country: "España" },
  { first: "Gemma", last: "Triay", city: "Menorca, España", points: 11200, country: "España" },
  { first: "Claudia", last: "Fernández", city: "Madrid, España", points: 10800, country: "España" },
  { first: "Delfina", last: "Brea", city: "Buenos Aires, Argentina", points: 9905, country: "Argentina" },
  { first: "Beatriz", last: "González", city: "Málaga, España", points: 9400, country: "España" },
  { first: "Marta", last: "Ortega", city: "Madrid, España", points: 8100, country: "España" },
  { first: "Sofia", last: "Araújo", city: "Lisboa, Portugal", points: 7600, country: "Portugal" },
  { first: "Jessica", last: "Castelló", city: "Alicante, España", points: 6400, country: "España" },
  { first: "Alejandra", last: "Salazar", city: "Madrid, España", points: 6100, country: "España" },
  { first: "Aranza", last: "Osoro", city: "Paraná, Argentina", points: 5100, country: "Argentina" },
  { first: "Patricia (Patty)", last: "Llaguno", city: "Cartagena, España", points: 4950, country: "España" },
  { first: "Virginia", last: "Riera", city: "Resistencia, Argentina", points: 4600, country: "Argentina" },
  { first: "Tamara", last: "Icardo", city: "Valencia, España", points: 4300, country: "España" },
  { first: "Claudia", last: "Jensen", city: "Madrid, España", points: 4100, country: "Argentina" },
  { first: "Lucía", last: "Sainz", city: "Barcelona, España", points: 3900, country: "España" },
  { first: "Verónica", last: "Virseda", city: "Toledo, España", points: 3650, country: "España" },
  { first: "Carmen", last: "Goenaga", city: "Salamanca, España", points: 3380, country: "España" },
  { first: "Andrea", last: "Ustero", city: "Barcelona, España", points: 3200, country: "España" },
  { first: "Alejandra", last: "Alonso", city: "Valladolid, España", points: 3100, country: "España" },
  { first: "Carolina", last: "Orsi", city: "Roma, Italia", points: 2850, country: "Italia" },
  { first: "Lorena", last: "Rufo", city: "Cáceres, España", points: 2600, country: "España" },
  { first: "Claudia", last: "Guinart", city: "Barcelona, España", points: 2450, country: "España" },
  { first: "Marta", last: "Talaván", city: "Madrid, España", points: 2320, country: "España" },
  { first: "Esther", last: "Carnicero", city: "Valladolid, España", points: 2200, country: "España" },
  { first: "Marina", last: "Guinart", city: "Barcelona, España", points: 2100, country: "España" },
  { first: "Carolina", last: "Navarro", city: "Málaga, España", points: 1980, country: "Suecia" },
  { first: "Nuria", last: "Rodríguez", city: "Madrid, España", points: 1850, country: "España" },
  { first: "Melania", last: "Merino", city: "Valladolid, España", points: 1750, country: "España" },
  { first: "Kika", last: "Ruiz", city: "Madrid, España", points: 1680, country: "España" },
  { first: "Araceli", last: "Martínez", city: "Murcia, España", points: 1620, country: "España" },
  { first: "Sofía", last: "Saiz", city: "Mallorca, España", points: 1560, country: "España" },
  { first: "Marta", last: "Barrera", city: "Cádiz, España", points: 1490, country: "España" },
  { first: "Sandra", last: "Bellver", city: "Barcelona, España", points: 1440, country: "España" },
  { first: "Ana Catarina", last: "Nogueira", city: "Oporto, Portugal", points: 1390, country: "Portugal" },
  { first: "Emily", last: "Stellato", city: "Roma, Italia", points: 1340, country: "Italia" },
  { first: "Giulia", last: "Sussarello", city: "Milán, Italia", points: 1290, country: "Italia" },
  { first: "Lea", last: "Godallier", city: "Burdeos, Francia", points: 1240, country: "Francia" },
  { first: "Alix", last: "Collombon", city: "Lyon, Francia", points: 1180, country: "Francia" },
  { first: "Teresa", last: "Navarro", city: "Las Palmas, España", points: 1120, country: "España" }
];

// Seed lists to dynamically expand up to 100 players cleanly
const FIRST_NAMES_MASC = [
  "Gonzalo", "Álvaro", "Pablo", "Diego", "Lucas", "Nicolás", "Valentín", "Mateo", "Enzo", "Maximiliano",
  "Rodrigo", "Tomás", "Santiago", "Manuel", "Julián", "Bautista", "Joaquín", "Felipe", "Gaspar", "Esteban",
  "Ramiro", "Agustín", "Facundo", "Leandro", "Marcos", "Ignacio", "Hernán", "Federico", "Dardo", "Lisandro",
  "Guillermo", "Emilio", "Ángel", "Raúl", "Andrés", "Bruno", "Félix", "Matías", "Ignacio", "Ezequiel"
];

const LAST_NAMES = [
  "Ruiz", "Gómez", "Sánchez", "García", "Fernández", "López", "González", "Martínez", "Pérez", "Rodríguez",
  "Alvarez", "Gutiérrez", "Chaves", "Molina", "Castro", "Ortiz", "Silva", "Delgado", "Mendez", "Torres",
  "Rios", "Vega", "Suarez", "Guerrero", "Rojas", "Cardozo", "Navarro", "Acosta", "Peralta", "Domínguez",
  "Galarza", "Benítez", "Sosa", "Herrera", "Medina", "Luna", "Romero", "Zapata", "Rubio", "Díaz",
  "Campos", "Flores", "Cabrera", "Ortega", "Vargas", "Ramos", "Castillo", "Mano", "Franco", "Quiroga"
];

const FIRST_NAMES_FEM = [
  "Paula", "Marta", "Clara", "Lucía", "Sofía", "Martina", "Daniela", "Elena", "Inés", "Natalia",
  "Carmen", "Victoria", "Beatriz", "Julia", "Camila", "Valentina", "Antonia", "Isabella", "Emma", "Agustina",
  "Florencia", "Catalina", "Delfina", "Lorena", "Virginia", "Estela", "Juliana", "Guadalupe", "Sol", "Milagros",
  "Catalina", "Amparo", "Rocío", "Gabriela", "Mariana", "Luisa", "Cecilia", "Bárbara", "Belén", "Jimena"
];

const LAT_AM_CITIES = [
  { city: "Buenos Aires, Argentina" },
  { city: "Rosario, Argentina" },
  { city: "Córdoba, Argentina" },
  { city: "Mendoza, Argentina" },
  { city: "Santiago, Chile" },
  { city: "Montevideo, Uruguay" },
  { city: "Asunción, Paraguay" },
  { city: "San Pablo, Brasil" },
  { city: "Río de Janeiro, Brasil" },
  { city: "Lima, Perú" },
  { city: "Mar del Plata, Argentina" },
  { city: "Tucumán, Argentina" },
  { city: "Salta, Argentina" },
  { city: "Neuquén, Argentina" },
  { city: "Santa Fe, Argentina" }
];

const SPAIN_CITIES = [
  { city: "Madrid, España" },
  { city: "Barcelona, España" },
  { city: "Málaga, España" },
  { city: "Sevilla, España" },
  { city: "Valencia, España" },
  { city: "Bilbao, España" },
  { city: "Zaragoza, España" },
  { city: "Alicante, España" },
  { city: "Vigo, España" },
  { city: "Valladolid, España" },
  { city: "Córdoba, España" },
  { city: "Cádiz, España" },
  { city: "Murcia, España" },
  { city: "Palma de Mallorca, España" },
  { city: "Granada, España" }
];

// Helper to generate unique photourls with dicebear or stable beautiful unspash profiles
const getUnsplashAvatarUrlByGender = (gender: "m" | "f", idx: number): string => {
  const maleSeeds = [
    "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1504257404764-b2b1d355ef4e?auto=format&fit=crop&q=80&w=200"
  ];

  const femaleSeeds = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1506919258185-6078bba55d2a?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=200"
  ];

  const seeds = gender === "m" ? maleSeeds : femaleSeeds;
  return seeds[idx % seeds.length];
};

export const getFIPTop100Males = (): Player[] => {
  const result: Player[] = [];
  const totalSlots = 100;

  // Add the real ones first
  for (let i = 0; i < REAL_MALES.length && i < totalSlots; i++) {
    const rm = REAL_MALES[i];
    const rank = i + 1;
    
    // Distribute perfectly among the 5 masculine categories: Libre, 4ta, 5ta, 6ta, 7ma
    // Libre Masculina: Rank 1-20
    // 4ta Masculina: Rank 21-40
    // 5ta Masculina: Rank 41-60
    // 6ta Masculina: Rank 61-80
    // 7ma Masculina: Rank 81-100
    let category = "Libre Masculina";
    if (rank > 20 && rank <= 40) category = "4ta Masculina";
    else if (rank > 40 && rank <= 60) category = "5ta Masculina";
    else if (rank > 60 && rank <= 80) category = "6ta Masculina";
    else if (rank > 80) category = "7ma Masculina";

    const matchesPlayed = 40 + Math.floor(Math.random() * 30);
    // Highest ranked have higher winrates (e.g. 80-92% vs 45-60%)
    const winRate = rank <= 10 ? 0.85 + (Math.random() * 0.08) : rank <= 30 ? 0.70 + (Math.random() * 0.15) : 0.45 + (Math.random() * 0.25);
    const matchesWon = Math.round(matchesPlayed * winRate);
    const matchesLost = matchesPlayed - matchesWon;

    result.push({
      id: `fip_male_${rank}_${rm.first.toLowerCase().replace(/\s+/g, '_')}_${rm.last.toLowerCase().replace(/\s+/g, '_')}`,
      firstName: rm.first,
      lastName: rm.last,
      dni: `${30000000 + rank * 82743}M`,
      phone: `+34 699 100 ${String(rank).padStart(3, '0')}`,
      email: `${rm.first.toLowerCase().split(' ')[0]}.${rm.last.toLowerCase().replace(/\s+/g, '')}@padelfip.com`,
      city: rm.city,
      birthDate: `${1980 + (rank % 25)}-${String(1 + (rank % 11)).padStart(2, '0')}-${String(1 + (rank % 27)).padStart(2, '0')}`,
      category,
      rankingPoints: rm.points,
      photoUrl: getUnsplashAvatarUrlByGender("m", i),
      matchesPlayed,
      matchesWon,
      matchesLost,
      setsWon: matchesWon * 2 + Math.floor(Math.random() * matchesLost),
      setsLost: matchesLost * 2 + Math.floor(Math.random() * matchesWon),
      gamesWon: matchesWon * 12 + Math.floor(Math.random() * matchesLost * 4),
      gamesLost: matchesLost * 12 + Math.floor(Math.random() * matchesWon * 4)
    });
  }

  // Expand dynamically up to 100
  let currentPoints = REAL_MALES[REAL_MALES.length - 1].points;
  for (let rank = REAL_MALES.length + 1; rank <= totalSlots; rank++) {
    currentPoints -= 15 + Math.floor(Math.random() * 10);
    if (currentPoints < 400) currentPoints = 400;

    const fn = FIRST_NAMES_MASC[(rank * 3) % FIRST_NAMES_MASC.length];
    const ln = LAST_NAMES[(rank * 7) % LAST_NAMES.length];
    const ln2 = LAST_NAMES[(rank * 13) % LAST_NAMES.length];
    const location = rank % 2 === 0 
      ? SPAIN_CITIES[rank % SPAIN_CITIES.length] 
      : LAT_AM_CITIES[rank % LAT_AM_CITIES.length];

    let category = "Libre Masculina";
    if (rank > 20 && rank <= 40) category = "4ta Masculina";
    else if (rank > 40 && rank <= 60) category = "5ta Masculina";
    else if (rank > 60 && rank <= 80) category = "6ta Masculina";
    else if (rank > 80) category = "7ma Masculina";

    const matchesPlayed = 15 + Math.floor(Math.random() * 25);
    const winRate = 0.40 + (Math.random() * 0.20);
    const matchesWon = Math.round(matchesPlayed * winRate);
    const matchesLost = matchesPlayed - matchesWon;

    result.push({
      id: `fip_male_${rank}_${fn.toLowerCase()}_${ln.toLowerCase()}`,
      firstName: fn,
      lastName: `${ln} ${ln2}`,
      dni: `${31000000 + rank * 91283}X`,
      phone: `+34 602 441 ${String(rank).padStart(3, '0')}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@padelfip.com`,
      city: location.city,
      birthDate: `${1983 + (rank % 22)}-${String(1 + (rank % 11)).padStart(2, '0')}-${String(1 + (rank % 27)).padStart(2, '0')}`,
      category,
      rankingPoints: currentPoints,
      photoUrl: getUnsplashAvatarUrlByGender("m", rank),
      matchesPlayed,
      matchesWon,
      matchesLost,
      setsWon: matchesWon * 2 + Math.floor(Math.random() * matchesLost),
      setsLost: matchesLost * 2 + Math.floor(Math.random() * matchesWon),
      gamesWon: matchesWon * 12 + Math.floor(Math.random() * matchesLost * 4),
      gamesLost: matchesLost * 12 + Math.floor(Math.random() * matchesWon * 4)
    });
  }

  return result;
};

export const getFIPTop100Females = (): Player[] => {
  const result: Player[] = [];
  const totalSlots = 100;

  // Add the real ones first
  for (let i = 0; i < REAL_FEMALES.length && i < totalSlots; i++) {
    const rf = REAL_FEMALES[i];
    const rank = i + 1;
    
    // Distribute perfectly between the 2 feminine categories: 6ta Femenina, 7ma Femenina
    // 6ta Femenina: Rank 1-50
    // 7ma Femenina: Rank 51-100
    let category = "6ta Femenina";
    if (rank > 50) category = "7ma Femenina";

    const matchesPlayed = 38 + Math.floor(Math.random() * 28);
    // Highest ranked have higher winrates (e.g. 80-92% vs 45-60%)
    const winRate = rank <= 10 ? 0.85 + (Math.random() * 0.08) : rank <= 30 ? 0.70 + (Math.random() * 0.15) : 0.45 + (Math.random() * 0.25);
    const matchesWon = Math.round(matchesPlayed * winRate);
    const matchesLost = matchesPlayed - matchesWon;

    result.push({
      id: `fip_female_${rank}_${rf.first.toLowerCase().replace(/\s+/g, '_')}_${rf.last.toLowerCase().replace(/\s+/g, '_')}`,
      firstName: rf.first,
      lastName: rf.last,
      dni: `${40000000 + rank * 73921}F`,
      phone: `+34 688 200 ${String(rank).padStart(3, '0')}`,
      email: `${rf.first.toLowerCase().split(' ')[0]}.${rf.last.toLowerCase().replace(/\s+/g, '')}@padelfip.com`,
      city: rf.city,
      birthDate: `${1982 + (rank % 23)}-${String(1 + (rank % 11)).padStart(2, '0')}-${String(1 + (rank % 27)).padStart(2, '0')}`,
      category,
      rankingPoints: rf.points,
      photoUrl: getUnsplashAvatarUrlByGender("f", i),
      matchesPlayed,
      matchesWon,
      matchesLost,
      setsWon: matchesWon * 2 + Math.floor(Math.random() * matchesLost),
      setsLost: matchesLost * 2 + Math.floor(Math.random() * matchesWon),
      gamesWon: matchesWon * 12 + Math.floor(Math.random() * matchesLost * 4),
      gamesLost: matchesLost * 12 + Math.floor(Math.random() * matchesWon * 4)
    });
  }

  // Expand dynamically up to 100
  let currentPoints = REAL_FEMALES[REAL_FEMALES.length - 1].points;
  for (let rank = REAL_FEMALES.length + 1; rank <= totalSlots; rank++) {
    currentPoints -= 15 + Math.floor(Math.random() * 10);
    if (currentPoints < 350) currentPoints = 350;

    const fn = FIRST_NAMES_FEM[(rank * 3) % FIRST_NAMES_FEM.length];
    const ln = LAST_NAMES[(rank * 9) % LAST_NAMES.length];
    const ln2 = LAST_NAMES[(rank * 11) % LAST_NAMES.length];
    const location = rank % 2 === 0 
      ? SPAIN_CITIES[rank % SPAIN_CITIES.length] 
      : LAT_AM_CITIES[rank % LAT_AM_CITIES.length];

    let category = "6ta Femenina";
    if (rank > 50) category = "7ma Femenina";

    const matchesPlayed = 12 + Math.floor(Math.random() * 22);
    const winRate = 0.40 + (Math.random() * 0.20);
    const matchesWon = Math.round(matchesPlayed * winRate);
    const matchesLost = matchesPlayed - matchesWon;

    result.push({
      id: `fip_female_${rank}_${fn.toLowerCase()}_${ln.toLowerCase()}`,
      firstName: fn,
      lastName: `${ln} ${ln2}`,
      dni: `${42000000 + rank * 81273}K`,
      phone: `+34 602 552 ${String(rank).padStart(3, '0')}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@padelfip.com`,
      city: location.city,
      birthDate: `${1985 + (rank % 20)}-${String(1 + (rank % 11)).padStart(2, '0')}-${String(1 + (rank % 27)).padStart(2, '0')}`,
      category,
      rankingPoints: currentPoints,
      photoUrl: getUnsplashAvatarUrlByGender("f", rank),
      matchesPlayed,
      matchesWon,
      matchesLost,
      setsWon: matchesWon * 2 + Math.floor(Math.random() * matchesLost),
      setsLost: matchesLost * 2 + Math.floor(Math.random() * matchesWon),
      gamesWon: matchesWon * 12 + Math.floor(Math.random() * matchesLost * 4),
      gamesLost: matchesLost * 12 + Math.floor(Math.random() * matchesWon * 4)
    });
  }

  return result;
};
