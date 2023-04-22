# AWS Lambda Aggregator Patterns 

This is a CDK project that has basic implementations of an aggregator design pattern using HTTP and REST API Gateways.
Both use a custom authorizer that returns context data to a express function workflow to determine which Lambda function
to invoke.

## Useful commands

* `npx cdk deploy RestApiExpressStepFunctionStack` Deploy the REST API
* `npx cdk deploy HttpApiExpressStepFunctionStack` Deploy the HTTP API

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

### REST API Todo

### HTTP API Todo
* Add step function as HTTP authoriser
* Allow for nested json to parsed in request mapping
*Allow for output to be change to lambda output.
