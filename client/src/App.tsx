import React, { useEffect, useState } from 'react'
import TestDataSender from './TestDataSender'

interface RowData {
  RowId: string
  Portfolio: string
  Code: string
  Name: string
  Price: string
  Quantity: string
  isHighlighted?: boolean
  timestamp?: number
}

const App: React.FC = () => {
  const [rows, setRows] = useState<Record<string, RowData>>({})
  const [status, setStatus] = useState('Connecting...')
  const [timestamp, setTimestamp] = useState(1)
  const [socket, setSocket] = useState<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000/ws')

    ws.onopen = () => {
      setStatus('Connected')
      setSocket(ws)
    }
    ws.onerror = () => setStatus('Error')
    ws.onclose = () => {
      setStatus('Disconnected')
      setSocket(null)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RowData
        setRows(prev => ({
          ...prev,
          [data.RowId]: { ...data, isHighlighted: true, timestamp: Date.now() }
        }))
        setTimestamp(t => t + 1)
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    }

    return () => ws.close()
  }, [])

  // 移除3秒后的高亮
  useEffect(() => {
    const timer = setTimeout(() => {
      setRows(prev => {
        const now = Date.now()
        const updated = { ...prev }
        Object.keys(updated).forEach(key => {
          if (updated[key].timestamp && now - updated[key].timestamp! > 3000) {
            updated[key] = { ...updated[key], isHighlighted: false }
          }
        })
        return updated
      })
    }, 3000)
    return () => clearTimeout(timer)
  }, [timestamp])

  const getCellStyle = (isHighlighted: boolean) => ({
    padding: '8px',
    border: '1px solid #ddd',
    backgroundColor: isHighlighted ? '#fff3cd' : 'transparent',
    transition: 'background-color 0.5s ease'
  })

  return (
    <div style={{ padding: '20px' }}>
      <TestDataSender socket={socket} />
      <h1>Live Data Grid</h1>
      <div>Status: {status}</div>
      <div>T={Math.floor(timestamp/2)}</div>
      <table style={{ 
        marginTop: '10px', 
        borderCollapse: 'collapse',
        width: '100%',
        border: '1px solid #ddd'
      }}>
        <thead>
          <tr>
            <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>Portfolio</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>Code</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>Name</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>Price</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(rows).map(row => (
            <tr key={row.RowId}>
              <td style={getCellStyle(row.isHighlighted || false)}>{row.Portfolio}</td>
              <td style={getCellStyle(row.isHighlighted || false)}>{row.Code}</td>
              <td style={getCellStyle(row.isHighlighted || false)}>{row.Name}</td>
              <td style={getCellStyle(row.isHighlighted || false)}>{row.Price}</td>
              <td style={getCellStyle(row.isHighlighted || false)}>{row.Quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App