/**
 * Dataset Aggregator Service
 * Agrupa StudyRecords en datasets vendibles
 * 
 * En producción, usaría PostgreSQL para:
 * - study_records: estudios individuales
 * - datasets: datasets agregados
 * - dataset_studies: relación many-to-many
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '../../data')
const DATASETS_FILE = path.join(DATA_DIR, 'datasets.json')
const STUDIES_FILE = path.join(DATA_DIR, 'studies.json')

// Asegurar que el directorio existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Cargar datos desde archivo o crear Map vacío
const loadData = (filePath: string): Map<string, any> => {
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      return new Map(Object.entries(data))
    }
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error)
  }
  return new Map()
}

// Guardar datos a archivo
const saveData = (data: Map<string, any>, filePath: string) => {
  try {
    const obj = Object.fromEntries(data)
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf-8')
  } catch (error) {
    console.error(`Error saving data to ${filePath}:`, error)
  }
}

// Storage con persistencia en archivo
const datasets: Map<string, any> = loadData(DATASETS_FILE)
const studyRecords: Map<string, any> = loadData(STUDIES_FILE)

// Guardar automáticamente cada 5 segundos (debounce)
let datasetsSaveTimeout: NodeJS.Timeout | null = null
let studiesSaveTimeout: NodeJS.Timeout | null = null

const scheduleDatasetsSave = () => {
  if (datasetsSaveTimeout) clearTimeout(datasetsSaveTimeout)
  datasetsSaveTimeout = setTimeout(() => {
    saveData(datasets, DATASETS_FILE)
  }, 5000)
}

const scheduleStudiesSave = () => {
  if (studiesSaveTimeout) clearTimeout(studiesSaveTimeout)
  studiesSaveTimeout = setTimeout(() => {
    saveData(studyRecords, STUDIES_FILE)
  }, 5000)
}

export interface Dataset {
  id: string
  name: string
  description: string
  price: number
  studyCount: number
  studyIds: string[]
  metadata: {
    ageRange: string
    condition: string
    population: string
  }
  tags: string[]
  createdAt: string
}

/**
 * Crea un dataset agregado
 */
export const createDataset = (
  studyIds: string[],
  name: string,
  description: string,
  price: number
): Dataset => {
  const dataset: Dataset = {
    id: `dataset_${Date.now()}`,
    name,
    description,
    price,
    studyCount: studyIds.length,
    studyIds,
    metadata: {
      ageRange: '25-30',
      condition: 'Diabetes Type 2',
      population: 'Hispanic',
    },
    tags: ['diabetes', 'type-2'],
    createdAt: new Date().toISOString(),
  }

  datasets.set(dataset.id, dataset)
  scheduleDatasetsSave()
  return dataset
}

/**
 * Obtiene todos los datasets
 */
export const getAllDatasets = (): Dataset[] => {
  const allDatasets = Array.from(datasets.values())
  // Enriquecer con metadata más detallada para demo
  return allDatasets.map((ds) => ({
    ...ds,
    tags: ds.tags || ['diabetes', 'type-2'],
    metadata: {
      ageRange: '25-30',
      condition: ds.name.includes('SOP') ? 'SOP' : ds.name.includes('sin anticonceptivos') ? 'Grupo control' : 'Anticonceptivos hormonales',
      population: 'Hispana/Latina',
    },
  }))
}

/**
 * Obtiene un dataset por ID
 */
export const getDataset = (datasetId: string): Dataset | null => {
  return datasets.get(datasetId) || null
}

/**
 * Registra un estudio
 */
export const registerStudy = (studyId: string, data: any) => {
  studyRecords.set(studyId, {
    ...data,
    createdAt: new Date().toISOString(),
  })
  scheduleStudiesSave()
}

/**
 * Obtiene estudios de un dataset
 */
export const getDatasetStudies = (datasetId: string): any[] => {
  const dataset = datasets.get(datasetId)
  if (!dataset) return []

  return dataset.studyIds.map((studyId) => studyRecords.get(studyId)).filter(Boolean)
}

// Datos de demo - Datasets realistas
createDataset(
  ['study1', 'study2', 'study3'],
  'Mujer, 28 años, anticonceptivos 3 años',
  'Dataset de persona fértil usando anticonceptivos hormonales',
  120
)

createDataset(
  ['study4', 'study5'],
  'Mujer, 32 años, sin anticonceptivos',
  'Dataset de grupo control sin uso de anticonceptivos',
  95
)

// Guardar datos al cerrar el proceso
process.on('SIGINT', () => {
  saveData(datasets, DATASETS_FILE)
  saveData(studyRecords, STUDIES_FILE)
  process.exit(0)
})

process.on('SIGTERM', () => {
  saveData(datasets, DATASETS_FILE)
  saveData(studyRecords, STUDIES_FILE)
  process.exit(0)
})

// Inicializar datos de demo solo si no existen
if (datasets.size === 0) {
  createDataset(
    ['study1', 'study2', 'study3'],
    'Mujer, 28 años, anticonceptivos 3 años',
    'Dataset de persona fértil usando anticonceptivos hormonales',
    120
  )

  createDataset(
    ['study4', 'study5'],
    'Mujer, 32 años, sin anticonceptivos',
    'Dataset de grupo control sin uso de anticonceptivos',
    95
  )

  createDataset(
    ['study6'],
    'Mujer, 25 años, SOP diagnosticado',
    'Dataset de persona con Síndrome de Ovario Poliquístico',
    150
  )
}

