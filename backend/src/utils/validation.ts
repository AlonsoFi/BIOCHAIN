/**
 * Validación de schemas con Zod
 * Schemas reutilizables para validar requests
 */

import { z } from 'zod'

// Schema para Historia Clínica
export const HistoriaClinicaSchema = z.object({
  // Paso 1: Datos básicos
  añoNacimiento: z.number().int().min(1900).max(new Date().getFullYear()),
  sexo: z.enum(['masculino', 'femenino', 'otro']),
  país: z.string().min(2).max(100),
  ciudad: z.string().min(2).max(100),
  etnia: z.string().optional(),

  // Paso 2: Salud reproductiva
  usaAnticonceptivos: z.boolean(),
  tipoAnticonceptivo: z.string().optional(),
  marcaAnticonceptivo: z.string().optional(),
  tiempoUsoAnticonceptivo: z.string().optional(),

  // Paso 3: Condiciones médicas
  condicionesMedicas: z.array(z.string()).optional(),
  medicacionActual: z.array(z.string()).optional(),

  // Paso 4: Consentimiento
  consentimiento: z.object({
    firmado: z.boolean(),
    fecha: z.string(),
  }),
})

// Schema para wallet address
export const WalletAddressSchema = z
  .string()
  .regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar wallet address format')

// Schema para dataset ID
export const DatasetIdSchema = z.string().uuid('Invalid dataset ID format')

// Schema para file upload
export const FileUploadSchema = z.object({
  mimetype: z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
})

// Helper para validar request body
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    return schema.parse(data)
  }
}

// Helper para validar headers
export function validateHeader(schema: z.ZodSchema) {
  return (value: string | undefined): string => {
    return schema.parse(value)
  }
}

