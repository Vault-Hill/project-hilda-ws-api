from datetime import datetime
import json
import boto3
import os

def handler(event, context):
    callback_url = f"https://{event['requestContext']['domainName']}/{event['requestContext']['stage']}"
    connection_id = event['requestContext']['connectionId']
    payload = json.loads(event['body'])

    # Fetch session context from ElastiCache
    # =========================================
    # elasticache_client = boto3.client('elasticache')
    # session_context =  elasticache_client.getItem(
    #     TableName='context',
    #     Key={
    #     'Key': connection_id
    #     }
    # )

    # Deserialize the session context
    # ===============================
    # dialog = json.loads(session_context['Item']['Value'])

    # TODO: temporary, remove after ElastiCache is implemented
    dialog = [
        {
            "role": "system",
            "content":
                """
                    MTN has built strong core operations, which are underpinned by the largest fixed and mobile network in Africa; a large, connected registered customer base; an unparalleled registration and distribution network, as well as one of the strongest brands in our markets. Omowole Gbenga is the CEO of MTN Group. He has been with the Group since April 2017. He is a seasoned executive with a wealth of experience spanning 25 years. He has extensive experience in the telecommunications sector, having held senior leadership roles at Vodafone, Celtel, Safaricom and Vodacom. He has also served on various boards including Vodacom Group and Vodacom South Africa. He is a member of the Board of the GSMA and the Chairman of the MTN GlobalConnect Board.

                    DO NOT PREFIX YOUR RESPONSE WITH ANY PHRASE. The user does not need to know you're working with a context. Simply respond as appropriate.
                """,
        },
    ] 

    # Append new input to the previous inputs
    dialog.append({"role": "user", "content": payload['data']['message']})

    prompts = {
        "inputs": [dialog], 
        "parameters": {"max_new_tokens": 256, "top_p": 0.9, "temperature": 0.6},
    }

    endpoint_name = os.environ.get('MODEL_ENDPOINT_NAME')

    sagemaker_client = boto3.client("sagemaker-runtime")
    
    response = sagemaker_client.invoke_endpoint(
        EndpointName=endpoint_name,
        ContentType="application/json",
        Body=json.dumps(prompts),
        CustomAttributes="accept_eula=true"
    )

    response = response["Body"].read().decode("utf8")

    response = json.loads(response)

    generated_response = {
        "action": "prompt",
        "data": {
            "role": "Hilda",
            "message": response[0]['generation'],
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    }

    # Save updated session context back to ElastiCache
    # ================================================
    # dialog.append({"role": "assistant", "content": generated_response['data']['message']})
    # elasticache_client.putItem(
    #     TableName='context',
    #     Item={
    #         'Key': connection_id,
    #         'Value': json.dumps(dialog)
    #     }
    # )

    # Send response to connection
    apigatewaymanagementapi = boto3.client('apigatewaymanagementapi', endpoint_url=callback_url)

    apigatewaymanagementapi.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(generated_response)
        )

    return {
        'statusCode': 200
    }
