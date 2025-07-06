import React, { useState } from 'react'

interface TestData {
  RowId: string
  Portfolio: string
  Code: string
  Name: string
  Price: string
  Quantity: string
}

const TestDataSender: React.FC = () => {
  const [testData, setTestData] = useState<TestData>({
    RowId: '1',
    Portfolio: 'Portfolio 1',
    Code: '0007',
    Name: 'HK FINANCE INV',
    Price: '0.092',
    Quantity: '100'
  })

  const sendTestData = () => {
    const ws = new WebSocket('ws://localhost:5000/ws')
    ws.onopen = () => {
      ws.send(JSON.stringify(testData))
      ws.close()
    }
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px' }}>
      <h2>测试数据发送器</h2>
      <div style={{ marginBottom: '10px' }}>
        <label>Portfolio: </label>
        <input
          value={testData.Portfolio}
          onChange={e => setTestData(prev => ({ ...prev, Portfolio: e.target.value }))}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Code: </label>
        <input
          value={testData.Code}
          onChange={e => setTestData(prev => ({ ...prev, Code: e.target.value }))}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Name: </label>
        <input
          value={testData.Name}
          onChange={e => setTestData(prev => ({ ...prev, Name: e.target.value }))}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Price: </label>
        <input
          value={testData.Price}
          onChange={e => setTestData(prev => ({ ...prev, Price: e.target.value }))}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Quantity: </label>
        <input
          value={testData.Quantity}
          onChange={e => setTestData(prev => ({ ...prev, Quantity: e.target.value }))}
        />
      </div>
      <button onClick={sendTestData}>发送测试数据</button>
    </div>
  )
}

export default TestDataSender