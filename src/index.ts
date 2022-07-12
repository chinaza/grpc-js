import { credentials } from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import GrpcClient from './client';
import GrpcServer from './server';

interface ProtoParams {
  protoDir?: string;
  protoOptions?: protoLoader.Options;
}

interface ServerParams extends ProtoParams {}

interface ClientParams extends ProtoParams {
  uri?: string;
}

export type {
  ServerUnaryCall,
  ServerReadableStream,
  sendUnaryData,
  ServerWritableStream
} from '@grpc/grpc-js';

export function getServer(params: ServerParams) {
  const server = GrpcServer.getInstance(params);

  return {
    addService: server.addService.bind(server),
    listen: server.listen.bind(server)
  };
}

export function getClient(params: ClientParams) {
  const { protoDir, protoOptions } = params;
  const client = new GrpcClient({
    protoDir,
    protoOptions
  });
  return client;
}

export function getService(
  client: GrpcClient,
  serviceName: string,
  uri?: string
) {
  const Service = client.getService(serviceName);

  uri = uri || client.uri;
  if (!uri) throw new Error('Invalid uri passed');

  const service = new Service(uri, credentials.createInsecure());
  return service;
}
