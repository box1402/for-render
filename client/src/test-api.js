// This is a test file to check if the API is working correctly
// It can be run from the command line with 'node client/src/test-api.js'

const sitePwdSuccess = {
  url: "/api/site-auth",
  method: "POST",
  body: {
    password: "gabby1218814!"
  }
};

const sitePwdFail = {
  url: "/api/site-auth",
  method: "POST",
  body: {
    password: "wrongpassword"
  }
};

// Test function to check the API - can be called from the browser console
async function testApi(config) {
  try {
    const response = await fetch(config.url, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config.body),
    });
    const data = await response.json();
    console.log(`API test result for ${config.url}:`, data);
    return data;
  } catch (error) {
    console.error('API test error:', error);
    return null;
  }
}

// For debugging in the browser console
window.testApi = testApi;
window.sitePwdSuccess = sitePwdSuccess;
window.sitePwdFail = sitePwdFail;