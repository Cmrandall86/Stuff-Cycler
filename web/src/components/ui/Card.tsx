import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`card shadow-sm border border-base-700 ${className}`} {...props}>
      {children}
    </div>
  )
}

