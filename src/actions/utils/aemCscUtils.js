/* 
* <license header>
*/

/* This file exposes some common CSC related utilities for your actions */
const { getBearerToken } = require('./common')
const { Core, State, Files } = require('@adobe/aio-sdk')
const openwhisk = require("openwhisk")
const fetch = require('node-fetch')
const FormData = require('form-data')
const axios = require('axios')
const { getJwtToken, getServer2ServerToken } = require('./adobeAuthUtils')


/***
 * Get aem asset data
 * 
 * @param {string} aemHost aem host
 * @param {string} aemAssetPath aem asset path
 * @param {object} params action input parameters.
 * @param {object} logger logger object
 * 
 * @returns {object} resultData
 */
async function getAemAssetData(aemHost,aemAssetPath,params,logger){
  // fetch content from external api endpoint
  const fetchUrl = aemHost + aemAssetPath + '.3.json'
  logger.debug("getAemAssetData fetchUrl",fetchUrl);
  const aemAuthToken = await getAemAuth(params,logger);
  logger.debug("getAemAssetData aemAuthToken",aemAuthToken);

  const res = await fetch(fetchUrl, {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + aemAuthToken,
      'Content-Type': 'application/json'
    }
  })
  
  if (!res.ok) {
    throw new Error('request to ' + fetchUrl + ' failed with status code ' + res.status);
  }else{
    return await res.json();
  }
}

/***
 * Get AEM Asset data from repo
 * 
 * @param {string} aemHost aem host
 * @param {string} aemAssetPath aem asset path
 * @param {object} params action input parameters.
 * @param {object} logger logger object
 * 
 * @returns {object} resultData
 */
async function getAemAssetDataRapi(aemHost,aemAssetPath,params,logger){
  const fetchUrl = `${aemHost}/adobe/repository?path=${aemAssetPath}`
  const aemAuthToken = await getAemAuth(params,logger)

  const res = await fetch(fetchUrl, {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + aemAuthToken,
      'Content-Type': 'application/json',
      'x-api-key': params.AEM_SERVICE_TECH_ACCOUNT_CLIENT_ID
    }
  })
  
  if (!res.ok) {
    throw new Error('getAemAssetDataRapi request to ' + fetchUrl + ' failed with status code ' + res.status)
  }else{
    return await res.json()
  }
}

/***
 * Get AEM Asset presigned url
 * 
 * @param {string} aemHost aem host
 * @param {string} aemAssetPath aem asset path
 * @param {object} params action input parameters.
 * @param {object} logger logger object
 * 
 * @returns {string} presigned dowload url
 */
async function getAemAssetPresignedDownloadUrl(aemHost,aemAssetPath,params,logger){
  // get repo data
  let assetRepoData
  try {
    logger.debug(`getAemAssetPresignedDownloadUrl:getAemAssetDataRapi ${aemHost}${aemAssetPath}`)
    assetRepoData = await getAemAssetDataRapi(aemHost,aemAssetPath,params,logger) 
  } catch (error) {
    logger.error(`getAemAssetPresignedDownloadUrl:getAemAssetDataRapi request to ${aemHost}${aemAssetPath} failed with error ${error.message}`)
    throw new Error(`getAemAssetPresignedDownloadUrl:getAemAssetDataRapi request to ${aemHost}${aemAssetPath} failed with error ${error.message}`)
  }

  //get download link  TODO
  const fetchUrl = assetRepoData['_links']['http://ns.adobe.com/adobecloud/rel/download'].href
  const aemAuthToken = await getAemAuth(params,logger)

  try {
    const res = await fetch(fetchUrl, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + aemAuthToken,
        'Content-Type': 'application/json',
        'x-api-key': params.AEM_SERVICE_TECH_ACCOUNT_CLIENT_ID
      }
    })

    if (!res.ok) {
      throw new Error('getAemAssetPresignedDownloadUrl:getAemAssetDataRapi request to ' + fetchUrl + ' failed with status code ' + res.status)
    }else{
      const jsonResponse = await res.json()
      logger.debug(`getAemAssetPresignedDownloadUrl:getAemAssetDataRapi ${JSON.stringify(jsonResponse, null, 2)}`)
      return jsonResponse.href
    }
  } catch (error) {
    logger.error(`getAemAssetPresignedDownloadUrl:fetch presigned request to ${aemHost}${aemAssetPath} failed with error ${error.message}`)
    throw new Error(`getAemAssetPresignedDownloadUrl:fetch presigned request to ${aemHost}${aemAssetPath} failed with error ${error.message}`)
  }
}

