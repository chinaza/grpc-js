import {
  loadPackageDefinition,
  Server,
  ServerCredentials,
  ServerUnaryCall,
  ServerReadableStream,
  sendUnaryData,
  ServerWritableStream,
  GrpcObject,
  ServiceClientConstructor
} from '@grpc/grpc-js';
import protoLoader, { loadSync } from '@grpc/proto-loader';
import fs from 'fs';

interface ServerInit {
  protoDir?: string;
  protoOptions?: protoLoader.Options;
}

type HandlerMethod = (
  call:
    | ServerUnaryCall<any, any>
    | ServerReadableStream<any, any>
    | ServerWritableStream<any, any>,
  callback?: sendUnaryData<any>
) => void;

export default class GrpcServer {
  private protoOptions: protoLoader.Options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  };
  private server: Server;
  private proto?: GrpcObject;

  constructor({ protoDir, protoOptions }: ServerInit) {
    this.server = new Server({});

    if (protoDir) {
      const protoFiles = fs.readdirSync(protoDir).map((file) => {
        return `${protoDir}/${file}`;
      });
      this.setupProto(protoFiles, protoOptions);
    }
  }

  // eslint-disable-next-line no-use-before-define
  private static instance: GrpcServer;
  public static getInstance({
    protoDir,
    protoOptions
  }: ServerInit): GrpcServer {
    if (!this.instance) {
      this.instance = new GrpcServer({ protoDir, protoOptions });
    }

    return this.instance;
  }

  public setupProto(protoFiles: string[], protoOptions?: protoLoader.Options) {
    protoOptions = {
      ...this.protoOptions,
      ...protoOptions
    };
    const packageDef = loadSync(protoFiles, protoOptions);
    this.proto = loadPackageDefinition(packageDef);
  }

  public addService(
    serviceName: string,
    handler: Record<string, HandlerMethod>
  ) {
    if (!this.proto) throw new Error('No proto initialised');

    const service = (this.proto[serviceName] as ServiceClientConstructor)
      ?.service;

    if (!service) throw new Error('Invalid service name');

    this.server.addService(service, handler);
  }

  public listen(
    port: string,
    callback?: (error: Error | null, port: number) => void
  ) {
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      ServerCredentials.createInsecure(),
      (err, cbPort) => {
        console.log(`Server running at http://0.0.0.0:${port}`);
        this.server.start();
        if (callback) callback(err, cbPort);
      }
    );
  }
}
