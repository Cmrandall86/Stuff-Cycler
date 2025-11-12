import { ReactNode } from 'react'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="card p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          {title && <h2 className="text-xl font-bold text-ink-400">{title}</h2>}
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>
        {children}
      </div>
    </div>
  )
}

