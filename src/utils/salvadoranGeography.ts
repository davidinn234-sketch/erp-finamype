// Estructura oficial de Departamentos y Municipios/Distritos de El Salvador

export interface DepartmentInfo {
  name: string;
  code: string;
  municipalities: string[];
}

export const SALVADORAN_DEPARTMENTS: DepartmentInfo[] = [
  {
    name: 'San Salvador',
    code: 'SS',
    municipalities: [
      'San Salvador Centro (San Salvador, Mejicanos, Ayutuxtepeque, Cuscatancingo, Ciudad Delgado)',
      'San Salvador Este (Soyapango, Ilopango, San Martín, Tonacatepeque)',
      'San Salvador Oeste (Apopa, Nejapa)',
      'San Salvador Sur (San Marcos, Panchimalco, Santo Tomás, Santiago Texacuangos, Rosario de Mora)',
      'San Salvador Norte (Aguilares, El Paisnal, Guazapa)',
    ],
  },
  {
    name: 'La Libertad',
    code: 'LL',
    municipalities: [
      'La Libertad Centro (Santa Tecla, Antiguo Cuscatlán)',
      'La Libertad Sur (Zaragoza, San José Villanueva, Nuevo Cuscatlán, Huizúcar)',
      'La Libertad Costa (La Libertad, Tamanique, Chiltiupán, Jicalapa, Teotepeque)',
      'La Libertad Este (San Juan Opico, Ciudad Arce)',
      'La Libertad Norte (Quezaltepeque, San Matías, San Pablo Tacachico)',
      'La Libertad Oeste (Colón, Jayaque, Sacacoyo, Tepecoyo, Talnique)',
    ],
  },
  {
    name: 'Santa Ana',
    code: 'SA',
    municipalities: [
      'Santa Ana Centro (Santa Ana)',
      'Santa Ana Este (Coatepeque, El Congo)',
      'Santa Ana Norte (Metapán, Masahuat, Santa Rosa Guachipilín, Texistepeque)',
      'Santa Ana Oeste (Chalchuapa, Candelaria de la Frontera, El Porvenir, San Antonio Pajonal, San Sebastián Salitrillo, Santiago de la Frontera)',
    ],
  },
  {
    name: 'San Miguel',
    code: 'SM',
    municipalities: [
      'San Miguel Centro (San Miguel, Comacarán, Ullazapa)',
      'San Miguel Este (Chinameca, Nueva Guadalupe, San Rafael Oriente, San Jorge, El Tránsito)',
      'San Miguel Norte (Ciudad Barrios, Sesori, Carolina, Chapeltique, Nuevo Edén de San Juan, San Antonio, San Gerardo, San Luis de la Reina)',
      'San Miguel Oeste (Moncagua, Quelepa, Chirilagua)',
    ],
  },
  {
    name: 'Sonsonate',
    code: 'SO',
    municipalities: [
      'Sonsonate Centro (Sonsonate, Sonzacate, Nahulingo, San Antonio del Monte)',
      'Sonsonate Este (Izalco, Armenia, Caluco, Cuisnahuat, Santa Isabel Ishuatán, Santo Domingo de Guzmán)',
      'Sonsonate Norte (Juayúa, Nahuizalco, Salcoatitán, Santa Catarina Masahuat)',
      'Sonsonate Oeste (Acajutla)',
    ],
  },
  {
    name: 'Usulután',
    code: 'US',
    municipalities: [
      'Usulután Este (Usulután, Jucuarán, Ozatlán, Tecapán, Ereguayquín, Santa Elena)',
      'Usulután Norte (Santiago de María, Alegría, Berlín, California, El Triunfo, Estanzuelas, Jucuapa, Mercedes Umaña, Nueva Granada, San Agustín, San Buenaventura)',
      'Usulután Oeste (Jiquilisco, Puerto El Triunfo, San Dionisio, Concepción Batres)',
    ],
  },
  {
    name: 'Ahuachapán',
    code: 'AH',
    municipalities: [
      'Ahuachapán Centro (Ahuachapán)',
      'Ahuachapán Norte (Atiquizaya, El Refugio, San Lorenzo, Turín)',
      'Ahuachapán Sur (Apaneca, Concepción de Ataco, Guaymango, Jujutla, San Francisco Menéndez, San Pedro Puxtla, Tacuba)',
    ],
  },
  {
    name: 'La Paz',
    code: 'LP',
    municipalities: [
      'La Paz Centro (Zacatecoluca, San Luis La Herradura, San Juan Nonualco)',
      'La Paz Este (San Rafael Obrajuelo, San Juan Talpa, San Pedro Nonualco, Santa María Ostuma, Mercedes La Ceiba, Jerusalem)',
      'La Paz Oeste (Olocuilta, San Juan Tepezontes, San Antonio Masahuat, Cuyultitán, Tapalhuaca, San Pedro Masahuat, San Luis Talpa, San Francisco Chinameca)',
    ],
  },
  {
    name: 'Cabañas',
    code: 'CA',
    municipalities: [
      'Cabañas Este (Sensuntepeque, Guacotecti, San Isidro, Victoria, Dolores)',
      'Cabañas Oeste (Ilobasco, Cinquera, Jutiapa, Tejutepeque)',
    ],
  },
  {
    name: 'Chalatenango',
    code: 'CH',
    municipalities: [
      'Chalatenango Centro (Chalatenango, Agua Caliente, Dulce Nombre de María, El Paraíso, La Reina, Nueva Concepción, San Fernando, San Francisco Morazán, San Rafael, Santa Rita)',
      'Chalatenango Norte (La Palma, San Ignacio, Citalá)',
      'Chalatenango Sur (Arcatao, Azacualpa, Cancasque, Comalapa, Concepción Quezaltepeque, El Carrizal, La Laguna, Las Vueltas, Nombre de Jesús, Nueva Trinidad, Ojos de Agua, Potonico, San Antonio de la Cruz, San Antonio Los Ranchos, San Francisco Lempa, San Isidro Labrador, San José Cancasque, San José Las Flores, San Luis del Carmen, San Miguel de Mercedes, San Sebastián El Chingo)',
    ],
  },
  {
    name: 'Cuscatlán',
    code: 'CU',
    municipalities: [
      'Cuscatlán Norte (Suchitoto, San José Guayabal, Oratorio de Concepción, San Bartolomé Perulapía, San Pedro Perulapán)',
      'Cuscatlán Sur (Cojutepeque, Candelaria, El Carmen, El Rosario, Monte San Juan, San Cristóbal, San Rafael Cedros, San Ramón, Santa Cruz Analquito, Santa Cruz Michapa, Tenancingo)',
    ],
  },
  {
    name: 'Morazán',
    code: 'MO',
    municipalities: [
      'Morazán Norte (Perquín, Arambala, Cacaopera, Corinto, El Rosario, Joateca, Jocoaitique, Meanguera, San Fernando, San Isidro, Torola)',
      'Morazán Sur (San Francisco Gotera, Chilanga, Delicias de Concepción, El Divisadero, Gualococti, Guatajiagua, Jocoro, Osicala, San Carlos, San Simón, Sensembra, Sociedad, Yamabal, Yoloaiquín)',
    ],
  },
  {
    name: 'San Vicente',
    code: 'SV',
    municipalities: [
      'San Vicente Norte (Apastepeque, San Esteban Catarina, San Ildefonso, San Lorenzo, San Sebastián, Santa Clara, Santo Domingo)',
      'San Vicente Sur (San Vicente, Guadalupe, San Cayetano Istepeque, Tecoluca, Tepetitán, Verapaz)',
    ],
  },
  {
    name: 'La Unión',
    code: 'LU',
    municipalities: [
      'La Unión Norte (Anamorós, Bolívar, Concepción de Oriente, El Carmen, El Sauce, Lislique, Nueva Esparta, Pasaquina, Polorós, San Alejo, Yucuaiquín)',
      'La Unión Sur (La Unión, Conchagua, El Tamarindo, Intipucá, Meanguera del Golfo, San José, Yayantique)',
    ],
  },
];

export const getMunicipalitiesForDepartment = (deptName?: string): string[] => {
  if (!deptName) return SALVADORAN_DEPARTMENTS[0].municipalities;
  const dept = SALVADORAN_DEPARTMENTS.find(
    (d) => d.name.toLowerCase() === deptName.toLowerCase()
  );
  return dept ? dept.municipalities : SALVADORAN_DEPARTMENTS[0].municipalities;
};
