import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Database, Users, DollarSign } from 'lucide-react'

/**
 * Landing Page específica para Usuarios (Contribuyentes)
 * Según diagrama: "User Landing Page" → "Clicks 'Empezar a ganar'"
 */
export default function UserLanding() {
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
            Comparte tus datos médicos y gana dinero
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Tus estudios médicos pueden ayudar a avanzar la investigación científica.
            Recibís el 85% de cada venta. Tus datos están protegidos y anonimizados.
          </p>
          <Link
            to="/login?type=contributor"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#FF8C61] transition shadow-lg text-lg"
          >
            Empezar a ganar <ArrowRight className="w-6 h-6" />
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <Shield className="w-12 h-12 mb-4 text-[#FF6B35]" />
            <h3 className="text-xl font-semibold mb-2">100% Privado</h3>
            <p className="text-gray-200">
              Tus PDFs se procesan en NVIDIA TEE. Nunca se almacenan. Solo se extrae información anonimizada.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <DollarSign className="w-12 h-12 mb-4 text-[#FF6B35]" />
            <h3 className="text-xl font-semibold mb-2">Ganá dinero</h3>
            <p className="text-gray-200">
              Recibís el 85% de cada venta. Los investigadores compran acceso a tus datos agregados.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <Database className="w-12 h-12 mb-4 text-[#FF6B35]" />
            <h3 className="text-xl font-semibold mb-2">Blockchain</h3>
            <p className="text-gray-200">
              Tus estudios quedan registrados en Stellar + Soroban. Transparente y trazable.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20 bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">¿Cómo funciona?</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FF6B35] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold mb-2">Completá tu historia clínica</h4>
              <p className="text-sm text-gray-200">Datos básicos, salud reproductiva, condiciones médicas</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FF6B35] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold mb-2">Subí tus estudios</h4>
              <p className="text-sm text-gray-200">PDFs o fotos de análisis de laboratorio</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FF6B35] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold mb-2">Procesamiento seguro</h4>
              <p className="text-sm text-gray-200">NVIDIA CVM extrae biomarkers y elimina PII</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FF6B35] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="font-semibold mb-2">Ganá dinero</h4>
              <p className="text-sm text-gray-200">Investigadores compran acceso, vos recibís USDC</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

