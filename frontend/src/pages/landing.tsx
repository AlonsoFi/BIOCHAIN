import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Database, Users } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stellar-primary via-purple-900 to-stellar-secondary">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-3xl font-bold text-white">🧬 BioChain</h1>
          <Link
            to="/login"
            className="px-6 py-2 bg-white text-stellar-primary rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Iniciar Sesión
          </Link>
        </header>

        {/* Hero */}
        <div className="text-center mb-20">
          <h2 className="text-6xl font-bold text-white mb-6">
            Datos Médicos Descentralizados
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Comparte tus datos médicos de forma segura y privada. Los investigadores
            pueden acceder a datasets agregados para avanzar en la medicina.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/user/landing"
              className="px-8 py-3 bg-white text-stellar-primary rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
            >
              Soy Usuario <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/researcher/landing"
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Soy Investigador
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <Shield className="w-12 h-12 mb-4 text-stellar-secondary" />
            <h3 className="text-xl font-semibold mb-2">Confidencialidad</h3>
            <p className="text-gray-200">
              Tus datos se procesan en NVIDIA TEE. Nunca se almacenan PDFs.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <Database className="w-12 h-12 mb-4 text-stellar-secondary" />
            <h3 className="text-xl font-semibold mb-2">Blockchain</h3>
            <p className="text-gray-200">
              Transparencia y trazabilidad usando Stellar + Soroban.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <Users className="w-12 h-12 mb-4 text-stellar-secondary" />
            <h3 className="text-xl font-semibold mb-2">Monetización</h3>
            <p className="text-gray-200">
              Recibe USDC por compartir tus datos. 85% para ti, 15% para BioChain.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

