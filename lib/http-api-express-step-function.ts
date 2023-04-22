import {
    aws_dynamodb,
    aws_iam,
    aws_lambda_nodejs,
    aws_stepfunctions,
    Duration,
    Stack,
    StackProps
} from 'aws-cdk-lib';
import {
    HttpApi,
    HttpIntegrationSubtype,
    HttpIntegrationType,
    HttpMethod,
    ParameterMapping,
    PayloadFormatVersion,
    HttpIntegration,
} from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
import {HttpLambdaIntegration} from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import {Construct} from 'constructs';
import {ProviderExpressWorkflow} from "./resources/ProviderExpressWorkflow";
import {HttpConnectionType} from "@aws-cdk/aws-apigatewayv2-alpha/lib/http/integration";
import {SettingsTable} from "./resources/SettingsTable";

export class HttpApiExpressStepFunction extends Stack {

    private settingsTable: aws_dynamodb.Table;

    private stateMachine: aws_stepfunctions.StateMachine;

    private apiRole: aws_iam.Role;
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        this.createStateMachine();
        this.createDynamoDbTable();
        this.createApiRole();
        this.createApi();
    }

    private createDynamoDbTable() {
        this.settingsTable = new SettingsTable(this, 'Table');
    };

    private createApiRole() {
        this.apiRole = new aws_iam.Role(this, 'apiRole', {
            roleName: 'HttpApiAggregatorRole',
            assumedBy: new aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
            description: 'Role to allow a http api to start a step function execution.',
            managedPolicies: []
        });

        this.apiRole.addToPolicy(new aws_iam.PolicyStatement({
            effect: aws_iam.Effect.ALLOW,
            actions: ['states:StartExecution', 'states:StartSyncExecution'],
            resources: [this.stateMachine.stateMachineArn]
        }));
    }

    private createApi() {
        const lmFn = new aws_lambda_nodejs.NodejsFunction(this, 'testLambda2', {
            entry: 'src/providerOne.ts',
            handler: 'index'
        })

        const customAuthorizer = new aws_lambda_nodejs.NodejsFunction(this, 'customAuthorizer', {
            entry: 'src/customAuthorizer.ts',
            handler: 'index',
            environment: {
                SETTINGS_TABLE: this.settingsTable.tableName,
            },
        });
        this.settingsTable.grantReadData(customAuthorizer);

        const authorizer = new HttpLambdaAuthorizer('CustomAuthorizer', customAuthorizer, {
            responseTypes: [HttpLambdaResponseType.IAM],
            resultsCacheTtl: Duration.seconds(0)
        });

        // Define API Gateway HTTP API
        const httpApi = new HttpApi(this, 'HttpApi');
        const testIntegration = new HttpLambdaIntegration('TestIntegration', lmFn);

        // todo currently I manually swapped the integration after deployment and it works. Need to figure out how I can
        // todo use @aws-cdk/aws-apigatewayv2-integrations-alpha to create the below integration.
        const stepFnIntegration = new HttpIntegration(this, 'stepint', {
            httpApi: httpApi,
            integrationType: HttpIntegrationType.AWS_PROXY,
            integrationSubtype: HttpIntegrationSubtype.STEPFUNCTIONS_START_SYNC_EXECUTION,
            connectionType: HttpConnectionType.INTERNET,
            payloadFormatVersion: PayloadFormatVersion.VERSION_1_0,
            credentials: {
                credentialsArn: this.apiRole.roleArn
            },
            parameterMapping: new ParameterMapping()
                .custom('StateMachineArn', this.stateMachine.stateMachineArn)
                .custom('Input', JSON.stringify({
                    'financeProvider': '${context.authorizer.financeProvider}',
                    'requestBody': '${request.body.message}' // todo Need to work out how to nest the whole request body and also near with the message value if it is a json object
                }))
        })

        httpApi.addRoutes({
            path: '/api/test',
            methods: [HttpMethod.POST],
            integration: testIntegration,
            authorizer: authorizer
        });
    }

    private createStateMachine() {
        const workflow = new ProviderExpressWorkflow(this, 'StateMachine');
        this.stateMachine = workflow.stateMachine;
    }
}
