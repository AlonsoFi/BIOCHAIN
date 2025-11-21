/**
 * Dataset Aggregator Service
 * Agrupa StudyRecords en datasets vendibles
 * 
 * En producción, usaría PostgreSQL para:
 * - study_records: estudios individuales
 * - datasets: datasets agregados
 * - dataset_studies: relación many-to-many
 */

// Mock storage en memoria
const datasets: Map<string, any> = new Map()
const studyRecords: Map<string, any> = new Map()

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

createDataset(
  ['study6'],
  'Mujer, 25 años, SOP diagnosticado',
  'Dataset de persona con Síndrome de Ovario Poliquístico',
  150
)