/****
 * Write rendition to asset
 */
async function writeRenditionToAsset(aemHost,aemAssetPath,fileBinary,fileMimeType,params,logger){
  aemAssetPath = aemAssetPath.replace("/content/dam","/api/assets")
  if(aemAssetPath.indexOf("/api/assets") < 0){
    aemAssetPath = "/api/assets" + aemAssetPath
  }
  logger.debug("writeRenditionToAsset aemAssetPath: " + aemAssetPath)

  const fetchUrl = aemHost + aemAssetPath
  const aemAuthToken = await getAemAuth(params,logger)

  const res = await fetch(fetchUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + aemAuthToken,
      'Content-Type': fileMimeType
    },
    body:fileBinary
  })
  
  if (!res.ok) {
    throw new Error('request to ' + fetchUrl + ' failed with status code ' + res.status)
  }else{
    return await res.json()
  }
}

/***
 * Write comment to asset
 * 
 * @param {string} aemHost aem host
 * @param {string} aemAssetPath aem asset path
 * @param {string} comment comment to write
 * @param {string} annotations annotations to write or empty object {} if none
 * @param {string} fileMimeType file mime type, default is 'image/vnd.adobe.photoshop' TODO put in a lookup based on file type
 * @param {object} params action input parameters.
 * @param {object} logger logger object
 * 
 * @returns {object} resultData
 */
async function writeCommentToAsset(aemHost,aemAssetPath,comment,annotations,params,logger){
  aemAssetPath = aemAssetPath.replace("/content/dam","/api/assets")
  if(aemAssetPath.indexOf("/api/assets") < 0){
    aemAssetPath = "/api/assets" + aemAssetPath
  }
  aemAssetPath = aemAssetPath + "/comments/*"

  logger.debug("writeCommentToAsset aemAssetPath path is : " + aemAssetPath +  " we are starting the form build")
  const form = new FormData()
  form.append('message', comment)

  if(typeof annotations != null && typeof annotations === 'object' && Object.keys(annotations).length > 0){
    form.append('annotationData', annotations)
  }

  const fetchUrl = aemHost + aemAssetPath
  logger.debug("writeCommentToAsset fetchUrl: " + fetchUrl)

  const aemAuthToken = await getAemAuth(params,logger)
  logger.debug("writeCommentToAsset aemAuthToken: " + JSON.stringify(aemAuthToken, null, 2))

  const res = await fetch(fetchUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + aemAuthToken
    },
    body:form
  })
  logger.debug("writeCommentToAsset res: " + JSON.stringify(res)) 
  
  if (!res.ok) {
    throw new Error('request to ' + fetchUrl + ' writeCommentToAsset failed with status code ' + res.status)
  }else{
    return await res.json()
  }
}

/****
 * Write json express compatibility report to comment
 * 
 * @param {string} aemHost aem host
 * @param {string} aemAssetPath aem asset path
 * @param {object} jsonReport json report object
 * @param {object} params action input parameters.
 * @param {object} logger logger object
 * 
 * @returns {object} resultData
 */
