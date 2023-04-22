import {Construct} from 'constructs';
import {aws_dynamodb, RemovalPolicy} from "aws-cdk-lib";

export class SettingsTable extends aws_dynamodb.Table {

    constructor(scope: Construct, id: string) {
        super(scope, id, {
            partitionKey: {
                name: 'id',
                type: aws_dynamodb.AttributeType.STRING
            },
            billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.DESTROY
        });
    }
}
