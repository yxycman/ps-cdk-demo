import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { IVpc, InstanceType, LaunchTemplate, Peer, Port, SecurityGroup, UserData, Vpc } from 'aws-cdk-lib/aws-ec2';
import {
  AsgCapacityProvider,
  Cluster,
  ContainerImage,
  Ec2TaskDefinition,
  EcsOptimizedImage,
  LogDrivers,
  TaskDefinition,
} from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedEc2Service } from 'aws-cdk-lib/aws-ecs-patterns';
import { ApplicationLoadBalancer, ListenerAction, ListenerCondition } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ManagedPolicy, Policy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';


export interface IUptimeKumaStackProps extends StackProps {
  /**
   * instance VPC ID.
   */
  vpcId: string;

  /**
   * instance Type.
   */
  instanceType: string;
}


export class UptimeKumaStack extends Stack {
  constructor(scope: Construct, id: string, props: IUptimeKumaStackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, 'VPC', { vpcId: props.vpcId });
    const cluster = new Cluster(this, 'Cluster', { vpc });
    const albSecurityGroup = new SecurityGroup(this, 'AlbSecurityGroup', { vpc });

    this.createAsg(cluster, albSecurityGroup, vpc, props);
    const taskDefinition = this.createEcs();
    this.createAlbService(cluster, taskDefinition, albSecurityGroup);
  }

  private createAsg(
    cluster: Cluster,
    albSecurityGroup: SecurityGroup,
    vpc: IVpc,
    props: IUptimeKumaStackProps,
  ): SecurityGroup {
    const role = new Role(this, 'EC2Role', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });
    role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedEC2InstanceDefaultPolicy'));
    role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceforEC2Role'));

    const securityGroup = new SecurityGroup(this, 'AsgSecurityGroup', { vpc });
    securityGroup.addIngressRule(Peer.securityGroupId(albSecurityGroup.securityGroupId), Port.allTcp(), 'ALB Access');

    const launchTemplate = new LaunchTemplate(this, 'LaunchTemplate', {
      role,
      securityGroup,
      launchTemplateName: 'UptimeKumaLaunchTemplate',
      machineImage: EcsOptimizedImage.amazonLinux2(),
      instanceType: new InstanceType(props.instanceType),
      userData: UserData.forLinux(),
    });

    const autoScalingGroup = new AutoScalingGroup(this, 'ASG', {
      vpc,
      launchTemplate,
      maxCapacity: 1,
      minCapacity: 1,
      newInstancesProtectedFromScaleIn: false,
      vpcSubnets: {
        availabilityZones: [vpc.availabilityZones[0]],
      },
    });

    const capacityProvider = new AsgCapacityProvider(this, 'AsgCapacityProvider', { autoScalingGroup });
    cluster.addAsgCapacityProvider(capacityProvider);

    return securityGroup;
  }

  private createEcs(): TaskDefinition {
    const escLogGroup = new LogGroup(this, 'LogGroup', {
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const taskRole = new Role(this, 'ECSTaskRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    taskRole.attachInlinePolicy(
      new Policy(this, 'LogGroupPolicy', {
        statements: [
          new PolicyStatement({
            actions: ['logs:PutLogEvents', 'logs:CreateLogStream'],
            resources: [escLogGroup.logGroupArn],
          }),
        ],
      }),
    );

    const taskDefinition = new Ec2TaskDefinition(this, 'Task', {
      taskRole,
    });

    taskDefinition.addContainer('Container', {
      image: ContainerImage.fromRegistry('louislam/uptime-kuma'),
      memoryLimitMiB: 3072,
      portMappings: [{ containerPort: 3001 }],
      logging: LogDrivers.awsLogs({ streamPrefix: 'main', logGroup: escLogGroup }),
    });

    return taskDefinition;
   }

  private createAlbService(
    cluster: Cluster,
    taskDefinition: TaskDefinition,
    albSecurityGroup: SecurityGroup,
  ): ApplicationLoadBalancer {
    const loadBalancedEcsService = new ApplicationLoadBalancedEc2Service(this, 'Service', {
      cluster,
      taskDefinition,
      enableECSManagedTags: true,
      desiredCount: 1,
      minHealthyPercent: 0,
    });
    
    loadBalancedEcsService.loadBalancer.addSecurityGroup(albSecurityGroup);

    loadBalancedEcsService.listener.addAction('DefaultAction', {
      action: ListenerAction.fixedResponse(404),
    });

    loadBalancedEcsService.listener.addTargetGroups('MyApplicationListenerRule', {
      priority: 1,
      conditions: [ListenerCondition.pathPatterns(['/*'])],
      targetGroups: [loadBalancedEcsService.targetGroup],
    });

    loadBalancedEcsService.targetGroup.configureHealthCheck({
      healthyHttpCodes: '200,302',
      path: '/',
      port: 'traffic-port',
      unhealthyThresholdCount: 5,
      timeout: Duration.seconds(5),
      healthyThresholdCount: 2 
    });

    return loadBalancedEcsService.loadBalancer;
 }
}
