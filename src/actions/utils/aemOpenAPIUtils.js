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
    let LOCAL_S2S_SCOPES='["AdobeID","openid","read_organizations","additional_info.projectedProductContext","additional_info.roles","adobeio_api","read_client_secret","manage_client_secrets","event_receiver_api","aem.folders","aem.assets.author"]';
    let scopesCleaned = JSON.parse(LOCAL_S2S_SCOPES);
    let scope = scopesCleaned.join(',');
    let orgs = params.ORG_ID;
    let clientId = params.S2S_CLIENT_ID;
    let clientSecret = params.S2S_CLIENT_SECRET;
    let s2sAuthenticationCredentials = {
      "client_id": clientId,
      "client_secret": clientSecret,
      "orgId": orgs,
      "scope": scope
    }

    aemAuthToken = await getServer2ServerToken(s2sAuthenticationCredentials,logger);

    logger.debug("getAemAuth process complete getServer2ServerToken:",aemAuthToken);

    let data = JSON.stringify({
      "assetMetadata": {
        "dc:title": params.data.metadata["dc:description"],
        "xmp:Rating": 5,
        "prism:expirationDate": ""
      },
      "folder": params.DESTINATION_FOLDER_ID,
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
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://author-'+params.AIO_ASSET_SYNCH_TARGET_PROGRAM_ENVIRONMENT+'.adobeaemcloud.com/adobe/assets/import/fromUrl',        
      headers: { 
        'x-api-key': params.S2S_API_KEY, 
        'authorization': 'Bearer '+aemAuthToken,
        'Content-Type': params.CONTENT_TYPE
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