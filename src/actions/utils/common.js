/* 
* <license header>
*/

/* This file exposes some common utilities for your actions */

/**
 *
 * Returns a log ready string of the action input parameters.
 * The `Authorization` header content will be replaced by '<hidden>'.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string}
 *
 */
function stringParameters (params) {
  // hide authorization token without overriding params
  let headers = params.__ow_headers || {}
  if (headers.authorization) {
    headers = { ...headers, authorization: '<hidden>' }
  }
  return JSON.stringify({ ...params, __ow_headers: headers })
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} obj object to check.
 * @param {array} required list of required keys.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'
 *
 * @returns {array}
 * @private
 */
function getMissingKeys (obj, required) {
  return required.filter(r => {
    const splits = r.split('.')
    const last = splits[splits.length - 1]
    const traverse = splits.slice(0, -1).reduce((tObj, split) => { tObj = (tObj[split] || {}); return tObj }, obj)
    return traverse[last] === undefined || traverse[last] === '' // missing default params are empty string
  })
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} params action input parameters.
 * @param {array} requiredHeaders list of required input headers.
 * @param {array} requiredParams list of required input parameters.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'.
 *
 * @returns {string} if the return value is not null, then it holds an error message describing the missing inputs.
 *
 */
function checkMissingRequestInputs (params, requiredParams = [], requiredHeaders = []) {
  let errorMessage = null

  // input headers are always lowercase
  requiredHeaders = requiredHeaders.map(h => h.toLowerCase())
  // check for missing headers
  const missingHeaders = getMissingKeys(params.__ow_headers || {}, requiredHeaders)
  if (missingHeaders.length > 0) {
    errorMessage = `missing header(s) '${missingHeaders}'`
  }

  // check for missing parameters
  const missingParams = getMissingKeys(params, requiredParams)
  if (missingParams.length > 0) {
    if (errorMessage) {
      errorMessage += ' and '
    } else {
      errorMessage = ''
    }
    errorMessage += `missing parameter(s) '${missingParams}'`
  }

  return errorMessage
}

/**
 *
 * Extracts the bearer token string from the Authorization header in the request parameters.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string|undefined} the token string or undefined if not set in request headers.
 *
 */
function getBearerToken (params) {
  if (params.__ow_headers &&
      params.__ow_headers.authorization &&
      params.__ow_headers.authorization.startsWith('Bearer ')) {
    return params.__ow_headers.authorization.substring('Bearer '.length)
  }
  return undefined
}
/**
 *
 * Returns an error response object and attempts to log.info the status code and error message
 *
 * @param {number} statusCode the error status code.
 *        e.g. 400
 * @param {string} message the error message.
 *        e.g. 'missing xyz parameter'
 * @param {*} [logger] an optional logger instance object with an `info` method
 *        e.g. `new require('@adobe/aio-sdk').Core.Logger('name')`
 *
 * @returns {object} the error object, ready to be returned from the action main's function.
 *
 */
function errorResponse (statusCode, message, logger) {
  if (logger && typeof logger.info === 'function') {
    logger.info(`${statusCode}: ${message}`)
  }
  return {
    error: {
      statusCode,
      body: {
        error: message
      }
    }
  }
}


/**
 * Set default content
 * 
 */
function contentInit(params){
  let content = {
    "message": "success", 
    "status": "ok"
  }

  /*
  if(typeof params.debug !== 'undefined'){
    content.debug = params.debug
  }

  if(typeof params.aemHost !== 'undefined'){
    content.aemHost = params.aemHost
  }

  if(typeof params.aemAssetPath !== 'undefined'){
    content.aemAssetPath = params.aemAssetPath
  }

  if(typeof params.manifest !== 'undefined'){
    content.manifest = params.manifest
  }

  if(typeof params.aemHost !== 'undefined'){
    content.aemHost = params.aemHost
  }

  if(typeof params.aemHost !== 'undefined'){
    content.aemHost = params.aemHost
  }  

  if(typeof params.modules !== 'undefined'){
    content.modules = params.modules
  }

  if(typeof params.artboardCount !== 'undefined'){
    content.artboardCount = params.artboardCount
  }
  */

  return content
}

/**
 * Check if an object contains any internal OpenWhisk parameters
 * @param {Object} params - The object to check
 * @returns {boolean} - True if the object contains __ow_ parameters
 */
function hasOpenWhiskParams(params) {
  if (!params || typeof params !== 'object') {
    return false;
  }
  
  return Object.keys(params).some(key => key.startsWith('__ow_'));
}

/**
 * Strip internal OpenWhisk parameters from action parameters
 * @param {Object} params - The original action parameters
 * @returns {Object} - Cleaned parameters without internal OpenWhisk parameters
 */
function stripOpenWhiskParams(params) {
  if (!params || typeof params !== 'object') {
    return params;
  }
  
  const cleanParams = {};
  let strippedCount = 0;
  
  // Iterate through all properties and exclude OpenWhisk internal ones
  for (const [key, value] of Object.entries(params)) {
    if (!key.startsWith('__ow_')) {
      cleanParams[key] = value;
    } else {
      strippedCount++;
    }
  }
  
  // Log if we stripped any parameters (useful for debugging)
  if (strippedCount > 0) {
    console.log(`stripOpenWhiskParams: Stripped ${strippedCount} internal OpenWhisk parameters`);
  }
  
  return cleanParams;
}

module.exports = { 
  errorResponse,
  getBearerToken,
  stringParameters,
  checkMissingRequestInputs,
  contentInit,
  hasOpenWhiskParams,
  stripOpenWhiskParams
}