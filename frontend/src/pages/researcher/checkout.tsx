import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDataset, purchaseDataset } from '@/lib/api/datasetsApi'
import { purchaseDataset as purchaseOnChain } from '@/lib/stellar/sorobanClient'
import type { Dataset } from '@/lib/api/datasetsApi'
import { useAuthStore } from '@/store/authStore'
import { StellarPaymentButton } from '@/lib/paltalabs/components'

export default function Checkout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { walletAddress } = useAuthStore()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'mp' | 'transfer' | 'crypto'>('mp')
  const [purpose, setPurpose] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (id) {
      loadDataset()
    }
  }, [id])

  const loadDataset = async () => {
    try {
      const data = await getDataset(id!)
      setDataset(data)
    } catch (error) {
      console.error('Error cargando dataset:', error)
    }
  }

  const handlePurchase = async (txHash?: string) => {
    if (!purpose.trim()) {
      alert('Por favor, ingresá el propósito de tu investigación.')
      return
    }

    setProcessing(true)
    try {
      // Según diagrama (Researcher Flow):
      // 1. User selects payment method (transfer / MercadoPago) ✅
      // 2. Anchor processes off-chain payment
      // 3. Anchor converts fiat → USDC on Stellar
      // 4. USDC sent to BioChain Smart Contract
      // 5. Soroban Contract: verifies, registers, splits revenue
      // 6. Investigator receives dataset access token
      
      // 1. Comprar en backend (mock SEP-24 Anchor)
      const result = await purchaseDataset(id!)
      // El backend simula:
      // - Anchor processes off-chain payment
      // - Anchor converts fiat → USDC
      // - USDC sent to BioChain Smart Contract

      // 2. Registrar compra en blockchain (Soroban Contract)
      if (!txHash) {
        await purchaseOnChain(id!)
        // Soroban Contract:
        // - Verifies payment
        // - Registers purchase
        // - Executes revenue split: 85% contributors, 15% BioChain
        // - Sends USDC to contributors
      }

      // 3. Investigator receives dataset access token
      alert(`✅ ¡Pago completado!\n\n• El dataset ya está disponible\n• Access token: ${result.accessToken}\n• El contribuyente recibió $${Math.round(dataset!.price * 0.85)} USDC\n• La transacción quedó registrada en blockchain`)
      navigate('/researcher/dashboard')
    } catch (error) {
      console.error('Error en compra:', error)
      alert('Error al procesar el pago. Intenta de nuevo.')
    } finally {
      setProcessing(false)
    }
  }

  if (!dataset) {
    return <div>Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <button onClick={() => navigate('/researcher/marketplace')} className="text-gray-600 hover:text-[#7B6BA8]">
            Buscar datasets
          </button>
          <span>›</span>
          <button onClick={() => navigate(`/researcher/dataset/${id}`)} className="text-gray-600 hover:text-[#7B6BA8]">
            {dataset.id}
          </button>
          <span>›</span>
          <span className="font-semibold text-gray-900">Checkout</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Info */}
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 mb-6">💰 Tu Wallet</h2>
              <div className="bg-gradient-to-br from-[#FF6B35] to-[#FF8C61] rounded-3xl p-8 text-white text-center mb-6">
                <div className="text-base opacity-90 mb-2">Balance disponible</div>
                <div className="text-5xl font-black mb-6">0 USDC</div>
                <div className="text-sm font-mono opacity-80 mb-4">{walletAddress}</div>
                <button className="w-full px-6 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white font-bold hover:bg-white/30 transition">
                  ➕ Fondear wallet
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Para comprar datasets necesitás tener USDC en tu wallet. Elegí un método de pago para fondear:
              </p>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 mb-6">💳 Método de pago</h2>

              {/* SEP-24 Info - Explícitamente mencionado según diagrama */}
              <div className="bg-[#7B6BA8]/10 p-5 rounded-xl mb-6 border-2 border-[#7B6BA8]">
                <h4 className="text-sm font-bold text-[#7B6BA8] mb-2">⚡ Payment Screen (SEP-0024)</h4>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  <strong>SEP-0024 (Stellar Ecosystem Proposal)</strong>: Tu pago se procesa mediante un Anchor que
                  convierte automáticamente fiat → USDC en Stellar. El Anchor procesa el pago off-chain y luego
                  deposita USDC en tu wallet.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: '💵', text: 'Pagás en pesos' },
                    { icon: '🔄', text: 'Conversión automática' },
                    { icon: '💎', text: 'Se acredita en USDC' },
                  ].map((step, idx) => (
                    <div key={idx} className="text-center p-4 bg-white rounded-xl">
                      <div className="text-2xl mb-2">{step.icon}</div>
                      <div className="text-xs text-gray-600">{step.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Options - Según diagrama: "User selects payment method (transfer / MercadoPago)" */}
              <div className="space-y-4">
                {/* Mercado Pago */}
                <div
                  onClick={() => setPaymentMethod('mp')}
                  className={`p-6 border-2 rounded-2xl cursor-pointer transition ${
                    paymentMethod === 'mp'
                      ? 'border-[#7B6BA8] bg-[#7B6BA8]/5'
                      : 'border-gray-200 hover:border-[#9B8BC5]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'mp' ? 'border-[#7B6BA8]' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'mp' && <div className="w-3 h-3 bg-[#7B6BA8] rounded-full" />}
                    </div>
                    <div className="w-12 h-12 bg-[#009EE3] rounded-xl flex items-center justify-center text-2xl">💙</div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">Mercado Pago</div>
                      <div className="text-sm text-gray-600">Tarjeta de crédito/débito, dinero en cuenta</div>
                    </div>
                    <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] rounded-full text-xs font-semibold">
                      Recomendado
                    </span>
                  </div>
                  {paymentMethod === 'mp' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-4">Serás redirigido a Mercado Pago para completar el pago de forma segura.</p>
                      <div className="bg-[#009EE3] p-6 rounded-xl text-center text-white">
                        <p className="text-sm mb-2">Pago seguro con Mercado Pago</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transferencia */}
                <div
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-6 border-2 rounded-2xl cursor-pointer transition ${
                    paymentMethod === 'transfer'
                      ? 'border-[#7B6BA8] bg-[#7B6BA8]/5'
                      : 'border-gray-200 hover:border-[#9B8BC5]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'transfer' ? 'border-[#7B6BA8]' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'transfer' && <div className="w-3 h-3 bg-[#7B6BA8] rounded-full" />}
                    </div>
                    <div className="w-12 h-12 bg-[#9B8BC5] rounded-xl flex items-center justify-center text-2xl">🏦</div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">Transferencia bancaria</div>
                      <div className="text-sm text-gray-600">CBU/CVU, acreditación en 24-48hs</div>
                    </div>
                  </div>
                  {paymentMethod === 'transfer' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-[#FAFAFA] p-6 rounded-xl space-y-4">
                        {[
                          { label: 'Titular', value: 'BioChain S.A.' },
                          { label: 'CBU', value: '0000003100012345678901' },
                          { label: 'Alias', value: 'BIOCHAIN.ANCHOR' },
                          { label: 'CUIT', value: '30-12345678-9' },
                          { label: 'Referencia', value: 'REF-2025-GCKX3M' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono text-gray-900">{item.value}</code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.value)
                                  alert(`${item.label} copiado al portapapeles`)
                                }}
                                className="px-3 py-1 bg-[#7B6BA8] text-white rounded-lg text-xs font-semibold hover:bg-[#5D4A7E]"
                              >
                                Copiar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Crypto */}
                <div
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-6 border-2 rounded-2xl cursor-pointer transition ${
                    paymentMethod === 'crypto'
                      ? 'border-[#7B6BA8] bg-[#7B6BA8]/5'
                      : 'border-gray-200 hover:border-[#9B8BC5]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'crypto' ? 'border-[#7B6BA8]' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'crypto' && <div className="w-3 h-3 bg-[#7B6BA8] rounded-full" />}
                    </div>
                    <div className="w-12 h-12 bg-[#FF6B35] rounded-xl flex items-center justify-center text-2xl">⛓️</div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">USDC directo</div>
                      <div className="text-sm text-gray-600">Si ya tenés USDC en Stellar</div>
                    </div>
                  </div>
                  {paymentMethod === 'crypto' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-[#FAFAFA] p-6 rounded-xl space-y-4">
                        {[
                          { label: 'Dirección Stellar', value: 'GDQP2KPQG...' },
                          { label: 'Memo', value: 'INV-2025-001' },
                          { label: 'Asset', value: 'USDC (Stellar)' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono text-gray-900">{item.value}</code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.value)
                                  alert(`${item.label} copiado al portapapeles`)
                                }}
                                className="px-3 py-1 bg-[#7B6BA8] text-white rounded-lg text-xs font-semibold hover:bg-[#5D4A7E]"
                              >
                                Copiar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-8 shadow-lg sticky top-8">
              <h3 className="text-xl font-black text-gray-900 mb-6">Resumen de compra</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                  <div>
                    <div className="font-semibold text-gray-900">{dataset.name}</div>
                    <div className="text-xs text-gray-600">Acceso 90 días</div>
                  </div>
                  <div className="font-bold text-gray-900">${dataset.price}</div>
                </div>

                <div className="space-y-2 pb-4 border-b border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${dataset.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Comisión plataforma</span>
                    <span>$0</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                  <span className="font-bold text-gray-900">Total</span>
                  <div>
                    <div className="text-3xl font-black text-[#FF6B35]">${dataset.price}</div>
                    <div className="text-xs text-gray-500 text-right">≈ {dataset.price} USDC</div>
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Propósito de investigación</label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Ej: Estudio sobre efectos de anticonceptivos en salud mental en población latinoamericana"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7B6BA8] resize-none min-h-[80px]"
                />
                <div className="text-xs text-gray-500 mt-2">
                  Este propósito quedará registrado en blockchain para compliance ético.
                </div>
              </div>

              <div className="mb-4">
                <StellarPaymentButton
                  amount={dataset.price}
                  asset="USDC"
                  onPaymentComplete={async (txHash) => {
                    await handlePurchase(txHash)
                  }}
                />
                {processing && (
                  <p className="text-sm text-center text-gray-600 mt-2">Procesando pago...</p>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mb-6">
                <span>🔒</span>
                <span>Pago seguro • Datos encriptados</span>
              </div>

              <div className="pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <span>✅</span>
                  <span className="text-gray-600">85% (${Math.round(dataset.price * 0.85)}) va directo al contribuyente</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>⛓️</span>
                  <span className="text-gray-600">Transacción registrada en Stellar</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>📄</span>
                  <span className="text-gray-600">Recibirás factura por email</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

