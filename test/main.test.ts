import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LambdaHelloWorldStack } from '../src/lambda';

test('Snapshot', () => {
  const app = new App();
  const stack = new LambdaHelloWorldStack(app, 'test', {
    description: 'LambdaHelloWorld CDK Stack',
    env: { account: '123456789012', region: 'us-east-1' },
    lambdaHelloWorldMessage: 'test',
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});