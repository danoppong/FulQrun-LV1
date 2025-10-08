// Test MEDDPICC API endpoint
async function testAPI() {
  try {
    console.log('Testing MEDDPICC API...')
    
    // Test GET first
    const getResponse = await fetch('http://localhost:3008/api/admin/meddpicc-config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('GET Response Status:', getResponse.status)
    const getData = await getResponse.json()
    console.log('GET Response:', JSON.stringify(getData, null, 2))
    
    // Test PUT with simple data
    const testConfig = {
      projectName: "Test Configuration",
      version: "1.0",
      framework: "MEDD(I)PICC",
      scoring: {
        weights: {
          metrics: 40,
          economicBuyer: 15,
          decisionCriteria: 8,
          decisionProcess: 10,
          paperProcess: 3,
          identifyPain: 12,
          implicatePain: 7,
          champion: 3,
          competition: 2
        }
      },
      pillars: []
    }
    
    const putResponse = await fetch('http://localhost:3008/api/admin/meddpicc-config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        configuration: testConfig,
        organizationId: '1'
      })
    })
    
    console.log('PUT Response Status:', putResponse.status)
    const putData = await putResponse.json()
    console.log('PUT Response:', JSON.stringify(putData, null, 2))
    
  } catch (error) {
    console.error('API Test Error:', error)
  }
}

testAPI()