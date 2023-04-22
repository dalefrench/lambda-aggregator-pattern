# AWS Lambda Aggregator Patterns 

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template



`npx cdk deploy RestApiExpressStepFunctionStack`

`npx cdk deploy HttpApiExpressStepFunctionStack`

REST API Todo

HTTP API Todo
- Add step function as HTTP authoriser
- Allow for nested json to parsed in request mapping
- Allow for output to be change to lambda output.
