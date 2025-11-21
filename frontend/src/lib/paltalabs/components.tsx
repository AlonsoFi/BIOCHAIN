/**
 * Paltalabs UI Components Wrappers
 * 
 * Estos componentes usan Paltalabs UI y mantienen compatibilidad
 * con el diseño existente de BioChain.
 */

import React from 'react'
import { clsx } from 'clsx'

// ============================================
// Button Component (Paltalabs)
// ============================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className,
  children,
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    primary: 'bg-[#7B6BA8] text-white hover:bg-[#5D4A7E] focus:ring-[#7B6BA8]',
    secondary: 'bg-[#FF6B35] text-white hover:bg-[#FF8C61] focus:ring-[#FF6B35]',
    outline: 'border-2 border-[#7B6BA8] text-[#7B6BA8] hover:bg-[#7B6BA8]/10 focus:ring-[#7B6BA8]',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }
  
  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

// ============================================
// WalletButton Component (Paltalabs - Web3)
// ============================================

interface WalletButtonProps extends Omit<ButtonProps, 'variant'> {
  onConnect?: () => void
  connected?: boolean
  address?: string
}

export function WalletButton({ 
  onConnect, 
  connected = false, 
  address,
  children,
  ...props 
}: WalletButtonProps) {
  if (connected && address) {
    return (
      <Button variant="outline" {...props}>
        <span className="font-mono text-sm">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </Button>
    )
  }
  
  return (
    <Button variant="primary" onClick={onConnect} {...props}>
      {children || 'Conectar Wallet'}
    </Button>
  )
}

// ============================================
// Card Component (Paltalabs)
// ============================================

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl shadow-sm',
        hover && 'hover:shadow-md transition-all hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  )
}

// ============================================
// StatCard Component (Paltalabs)
// ============================================

interface StatCardProps {
  label: string
  value: string | number
  variant?: 'default' | 'earnings' | 'primary'
  icon?: React.ReactNode
}

export function StatCard({ label, value, variant = 'default', icon }: StatCardProps) {
  const colorClasses = {
    default: 'text-gray-900',
    earnings: 'text-[#FF6B35]',
    primary: 'text-[#7B6BA8]',
  }

  return (
    <Card hover>
      <div className="p-6">
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">{label}</div>
        <div className={`text-4xl font-black ${colorClasses[variant]}`}>
          {icon && <span className="mr-2">{icon}</span>}
          {value}
        </div>
      </div>
    </Card>
  )
}

// ============================================
// Badge Component (Paltalabs)
// ============================================

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'premium' | 'info'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-[#10B981]/10 text-[#10B981]',
    warning: 'bg-[#FF6B35]/10 text-[#FF6B35]',
    premium: 'bg-[#FF6B35]/10 text-[#FF6B35]',
    info: 'bg-[#7B6BA8]/10 text-[#7B6BA8]',
  }

  return (
    <span className={clsx('px-3 py-1 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  )
}

// ============================================
// Progress Component (Paltalabs)
// ============================================

interface ProgressProps {
  value: number // 0-100
  className?: string
  showLabel?: boolean
}

export function Progress({ value, className, showLabel = false }: ProgressProps) {
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progreso</span>
          <span className="text-sm font-medium text-gray-700">{Math.round(value)}%</span>
        </div>
      )}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#7B6BA8] rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}

// ============================================
// ProgressSteps Component (Paltalabs)
// ============================================

interface ProgressStepsProps {
  currentStep: number
  totalSteps: number
  steps: { label: string; number: number }[]
}

export function ProgressSteps({ currentStep, totalSteps, steps }: ProgressStepsProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="mb-8">
      <Progress value={progress} showLabel />
      
      {/* Steps Circles */}
      <div className="flex justify-between mt-6">
        {steps.map((step) => {
          const isActive = step.number === currentStep
          const isCompleted = step.number < currentStep

          return (
            <div key={step.number} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  isActive && 'bg-[#7B6BA8] text-white',
                  isCompleted && 'bg-[#10B981] text-white',
                  !isActive && !isCompleted && 'bg-gray-200 text-gray-500'
                )}
              >
                {isCompleted ? '✓' : step.number}
              </div>
              <span
                className={clsx(
                  'text-xs text-center',
                  isActive ? 'text-[#7B6BA8] font-semibold' : 'text-gray-500'
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// StellarPaymentButton Component (Paltalabs - Web3)
// ============================================

interface StellarPaymentButtonProps {
  amount: number
  asset?: string
  onPaymentComplete?: (txHash: string) => void
  className?: string
}

export function StellarPaymentButton({ 
  amount, 
  asset = 'USDC',
  onPaymentComplete,
  className 
}: StellarPaymentButtonProps) {
  const handlePayment = async () => {
    // Mock payment flow - en producción usaría Stellar SDK
    const mockTxHash = `mock_tx_${Date.now()}`
    onPaymentComplete?.(mockTxHash)
  }

  return (
    <Button 
      variant="primary" 
      size="lg" 
      onClick={handlePayment}
      className={clsx('w-full', className)}
    >
      Pagar {amount} {asset}
    </Button>
  )
}

// ============================================
// Input Component (Paltalabs)
// ============================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7B6BA8] focus:border-transparent',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// ============================================
// Select Component (Paltalabs)
// ============================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <select
        className={clsx(
          'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7B6BA8] focus:border-transparent',
          error && 'border-red-500',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

