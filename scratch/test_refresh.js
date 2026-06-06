const axios = require('axios');

async function testRefresh() {
  try {
    const res = await axios.post('http://localhost:4000/api/v1/auth/refresh', {
      refreshToken: 'some-invalid-token'
    });
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Data:', err.response.data);
    } else {
      console.log('Error:', err.message);
    }
  }
}

testRefresh();
