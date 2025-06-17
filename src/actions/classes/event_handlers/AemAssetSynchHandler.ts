/**
 * onAemProcComplete
 *
 * Used to filter all events down to just the asset events we want to evaluate.
 * After filtering we set state varibles to capture the AEM asset data.  We then request a presigned url for the target aem asset.
 * The last step is we kick off a asynchronous request to get the target assets psd manifest data
 *
 * we subscribe this action to the Assets processing complete event in Adobe IO developer console.
 *
 */

import * as stateLib from "@adobe/aio-lib-state";
import { IoEventHandler } from '../IoEventHandler';
import { IoCustomEventManager } from "../IoCustomEventManager";

export class AssetSynchEventHandler extends IoEventHandler {
  /*******
   * handleEvent - handle the event and see if the asset needs to be processed
   * 
   * @param event: any 
   * @returns Promise<any>
   *******/
  async handleEvent(event: any): Promise<any> {
    this.logger.info("Asset Synch Event Handler called",event);

    // todo:// look to see if we need to handle the event 
    if(event.type === 'aem.assets.asset.deleted'){
      this.logger.info("Asset deleted event",event);

      // do delete stuff here
    }else if(event.type === 'aem.assets.asset.metadata_updated'){
      this.logger.info("Asset metadata updated event",event);

<<<<<<< HEAD
      /*  Import and use the AemCscUtils class
      * @param {string} aemHost aem host
      * @param {string} aemAssetPath aem asset path
      * @param {object} params action input parameters.
      * @param {object} logger logger object
      */
      const aemHost = `https://${event.data.repositoryMetadata["repo:repositoryId"]}`;
      const aemAssetPath = event.data.repositoryMetadata["repo:path"];
      const aemAssetData = await getAemAssetData(aemHost,aemAssetPath,event,this.logger);
      this.logger.info("AssetSynchEventHandler aemAssetData from aemCscUtils getAemAssetData",aemAssetData);


      // does the asset have a the metadata for the brand?
      // a2b__synch_on_change
      // a2d__customers
      const metadata = aemAssetData["jcr:content"].metadata;
      if(metadata){
        if(metadata["a2b__synch_on_change"] && metadata["a2b__synch_on_change"] === "true" && metadata["a2d__customers"]){
          // loop over brands and send an event for each brand
          const customers = metadata["a2d__customers"];
          const customersArray = customers.split(",");
          for(const customer of customersArray){
            // set the brand id
            const brandId = customer;

            let eventData = {
              "brandId":brandId,
              "asset_id":aemAssetData["jcr:uuid"],
              "asset_path":aemAssetData["jcr:content"]["cq:parentPath"],
              "metadate":aemAssetData["jcr:content"].metadata
            };

            // has the asset been synched before?
            if(aemAssetData["jcr:content"].metadata["a2d__last_sync"]){
              // update event
              const assetSynchEventUpdate = new AssetSynchUpdateEvent(eventData);
              this.logger.info("AssetSynchEventHandler assetSynchEventUpdate",assetSynchEventUpdate);
              await this.eventManager.publishEvent(assetSynchEventUpdate);

              // update the last sync date in AEM data
              eventData.metadate["a2d__last_sync"] = new Date().toISOString();
            }else{
              // new event
              const assetSynchEventNew = new AssetSynchNewEvent(eventData);
              this.logger.info("AssetSynchEventHandler assetSynchEventNew",assetSynchEventNew);
              await this.eventManager.publishEvent(assetSynchEventNew);

               // update the last sync date in AEM data
              eventData.metadate["a2d__last_sync"] = new Date().toISOString();
            }

            // TODO: delete handle 
          }

        }else{
          this.logger.warn("AssetSynchEventHandler asset metadata not found",aemAssetPath);
        }

      }else{
        this.logger.warn("AssetSynchEventHandler asset metadata not found",aemAssetPath);
      }
=======
      // Do update stuff here
>>>>>>> bd12aa9 (eod)
    }else{
      this.logger.info("Asset event not handled",event);
    }

    return {
      statusCode: 200,
      body: {
        message: 'Asset event processed successfully',
      }
    }
  }
}