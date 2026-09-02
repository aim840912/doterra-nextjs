'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: '精油圖鑑' },
  { href: '/knowledge', label: '精油小知識' },
] as const

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav
      className="bg-white border-b border-gray-200 sticky top-0 z-40"
      aria-label="主導覽"
    >
      <div className="container mx-auto px-4">
        <ul className="flex items-center gap-1 sm:gap-2 h-14 overflow-x-auto">
          {NAV_ITEMS.map(({ href, label }) => {
            // 首頁必須用 === 比對，用 startsWith('/') 的話每個路徑都會命中
            const isActive =
              href === '/' ? pathname === '/' : pathname.startsWith(href)

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex items-center min-h-[44px] px-4 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
