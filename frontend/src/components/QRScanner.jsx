import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import toast from 'react-hot-toast'
import api from '../api/client'

export default function QRScanner({ orderId, onVerified }) {
  const [scanning, setScanning] = useState(false)
  const [verified, setVerified] = useState(false)
  const scannerRef = useRef(null)

  const startScanner = () => {
    setScanning(true)
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)
      scannerRef.current = scanner
      scanner.render(
        async (decodedText) => {
          scanner.clear()
          setScanning(false)
          // Verify with backend
          try {
            const res = await api.post(`/orders/${orderId}/verify-qr`, { scanned_data: decodedText })
            if (res.data.verified) {
              setVerified(true)
              toast.success('✅ Delivery Verified!')
              onVerified?.()
            } else {
              toast.error('❌ QR mismatch!')
            }
          } catch {
            toast.error('Verification failed')
          }
        },
        () => {}
      )
    }, 200)
  }

  const stopScanner = () => {
    scannerRef.current?.clear().catch(() => {})
    setScanning(false)
  }

  useEffect(() => () => scannerRef.current?.clear().catch(() => {}), [])

  if (verified) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius)', border: '1px solid var(--success)' }}>
        <div style={{ fontSize: '3rem' }}>✅</div>
        <h3 style={{ color: 'var(--success)', marginTop: '8px' }}>Delivery Verified!</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Order marked as delivered</p>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {!scanning ? (
        <button className="btn btn-primary" onClick={startScanner} id="scan-qr-btn">
          📷 Scan QR Code
        </button>
      ) : (
        <>
          <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', borderRadius: 'var(--radius)', overflow: 'hidden' }} />
          <button className="btn btn-secondary btn-sm" onClick={stopScanner} style={{ marginTop: '10px' }}>
            Cancel
          </button>
        </>
      )}
    </div>
  )
}
