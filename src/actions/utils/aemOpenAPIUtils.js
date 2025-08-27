const axios = require('axios');
const path = require('path');
const { getJwtToken, getServer2ServerToken } = require('./adobeAuthUtils')
/***
 * fetches an asset
 * 
 * @param {string} uri aem asset path
 * @param {object} logger logger object
 * @returns {object} resultData
 */

async function fetchAssetFromPreassigned(params,logger){
    let data = JSON.stringify({
      "assetMetadata": {
        "dc:title": params.data.metadata["dc:description"],
        "xmp:Rating": 5,
        "prism:expirationDate": ""
      },
      "folder": "urn:aaid:aem:3eef3dc2-4141-44f8-8f7f-c931f9f29ea1",
      "files": [
        {
          "fileName": path.basename(params.data.asset_path),
          "assetMetadata": {
            "custom:test": "custom-metadata"
          },
          "mimeType": params.data.metadata["dc:format"],
          "fileSize": params.data.metadata["dam:size"],
          "url": params.data.asset_presigned_url
        }
      ]
    });
    
    logger.debug("getAemAuth getServer2ServerToken",params)
    let scopesCleaned = JSON.parse(params.S2S_SCOPES);
    let scopes = scopesCleaned.join(',');
    const orgs = params.ORG_ID;
    const clientId = params.S2S_CLIENT_ID;
    const clientSecret = params.S2S_CLIENT_SECRET;
    aemAuthToken = await getServer2ServerToken(clientId,clientSecret,orgs,scopes,logger);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://author-'+process.env.AIO_ASSET_SYNCH_TARGET_PROGRAM_ENVIRONMENT+'.adobeaemcloud.com/adobe/assets/import/fromUrl',        
      headers: { 
        'x-api-key': process.env.AGENCY_BASE_URL, 
        'authorization': aemAuthToken,
        'Content-Type': process.env.CONTENT_TYPE
      },
      data : data
    };
    
    axios.request(config)
    .then((response) => {
        logger.debug('Completed asset upload:',JSON.stringify(response.data));
    })
    .catch((error) => {
        logger.debug('error occured while uploading the file from pre-assigned URL:',error);
    });    
    return response.data;
}


module.exports = {
    fetchAssetFromPreassigned
}