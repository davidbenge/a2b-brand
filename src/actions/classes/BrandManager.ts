import * as aioLogger from "@adobe/aio-lib-core-logging";
import { Brand } from "./Brand";
import { BRAND_STATE_PREFIX, BRAND_FILE_STORE_DIR } from "../constants";

export class BrandManager {
    private logger: any;
    private stateStore: any;
    private fileStore: any;

    constructor(logLevel: string) {
        this.logger = aioLogger("BrandManager", { level: logLevel || "info" });
        this.logger.debug('BrandManager constructor');
    }

    async getStateStore(): Promise<any> {
        if (!this.stateStore) {
            this.logger.debug('Storage lib imported');
            const stateLib = require('@adobe/aio-lib-state');
            try {
                this.stateStore = await stateLib.init();
                this.logger.debug('State store initialized');
            } catch (error) {
                this.logger.error(`Error initializing state store: ${error}`);
                throw new Error(`Error initializing state store: ${error}`);
            }
        }
        return this.stateStore;
    }

   async getFileStore(): Promise<any> {
        if (!this.fileStore) {
            this.logger.debug('File store not initialized');
            const filesLib = require('@adobe/aio-lib-files');
            try {
                this.fileStore = await filesLib.init();
                this.logger.debug('File store initialized');
            } catch (error) {
                this.logger.error(`Error initializing file store: ${error}`);
                throw new Error(`Error initializing file store: ${error}`);
            }
        }
        return this.fileStore;
    }

    async getBrand(bid: string): Promise<Brand> {
        this.logger.debug(`Getting brand ${bid} from state store`);
        const stateStore = await this.getStateStore();
        const brandString = await stateStore.get(`${BRAND_STATE_PREFIX}${bid}`);

        if (!brandString) {
            this.logger.debug(`brand ${bid} not found in state store, checking file store`);
            // lets check the file store for the brand
            const fileStore = await this.getFileStore();
            try {
                const buffer = await fileStore.read(`${BRAND_FILE_STORE_DIR}/${bid}.json`);
                const brandJson = JSON.parse(buffer.toString());
                this.logger.debug(`Brand found in file store for bid ${bid}: ${buffer.toString()}`);
                const foundBrand = Brand.fromJSON(brandJson);
                //load the Brand to state store
                await stateStore.put(`${BRAND_STATE_PREFIX}${bid}`, foundBrand.toJSONString());

                return foundBrand;
            } catch (error) {
                this.logger.error(`Brand not found in state store or file store for bid ${bid}: ${error}`);
                throw new Error(`Brand not found in state store or file store for bid ${bid}: ${error}`);
            }
        }else{
            const brandJson = JSON.parse(brandString);
            const brand = Brand.fromJSON(brandJson);
            return brand;
        }
    }

    /**
     * Save the brand to the state store and file store
     * 
     * @param brand - The brand to save
     * 
     * @returns brand : Brand
     */
    async saveBrand(brand: Brand): Promise<Brand> {
        this.logger.debug(`Saving brand ${brand.bid} to state store and file store`);
        // save to state store
        const stateStore = await this.getStateStore();
        const stateStoreKey = `${BRAND_STATE_PREFIX}${brand.bid}`;
        this.logger.debug(`Saving brand ${brand.bid} to state store with key ${stateStoreKey}`);
        
        await stateStore.put(stateStoreKey, brand.toJSONString());
        this.logger.debug(`Saved brand ${brand.bid} to state store`);

        // save to file store
        const fileStore = await this.getFileStore();
        await fileStore.write(`${BRAND_FILE_STORE_DIR}/${brand.bid}.json`, brand.toJSONString());
        this.logger.debug(`Saving brand ${brand.bid} to file store`);

        return brand;
    }

    /**
     * Delete the brand from the state store and file store
     * 
     * @param bid : string - The brand id to delete
     */
    async deleteBrand(bid: string): Promise<void> {
        // delete from state store
        const stateStore = await this.getStateStore();
        await stateStore.delete(`${BRAND_STATE_PREFIX}${bid}`);

        // delete from file store
        const fileStore = await this.getFileStore();
        await fileStore.delete(`${BRAND_FILE_STORE_DIR}/${bid}.json`);
    }

    /**
     * Get all brands from the state store
     * 
     * @returns Promise<Brand[]> - The brands
     */
    async getAllBrands(): Promise<Brand[]> {
        const fileStore = await this.getFileStore();
        const brandList = [];
        const brands = await fileStore.list(`${BRAND_FILE_STORE_DIR}/`);
        this.logger.debug(`Found ${brands.length} brands in file store at path ${BRAND_FILE_STORE_DIR}/`);

        for (const fileData of brands) {
            this.logger.debug(`Reading brand from file store`,fileData);
            var buffer: any;
            try {
                buffer = await fileStore.read(fileData.name);
                this.logger.debug(`Brand found in file store ${fileData.name}: ${buffer.toString()}`);
            } catch (error) {
                this.logger.warn(`Error reading brand from file store ${fileData.name}: ${error}`);
            }

            var brandJson: any;
            try{
                brandJson = JSON.parse(buffer.toString());
                this.logger.debug(`Brand JSON imported from file store ${fileData.name}`,brandJson);
            } catch (error) {
                this.logger.warn(`Error parsing brand from file store ${fileData.name}: ${error}`);
            }

            try {
                const brand = Brand.fromJSON(brandJson);
                brandList.push(brand);
            } catch (error) {
                this.logger.warn(`Error parsing brand from file store ${fileData.name}: ${error}`);
            }
        }
        return brandList;
    }
}