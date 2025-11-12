import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="block text-ink-500 mb-2">{label}</label>
      )}
      <input
        className={`w-full px-4 py-2 bg-base-700 border border-base-600 rounded-2xl text-ink-400 focus:outline-none focus:ring-2 focus:ring-mint-400 ${className}`}
        {...props}
      />
    </div>
  )
}

