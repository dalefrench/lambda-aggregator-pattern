import {Construct} from 'constructs';
import {aws_lambda_nodejs, aws_logs, aws_stepfunctions, aws_stepfunctions_tasks, Duration} from "aws-cdk-lib";
import {LogLevel, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {RetentionDays} from "aws-cdk-lib/aws-logs";

export class ProviderExpressWorkflow extends Construct {
    public stateMachine: aws_stepfunctions.StateMachine;

    private logGroup: aws_logs.LogGroup;
    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.createLogGroup();
        const providerOneLambda = new aws_lambda_nodejs.NodejsFunction(this, 'providerOneLambda', {
            entry: 'src/providerOne.ts',
            handler: 'index'
        })
        const providerOneJob = new aws_stepfunctions_tasks.LambdaInvoke(this, 'providerOneJob', {
            lambdaFunction: providerOneLambda,
            outputPath: '$.Payload',
        });

        const providerTwoLambda = new aws_lambda_nodejs.NodejsFunction(this, 'providerTwoLambda', {
            entry: 'src/providerTwo.ts',
            handler: 'index'
        })
        const providerTwoJob = new aws_stepfunctions_tasks.LambdaInvoke(this, 'providerTwoJob', {
            lambdaFunction: providerTwoLambda,
            outputPath: '$.Payload',
        });

        const jobFailed = new aws_stepfunctions.Fail(this, 'Job Failed', {
            cause: 'Failed invalid finance provider.',
            error: 'providerChoice returned FAILED',
        });

        const providerChoice = new aws_stepfunctions.Choice(this, 'providerChoice', {
            comment: 'Choice to determine lambda function to run depending on finance provider.',
        }).when(aws_stepfunctions.Condition.stringEquals('$.financeProvider', 'provider_one'), providerOneJob)
            .when(aws_stepfunctions.Condition.stringEquals('$.financeProvider', 'provider_two'), providerTwoJob)
            .otherwise(jobFailed);

        this.stateMachine = new aws_stepfunctions.StateMachine(this, 'ProviderExpressWorkflow', {
            definition: providerChoice,
            stateMachineType: StateMachineType.EXPRESS,
            timeout: Duration.minutes(5),
            logs: {
                level: LogLevel.ALL,
                destination: this.logGroup,
                includeExecutionData: true,
            }
        });
    }

    private createLogGroup() {
        this.logGroup = new aws_logs.LogGroup(this, 'StateMachineLogGroup', {
            retention: RetentionDays.TWO_WEEKS
        });
    }
}
