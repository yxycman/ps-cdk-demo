## CDK demo for ProfiSea team with Projen for configuration management.
### Projen
https://github.com/projen/projen

### Download and install nvm:
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

### Download and install Node.js v22:
```
nvm install 22
npm install --global yarn ts-node
```

### Clone the repository and install the dependencies
```
git clone git@github.com:yxycman/ps-cdk-demo.git
yarn install --check-files
```

## Useful info
> [!IMPORTANT]  
> `github-token` secret with PAT is required in the Pipeline region

### Update the Projen configuration and build the project
```
npx projen && npx projen build
```

### Bootstrap multiple regions in the 307946657180 account
```
npx cdk bootstrap 307946657180/eu-central-1 307946657180/us-east-1 307946657180/us-east-2 --trust 307946657180 --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

### List existing stacks
```
npx cdk list
```

### CDK constructs I would check
https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines-readme.html
https://docs.aws.amazon.com/cdk/api/v2/docs/aws-lambda-python-alpha-readme.html
https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.custom_resources.AwsSdkCall.html


> [!NOTE]  
> Also find the UptimeKuma setup with CDK (no persistent storage)