async function writeJsonExpressCompatibiltyReportToComment(aemHost,aemAssetPath,jsonReport,params,logger){
  let myReport = `
    Artboard count: ${jsonReport.artboardCount}
    artboard count ok: ${jsonReport.artboardCountOk}
    bit depth: ${jsonReport.bitDepth}
    height: ${jsonReport.height}
    height ok: ${jsonReport.heightOk}
    icc profile name: ${jsonReport.iccProfileName}
    image mode: ${jsonReport.imageMode}
    image mode ok: ${jsonReport.imageModeOk}
    status: ${jsonReport.status}
    width: ${jsonReport.width}
    width ok: ${jsonReport.widthOk}
    smart object count: ${jsonReport.smartObjectCount}
    smart object count ok: ${jsonReport.smartObjectCountOk}
    layer count: ${jsonReport.layerCount}
    layer count ok: ${jsonReport.layerCountOk}
  `

  let annotations
  let returnData = await writeCommentToAsset(aemHost,aemAssetPath,myReport,annotations,params,logger)

  return returnData
}

/****
 * Write a tag onto an asset
 * 
 * @param {string} aemHost aem host
 * @param {string} aemAssetPath aem asset path
 * @param {object} tagPath tag path
 * @param {object} tagValue tag value
 * @param {object} params action input parameters.
 * @param {object} logger logger object
 * 
 * @returns {object} resultData
 * 
 * TODO: finsh
 */
async function addMetadataToAemAsset(aemHost,aemAssetPath,tagPath,tagValue,params,logger){
  const callData = JSON.stringify([
    {
      "op": "add",
      "path": tagPath,
      "value": tagValue
    }
  ])

  if(aemAssetPath.indexOf("/content/dam") < 0){
    aemAssetPath = "/content/dam" + aemAssetPath
  }

  logger.debug(`aemCscUtils:aemAssetAddMetadata call path prepped for  ${aemAssetPath}`)

  const aemAuthToken = await getAemAuth(params,logger)

  logger.debug(`aemCscUtils:aemAssetAddMetadata got auth ${JSON.stringify(aemAuthToken, null, 2)}`)
  let config = {
    method: 'patch',
    url: `${aemHost}/adobe/repository${aemAssetPath};resource=applicationmetadata`,
    headers: { 
      'X-Api-Key': params.AEM_SERVICE_TECH_ACCOUNT_CLIENT_ID, 
      'Content-Type': 'application/json-patch+json', 
      'Authorization': `Bearer ${aemAuthToken}`
    },
    data : callData
  };

  logger.debug(`aemCscUtils:aemAssetAddMetadata call config prepped ${JSON.stringify(config, null, 2) }`) 

  let response
  try {
    response = await axios.request(config)
    logger.debug(`aemCscUtils:aemAssetAddMetadata response: ${JSON.stringify(response.data, null, 2)}`)

    if (response.statusText !== 'OK') {
      throw new Error(`aemCscUtils:aemAssetAddMetadata request to ${config.url} failed with status code ${response.status} ${response.statusText}`)
    }else{
      return {"message":"success"}
    }
  } catch (error) {
    logger.error(`aemCscUtils:aemAssetAddMetadata request to ${config.url} failed ${JSON.stringify(error, null, 2)}`)
    if (error.response) {
      logger.error(`aemCscUtils:aemAssetAddMetadata error.response.data ${error.response.data}`)
      logger.error(`aemCscUtils:aemAssetAddMetadata error.response.status ${error.response.status}`)
      logger.error(`aemCscUtils:aemAssetAddMetadata error.response.headers ${error.response.headers}`)
    } else if (error.request) {
      logger.error(`aemCscUtils:aemAssetAddMetadata error.request ${error.request}`)
    } else {
      logger.error(`aemCscUtils:aemAssetAddMetadata request to ${config.url} failed ${error.message}`)
    }
    throw new Error(`aemCscUtils:aemAssetAddMetadata request to ${config.url} failed ${error.response}`)
  }
}

/****
 * Get AEM auth from right place
 */
