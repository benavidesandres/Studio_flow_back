import type { Actor, Production, Scene, ShootStatus } from '@/types';
import { isoFromToday } from '@/lib/format';

/* Sample data for demo mode. People and titles are fictional; dates are relative to today. */

export const SAMPLE_ACTORS: Actor[] = [
  { id: 1, name: 'Valeria Ortiz', email: 'valeria@studioflow.demo', characterName: 'Inés' },
  { id: 2, name: 'Tomás Rendón', email: 'tomas@studioflow.demo', characterName: 'Mateo' },
  { id: 3, name: 'Camila Duarte', email: 'camila@studioflow.demo', characterName: 'Dra. Salas' },
  { id: 4, name: 'Andrés Vélez', email: 'andres@studioflow.demo', characterName: 'Ruiz' },
  { id: 5, name: 'Noa Herrera', email: 'noa@studioflow.demo', characterName: 'Lucía' },
  { id: 6, name: 'Julián Prieto', email: 'julian@studioflow.demo', characterName: 'El Capitán' },
];

const STUDIO = 'Estudio 4 · Set del hangar';
const ROOFTOP = 'Azotea Torre Norte';
const PORT = 'Puerto Viejo · Muelle 7';
const HOUSE = 'Casa Aranda';
const TUNNEL = 'Túnel de servicio';
const LIGHTHOUSE = 'Faro de Punta Gris';
const VILLAGE = 'Caleta San Roque';
const WAREHOUSE = 'Bodega 12 · Zona industrial';
const CLUB = 'Club Terciopelo';

type Row = [string, string, string, number, string, string, number, ShootStatus, number[], string?];

const PROJECT_X: Row[] = [
  ['11', 'Llegada al hangar', STUDIO, -9, '08:00', '11:00', 2100, 'COMPLETED', [1, 2]],
  ['12', 'La llamada anónima', HOUSE, -9, '14:00', '16:00', 1800, 'COMPLETED', [1]],
  ['13', 'Registro del despacho', HOUSE, -8, '09:00', '13:00', 2600, 'COMPLETED', [1, 3]],
  ['14', 'Reunión en la azotea', ROOFTOP, -7, '17:00', '20:00', 2400, 'COMPLETED', [2, 4]],
  ['15', 'El informe forense', STUDIO, -6, '09:00', '11:30', 1900, 'COMPLETED', [3]],
  ['16', 'Persecución por el túnel', TUNNEL, -6, '20:00', '23:30', 3200, 'COMPLETED', [1, 4, 6]],
  ['17', 'Interrogatorio', STUDIO, -5, '10:00', '13:00', 2200, 'COMPLETED', [2, 6]],
  ['18', 'El muelle de noche', PORT, -4, '19:00', '23:00', 2800, 'COMPLETED', [1, 5]],
  ['19', 'Desayuno con Lucía', HOUSE, -3, '08:00', '10:30', 2000, 'COMPLETED', [5, 2]],
  ['20', 'Sabotaje en el hangar', STUDIO, -3, '13:00', '17:00', 2700, 'COMPLETED', [4, 6]],
  ['21', 'La carta', HOUSE, -2, '09:00', '11:00', 1900, 'COMPLETED', [1, 3]],
  ['22', 'Emboscada en el túnel', TUNNEL, -2, '18:00', '21:30', 2500, 'COMPLETED', [2, 4]],
  ['23', 'Confesión', STUDIO, -1, '10:00', '13:30', 2400, 'COMPLETED', [1, 2, 3]],
  ['24', 'El hangar vacío', STUDIO, 0, '08:00', '11:15', 2200, 'READY', [1, 2], 'Humo denso en cabina. Lentes anamórficos reservados.'],
  ['25', 'Encuentro en la azotea', ROOFTOP, 0, '11:30', '14:30', 2600, 'DELAYED', [1, 4], 'La grúa llega con retraso; revisar plano de apertura.'],
  ['26', 'Entrega en el muelle', PORT, 0, '15:00', '18:00', 3100, 'PROBLEM', [2, 5], 'Permiso portuario sin confirmar. Sin él no se puede rodar en el muelle.'],
  ['27', 'La discusión', HOUSE, 1, '09:00', '12:00', 2000, 'READY', [3, 4]],
  ['28', 'Última llamada', PORT, 1, '11:00', '13:00', 2100, 'READY', [3, 5], 'Doble de riesgo en espera.'],
];

const LAST_LIGHT: Row[] = [
  ['1', 'Amanecer en el faro', LIGHTHOUSE, -3, '05:30', '08:00', 900, 'COMPLETED', [6]],
  ['2', 'Entrevista al farero', LIGHTHOUSE, -3, '10:00', '13:00', 700, 'COMPLETED', [6, 3]],
  ['3', 'Las redes de la caleta', VILLAGE, 2, '06:00', '09:00', 850, 'READY', [3]],
  ['4', 'Tormenta en la costa', LIGHTHOUSE, 4, '16:00', '19:00', 1400, 'DELAYED', [6], 'Depende de la previsión meteorológica.'],
  ['5', 'Voces del pueblo', VILLAGE, 5, '10:00', '14:00', 800, 'READY', [3, 5]],
];

const VELVET: Row[] = [
  ['A', 'Plano secuencia inicial', CLUB, -1, '21:00', '23:30', 4200, 'COMPLETED', [5]],
  ['B', 'Coreografía central', WAREHOUSE, 3, '12:00', '17:00', 6800, 'READY', [5, 4]],
  ['C', 'Inserts de vestuario', WAREHOUSE, 3, '18:00', '20:00', 2300, 'READY', [5]],
];

const toScenes = (rows: Row[], productionId: number, firstId: number): Scene[] =>
  rows.map(([sceneNumber, title, location, offset, startTime, endTime, cost, status, actorIds, notes], index) => ({
    id: firstId + index,
    productionId,
    sceneNumber,
    title,
    location,
    shootDate: isoFromToday(offset),
    startTime,
    endTime,
    cost,
    status,
    actorIds,
    notes,
  }));

export const buildSampleData = (): { productions: Production[]; scenes: Scene[] } => ({
  productions: [
    {
      id: 1,
      title: 'Project X',
      description: 'Thriller de investigación rodado entre estudio y exteriores nocturnos en la ciudad portuaria.',
      startDate: isoFromToday(-9),
      endDate: isoFromToday(12),
      totalBudget: 59000,
      spentBudget: 0,
      progressPercentage: 0,
      totalScenes: 0,
      completedScenes: 0,
      status: 'FILMING',
      directorName: 'Marina Salcedo',
    },
    {
      id: 2,
      title: 'La última luz',
      description: 'Documental sobre los últimos fareros de la costa y las comunidades que dependen de ellos.',
      startDate: isoFromToday(-3),
      endDate: isoFromToday(30),
      totalBudget: 12500,
      spentBudget: 0,
      progressPercentage: 0,
      totalScenes: 0,
      completedScenes: 0,
      status: 'FILMING',
      directorName: 'Elías Arango',
    },
    {
      id: 3,
      title: 'Terciopelo',
      description: 'Videoclip con coreografía en plano secuencia y vestuario práctico.',
      startDate: isoFromToday(-1),
      endDate: isoFromToday(6),
      totalBudget: 14000,
      spentBudget: 0,
      progressPercentage: 0,
      totalScenes: 0,
      completedScenes: 0,
      status: 'PRE_PRODUCTION',
      directorName: 'Sara Quiroga',
    },
  ],
  scenes: [...toScenes(PROJECT_X, 1, 101), ...toScenes(LAST_LIGHT, 2, 201), ...toScenes(VELVET, 3, 301)],
});
