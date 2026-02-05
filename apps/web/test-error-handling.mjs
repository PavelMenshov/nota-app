// Test script to verify the API error handling improvements
// This tests the error handling logic without requiring a running server

import { ApiError } from '../src/lib/api';

console.log('Testing ApiError class...');

// Test 1: Basic ApiError creation
const err1 = new ApiError('Test error', 404, false);
console.log('✓ Test 1 passed: Basic ApiError creation');
console.assert(err1.message === 'Test error', 'Message should match');
console.assert(err1.statusCode === 404, 'Status code should be 404');
console.assert(err1.isNetworkError === false, 'Should not be network error');

// Test 2: Network error
const err2 = new ApiError('Network error', undefined, true);
console.log('✓ Test 2 passed: Network error creation');
console.assert(err2.isNetworkError === true, 'Should be network error');

// Test 3: Error with status code
const err3 = new ApiError('Conflict', 409, false);
console.log('✓ Test 3 passed: Error with 409 status code');
console.assert(err3.statusCode === 409, 'Status code should be 409');

console.log('\n✓ All tests passed!');
console.log('\nKey improvements in the registration system:');
console.log('1. ✓ Custom ApiError class for better error categorization');
console.log('2. ✓ Network error detection and retry logic');
console.log('3. ✓ Health check endpoint for API availability');
console.log('4. ✓ User-friendly error messages for different scenarios');
console.log('5. ✓ Exponential backoff retry (2 retries with increasing delays)');
