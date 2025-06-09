import logging
import httpx # NX-API 통신을 위해 추가
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Path
from fastapi.responses import HTMLResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# --- NX-API Sandbox 정보 ---
NXAPI_HOST = "https://sbx-nxos-mgmt.cisco.com" # HTTPS 사용 확인
NXAPI_USERNAME = "admin"
NXAPI_PASSWORD = "Admin_1234!" # 실제 운영에서는 환경 변수나 보안 저장소 사용 권장
NXAPI_ENDPOINT = f"{NXAPI_HOST}/ins"

# --- 간단한 HTML 테스트 페이지 (이전과 동일) ---
html = """...""" # 이전 HTML 코드와 동일하게 유지

@app.get("/")
async def get_test_page():
    return {"message": "FastAPI NX-API backend is running."}


async def execute_real_nxapi_command(command: str) -> str:
    """실제 NX-API Sandbox에 명령을 실행하고 결과를 반환합니다."""
    payload = {
        "jsonrpc": "2.0",
        "method": "cli",
        "params": {"cmd": command, "version": 1},
        "id": 1,
    }
    headers = {"Content-Type": "application/json-rpc"}

    logger.info(f"Attempting NX-API call with username: {NXAPI_USERNAME}")

    try:
        async with httpx.AsyncClient(
            auth=(NXAPI_USERNAME, NXAPI_PASSWORD),
            verify=False # SSL 검증 비활성화
        ) as client:
            logger.info(f"Sending NX-API command to {NXAPI_ENDPOINT}: {command}")
            response = await client.post(NXAPI_ENDPOINT, json=payload, headers=headers, timeout=15.0)
            
            if response.status_code == 401:
                logger.error(f"NX-API Authentication Failed (401). Response headers: {response.headers}")
            
            response.raise_for_status() 

            response_data = response.json()

            if "result" in response_data and response_data["result"] and "body" in response_data["result"]:
                body_content = response_data["result"]["body"]
                
                # 디버깅을 위해 body_content의 타입과 내용 로깅
                logger.debug(f"NX-API response body type: {type(body_content)}")
                logger.debug(f"NX-API response body content: {body_content}")

                if isinstance(body_content, str):
                    return body_content
                elif isinstance(body_content, (dict, list)):
                    # 딕셔너리나 리스트인 경우, JSON 문자열로 변환하여 반환
                    return json.dumps(body_content, indent=2, ensure_ascii=False)
                else:
                    # 예상치 못한 다른 타입인 경우, 문자열로 변환 시도
                    return str(body_content)
                    
            elif "error" in response_data and response_data["error"]:
                error_info = response_data["error"]
                # 이미 문자열로 구성되므로 추가 처리 불필요
                return f"NX-API Error: {error_info.get('message', 'Unknown error')} (Code: {error_info.get('code', 'N/A')})\nData: {error_info.get('data', '')}"
            else:
                return "NX-API Error: Unknown response format."
                
    except httpx.HTTPStatusError as e:
        logger.error(f"NX-API HTTPStatusError: {e.response.status_code} - {e.response.text}")
        return f"NX-API HTTP Error: {e.response.status_code} - Review credentials and server response. Response: {e.response.text}"
    except httpx.RequestError as e:
        logger.error(f"NX-API RequestError: {e}")
        return f"NX-API Request Error: Could not connect or SSL issue. Details: {str(e)}"
    except json.JSONDecodeError as e: # NX-API 응답이 JSON이 아닐 경우 발생 가능
        logger.error(f"NX-API JSONDecodeError for command '{command}'. Raw response: {response.text if 'response' in locals() else 'N/A'}", exc_info=True)
        return f"NX-API Error: Failed to decode JSON response from device. Raw response: {response.text if 'response' in locals() else 'N/A'}"
    except Exception as e:
        logger.error(f"NX-API Unhandled exception: {e}", exc_info=True) # 상세 스택 트레이스 로깅
        return f"NX-API Unhandled Exception: {str(e)}"


# websocket_endpoint 함수는 이전과 동일하게 유지합니다.
# ... (websocket_endpoint 함수 및 uvicorn 실행 부분은 이전과 동일하게 유지) ...
@app.websocket("/ws/{device_id}")
async def websocket_endpoint(websocket: WebSocket, device_id: str = Path(...)):
    await websocket.accept()
    logger.info(f"Device '{device_id}': WebSocket connection established.")

    if device_id == "real-san-device":
        device_prompt = "nx-sandbox# "
    else:
        device_prompt = f"{device_id.split('-')[0].lower() if '-' in device_id else 'switch'}# "
    
    try:
        await websocket.send_text(f"Successfully connected to device: {device_id}\n{device_prompt}")

        while True:
            command = await websocket.receive_text()
            logger.info(f"Device '{device_id}': Received command: '{command}'")

            response_message = ""
            if device_id == "real-san-device":
                if command.strip() == "":
                     response_message = ""
                else:
                    # execute_real_nxapi_command는 이제 항상 문자열을 반환합니다.
                    raw_nxapi_output = await execute_real_nxapi_command(command)
                    response_message = f"\n{raw_nxapi_output.strip()}" # .strip() 호출이 안전해짐
            else:
                # 다른 장비 시뮬레이션 로직
                if command.strip().lower() == "show version": 
                    response_message = f"\nMock 'show version' for {device_id}"
                elif command.strip() == "":
                    response_message = ""
                else:
                    response_message = f"\nCommand '{command}' executed (simulated for {device_id})."
            
            if response_message.strip() == "": # 여기의 .strip()도 안전해짐
                await websocket.send_text(f"{device_prompt}")
            else:
                if not response_message.endswith('\n'): # 여기의 .endswith()도 안전해짐
                    response_message += '\n'
                await websocket.send_text(f"{response_message}{device_prompt}")

    except WebSocketDisconnect:
        logger.info(f"Device '{device_id}': WebSocket connection closed.")
    except Exception as e:
        logger.error(f"Device '{device_id}': Error - {str(e)}", exc_info=True) # 상세 스택 트레이스 로깅
        try:
            await websocket.send_text(f"An error occurred: {str(e)}\n{device_prompt}")
        except Exception:
            pass 
    finally:
        logger.info(f"Device '{device_id}': Cleaned up WebSocket connection.")


if __name__ == "__main__":
    import uvicorn
    # 로그 레벨을 DEBUG로 설정하여 더 자세한 정보 확인 가능
    # uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="debug")
    uvicorn.run(app, host="0.0.0.0", port=8000)
