import { Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
//import { BuildEnvironmentVariableType, BuildSpec, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { CodePipelineSource, CodePipeline, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { IUptimeKumaStackProps, UptimeKumaStack } from './stack';


export interface IUptimeKumaPipelineStackProps extends StackProps {
  /**
   * GitHub Repository string.
   */
  gitHubRepositoryString: string;

  /**
   * UptimeKuma deployment configuration.
   */
  uptimeKumaDeploymentConfig: IUptimeKumaStackProps[];
}


export interface IUptimeKumaPipelineStageProps extends StageProps {
  /**
   * UptimeKuma deployment configuration.
   */
  uptimeKumaDeploymentConfig: IUptimeKumaStackProps[];
}


export class UptimeKumaPipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: IUptimeKumaPipelineStageProps) {
    super(scope, id, props);

    props.uptimeKumaDeploymentConfig.forEach((deploymentConfig) => {
      new UptimeKumaStack(this, `UptimeKuma-${deploymentConfig.env?.account}-${deploymentConfig.env?.region}`, {
        stackName: `UptimeKuma-${deploymentConfig.env?.account}-${deploymentConfig.env?.region}`,
        description: 'The UptimeKuma stack',
        env: deploymentConfig.env,
        vpcId: deploymentConfig.vpcId,
        instanceType: deploymentConfig.instanceType,
      });
    });
  }
}


// Stack class to hold the pipeline
export class UptimeKumaPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: IUptimeKumaPipelineStackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'UptimeKumaPipeline', {
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

    const uptimeKumaWave = pipeline.addWave('UptimeKuma');
    uptimeKumaWave.addStage(
      new UptimeKumaPipelineStage(this, 'UptimeKuma', {
        env: props.env,
        uptimeKumaDeploymentConfig: props.uptimeKumaDeploymentConfig,
      }),
    );

    pipeline.buildPipeline();
  }
}
