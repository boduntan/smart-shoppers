import { describe, expect, test } from '@jest/globals';

describe('Basic Validation Tests', () => {
  test('should validate string operations', () => {
    const testString = 'Staples ChatBot';
    expect(testString).toContain('ChatBot');
    expect(testString.toLowerCase()).toBe('staples chatbot');
  });

  test('should validate array operations', () => {
    const testArray = [1, 2, 3, 4, 5];
    expect(testArray.length).toBe(5);
    expect(testArray).toContain(3);
  });

  test('should validate object operations', () => {
    const testObj = { name: 'test', version: '1.0' };
    expect(testObj).toHaveProperty('name');
    expect(testObj.version).toBe('1.0');
  });
});
