# AWS Lambda Aggregator Patterns 

This is a CDK project that has basic implementations of an aggregator design pattern using HTTP and REST API Gateways.
Both use a custom authorizer that returns context data to a express function workflow to determine which Lambda function
to invoke.

## Useful commands

* `npx cdk deploy RestApiExpressStepFunctionStack` Deploy the REST API
* `npx cdk deploy HttpApiExpressStepFunctionStack` Deploy the HTTP API (Currently requires manual switch in console of integration types to the step function one)

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

### REST API Todo

### HTTP API Todo
* Need to work out how to use the @aws-cdk/aws-apigatewayv2-integrations-alpha library to add a step function integration. Currently, I am swapping this over manually in the console.
* Allow for nested json to parsed in request mapping. It fails when adding the whole request body. I assume this is due to nested JSON.
* Allow for output to be altered to lambda output. Currently, the whole step function output is returned in the API. Would need to filter this out and just return the desired response.
