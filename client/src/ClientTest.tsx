import React, { useEffect, useState } from 'react';

interface RowData {
  timestamp: number;
  payload: string;
}

const CLIENT_COUNT = 3; // 模拟 3 个客户端连接
const WS_URL = 'ws://localhost:5000/ws';

const ClientTest: React.FC = () => {
  const [clients, setClients] = useState<WebSocket[]>([]);
  const [logs, setLogs] = useState<Record<number, RowData[]>>({});
  const [isPaused, setIsPaused] = useState(false);

  // 初始化多个客户端连接
  useEffect(() => {
    const wsList: WebSocket[] = [];
    const logMap: Record<number, RowData[]> = {};

    for (let i = 0; i < CLIENT_COUNT; i++) {
      const ws = new WebSocket(WS_URL);
      const id = i;

      ws.onopen = () => {
        console.log(`Client ${id} connected`);
        setLogs((prev) => ({ ...prev, [id]: [] }));
      };

      ws.onmessage = (e) => {
        if (!isPaused) {
          const time = Date.now();
          logMap[id] = [...(logMap[id] || []), { timestamp: time, payload: e.data }];
          setLogs({ ...logMap });
        }
      };

      ws.onclose = () => {
        console.log(`Client ${id} disconnected`);
      };

      ws.onerror = (e) => {
        console.error(`Client ${id} error`, e);
      };

      wsList.push(ws);
    }

    setClients(wsList);

    // 清理所有连接
    return () => {
      wsList.forEach((ws) => ws.close());
    };
  }, []);

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>🧪 多客户端 WebSocket 测试</h2>
      <p>连接数：{CLIENT_COUNT}</p>
      <button 
        onClick={togglePause}
        style={{
          padding: '8px 16px',
          marginBottom: '1rem',
          backgroundColor: isPaused ? '#4CAF50' : '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {isPaused ? '继续' : '暂停'}
      </button>

      {Object.entries(logs).map(([clientId, messages]) => (
        <div key={clientId} style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
          <h4>Client #{clientId}</h4>
          <ul>
            {messages.map((msg, i) => (
              <li key={i}>
                <code>[{new Date(msg.timestamp).toLocaleTimeString()}]</code> {msg.payload}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ClientTest;