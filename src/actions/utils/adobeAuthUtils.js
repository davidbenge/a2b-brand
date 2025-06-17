/* 
* <license header>
*/

/* This file exposes some common auth utils */
const fetch = require('node-fetch');
const { Core } = require('@adobe/aio-sdk');
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('./common');
const auth = require("@adobe/jwt-auth");

/***
 * Get aem jwt account token
 * 
 * @param {object} authOptions - raw request parameters
 * @param {string} authOptions.client_id - client id
 * @param {string} authOptions.technical_account_id - technical account id
 * @param {string} authOptions.org_id - org id
 * @param {string} authOptions.client_secret - client secret
 * @param {string} authOptions.private_key - PrivateKey is a string (utf-8 encoded), buffer, object, or KeyObject containing either the secret for HMAC algorithms or the PEM encoded private key for RSA and ECDSA
 * @param {Array<string>} authOptions.meta_scopes - meta scopes
 * @param {string} authOptions.ims_endpoint - IMS https://ims-na1.adobelogin.com
 * @param {object} params - raw request parameters
 * @param {object} logger - logger object
 * 
 * return {object} tokenResponse - token response
 * return {string} tokenResponse.access_token - access token
 * return {string} tokenResponse.token_type - token type
 * return {string} tokenResponse.expires_in - expires in
 */
async function getJwtToken(authOptions,logger){
  logger.debug("getJwtToken authOptions",authOptions)

  // clean up the meta scopes
  let metaScopes = authOptions.meta_scopes
  if (metaScopes.constructor !== Array) {
    metaScopes = metaScopes.split(',').toString();
  }

  const config = {
    clientId: `${authOptions.client_id}`,
    clientSecret: `${authOptions.client_secret}`,
    technicalAccountId: `${authOptions.technical_account_id}`,
    orgId: `${authOptions.org_id}`,
    metaScopes: `${metaScopes}`,
    privateKey: `${authOptions.private_key}`
  };

  //logger.debug(`call config: ${JSON.stringify(config, null, 2)}`);

  try {
    let tokenResponse = await auth(config);
    return tokenResponse.access_token;
  } catch (error) {
    logger.error(`getJwtToken error: ${error}`);
    throw error;
  }
}

/***
 * Get a server to server token
 * 
 * @param {object} s2sAuthenticationCredentials - s2s authentication credentials
 * @param {string} s2sAuthenticationCredentials.clientId - client id
 * @param {string} s2sAuthenticationCredentials.clientSecret - client secret
 * @param {string} s2sAuthenticationCredentials.orgId - org id
 * @param {string} s2sAuthenticationCredentials.scopes - scopes
 * @param {object} logger - logger object
 * 
 * return {object} callResult - call result
 */     
async function getServer2ServerToken(s2sAuthenticationCredentials,logger){
  const urlencoded = new URLSearchParams();
  urlencoded.append('client_id', s2sAuthenticationCredentials.clientId);
  urlencoded.append('client_secret', s2sAuthenticationCredentials.clientSecret);
  urlencoded.append('grant_type', 'client_credentials');
  urlencoded.append('scope', s2sAuthenticationCredentials.scopes);

  logger.debug("getServer2ServerToken urlencoded",urlencoded.toString());
  logger.debug("getServer2ServerToken s2sAuthenticationCredentials",s2sAuthenticationCredentials);
  
  const callConfig = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-gw-ims-org-id": s2sAuthenticationCredentials.orgId,
    },
    body: urlencoded.toString()
  };

  //logger.debug('adobeAuthUtils callConfig:', callConfig);
  //logger.debug('adobeAuthUtils formdata:', urlencoded.toString());

  const callResult = await fetch("https://ims-na1.adobelogin.com/ims/token/v3", callConfig);

  if (!callResult.ok) {
    logger.error('adobeAuthUtils getServer2ServerToken NOT GOOD callResult:', callResult.body);
    throw new Error('adobeAuthUtils error getServer2ServerTokencallResult:', callResult.body);
  }else{
    const data = await callResult.json();
    logger.debug('adobeAuthUtils getServer2ServerToken Response:', data);

    if(data.access_token){
      return data.access_token;
    }else{
      logger.error('adobeAuthUtils getServer2ServerToken no auth token returned', data);
      throw new Error('adobeAuthUtils getServer2ServerToken no auth token returned', data);
    }
  }
}

module.exports = {
  getJwtToken,
  getServer2ServerToken
}