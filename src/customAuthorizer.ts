import * as AWS from 'aws-sdk';

export const index = async function(event: any, context: any, callback: any) {
    if (hasValidAuthHeaders(event.headers)) {
        callback(null, await generateAllow('setYourPrincipalIdHere', event));
    } else {
        callback("Unauthorized");
    }
}

// Help function to generate an IAM policy
const generatePolicy = async function(principalId: string, effect: string, event: any) {
    const authResponse: any = {};
    authResponse.principalId = principalId;
    if (effect && event.methodArn) {
        const policyDocument: any = {};
        policyDocument.Version = '2012-10-17'; // default version
        policyDocument.Statement = [];
        const statementOne: any = {};
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
    return authResponse;
}

const generateAllow = async function(principalId: string, event: any) {
    return await generatePolicy(principalId, 'Allow', event);
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

const hasValidAuthHeaders = function(headers: any) {
    const validHeaderValue = 'authme';
    return headers.Authorization === validHeaderValue || headers.authorization === validHeaderValue;
};
