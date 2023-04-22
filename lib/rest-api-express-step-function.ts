import {
    Aws,
    aws_apigateway,
    aws_dynamodb,
    aws_iam,
    aws_lambda_nodejs,
    aws_stepfunctions,
    Duration,
    RemovalPolicy,
    Stack,
    StackProps
} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {StateMachine} from "./resources/StateMachine";

export class RestApiExpressStepFunction extends Stack {

    private stateMachine: aws_stepfunctions.StateMachine;

    private settingsTable: aws_dynamodb.Table;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        this.createDynamoDbTable();
        this.createStateMachine();
        this.createApi();
    }

    private createApi() {
        const customAuthorizer = new aws_lambda_nodejs.NodejsFunction(this, 'customAuthorizer', {
            entry: 'src/customAuthorizer.ts',
            handler: 'index',
            environment: {
                SETTINGS_TABLE: this.settingsTable.tableName,
            },
        });
        this.settingsTable.grantReadData(customAuthorizer);

        const customRequestAuthorizer = new aws_apigateway.RequestAuthorizer(this, 'customRequestAuthorizer', {
            handler: customAuthorizer,
            identitySources: [
                aws_apigateway.IdentitySource.header('Authorization'),
                aws_apigateway.IdentitySource.header('x-meta-data')
            ],
            resultsCacheTtl: Duration.seconds(0),
        });

        const apiRole = new aws_iam.Role(this, 'apiRole', {
            roleName: 'RestApiAggregatorRole',
            assumedBy: new aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
            description: 'Role to allow a rest api to start a step function execution.',
            managedPolicies: []
        });

        apiRole.addToPolicy(new aws_iam.PolicyStatement({
            effect: aws_iam.Effect.ALLOW,
            actions: ['states:StartExecution', 'states:StartSyncExecution'],
            resources: [this.stateMachine.stateMachineArn]
        }));

        const API = new aws_apigateway.RestApi(this, "API", {
            defaultMethodOptions: {
                authorizer: customRequestAuthorizer,
            }
        });

        const apiRoute = API.root.addResource('api');
        const testRoute = apiRoute.addResource('test');
        // https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html
        testRoute.addMethod('POST', new aws_apigateway.Integration({
                type: aws_apigateway.IntegrationType.AWS,
                integrationHttpMethod: "POST",
                uri: `arn:aws:apigateway:${Aws.REGION}:states:action/StartSyncExecution`,
                options: {
                    credentialsRole: apiRole,
                    passthroughBehavior: aws_apigateway.PassthroughBehavior.NEVER,
                    requestTemplates: {
                        "application/json": `{
                          "input": "{\\"actionType\\": \\"create\\", \\"body\\": $util.escapeJavaScript($input.json('$')), \\"financeProvider\\": \\"$context.authorizer.financeProvider\\"}",
                          "stateMachineArn": "${this.stateMachine.stateMachineArn}"
                        }`
                    },
                    integrationResponses: [
                        {
                            selectionPattern: "200",
                            statusCode: "201",
                            responseTemplates: {
                                "application/json": `
                                  #set($inputRoot = $input.path('$'))
                
                                  #if($input.path('$.status').toString().equals("FAILED"))
                                    #set($context.responseOverride.status = 500)
                                    {
                                      "error": "$input.path('$.error')",
                                      "cause": "$input.path('$.cause')"
                                    }
                                  #else
                                    $input.path('$.output')
                                  #end
                                `
                            }
                        }
                    ]
                }
            }),
            {
                methodResponses: [
                    {
                        statusCode: "201"
                    }
                ]
            })
    }

    private createDynamoDbTable() {
        this.settingsTable = new aws_dynamodb.Table(this, 'Table', {
            partitionKey: {
                name: 'id',
                type: aws_dynamodb.AttributeType.STRING
            },
            billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY
        });
    };

    private createStateMachine() {
        const sm = new StateMachine(this, 'StateMachine');
        this.stateMachine = sm.stateMachine;
    }
}
