// Simple WebSocket test script for the MongoDB Editor
const WebSocket = require('ws');

async function testWebSocket() {
  console.log('🧪 Testing MongoDB Editor WebSocket...');
  
  // Test connection
  const ws = new WebSocket('ws://localhost:4001/editor-ws?editorId=test-editor-1&database=editor_test_db');
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected');
    
    // Test joining a collection
    ws.send(JSON.stringify({
      type: 'JOIN_COLLECTION',
      collection: 'employees',
      editorId: 'test-editor-1',
      timestamp: Date.now()
    }));
    
    console.log('📝 Sent JOIN_COLLECTION message');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received:', message.type, message);
    } catch (error) {
      console.log('📨 Received (raw):', data.toString());
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`❌ WebSocket closed: ${code} ${reason}`);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
  
  // Keep the test running for a few seconds
  setTimeout(() => {
    console.log('🏁 Closing test connection');
    ws.close();
  }, 5000);
}

testWebSocket().catch(console.error);