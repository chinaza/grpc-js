import {
  GrpcObject,
  loadPackageDefinition,
  ServiceClientConstructor
} from '@grpc/grpc-js';
import protoLoader, { loadSync } from '@grpc/proto-loader';
import fs from 'fs';

interface ClientInit {
  protoDir?: string;
  protoOptions?: protoLoader.Options;
  uri?: string;
}

export default class GrpcClient {
  private protoOptions: protoLoader.Options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  };
  private proto?: GrpcObject;
  public uri?: string;

  constructor({ protoDir, protoOptions, uri }: ClientInit) {
    this.uri = uri;
    if (protoDir) {
      const protoFiles = fs.readdirSync(protoDir).map((file) => {
        return `${protoDir}/${file}`;
      });
      this.setupProto(protoFiles, protoOptions);
    }
  }

  public setupProto(protoFiles: string[], protoOptions?: protoLoader.Options) {
    protoOptions = {
      ...this.protoOptions,
      ...protoOptions
    };
    const packageDef = loadSync(protoFiles, protoOptions);
    this.proto = loadPackageDefinition(packageDef);
  }

  public getService(serviceName: string): ServiceClientConstructor {
    if (!this.proto) throw new Error('No proto initialised');

    const Service = this.proto[serviceName] as ServiceClientConstructor;

    if (!Service) throw new Error('Invalid service name');

    return Service;
  }
}
