import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error'
}

export default function Badge({ 
  children, 
  className = '', 
  variant = 'default',
  ...props 
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-base-700 text-ink-400',
    success: 'bg-mint-600 text-white',
    warning: 'bg-yellow-600 text-white',
    error: 'bg-red-600 text-white'
  }

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

