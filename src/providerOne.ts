import {APIGatewayProxyEvent} from 'aws-lambda';

export const index = async function (event: APIGatewayProxyEvent, context: any) {
    console.log('event', event);
    console.log('context', context);
    return {
        'message': 'provider one'
    }
}
