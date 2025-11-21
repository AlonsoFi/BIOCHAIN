import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { saveHistoriaClinica } from '@/lib/api/userApi'
import { ArrowLeft, ArrowRight, Check, Home } from 'lucide-react'
import ProgressSteps from '@/components/ui/ProgressSteps'

type Step = 1 | 2 | 3 | 4

interface HistoriaClinicaData {
  datosBasicos: {
    añoNacimiento: string
    sexoBiologico: string
    pais: string
    ciudad: string
    etnia: string
  }
  saludReproductiva: {
    usaAnticonceptivos: string // 'uso-actual' | 'uso-pasado' | 'nunca'
    tipoAnticonceptivo: string
    marca: string
    tiempoUsoAños: number
    tiempoUsoMeses: number
  }
  condicionesMedicas: {
    ginecologicas: string[]
    metabolicas: string[]
    otras: string[]
    medicacionActual: string
  }
  consentimiento: {
    firmado: boolean
    fecha: string
  }
}

export default function HistoriaClinica() {
  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState<HistoriaClinicaData>({
    datosBasicos: {
      añoNacimiento: '',
      sexoBiologico: '',
      pais: '',
      ciudad: '',
      etnia: '',
    },
    saludReproductiva: {
      usaAnticonceptivos: '',
      tipoAnticonceptivo: '',
      marca: '',
      tiempoUsoAños: 0,
      tiempoUsoMeses: 0,
    },
    condicionesMedicas: {
      ginecologicas: [],
      metabolicas: [],
      otras: [],
      medicacionActual: '',
    },
    consentimiento: {
      firmado: false,
      fecha: '',
    },
  })

  const navigate = useNavigate()

  // Generar años (1980-2006)
  const años = Array.from({ length: 27 }, (_, i) => 2006 - i)

  const handleNext = () => {
    if (step < 4) {
      setStep((step + 1) as Step)
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep((step - 1) as Step)
    }
  }

  const handleSubmit = async () => {
    try {
      // Validar que el consentimiento esté firmado
      if (!formData.consentimiento.firmado) {
        alert('Debes aceptar el consentimiento informado para continuar.')
        return
      }

      // Transformar datos del frontend al formato del backend
      const añoNacimiento = parseInt(formData.datosBasicos.añoNacimiento)
      const añoActual = new Date().getFullYear()
      const edad = añoActual - añoNacimiento

      // Mapear sexo biológico a formato del backend
      // El backend espera: 'masculino' | 'femenino' | 'otro'
      const sexoMap: Record<string, 'masculino' | 'femenino' | 'otro'> = {
        'masculino': 'masculino',
        'femenino': 'femenino',
        'intersex': 'otro',
        'no-decir': 'otro',
      }
      const sexo = sexoMap[formData.datosBasicos.sexoBiologico] || 'otro'

      // Validar campos requeridos
      if (!añoNacimiento || isNaN(añoNacimiento)) {
        alert('Por favor, selecciona tu año de nacimiento.')
        return
      }
      if (!formData.datosBasicos.sexoBiologico) {
        alert('Por favor, selecciona tu sexo biológico.')
        return
      }
      if (!formData.datosBasicos.pais) {
        alert('Por favor, selecciona tu país.')
        return
      }
      if (!formData.datosBasicos.ciudad) {
        alert('Por favor, ingresa tu ciudad.')
        return
      }

      // Convertir usaAnticonceptivos de string a boolean
      // El frontend tiene: 'uso-actual' | 'uso-pasado' | 'nunca'
      // El backend espera: boolean (true si usa o usó, false si nunca)
      const usaAnticonceptivos = formData.saludReproductiva.usaAnticonceptivos !== 'nunca' && formData.saludReproductiva.usaAnticonceptivos !== ''

      // Combinar todas las condiciones médicas en un array
      const todasCondiciones = [
        ...formData.condicionesMedicas.ginecologicas,
        ...formData.condicionesMedicas.metabolicas,
        ...formData.condicionesMedicas.otras,
      ]

      // Formatear medicación actual como array
      const medicacionArray = formData.condicionesMedicas.medicacionActual
        ? formData.condicionesMedicas.medicacionActual.split(',').map(m => m.trim()).filter(m => m)
        : []

      // Construir tiempo de uso de anticonceptivos
      const tiempoUso = formData.saludReproductiva.tiempoUsoAños > 0 || formData.saludReproductiva.tiempoUsoMeses > 0
        ? `${formData.saludReproductiva.tiempoUsoAños} años, ${formData.saludReproductiva.tiempoUsoMeses} meses`
        : ''

      // Datos en formato del backend
      const datosParaBackend = {
        añoNacimiento,
        sexo,
        país: formData.datosBasicos.pais,
        ciudad: formData.datosBasicos.ciudad,
        etnia: formData.datosBasicos.etnia || undefined,
        usaAnticonceptivos,
        tipoAnticonceptivo: formData.saludReproductiva.tipoAnticonceptivo || undefined,
        marcaAnticonceptivo: formData.saludReproductiva.marca || undefined,
        tiempoUsoAnticonceptivo: tiempoUso || undefined,
        condicionesMedicas: todasCondiciones.length > 0 ? todasCondiciones : undefined,
        medicacionActual: medicacionArray.length > 0 ? medicacionArray : undefined,
        consentimiento: {
          firmado: formData.consentimiento.firmado,
          fecha: formData.consentimiento.fecha || new Date().toISOString(),
        },
      }

      await saveHistoriaClinica(datosParaBackend as any)
      navigate('/user/dashboard')
    } catch (error: any) {
      console.error('Error guardando historia clínica:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Error al guardar. Intenta de nuevo.'
      alert(`Error: ${errorMessage}`)
    }
  }

  const toggleCondicion = (categoria: 'ginecologicas' | 'metabolicas' | 'otras', condicion: string) => {
    setFormData((prev) => {
      const current = prev.condicionesMedicas[categoria]
      const newList = current.includes(condicion)
        ? current.filter((c) => c !== condicion)
        : [...current, condicion]
      return {
        ...prev,
        condicionesMedicas: {
          ...prev.condicionesMedicas,
          [categoria]: newList,
        },
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white shadow-sm px-12 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            to="/user/dashboard"
            className="text-gray-600 hover:text-stellar-primary transition flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </Link>
          <div className="text-2xl font-black text-[#7B6BA8]">BioChain</div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-gray-600 hover:text-stellar-primary transition flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            <span>Inicio</span>
          </Link>
          <div className="flex items-center gap-3 px-5 py-3 bg-[#FAFAFA] rounded-full">
            <div className="w-9 h-9 bg-[#FF6B35] rounded-full flex items-center justify-center text-lg">👤</div>
            <span className="text-sm text-gray-600">usuario@email.com</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12">
        {/* Progress Steps */}
        <ProgressSteps
          currentStep={step}
          totalSteps={4}
          steps={[
            { label: 'Datos básicos', number: 1 },
            { label: 'Salud reproductiva', number: 2 },
            { label: 'Condiciones médicas', number: 3 },
            { label: 'Consentimiento', number: 4 },
          ]}
        />

        {/* Card Container */}
        <div className="bg-white rounded-3xl p-12 shadow-lg">
          {/* Step 1: Datos Básicos */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-black text-gray-900 mb-3">📋 Datos básicos</h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Esta información es anónima y ayuda a dar contexto a tus estudios médicos para los investigadores.
                </p>
              </div>

              <div className="bg-[#7B6BA8]/10 border-l-4 border-[#7B6BA8] p-5 rounded-r-xl mb-6">
                <p className="text-sm text-gray-800 leading-relaxed">
                  🔒 Tus datos personales nunca se comparten. Solo se usa información anonimizada para investigación.
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Año de nacimiento</label>
                    <select
                      value={formData.datosBasicos.añoNacimiento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          datosBasicos: { ...formData.datosBasicos, añoNacimiento: e.target.value },
                        })
                      }
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#7B6BA8] transition"
                    >
                      <option value="">Seleccionar...</option>
                      {años.map((año) => (
                        <option key={año} value={año.toString()}>
                          {año}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Sexo biológico</label>
                    <select
                      value={formData.datosBasicos.sexoBiologico}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          datosBasicos: { ...formData.datosBasicos, sexoBiologico: e.target.value },
                        })
                      }
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#7B6BA8] transition"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="femenino">Femenino</option>
                      <option value="masculino">Masculino</option>
                      <option value="intersex">Intersex</option>
                      <option value="no-decir">Prefiero no decir</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">País</label>
                    <select
                      value={formData.datosBasicos.pais}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          datosBasicos: { ...formData.datosBasicos, pais: e.target.value },
                        })
                      }
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#7B6BA8] transition"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="argentina">Argentina</option>
                      <option value="chile">Chile</option>
                      <option value="mexico">México</option>
                      <option value="colombia">Colombia</option>
                      <option value="peru">Perú</option>
                      <option value="uruguay">Uruguay</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Ciudad/Región</label>
                    <input
                      type="text"
                      value={formData.datosBasicos.ciudad}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          datosBasicos: { ...formData.datosBasicos, ciudad: e.target.value },
                        })
                      }
                      placeholder="Ej: Buenos Aires"
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#7B6BA8] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Etnia (opcional)</label>
                  <select
                    value={formData.datosBasicos.etnia}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        datosBasicos: { ...formData.datosBasicos, etnia: e.target.value },
                      })
                    }
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#7B6BA8] transition"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="hispana">Hispana/Latina</option>
                    <option value="caucasica">Caucásica</option>
                    <option value="afrodescendiente">Afrodescendiente</option>
                    <option value="asiatica">Asiática</option>
                    <option value="indigena">Indígena</option>
                    <option value="mestiza">Mestiza</option>
                    <option value="no-decir">Prefiero no decir</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Salud Reproductiva */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-black text-gray-900 mb-3">💊 Salud reproductiva</h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Información sobre tu uso de anticonceptivos y salud reproductiva.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    ¿Usás o usaste anticonceptivos hormonales?
                  </label>
                  <select
                    value={formData.saludReproductiva.usaAnticonceptivos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        saludReproductiva: { ...formData.saludReproductiva, usaAnticonceptivos: e.target.value },
                      })
                    }
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#7B6BA8] transition"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="uso-actual">Sí, actualmente uso</option>
                    <option value="uso-pasado">Sí, usé en el pasado</option>
                    <option value="nunca">No, nunca usé</option>
                  </select>
                </div>

                {formData.saludReproductiva.usaAnticonceptivos !== 'nunca' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Tipo de anticonceptivo</label>
                      <select
                        value={formData.saludReproductiva.tipoAnticonceptivo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            saludReproductiva: { ...formData.saludReproductiva, tipoAnticonceptivo: e.target.value },
                          })
                        }
                        className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#7B6BA8] transition"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="pildora-combinada">Píldora combinada</option>
                        <option value="mini-pildora">Mini-píldora (solo progestina)</option>
                        <option value="diu-hormonal">DIU hormonal</option>
                        <option value="implante">Implante subdérmico</option>
                        <option value="parche">Parche anticonceptivo</option>
                        <option value="anillo">Anillo vaginal</option>
                        <option value="inyeccion">Inyección</option>
                        <option value="no-aplica">No aplica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Marca/nombre comercial (opcional)
                      </label>
                      <input
                        type="text"
                        value={formData.saludReproductiva.marca}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            saludReproductiva: { ...formData.saludReproductiva, marca: e.target.value },
                          })
                        }
                        placeholder="Ej: Yasmin, Mirena, etc."
                        className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#7B6BA8] transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Tiempo de uso (años)</label>
                        <input
                          type="number"
                          value={formData.saludReproductiva.tiempoUsoAños}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              saludReproductiva: {
                                ...formData.saludReproductiva,
                                tiempoUsoAños: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          placeholder="Ej: 3"
                          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#7B6BA8] transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Tiempo de uso (meses)</label>
                        <input
                          type="number"
                          value={formData.saludReproductiva.tiempoUsoMeses}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              saludReproductiva: {
                                ...formData.saludReproductiva,
                                tiempoUsoMeses: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          placeholder="Ej: 6"
                          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#7B6BA8] transition"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Condiciones Médicas */}
          {step === 3 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-black text-gray-900 mb-3">🏥 Condiciones médicas</h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Seleccioná las condiciones que tenés o tuviste. Esto ayuda a contextualizar tus estudios.
                </p>
              </div>

              <div className="space-y-6">
                {/* Condiciones Ginecológicas */}
                <div>
                  <div className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🔴 Condiciones ginecológicas/hormonales
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['SOP (Síndrome de Ovario Poliquístico)', 'Endometriosis', 'Miomas uterinos', 'Amenorrea'].map(
                      (condicion) => (
                        <label
                          key={condicion}
                          className="flex items-center gap-3 p-4 bg-[#FAFAFA] rounded-xl cursor-pointer hover:bg-gray-100 transition"
                        >
                          <input
                            type="checkbox"
                            checked={formData.condicionesMedicas.ginecologicas.includes(condicion)}
                            onChange={() => toggleCondicion('ginecologicas', condicion)}
                            className="w-5 h-5 accent-[#7B6BA8]"
                          />
                          <span className="text-sm text-gray-800">{condicion}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                {/* Condiciones Metabólicas */}
                <div>
                  <div className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🔵 Condiciones metabólicas/endocrinas
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['Hipotiroidismo', 'Hipertiroidismo', 'Resistencia a la insulina', 'Diabetes'].map((condicion) => (
                      <label
                        key={condicion}
                        className="flex items-center gap-3 p-4 bg-[#FAFAFA] rounded-xl cursor-pointer hover:bg-gray-100 transition"
                      >
                        <input
                          type="checkbox"
                          checked={formData.condicionesMedicas.metabolicas.includes(condicion)}
                          onChange={() => toggleCondicion('metabolicas', condicion)}
                          className="w-5 h-5 accent-[#7B6BA8]"
                        />
                        <span className="text-sm text-gray-800">{condicion}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Otras Condiciones */}
                <div>
                  <div className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">🟡 Otras condiciones</div>
                  <div className="grid grid-cols-2 gap-3">
                    {['Anemia', 'Migrañas crónicas', 'Hipertensión', 'Ninguna de las anteriores'].map((condicion) => (
                      <label
                        key={condicion}
                        className="flex items-center gap-3 p-4 bg-[#FAFAFA] rounded-xl cursor-pointer hover:bg-gray-100 transition"
                      >
                        <input
                          type="checkbox"
                          checked={formData.condicionesMedicas.otras.includes(condicion)}
                          onChange={() => toggleCondicion('otras', condicion)}
                          className="w-5 h-5 accent-[#7B6BA8]"
                        />
                        <span className="text-sm text-gray-800">{condicion}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Medicación actual (opcional)</label>
                  <input
                    type="text"
                    value={formData.condicionesMedicas.medicacionActual}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        condicionesMedicas: { ...formData.condicionesMedicas, medicacionActual: e.target.value },
                      })
                    }
                    placeholder="Ej: Metformina 850mg, Levotiroxina 50mcg"
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#7B6BA8] transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Consentimiento */}
          {step === 4 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-black text-gray-900 mb-3">✅ Consentimiento informado</h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Lee y aceptá los términos para que tus datos puedan ser utilizados en investigación.
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#7B6BA8] to-[#5D4A7E] p-8 rounded-2xl text-white mb-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">⚖️ ¿Cómo se usarán tus datos?</h3>
                <ul className="space-y-2 mb-6 list-none">
                  {[
                    'Tus datos serán anonimizados y nunca se compartirá información personal identificable',
                    'Investigadores académicos y de salud podrán acceder a tus estudios para avanzar en investigación médica',
                    'Recibirás el 85% del pago cada vez que un investigador compre acceso a tu dataset',
                    'Podés revocar tu consentimiento en cualquier momento y eliminar tus datos',
                    'Tus datos quedan registrados de forma segura usando tecnología blockchain',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span className="text-[#FF6B35] font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <label className="flex items-start gap-3 p-4 bg-white/10 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consentimiento.firmado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        consentimiento: { 
                          ...formData.consentimiento, 
                          firmado: e.target.checked,
                          fecha: e.target.checked ? new Date().toISOString() : '',
                        },
                      })
                    }
                    className="w-6 h-6 mt-1 accent-[#FF6B35]"
                  />
                  <span className="text-sm leading-relaxed">
                    He leído y acepto que mis datos médicos anonimizados sean utilizados para investigación científica.
                    Entiendo que recibiré compensación económica y que puedo revocar mi consentimiento en cualquier
                    momento.
                  </span>
                </label>
              </div>

              <div className="bg-[#7B6BA8]/10 border-l-4 border-[#7B6BA8] p-5 rounded-r-xl">
                <p className="text-sm text-gray-800 leading-relaxed">
                  📄 Al hacer clic en "Firmar y continuar", tu consentimiento quedará registrado con fecha y hora.
                  Podrás descargar una copia en cualquier momento desde tu perfil.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10 pt-8 border-t border-gray-200">
            <button
              onClick={handlePrev}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 bg-[#FAFAFA] text-gray-700 rounded-xl font-bold border-2 border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </button>
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#FF8C61] hover:-translate-y-0.5 transition shadow-lg"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!formData.consentimiento.firmado}
                className="flex items-center gap-2 px-6 py-3 bg-[#10B981] text-white rounded-xl font-bold hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
              >
                <Check className="w-4 h-4" />
                Firmar y continuar →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
