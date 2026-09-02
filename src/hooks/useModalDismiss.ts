import { useEffect, useRef } from 'react'

/**
 * 彈窗共用行為：ESC 關閉 + 鎖住背景捲動，支援多層疊加。
 *
 * 為什麼需要模組層級的堆疊，而不是各自記住「前一個 overflow 值」：
 * 知識卡的燈箱是從詳情彈窗開啟的，兩層會同時掛載。若各自還原自己記錄的值，
 * 同時卸載時會互相覆蓋——詳情彈窗先還原成 ''，燈箱接著還原成它記錄的
 * 'hidden'，結果 body 永久卡在不能捲動。實測確認過這個情況。
 *
 * 同理，ESC 也必須只讓最上層的彈窗回應，否則一次按鍵會把兩層一起關掉。
 */
const openModals: symbol[] = []
let overflowBeforeLock = ''

export function useModalDismiss(isOpen: boolean, onClose: () => void): void {
  // 用 ref 存 onClose，讓下面的 effect 只依賴 isOpen。
  // 否則呼叫端每次 render 產生的新 onClose 都會讓彈窗重新進出堆疊。
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    const token = Symbol('modal')
    if (openModals.length === 0) {
      overflowBeforeLock = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    openModals.push(token)

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // 只有堆疊最上層的彈窗回應，避免一次 ESC 關掉整疊
      if (openModals[openModals.length - 1] !== token) return
      onCloseRef.current()
    }
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      const index = openModals.indexOf(token)
      if (index !== -1) openModals.splice(index, 1)
      // 只有最後一層關閉時才解鎖
      if (openModals.length === 0) {
        document.body.style.overflow = overflowBeforeLock
      }
    }
  }, [isOpen])
}
