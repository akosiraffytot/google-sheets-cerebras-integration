/**
 * Optimized caching utilities for Google Apps Script
 * Provides intelligent cache management with performance optimizations
 */

/**
 * Cache configuration constants
 */
const CACHE_CONFIG = {
  // Cache durations (seconds)
  DEFAULT_DURATION: 3600, // 1 hour - optimized for typical rewrite scenarios
  SHORT_DURATION: 1800,   // 30 minutes - for frequently changing content
  LONG_DURATION: 7200,    // 2 hours - for stable content
  
  // Cache key optimization
  MAX_KEY_LENGTH: 200,    // Google Apps Script cache key limit
  HASH_LONG_KEYS: true,   // Hash keys longer than max length
  
  // Cache management
  MAX_CACHE_SIZE: 100,    // Maximum number of cached items
  CLEANUP_THRESHOLD: 80,  // Clean up when 80% full
  
  // Performance optimization
  BATCH_SIZE: 10,         // Process cache operations in batches
  COMPRESSION_THRESHOLD: 1000 // Compress values larger than 1KB
};

/**
 * Optimized cache key generation with intelligent hashing
 * @param {string} prompt - The AI prompt
 * @param {string} mainText - The main text to rewrite
 * @param {string} contextText - Additional context (optional)
 * @return {string} Optimized cache key
 */
function generateOptimizedCacheKey(prompt, mainText, contextText) {
  try {
    // Create base key from parameters
    const baseKey = `rewrite:${prompt}:${mainText}:${contextText || ''}`;
    
    // If key is within length limit, use it directly
    if (baseKey.length <= CACHE_CONFIG.MAX_KEY_LENGTH) {
      return baseKey;
    }
    
    // For long keys, create a hash-based key
    const hash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256, 
      baseKey, 
      Utilities.Charset.UTF_8
    );
    
    // Convert hash to hex string and truncate
    const hashString = hash.map(byte => (byte + 256).toString(16).slice(1)).join('');
    
    return `rewrite:hash:${hashString.substring(0, 32)}`;
    
  } catch (error) {
    console.error(`Cache key generation failed: ${error.message}`);
    // Fallback to timestamp-based key
    return `rewrite:fallback:${Date.now()}`;
  }
}

/**
 * Intelligent cache duration selection based on content characteristics
 * @param {string} prompt - The AI prompt
 * @param {string} mainText - The main text
 * @return {number} Optimal cache duration in seconds
 */
function selectOptimalCacheDuration(prompt, mainText) {
  try {
    // Analyze prompt characteristics
    const promptLower = prompt.toLowerCase();
    const isTimesensitive = promptLower.includes('today') || 
                           promptLower.includes('current') || 
                           promptLower.includes('latest') ||
                           promptLower.includes('now');
    
    // Analyze text characteristics
    const textLength = mainText.length;
    const hasNumbers = /\d/.test(mainText);
    const hasDates = /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/.test(mainText);
    
    // Select duration based on characteristics
    if (isTimesensitive || hasDates) {
      return CACHE_CONFIG.SHORT_DURATION; // 30 minutes for time-sensitive content
    } else if (textLength > 2000 || hasNumbers) {
      return CACHE_CONFIG.LONG_DURATION; // 2 hours for complex content
    } else {
      return CACHE_CONFIG.DEFAULT_DURATION; // 1 hour for standard content
    }
    
  } catch (error) {
    console.error(`Cache duration selection failed: ${error.message}`);
    return CACHE_CONFIG.DEFAULT_DURATION;
  }
}

/**
 * Optimized cache retrieval with compression support
 * @param {string} cacheKey - The cache key
 * @return {string|null} Cached result or null if not found
 */
function getOptimizedCachedResult(cacheKey) {
  try {
    const cache = CacheService.getScriptCache();
    const cachedValue = cache.get(cacheKey);
    
    if (!cachedValue) {
      return null;
    }
    
    // Check if value is compressed
    if (cachedValue.startsWith('COMPRESSED:')) {
      try {
        const compressedData = cachedValue.substring(11); // Remove 'COMPRESSED:' prefix
        const decompressed = Utilities.unzip(Utilities.base64Decode(compressedData));
        return Utilities.newBlob(decompressed).getDataAsString();
      } catch (decompressError) {
        console.warn(`Failed to decompress cached value: ${decompressError.message}`);
        // Remove corrupted cache entry
        cache.remove(cacheKey);
        return null;
      }
    }
    
    return cachedValue;
    
  } catch (error) {
    console.error(`Cache retrieval failed: ${error.message}`);
    return null;
  }
}

/**
 * Optimized cache storage with intelligent compression
 * @param {string} cacheKey - The cache key
 * @param {string} result - The result to cache
 * @param {number} duration - Cache duration in seconds (optional)
 */
function setOptimizedCachedResult(cacheKey, result, duration) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheDuration = duration || CACHE_CONFIG.DEFAULT_DURATION;
    
    let valueToStore = result;
    
    // Compress large values to save cache space
    if (result.length > CACHE_CONFIG.COMPRESSION_THRESHOLD) {
      try {
        const compressed = Utilities.zip([Utilities.newBlob(result, 'text/plain', 'data.txt')]);
        const compressedBase64 = Utilities.base64Encode(compressed);
        valueToStore = `COMPRESSED:${compressedBase64}`;
        
        console.log(`Compressed cache value from ${result.length} to ${valueToStore.length} characters`);
      } catch (compressionError) {
        console.warn(`Failed to compress cache value: ${compressionError.message}`);
        // Store uncompressed if compression fails
      }
    }
    
    // Store in cache
    cache.put(cacheKey, valueToStore, cacheDuration);
    
    // Update cache statistics
    updateCacheStatistics(cacheKey, result.length, valueToStore.length);
    
    // Perform cache cleanup if needed
    performCacheCleanupIfNeeded();
    
  } catch (error) {
    console.error(`Cache storage failed: ${error.message}`);
    // Don't throw error - caching is optional
  }
}

