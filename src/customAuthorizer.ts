import * as AWS from 'aws-sdk';

export const index = async function(event: any, context: any, callback: any) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // A simple request-based authorizer example to demonstrate how to use request
    // parameters to allow or deny a request. In this example, a request is
    // authorized if the client-supplied headerauth1 header, QueryString1
    // query parameter, and stage variable of StageVar1 all match
    // specified values of 'headerValue1', 'queryValue1', and 'stageValue1',
    // respectively.

    // Retrieve request parameters from the Lambda function input:
    var headers = event.headers;
    var queryStringParameters = event.queryStringParameters;
    var pathParameters = event.pathParameters;
    var stageVariables = event.stageVariables;

    // Parse the input for the parameter values
    var tmp = event.methodArn.split(':');
    var apiGatewayArnTmp = tmp[5].split('/');
    var awsAccountId = tmp[4];
    var region = tmp[3];
    var restApiId = apiGatewayArnTmp[0];
    var stage = apiGatewayArnTmp[1];
    var method = apiGatewayArnTmp[2];
    var resource = '/'; // root resource
    if (apiGatewayArnTmp[3]) {
        resource += apiGatewayArnTmp[3];
    }

    // Perform authorization to return the Allow policy for correct parameters and
    // the 'Unauthorized' error, otherwise.
    var authResponse = {};
    var condition = {
        IpAddress: {}
    };
    console.log('headers', headers);
    if (headers.headerauth1 === "headerValue1"
        && queryStringParameters.QueryString1 === "queryValue1"
        && stageVariables.StageVar1 === "stageValue1") {
        callback(null, await generateAllow('me', event));
    } else if (headers.Authorization === "authme" || headers.authorization === "authme" ) {
        callback(null, await generateAllow('me', event));
    }
    else {
        callback("Unauthorized");
    }
}

// Help function to generate an IAM policy
var generatePolicy = async function(principalId: string, effect: string, event: any) {
    // Required output:
    var authResponse: any = {};
    authResponse.principalId = principalId;
    if (effect && event.methodArn) {
        var policyDocument: any = {};
        policyDocument.Version = '2012-10-17'; // default version
        policyDocument.Statement = [];
        var statementOne: any = {};
        statementOne.Action = 'execute-api:Invoke'; // default action
        statementOne.Effect = effect;
        statementOne.Resource = event.methodArn;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    const settings: any = await getSettingsFromDynamo(event.headers['x-meta-data']);
    // Optional output with custom properties of the String, Number or Boolean type.
    authResponse.context = {
        "financeProvider": settings['provider'],
    };
    console.log(authResponse);
    return authResponse;
}

var generateAllow = async function(principalId: string, event: any) {
    return await generatePolicy(principalId, 'Allow', event);
}

var generateDeny = async function(principalId: string, event: any) {
    return await generatePolicy(principalId, 'Deny', event);
}

const getSettingsFromDynamo = async (id: string) => {
    const dynamo = new AWS.DynamoDB.DocumentClient();
    const settings = await dynamo.get({
        TableName: process.env.SETTINGS_TABLE ?? '',
        Key: {
            id: id
        }
    }).promise();
    return settings['Item'];
};
