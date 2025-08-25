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
        'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsIng1dSI6Imltc19uYTEta2V5LWF0LTEuY2VyIiwia2lkIjoiaW1zX25hMS1rZXktYXQtMSIsIml0dCI6ImF0In0.eyJpZCI6IjE3NTU2MjY1OTE1NzBfZGEwNzNiNjQtZDgzMS00YmIxLTk5ZWItODg5NzE5MTdmMjljX3V3MiIsInR5cGUiOiJhY2Nlc3NfdG9rZW4iLCJjbGllbnRfaWQiOiJleGNfYXBwIiwidXNlcl9pZCI6IjRDNkEyQTFBNjQwQzI2RDMwQTQ5NUZDOUA0YWFiMjcyMjY0MGMyNmQyNDk1ZmNhLmUiLCJzdGF0ZSI6IntcInNlc3Npb25cIjpcImh0dHBzOi8vaW1zLW5hMS5hZG9iZWxvZ2luLmNvbS9pbXMvc2Vzc2lvbi92MS9ZVFEwTVRVMVl6SXRNMlJoWlMwME56Vm1MVGxsTXpFdFpETXhZVFZrTXpJMk5HRmhMUzB5TWtFNU1UUTVSVFl4T0RReU5FWTVNRUUwT1RWRE1UaEFRV1J2WW1WSlJBXCJ9IiwiYXMiOiJpbXMtbmExIiwiYWFfaWQiOiIyMkE5MTQ5RTYxODQyNEY5MEE0OTVDMThAQWRvYmVJRCIsImN0cCI6MCwiZmciOiJaVzRYVzY3TFZMUDVNSFVLSE1RVjJYQUFQST09PT09PSIsInNpZCI6IjE3NTU1Nzg0MjM4NTVfOGJmNTUzZWMtZDVkYS00MjAzLTgzNTEtOGE2NGFmMDM2NTA3X3V3MiIsIm1vaSI6IjE1NzExMTBiIiwicGJhIjoiTWVkU2VjTm9FVixMb3dTZWMiLCJleHBpcmVzX2luIjoiODY0MDAwMDAiLCJjcmVhdGVkX2F0IjoiMTc1NTYyNjU5MTU3MCIsInNjb3BlIjoiYWIubWFuYWdlLGFjY291bnRfY2x1c3Rlci5yZWFkLGFkZGl0aW9uYWxfaW5mbyxhZGRpdGlvbmFsX2luZm8uam9iX2Z1bmN0aW9uLGFkZGl0aW9uYWxfaW5mby5wcm9qZWN0ZWRQcm9kdWN0Q29udGV4dCxhZGRpdGlvbmFsX2luZm8ucm9sZXMsQWRvYmVJRCxhZG9iZWlvLmFwcHJlZ2lzdHJ5LnJlYWQsYWRvYmVpb19hcGksYWVtLmZyb250ZW5kLmFsbCxhdWRpZW5jZW1hbmFnZXJfYXBpLGNyZWF0aXZlX2Nsb3VkLG1wcyxvcGVuaWQsb3JnLnJlYWQscHBzLnJlYWQscmVhZF9vcmdhbml6YXRpb25zLHJlYWRfcGMscmVhZF9wYy5hY3AscmVhZF9wYy5kbWFfdGFydGFuLHNlcnZpY2VfcHJpbmNpcGFscy53cml0ZSxzZXNzaW9uIn0.auuF-toX_K5CSsja7UxzW4jOUangu1KwwWfR8UdR_HdOE95hBh1Q4O-cO_VfBgc2g9Or6TOYIEmz6DfOhUJlm9tsNCX2oKpKAtyLX5tMyqBnGLXbFSqhonxKDuzsUTS2UEw1Tt7jcXh-2DdiXreJsnu9v6m_pK6Vw4uWgOzd5_foBcKvWvCB6L66UCcrwVfgqs_V5zJ3C4R8jcPvIUw0fHqOhhVVRfz79kh5hZ9O5bevCTtR8GsIqRk9zDbXu568w2QanoWxHdGbYxXB17IHWP8pDlcgY-oiUy91OvzHV92V4GBBjnkI1rXEzWgt-youbOc_LIVxG2bYg6GCNERzIg', 
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