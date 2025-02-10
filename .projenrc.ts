import { awscdk } from 'projen';
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.178.1',
  defaultReleaseBranch: 'main',
  name: 'MyProjenTestApp',
  projenrcTs: true,

  minNodeVersion: '22.13.1',
  maxNodeVersion: '22.13.1',
  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
  context: {
    '@aws-cdk/aws-ecs:deprecatedImdsBlocking': true,
    '@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature': true,
  },
});


project.package.addDevDeps('eslint@^8');
project.synth();