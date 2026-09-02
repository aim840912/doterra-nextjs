'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useModalDismiss } from '@/hooks/useModalDismiss'
import MedicalDisclaimer from './MedicalDisclaimer'

interface KnowledgeLightboxProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

export default function KnowledgeLightbox({
  src,
  alt,
  isOpen,
  onClose,
}: KnowledgeLightboxProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useModalDismiss(isOpen, onClose)

  if (!mounted || !isOpen) return null

  return createPortal(
    // z-[60] 必須高於詳情 Modal 的 z-50，否則從 Modal 開燈箱會被蓋住
    <div
      className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div
        className="relative w-full max-w-3xl"
        onClick={e => e.stopPropagation()}
      >
        {/* fill 需要父層有明確高度，1280x1280 的方形圖用 aspect-square */}
        <div className="relative aspect-square w-full">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
        </div>
        <MedicalDisclaimer variant="inline" className="mt-3 rounded-lg" />
      </div>

      <button
        onClick={onClose}
        aria-label="關閉原圖檢視"
        className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-lg"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>,
    document.body
  )
}
