// Test script to verify token search fix
// Run with: node test-token-search.js

async function testTokenSearch() {
  const baseUrl = 'http://localhost:3001';

  console.log('\n🧪 Testing Token Search Fix\n');
  console.log('=' .repeat(50));

  const tests = [
    { name: 'PEPE on Ethereum', query: 'pepe', chain: 'ethereum' },
    { name: 'SHIB on Ethereum', query: 'shib', chain: 'ethereum' },
    { name: 'UNI on Ethereum', query: 'uni', chain: 'ethereum' },
  ];

  for (const test of tests) {
    try {
      console.log(`\n📝 Test: ${test.name}`);
      console.log(`   Query: ${test.query}, Chain: ${test.chain}`);

      const url = `${baseUrl}/api/tokens/search?q=${test.query}&chain=${test.chain}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'success') {
        console.log(`   ✅ Status: ${data.status}`);
        console.log(`   📊 Results: ${data.data.length} tokens`);
        console.log(`   🔍 Source: ${data.meta.source}`);
        console.log(`   💾 Cached: ${data.meta.cached}`);

        if (data.data.length > 0) {
          console.log(`   🎯 First result: ${data.data[0].name} (${data.data[0].symbol})`);
        }
      } else {
        console.log(`   ❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✨ Testing complete!\n');
}

testTokenSearch();
