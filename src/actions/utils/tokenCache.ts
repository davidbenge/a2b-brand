/**
 * Token Cache Utility
 * 
 * Caches S2S access tokens in state store to avoid repeated IMS calls.
 * Tokens are valid for 22 hours, we cache for 21 hours to be safe.
 */

import aioLogger from '@adobe/aio-lib-core-logging';

const TOKEN_CACHE_PREFIX = 'S2S_TOKEN_';
const TOKEN_TTL_SECONDS = 21 * 60 * 60; // 21 hours (tokens valid for 22, cache for 21)

interface CachedToken {
    token: string;
    expiresAt: number;
}

/**
 * Get cached token or return null if expired/missing
 */
export async function getCachedToken(
    key: string,
    logLevel: string = 'info'
): Promise<string | null> {
    const logger = aioLogger('tokenCache', { level: logLevel });
    
    try {
        const stateLib = require('@adobe/aio-lib-state');
        const stateStore = await stateLib.init();
        
        const cacheKey = `${TOKEN_CACHE_PREFIX}${key}`;
        const cached = await stateStore.get(cacheKey);
        
        if (!cached || !cached.value) {
            logger.debug('Token cache miss', { key });
            return null;
        }
        
        const cachedToken: CachedToken = JSON.parse(cached.value);
        
        // Check if token is expired
        if (Date.now() >= cachedToken.expiresAt) {
            logger.debug('Cached token expired', { key });
            await stateStore.delete(cacheKey);
            return null;
        }
        
        logger.debug('Token cache hit', { 
            key, 
            expiresIn: Math.round((cachedToken.expiresAt - Date.now()) / 1000 / 60) 
        });
        
        return cachedToken.token;
    } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.warn('Error reading token cache, will fetch fresh token', errorObj);
        return null;
    }
}

/**
 * Cache a token with TTL
 */
export async function cacheToken(
    key: string,
    token: string,
    logLevel: string = 'info'
): Promise<void> {
    const logger = aioLogger('tokenCache', { level: logLevel });
    
    try {
        const stateLib = require('@adobe/aio-lib-state');
        const stateStore = await stateLib.init();
        
        const cacheKey = `${TOKEN_CACHE_PREFIX}${key}`;
        const expiresAt = Date.now() + (TOKEN_TTL_SECONDS * 1000);
        
        const cachedToken: CachedToken = {
            token,
            expiresAt
        };
        
        await stateStore.put(cacheKey, JSON.stringify(cachedToken), {
            ttl: TOKEN_TTL_SECONDS
        });
        
        logger.debug('Token cached', { 
            key, 
            ttl: TOKEN_TTL_SECONDS,
            expiresAt: new Date(expiresAt).toISOString()
        });
    } catch (error) {
        // Don't fail if caching fails - just log and continue
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.warn('Error caching token, will work without cache', errorObj);
    }
}

/**
 * Get S2S token with caching
 * Checks cache first, fetches from IMS if needed
 */
export async function getS2STokenWithCache(
    s2sCredentials: {
        clientId: string;
        clientSecret: string;
        scopes: string;
        orgId: string;
    },
    logLevel: string = 'info'
): Promise<string> {
    const logger = aioLogger('tokenCache', { level: logLevel });
    
    // Create cache key from clientId (unique per S2S credential set)
    const cacheKey = `s2s_${s2sCredentials.clientId}`;
    
    // Try cache first
    const cachedToken = await getCachedToken(cacheKey, logLevel);
    if (cachedToken) {
        logger.info('Using cached S2S token');
        return cachedToken;
    }
    
    // Cache miss - fetch fresh token from IMS
    logger.info('Fetching fresh S2S token from IMS');
    const { getServer2ServerToken } = require('./adobeAuthUtils');
    const token = await getServer2ServerToken(s2sCredentials, logger);
    
    // Cache the token
    await cacheToken(cacheKey, token, logLevel);
    
    return token;
}

