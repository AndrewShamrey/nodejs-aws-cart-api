import { HttpApi, CorsHttpMethod } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { App, Stack, Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import * as dotenv from 'dotenv';

dotenv.config();

const STACK_NAME = `${process.env.COURSE_NAME}-${process.env.APP_NAME}-stack`;
const COMMON_LAMBDA_TIMEOUT = 29;

const app = new App();
const stack = new Stack(app, process.env.STACK_ID, {
  stackName: STACK_NAME,
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.DEFAULT_REGION,
  },
  description: 'The Cloud Formation Stack to manage Cart API resources',
});

const vpc = Vpc.fromLookup(stack, process.env.DEFAULT_VPC_FOR_LAMBDAS_ID, { vpcId: process.env.DEFAULT_VPC_ID });

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: Runtime.NODEJS_18_X,
  timeout: Duration.seconds(COMMON_LAMBDA_TIMEOUT),
  vpc,
  allowPublicSubnet: true,
  environment: {
    PG_HOST: process.env.PG_HOST,
    PG_PORT: process.env.PG_PORT,
    PG_USERNAME: process.env.PG_USERNAME,
    PG_PASSWORD: process.env.PG_PASSWORD,
    PG_DATABASE: process.env.PG_DATABASE,
    PG_PRODUCTS_TABLE: process.env.PG_PRODUCTS_TABLE,
    PG_STOCKS_TABLE: process.env.PG_STOCKS_TABLE,
    PG_CARTS_TABLE: process.env.PG_CARTS_TABLE,
    PG_CART_ITEMS_TABLE: process.env.PG_CART_ITEMS_TABLE,
    PG_ORDERS_TABLE: process.env.PG_ORDERS_TABLE,
    PG_USERS_TABLE: process.env.PG_USERS_TABLE,
    CART_AWS_REGION: process.env.DEFAULT_REGION,
  },
  bundling: {
    externalModules: [
      'pg-native',
      'sqlite3',
      'pg-query-stream',
      'oracledb',
      'better-sqlite3',
      'tedious',
      'mysql',
      'mysql2',
      'class-validator',
      'class-transformer',
      '@nestjs/websockets/socket-module',
      '@nestjs/microservices/microservices-module',
      '@nestjs/microservices',
    ],
  },
};

const wrapNestLambda = new NodejsFunction(stack, process.env.WRAP_NEST_LAMBDA_ID, {
  ...sharedLambdaProps,
  functionName: process.env.WRAP_NEST_LAMBDA_NAME,
  entry: 'src/main.ts',
  description: 'Lambda Function to wrap nest js application',
});

const api = new HttpApi(stack, process.env.API_ID, {
  corsPreflight: {
    allowHeaders: ['*'],
    allowOrigins: ['*'],
    allowMethods: [CorsHttpMethod.ANY],
  },
  description: 'API Gateway Proxy to manage requests to Nest application',
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    process.env.WRAP_NEST_LAMBDA_INTEGRATION,
    wrapNestLambda,
  ),
  path: '/{proxy+}',
});
