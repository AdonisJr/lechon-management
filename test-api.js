// Simple test script to check if orders API works
const testOrdersAPI = async () => {
  console.log('Testing orders API...');

  try {
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.status === 200) {
      console.log('✅ API is working correctly!');
    } else {
      console.log('❌ API returned error:', data);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
};

// Wait a bit for server to be ready
setTimeout(testOrdersAPI, 2000);