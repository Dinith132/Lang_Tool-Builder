import requests
import websockets
import asyncio
import json

# Test REST endpoint
def test_rest_endpoint(query: str):
    url = "http://localhost:8000/api/query"
    payload = {"query": query}
    response = requests.post(url, json=payload)
    print(f"REST Response: {response.json()}")

# Test WebSocket endpoint
async def test_websocket_endpoint(query: str):
    async with websockets.connect("ws://localhost:8000/ws/query") as websocket:
        await websocket.send(query)
        while True:
            message = await websocket.recv()
            print(f"WebSocket Message: {json.loads(message)}")

# Run tests
if __name__ == "__main__":
    # Test REST
    # test_rest_endpoint("Who is president of srilaka?")
    
    # # Test WebSocket
    asyncio.run(test_websocket_endpoint("Who is Olivia Wilde's boyfriend?"))