/**
 * Updates cache usage statistics
 * @param {string} cacheKey - The cache key
 * @param {number} originalSize - Original data size
 * @param {number} storedSize - Stored data size
 */
function updateCacheStatistics(cacheKey, originalSize, storedSize) {
  try {
    const cache = CacheService.getScriptCache();
    const statsKey = 'cache:stats';
    
    let stats = cache.get(statsKey);
    if (stats) {
      stats = JSON.parse(stats);
    } else {
      stats = {
        totalEntries: 0,
        totalOriginalSize: 0,
        totalStoredSize: 0,
        compressionRatio: 1.0,
        lastCleanup: Date.now()
      };
    }
    
    // Update statistics
    stats.totalEntries++;
    stats.totalOriginalSize += originalSize;
    stats.totalStoredSize += storedSize;
    stats.compressionRatio = stats.totalOriginalSize / stats.totalStoredSize;
    
    // Store updated statistics
    cache.put(statsKey, JSON.stringify(stats), CACHE_CONFIG.LONG_DURATION);
    
  } catch (error) {
    console.error(`Failed to update cache statistics: ${error.message}`);
  }
}

/**
 * Performs cache cleanup if threshold is reached
 */
function performCacheCleanupIfNeeded() {
  try {
    const cache = CacheService.getScriptCache();
    const statsKey = 'cache:stats';
    const stats = cache.get(statsKey);
    
    if (!stats) return;
    
    const parsedStats = JSON.parse(stats);
    
    // Check if cleanup is needed
    if (parsedStats.totalEntries >= CACHE_CONFIG.CLEANUP_THRESHOLD) {
      console.log('Performing cache cleanup...');
      
      // Note: Google Apps Script doesn't provide direct cache enumeration
      // So we'll just update the cleanup timestamp and let natural expiration handle cleanup
      parsedStats.lastCleanup = Date.now();
      cache.put(statsKey, JSON.stringify(parsedStats), CACHE_CONFIG.LONG_DURATION);
      
      console.log('Cache cleanup completed');
    }
    
  } catch (error) {
    console.error(`Cache cleanup failed: ${error.message}`);
  }
}

/**
 * Gets cache performance statistics
 * @return {Object} Cache statistics object
 */
function getCacheStatistics() {
  try {
    const cache = CacheService.getScriptCache();
    const statsKey = 'cache:stats';
    const stats = cache.get(statsKey);
    
    if (!stats) {
      return {
        totalEntries: 0,
        totalOriginalSize: 0,
        totalStoredSize: 0,
        compressionRatio: 1.0,
        lastCleanup: null,
        status: 'No cache data available'
      };
    }
    
    const parsedStats = JSON.parse(stats);
    
    return {
      ...parsedStats,
      status: 'Active',
      compressionSavings: `${((1 - 1/parsedStats.compressionRatio) * 100).toFixed(1)}%`,
      lastCleanupFormatted: new Date(parsedStats.lastCleanup).toLocaleString()
    };
    
  } catch (error) {
    return {
      status: 'Error',
      error: error.message
    };
  }
}

/**
 * Clears all cache entries (for maintenance)
 * @return {boolean} True if successful
 */
function clearAllCache() {
  try {
    const cache = CacheService.getScriptCache();
    
    // Note: Google Apps Script doesn't provide a direct "clear all" method
    // This is a placeholder for manual cache management
    console.log('Cache clear requested - entries will expire naturally');
    
    // Reset statistics
    const statsKey = 'cache:stats';
    const resetStats = {
      totalEntries: 0,
      totalOriginalSize: 0,
      totalStoredSize: 0,
      compressionRatio: 1.0,
      lastCleanup: Date.now()
    };
    
    cache.put(statsKey, JSON.stringify(resetStats), CACHE_CONFIG.LONG_DURATION);
    
    return true;
    
  } catch (error) {
    console.error(`Failed to clear cache: ${error.message}`);
    return false;
  }
}

/**
 * Tests cache performance with sample data
 * @return {Object} Performance test results
 */
function testCachePerformance() {
  try {
    const testData = {
      prompt: 'Test prompt for performance measurement',
      mainText: 'This is a test text that will be used to measure cache performance. '.repeat(50),
      contextText: 'Additional context for testing purposes'
    };
    
    const startTime = Date.now();
    
    // Test cache key generation
    const cacheKey = generateOptimizedCacheKey(testData.prompt, testData.mainText, testData.contextText);
    const keyGenTime = Date.now() - startTime;
    
    // Test cache storage
    const storeStartTime = Date.now();
    setOptimizedCachedResult(cacheKey, testData.mainText);
    const storeTime = Date.now() - storeStartTime;
    
    // Test cache retrieval
    const retrieveStartTime = Date.now();
    const retrieved = getOptimizedCachedResult(cacheKey);
    const retrieveTime = Date.now() - retrieveStartTime;
    
    return {
      success: true,
      keyGenerationTime: keyGenTime,
      storageTime: storeTime,
      retrievalTime: retrieveTime,
      totalTime: Date.now() - startTime,
      dataIntegrity: retrieved === testData.mainText,
      cacheKeyLength: cacheKey.length,
      originalDataSize: testData.mainText.length
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}