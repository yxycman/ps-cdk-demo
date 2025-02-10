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
  // context: {},

  pullRequestTemplateContents: [
    '# Description',
    '',
    '> The "IS THIS PR COMPLETE" Checklist:',
    '>',
    '> - [ ] Developer documentation updated',
    '> - [ ] Added a Jira issue reference to this PR',
    '',
    'Issue #, if available',
    '',
    'Please include a summary of the change and which issue is fixed.',
    '',
  ],
});

const excludeList = [
  'package-lock.json',
  'cdk.context.json',
  '.cdk.staging/',
  '.idea/',
  'cdk.out/',
  '.DS_Store',
  'test/__snapshots__/',
  '.vscode',
  'build',
  '.coverage',
];

project.gitignore.exclude(...excludeList);
project.package.addDevDeps('eslint@^8');
project.synth();