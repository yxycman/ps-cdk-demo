import { App } from 'aws-cdk-lib';
import { LambdaHelloWorldPipelineStack, LambdaHelloWorldStack } from './lambda';
//import { UptimeKumaStack } from './uptimekuma';

const app = new App();
// for development, use account/region from cdk cli
const devEnv = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

new LambdaHelloWorldStack(app, 'LambdaHelloWorld', {
  description: 'Demo CDK Stack',
  env: devEnv,
  lambdaHelloWorldMessage: 'ProfiSea'
});

new LambdaHelloWorldPipelineStack(app, 'LambdaHelloWorldPipeline', {
  description: 'Demo CDK Stack',
  gitHubRepositoryString: 'yxycman/ps-cdk-demo',
  env: devEnv,
  lambdaHelloWorldDeploymentConfig: [
    {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
      lambdaHelloWorldMessage: 'ProfiSea in us-east-1',
    },
    {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-2' },
      lambdaHelloWorldMessage: 'ProfiSea in us-east-2',
    },
  ],
});

// new UptimeKumaStack(app, 'UptimeKumaStack', {
//   description: 'UptimeKuma CDK Stack',
//   env: devEnv,
//   instanceType: 't3.large',
//   vpcId: 'vpc-0c2485d43df151fed',
// });

app.synth();