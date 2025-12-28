// Quick test to verify background functionality
const { getBackgroundById } = require('./src/lib/post-backgrounds.ts');

// Test the function exists and works
console.log('Testing getBackgroundById function...');

try {
  // Test with a sample background ID
  const testBackground = getBackgroundById('gradient-sunset');
  
  if (testBackground) {
    console.log('✅ getBackgroundById works correctly');
    console.log('Sample background:', {
      id: testBackground.id,
      name: testBackground.name,
      textColor: testBackground.textColor,
      hasStyle: !!testBackground.style
    });
  } else {
    console.log('❌ getBackgroundById returned undefined for valid ID');
  }
  
  // Test with invalid ID
  const invalidBackground = getBackgroundById('invalid-id');
  if (!invalidBackground) {
    console.log('✅ getBackgroundById correctly returns undefined for invalid ID');
  }
  
  console.log('\n🎯 Background functionality test completed');
  
} catch (error) {
  console.error('❌ Error testing background functionality:', error.message);
}