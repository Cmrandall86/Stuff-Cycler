import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export default function Button({ 
  children, 
  className = '', 
  variant = 'primary',
  ...props 
}: ButtonProps) {
  const baseClasses = 'btn px-4 py-2 font-medium transition-colors'
  const variantClasses = {
    primary: 'btn-accent text-black',
    secondary: 'bg-base-700 text-ink-400 hover:bg-base-600',
    ghost: 'text-ink-500 hover:text-ink-400'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

