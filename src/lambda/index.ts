import { Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
import { Code, Runtime, Function as Function } from 'aws-cdk-lib/aws-lambda';
import { CodePipelineSource, CodePipeline, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';


export interface ILambdaHelloWorldPipelineStackProps extends StackProps {
  /**
   * GitHub Repository string.
   */
  gitHubRepositoryString: string;

  /**
   * LambdaHelloWorld deployment configuration.
   */
  lambdaHelloWorldDeploymentConfig: ILambdaHelloWorldStackProps[];
}


export interface ILambdaHelloWorldPipelineStageProps extends StageProps {
  /**
   * LambdaHelloWorld deployment configuration.
   */
  lambdaHelloWorldDeploymentConfig: ILambdaHelloWorldStackProps[];
}


export interface ILambdaHelloWorldStackProps extends StackProps {
  /**
   * LambdaHelloWorld message.
   */
  lambdaHelloWorldMessage: string;
}


export class LambdaHelloWorldStack extends Stack {
  constructor(scope: Construct, id: string, props: ILambdaHelloWorldStackProps) {
    super(scope, id, props);

    new Function(this, 'HelloWorldFunction', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('./src/lambda/assets'),
      handler: 'hw.handler',
      environment: { MESSAGE: props.lambdaHelloWorldMessage },
    });
  }
}


// Stage class to hold the LambdaHelloWorld stack
export class LambdaHelloWorldPipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: ILambdaHelloWorldPipelineStageProps) {
    super(scope, id, props);

    props.lambdaHelloWorldDeploymentConfig.forEach((deploymentConfig) => {
      new LambdaHelloWorldStack(this, `LambdaHelloWorld-${deploymentConfig.env?.account}-${deploymentConfig.env?.region}`, {
        stackName: `LambdaHelloWorld-${deploymentConfig.env?.account}-${deploymentConfig.env?.region}`,
        description: 'The LambdaHelloWorld stack',
        env: deploymentConfig.env,
        lambdaHelloWorldMessage: deploymentConfig.lambdaHelloWorldMessage,
      });
    });
  }
}


// Stack class to hold the pipeline for LambdaHelloWorld
export class LambdaHelloWorldPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: ILambdaHelloWorldPipelineStackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'LambdaHelloWorldPipeline', {
      crossAccountKeys: true,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(props.gitHubRepositoryString, 'main'),
        // Installing and building stack with projen
        commands: [
          'n auto',
          'npm ci',
          'npx projen build',
          'npx projen synth',
        ],
      }),
    });

    const LambdaHelloWorldWave = pipeline.addWave('LambdaHelloWorld');
    LambdaHelloWorldWave.addStage(
      new LambdaHelloWorldPipelineStage(this, 'LambdaHelloWorld', {
        env: props.env,
        lambdaHelloWorldDeploymentConfig: props.lambdaHelloWorldDeploymentConfig,
      }),
    );

    pipeline.buildPipeline();
  }
}