async function getAemAuth(params,logger){
  if(params.AEM_AUTH_TYPE === 'server2server' || params.AEM_AUTH_TYPE === 'jwt'){
    //AEM auth key from cache 
    let aemAuthToken
    const state = await State.init()
    const stateAuth = await state.get(`aem-auth-key-${params.AEM_AUTH_TYPE}`)

    if(typeof stateAuth === 'undefined' || typeof stateAuth.value === 'undefined' || stateAuth.value === null){
      if(params.AEM_AUTH_TYPE === 'jwt'){
        //jwt type auth
        logger.debug("getAemAuth get jwt token");
        const authOptions = {
          "client_id": `${params.AEM_AUTH_CLIENT_ID}`,
          "client_secret": `${params.AEM_AUTH_CLIENT_SECRET}`,
          "technical_account_id": `${params.AEM_AUTH_TECH_ACCOUNT_ID}`,
          "org_id": `${params.ORG_ID}`,
          "meta_scopes": `${params.AEM_AUTH_SCOPES}`,
          "private_key": `${params.AEM_AUTH_PRIVATE_KEY}`
        };
        aemAuthToken = await getJwtToken(authOptions,logger);

      }else if(params.AEM_AUTH_TYPE === 'server2server'){
        //server2server type auth
        logger.debug("getAemAuth getServer2ServerToken",params)
        let scopesCleaned = JSON.parse(params.AUTH_SCOPES);
        let scopes = scopesCleaned.join(',');
        const orgs = params.ORG_ID;
        const clientId = params.API_KEY;
        const clientSecret = params.AUTH_CLIENT_SECRET;
        aemAuthToken = await getServer2ServerToken(clientId,clientSecret,orgs,scopes,logger);
      }else{
        logger.debug("getAemAuth get user token",params)
        aemAuthToken = await getBearerToken(params);
      }

      // cache the auth token so we don't have to get it every time
      await state.put(`aem-auth-key-${params.AEM_AUTH_TYPE}`, aemAuthToken, { ttl: 1320 });
    }else{
      logger.debug("getAemServiceAccountToken found a GOOD state key")
      //logger.debug("getAemServiceAccountToken state key value: " + stateAuth.value)
      aemAuthToken = stateAuth.value
    }
    return aemAuthToken
  }else{
    //user type auth
    logger.debug("getAemAuth getBearerToken")
    return getBearerToken(params)
  }
}

module.exports = {
  getAemAuth,
  getAemAssetData,
  writeCommentToAsset,
  writeJsonExpressCompatibiltyReportToComment,
  getAemAssetDataRapi,
  getAemAssetPresignedDownloadUrl,
  addMetadataToAemAsset
}


/***
 * TODO: add in the comments and annotations to the new UI.  Comments are not working in the new UI
 * 
 * Delhibabu Vengam bhanumoorthy
  4 days ago
  DEBUGGING  still not working
Comment creation API for Assets view UI - http://localhost:4502/adobe/collab/annots/id/content/dam/dbhanu/view.jpeg?api_version=1.x
asset path - /content/dam/dbhanu/view.jpeg -- This needs to be replaced with actual asset path
URI path - http://localhost:4502 -- This needs to be replaced with correct domain url
Sample Payload :
value : This holds actual comment
collab:source : identifier starting with bf6547f7 is the jcr:uuid of the asset which is present under the asset name. In this case its present under view.jpeg
Authentication : Bearer Token configured.
{
    "collab:body": {
        "dc:format": "text/plain",
        "value": "C1 comment"
    },
    "collab:motivation": "commenting",
    "collab:target": {
        "collab:source": "urn:aaid:aem:bf6547f7-5deb-4bed-9a30-7e048984b8e7",
        "collab:selector": {
            "collab:primarySelector":[
                {
                    "collab:type": "NodeSelector",
                    "collab:id":"1"
            }
            ],
            "collab:type": "node"
        }
    },
    "collab:mentions": []
}
 * 
 */