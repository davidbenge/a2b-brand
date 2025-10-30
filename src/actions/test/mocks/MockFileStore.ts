/**
 * Mock File Store for testing classes that depend on @adobe/aio-lib-files
 * This simulates the file system API without requiring Azure storage access
 */

export interface MockFileData {
  name: string;
  creationTime: Date;
  lastModified: Date;
  etag: string;
  contentLength: number;
  contentType: string;
  isDirectory: boolean;
  isPublic: boolean;
  url: string;
  internalUrl?: string;
  content?: string | Buffer;
}

export class MockFileStore {
  private files: Map<string, MockFileData> = new Map();
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || console;
  }

  /**
   * Mock initialization - simulates filesLib.init()
   */
  async init(): Promise<MockFileStore> {
    this.logger.debug('MockFileStore initialized');
    return this;
  }

  /**
   * Mock write operation
   */
  async write(path: string, content: string | Buffer | NodeJS.ReadableStream): Promise<void> {
    if (typeof content === 'string' || Buffer.isBuffer(content)) {
      const fileData: MockFileData = {
        name: path,
        creationTime: new Date(),
        lastModified: new Date(),
        etag: `mock-etag-${Date.now()}`,
        contentLength: typeof content === 'string' ? content.length : content.byteLength,
        contentType: this.getContentType(path),
        isDirectory: false,
        isPublic: path.startsWith('public/'),
        url: `https://mock-storage.com/${path}`,
        internalUrl: `https://mock-internal-storage.com/${path}`,
        content: content
      };
      
      this.files.set(path, fileData);
      this.logger.debug(`MockFileStore: Wrote file ${path}`);
    } else {
      // Handle ReadableStream
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        content.on('data', (chunk: Buffer) => chunks.push(chunk));
        content.on('end', async () => {
          const buffer = Buffer.concat(chunks);
          await this.write(path, buffer);
          resolve();
        });
        content.on('error', reject);
      });
    }
  }

  /**
   * Mock read operation
   */
  async read(path: string): Promise<Buffer> {
    const fileData = this.files.get(path);
    if (!fileData) {
      throw new Error(`File not found: ${path}`);
    }
    
    if (typeof fileData.content === 'string') {
      return Buffer.from(fileData.content);
    } else if (Buffer.isBuffer(fileData.content)) {
      return fileData.content;
    }
    
    throw new Error(`No content available for file: ${path}`);
  }

  /**
   * Mock list operation
   */
  async list(path: string): Promise<MockFileData[]> {
    const results: MockFileData[] = [];
    
    if (path.endsWith('/')) {
      // Directory listing
      for (const [filePath, fileData] of this.files.entries()) {
        if (filePath.startsWith(path) && filePath !== path) {
          results.push(fileData);
        }
      }
    } else {
      // Single file listing
      const fileData = this.files.get(path);
      if (fileData) {
        results.push(fileData);
      }
    }
    
    this.logger.debug(`MockFileStore: Listed ${results.length} files for path ${path}`);
    return results;
  }

  /**
   * Mock delete operation
   */
  async delete(path: string): Promise<void> {
    if (path.endsWith('/')) {
      // Delete directory contents
      const filesToDelete: string[] = [];
      for (const [filePath] of this.files.entries()) {
        if (filePath.startsWith(path)) {
          filesToDelete.push(filePath);
        }
      }
      
      filesToDelete.forEach(filePath => this.files.delete(filePath));
      this.logger.debug(`MockFileStore: Deleted directory ${path} with ${filesToDelete.length} files`);
    } else {
      // Delete single file
      const deleted = this.files.delete(path);
      if (deleted) {
        this.logger.debug(`MockFileStore: Deleted file ${path}`);
      } else {
        this.logger.debug(`MockFileStore: File not found for deletion ${path}`);
      }
    }
  }

  /**
   * Mock getProperties operation
   */
  async getProperties(path: string): Promise<MockFileData> {
    const fileData = this.files.get(path);
    if (!fileData) {
      throw new Error(`File not found: ${path}`);
    }
    
    return fileData;
  }

  /**
   * Mock generatePresignURL operation
   */
  async generatePresignURL(path: string, options: { expiryInSeconds?: number; permissions?: string; urltype?: string } = {}): Promise<string> {
    const fileData = this.files.get(path);
    if (!fileData) {
      throw new Error(`File not found: ${path}`);
    }
    
    const expiry = options.expiryInSeconds || 3600;
    const timestamp = Date.now() + (expiry * 1000);
    const signature = `mock-signature-${timestamp}`;
    
    return `${fileData.url}?sig=${signature}&se=${timestamp}`;
  }

  /**
   * Mock createReadStream operation
   */
  async createReadStream(path: string): Promise<NodeJS.ReadableStream> {
    const fileData = this.files.get(path);
    if (!fileData) {
      throw new Error(`File not found: ${path}`);
    }
    
    const { Readable } = require('stream');
    const stream = new Readable();
    
    if (typeof fileData.content === 'string') {
      stream.push(fileData.content);
    } else if (Buffer.isBuffer(fileData.content)) {
      stream.push(fileData.content);
    }
    
    stream.push(null); // End of stream
    return stream;
  }

  /**
   * Mock copy operation
   */
  async copy(src: string, dest: string, options: { localSrc?: boolean; localDest?: boolean } = {}): Promise<void> {
    if (options.localSrc) {
      // Simulate uploading from local
      this.logger.debug(`MockFileStore: Copying from local ${src} to ${dest}`);
    } else if (options.localDest) {
      // Simulate downloading to local
      this.logger.debug(`MockFileStore: Copying from ${src} to local ${dest}`);
    } else {
      // Simulate remote copy
      const srcData = this.files.get(src);
      if (srcData) {
        await this.write(dest, srcData.content || '');
        this.logger.debug(`MockFileStore: Copied ${src} to ${dest}`);
      } else {
        throw new Error(`Source file not found: ${src}`);
      }
    }
  }

  /**
   * Helper method to get content type based on file extension
   */
  private getContentType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json':
        return 'application/json';
      case 'html':
        return 'text/html';
      case 'txt':
        return 'text/plain';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Helper method to seed the mock store with test data
   */
  seedWithTestData(testData: { [path: string]: string | Buffer }): void {
    Object.entries(testData).forEach(([path, content]) => {
      this.files.set(path, {
        name: path,
        creationTime: new Date(),
        lastModified: new Date(),
        etag: `mock-etag-${Date.now()}`,
        contentLength: typeof content === 'string' ? content.length : content.byteLength,
        contentType: this.getContentType(path),
        isDirectory: false,
        isPublic: path.startsWith('public/'),
        url: `https://mock-storage.com/${path}`,
        internalUrl: `https://mock-internal-storage.com/${path}`,
        content: content
      });
    });
  }

  /**
   * Helper method to clear all files (useful for test cleanup)
   */
  clear(): void {
    this.files.clear();
    this.logger.debug('MockFileStore: Cleared all files');
  }

  /**
   * Helper method to get file count (useful for assertions)
   */
  getFileCount(): number {
    return this.files.size;
  }

  /**
   * Helper method to check if file exists
   */
  fileExists(path: string): boolean {
    return this.files.has(path);
  }
}
