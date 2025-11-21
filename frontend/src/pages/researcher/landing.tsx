import { Link } from 'react-router-dom'
import { ArrowRight, Search, Database, Shield, TrendingUp } from 'lucide-react'

/**
 * Landing Page específica para Investigadores
 * Según diagrama: "Investigador Landing Page" → "Clicks 'Acceder a datasets'"
 */
export default function ResearcherLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7B6BA8] via-purple-900 to-[#5D4A7E]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-3xl font-bold text-white">🧬 BioChain</h1>
          <Link
            to="/login"
            className="px-6 py-2 bg-white text-[#7B6BA8] rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Iniciar Sesión
          </Link>
        </header>

        {/* Hero */}
        <div className="text-center mb-20">
          <h2 className="text-6xl font-bold text-white mb-6">
            Accedé a datasets médicos para investigación
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Datasets agregados y anonimizados de estudios médicos reales.
            Datos verificados con Zero-Knowledge Proofs y procesados en NVIDIA TEE.
          </p>
          <Link
            to="/login?type=researcher"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#7B6BA8] rounded-xl font-bold hover:bg-gray-100 transition shadow-lg text-lg"
          >
            Acceder a datasets <ArrowRight className="w-6 h-6" />
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <Search className="w-12 h-12 mb-4 text-white" />
            <h3 className="text-xl font-semibold mb-2">Datasets Verificados</h3>
            <p className="text-gray-200">
              Todos los datasets están verificados con ZK Proofs. Sabés que los datos son válidos sin ver el contenido original.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <Shield className="w-12 h-12 mb-4 text-white" />
            <h3 className="text-xl font-semibold mb-2">100% Anonimizado</h3>
            <p className="text-gray-200">
              Sin PII (Personally Identifiable Information). Solo metadata agregada y biomarkers extraídos.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <Database className="w-12 h-12 mb-4 text-white" />
            <h3 className="text-xl font-semibold mb-2">Fácil de usar</h3>
            <p className="text-gray-200">
              Compra con fiat (Mercado Pago, transferencia) o USDC directo. Pago automático vía SEP-0024.
            </p>
          </div>
        </div>

        {/* Info about datasets */}
        <div className="mt-20 bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">Sobre los datasets</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                ¿Qué incluyen?
              </h4>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>• Biomarkers extraídos de estudios de laboratorio</li>
                <li>• Metadata demográfica agregada (edad rango, población)</li>
                <li>• Condiciones médicas (sin PII)</li>
                <li>• Información de hospital/laboratorio (anonimizada)</li>
                <li>• Zero-Knowledge Proofs de validez</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                ¿Cómo se procesan?
              </h4>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>• PDFs procesados en NVIDIA CVM (TEE)</li>
                <li>• Extracción automática de biomarkers</li>
                <li>• Detección de hospital/laboratorio</li>
                <li>• Eliminación de PII</li>
                <li>• Validación de autenticidad</li>
                <li>• Registro en blockchain (Soroban)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

