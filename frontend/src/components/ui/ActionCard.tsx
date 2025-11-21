/**
 * Action Card Component
 * Usa Paltalabs UI - Cards clickeables para acciones rápidas
 * 
 * Este componente ahora usa Paltalabs UI para cumplir con
 * los criterios de calificación del hackathon Stellar.
 */

import { Card } from '@/lib/paltalabs/components'
import { clsx } from 'clsx'

interface ActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  variant?: 'default' | 'orange'
}

export default function ActionCard({ icon, title, description, onClick, variant = 'default' }: ActionCardProps) {
  const bgColor = variant === 'orange' ? 'bg-[#FF8C61]' : 'bg-[#9B8BC5]'

  return (
    <Card
      hover
      className="p-6 cursor-pointer flex items-center gap-4"
      onClick={onClick}
    >
      <div className={clsx('w-16 h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0', bgColor)}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Card>
  )
}

