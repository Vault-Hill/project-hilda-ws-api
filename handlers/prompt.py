from datetime import datetime
import json
import boto3
import os

def handler(event, context):
    callback_url = f"https://{event['requestContext']['domainName']}/{event['requestContext']['stage']}"
    connection_id = event['requestContext']['connectionId']
    payload = json.loads(event['body'])

    # TODO: fetch previous inputs from ElastiCache
    previous_inputs = ""

    # Add the new input to the previous inputs
    previous_inputs += payload['data']['message']

    prompts = {
        "inputs": previous_inputs, 
        "parameters": {"max_new_tokens": 64, "top_p": 0.9, "temperature": 0.6, "return_full_text": False},
    }

    endpoint_name = os.environ.get('MODEL_ENDPOINT_NAME')

    client = boto3.client("sagemaker-runtime")
    
    response = client.invoke_endpoint(
        EndpointName=endpoint_name,
        ContentType="application/json",
        Body=json.dumps(prompts),
        CustomAttributes="accept_eula=true",
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

    # TODO: store new previous inputs in ElastiCache

    # Send response to connection
    apigatewaymanagementapi = boto3.client('apigatewaymanagementapi', endpoint_url=callback_url)

    apigatewaymanagementapi.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(generated_response)
        )

    return {
        'statusCode': 200
    }
