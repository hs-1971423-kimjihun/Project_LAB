import logging
import httpx
import json
from typing import List, Optional
from datetime import date, datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Path, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncpg
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Database Configuration ---
DB_CONFIG = {
    "host": "43.200.33.77",
    "port": 5432,
    "user": "ubuntu",
    "password": "ubuntu",
    "database": "postgres"
}

# --- Pydantic Models ---
class Equipment(BaseModel):
    id: int
    company_id: int  
    equipment_name: str
    model_name: Optional[str]
    serial_number: Optional[str]
    purchase_date: Optional[date]

class EquipmentCreate(BaseModel):
    equipment_name: str
    model_name: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[date] = None

class Company(BaseModel):
    company_id: int  
    name: str
    address: str
    phone: str
    city: Optional[str] = None  # 주소에서 추출
    maintenance_start_date: Optional[date] = None
    maintenance_end_date: Optional[date] = None
    status: str  # "active", "inactive", "pending"
    equipment: List[Equipment] = []

class CompanyCreate(BaseModel):
    name: str
    address: str
    phone: str
    maintenance_start_date: Optional[date] = None
    maintenance_end_date: Optional[date] = None
    equipment: List[EquipmentCreate] = []

# --- Database Pool ---
db_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global db_pool
    db_pool = await asyncpg.create_pool(**DB_CONFIG)
    logger.info("Database pool created")
    yield
    # Shutdown
    await db_pool.close()
    logger.info("Database pool closed")

app = FastAPI(lifespan=lifespan)

# CORS 설정 (React 앱에서 API 호출을 위해)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 운영환경에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- NX-API Sandbox 정보 (기존 코드와 동일) ---
NXAPI_HOST = "https://sbx-nxos-mgmt.cisco.com"
NXAPI_USERNAME = "admin"
NXAPI_PASSWORD = "Admin_1234!"
NXAPI_ENDPOINT = f"{NXAPI_HOST}/ins"

# --- Helper Functions ---
def extract_city_from_address(address: str) -> str:
    """주소에서 도시명을 추출합니다."""
    # 광역시, 도, 특별시 등을 찾아서 추출
    city_keywords = [
        "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
        "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
    ]
    
    for keyword in city_keywords:
        if keyword in address:
            return keyword
    
    # 더 정교한 추출 (예: "서울특별시", "경기도" 등)
    if "서울특별시" in address:
        return "서울"
    elif "부산광역시" in address:
        return "부산"
    elif "대구광역시" in address:
        return "대구"
    elif "인천광역시" in address:
        return "인천"
    elif "광주광역시" in address:
        return "광주"
    elif "대전광역시" in address:
        return "대전"
    elif "울산광역시" in address:
        return "울산"
    elif "세종특별자치시" in address:
        return "세종"
    elif "경기도" in address:
        return "경기"
    elif "강원도" in address:
        return "강원"
    elif "충청북도" in address:
        return "충북"
    elif "충청남도" in address:
        return "충남"
    elif "전라북도" in address:
        return "전북"
    elif "전라남도" in address:
        return "전남"
    elif "경상북도" in address:
        return "경북"
    elif "경상남도" in address:
        return "경남"
    elif "제주특별자치도" in address:
        return "제주"
    
    return "기타"

def calculate_status(start_date: Optional[date], end_date: Optional[date]) -> str:
    """유지보수 날짜를 기반으로 상태를 계산합니다."""
    if not start_date:
        return "inactive"  # 시작일이 없으면 비활성
    
    today = date.today()
    
    if start_date > today:
        return "pending"  # 아직 시작 안함
    
    if end_date and end_date < today:
        return "inactive"  # 종료됨
    
    return "active"  # 진행 중

# --- API Endpoints ---
@app.get("/")
async def get_test_page():
    return {"message": "FastAPI NX-API backend with PostgreSQL is running."}

@app.get("/api/companies", response_model=List[Company])
async def get_companies():
    """모든 회사 정보와 장비 정보를 가져옵니다."""
    try:
        async with db_pool.acquire() as connection:
            # 회사 정보 가져오기
            companies_query = """
                SELECT company_id, name, address, phone, 
                       maintenance_start_date, maintenance_end_date
                FROM companies
                ORDER BY name
            """
            companies_rows = await connection.fetch(companies_query)
            
            # 장비 정보 가져오기
            equipment_query = """
                SELECT id, company_id, equipment_name, model_name, 
                       serial_number, purchase_date
                FROM equipment
                ORDER BY company_id, equipment_name
            """
            equipment_rows = await connection.fetch(equipment_query)
            
            # 데이터 구조화
            companies_dict = {}
            for row in companies_rows:
                status = calculate_status(
                    row['maintenance_start_date'], 
                    row['maintenance_end_date']
                )
                
                company = Company(
                    company_id=row['company_id'],
                    name=row['name'],
                    address=row['address'],
                    phone=row['phone'],
                    city=extract_city_from_address(row['address']),
                    maintenance_start_date=row['maintenance_start_date'],
                    maintenance_end_date=row['maintenance_end_date'],
                    status=status,
                    equipment=[]
                )
                companies_dict[row['company_id']] = company
            
            # 장비 정보를 회사별로 할당
            for row in equipment_rows:
                if row['company_id'] in companies_dict:
                    equipment = Equipment(
                        id=row['id'],
                        company_id=row['company_id'],
                        equipment_name=row['equipment_name'],
                        model_name=row['model_name'],
                        serial_number=row['serial_number'],
                        purchase_date=row['purchase_date']
                    )
                    companies_dict[row['company_id']].equipment.append(equipment)
            
            return list(companies_dict.values())
            
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/companies/{company_id}", response_model=Company)
async def get_company(company_id: str):
    """특정 회사의 상세 정보를 가져옵니다."""
    try:
        async with db_pool.acquire() as connection:
            # 회사 정보 가져오기
            company_query = """
                SELECT company_id, name, address, phone,
                       maintenance_start_date, maintenance_end_date
                FROM companies
                WHERE company_id = $1
            """
            company_row = await connection.fetchrow(company_query, company_id)
            
            if not company_row:
                raise HTTPException(status_code=404, detail="Company not found")
            
            # 장비 정보 가져오기
            equipment_query = """
                SELECT id, company_id, equipment_name, model_name, 
                       serial_number, purchase_date
                FROM equipment
                WHERE company_id = $1
                ORDER BY equipment_name
            """
            equipment_rows = await connection.fetch(equipment_query, company_id)
            
            # 데이터 구조화
            equipment_list = []
            for row in equipment_rows:
                equipment = Equipment(
                    id=row['id'],
                    company_id=row['company_id'],
                    equipment_name=row['equipment_name'],
                    model_name=row['model_name'],
                    serial_number=row['serial_number'],
                    purchase_date=row['purchase_date']
                )
                equipment_list.append(equipment)
            
            status = calculate_status(
                company_row['maintenance_start_date'], 
                company_row['maintenance_end_date']
            )
            
            company = Company(
                company_id=company_row['company_id'],
                name=company_row['name'],
                address=company_row['address'],
                phone=company_row['phone'],
                city=extract_city_from_address(company_row['address']),
                maintenance_start_date=company_row['maintenance_start_date'],
                maintenance_end_date=company_row['maintenance_end_date'],
                status=status,
                equipment=equipment_list
            )
            
            return company
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/cities")
async def get_cities():
    """모든 도시 목록을 가져옵니다."""
    try:
        async with db_pool.acquire() as connection:
            # 주소에서 도시를 추출하여 중복 제거
            query = """
                SELECT DISTINCT address
                FROM companies
            """
            rows = await connection.fetch(query)
            
            cities = set()
            for row in rows:
                city = extract_city_from_address(row['address'])
                if city != "기타":
                    cities.add(city)
            
            return sorted(list(cities))
            
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/companies", response_model=Company)
async def create_company(company_data: CompanyCreate):
    """새로운 회사와 장비 정보를 생성합니다."""
    try:
        async with db_pool.acquire() as connection:
            # 트랜잭션 시작
            async with connection.transaction():
                # 1. 회사 정보 삽입
                company_query = """
                    INSERT INTO companies (name, address, phone, 
                                         maintenance_start_date, maintenance_end_date)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING company_id, name, address, phone, 
                              maintenance_start_date, maintenance_end_date
                """
                company_row = await connection.fetchrow(
                    company_query,
                    company_data.name,
                    company_data.address,
                    company_data.phone,
                    company_data.maintenance_start_date,
                    company_data.maintenance_end_date
                )
                # 자동 생성된 company_id 가져오기
                generated_company_id = company_row['company_id']
                
                # 2. 장비 정보 삽입
                equipment_list = []
                # 2. 장비 정보 삽입 시 생성된 ID 사용
                for equip in company_data.equipment:
                    equipment_query = """
                        INSERT INTO equipment (company_id, equipment_name, model_name, 
                                             serial_number, purchase_date)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING id, company_id, equipment_name, model_name, 
                                  serial_number, purchase_date
                    """
                    equipment_row = await connection.fetchrow(
                        equipment_query,
                        generated_company_id,  # 생성된 ID 사용
                        equip.equipment_name,
                        equip.model_name,
                        equip.serial_number,
                        equip.purchase_date
                    )
                    
                    equipment_list.append(Equipment(
                        id=equipment_row['id'],
                        company_id=equipment_row['company_id'],
                        equipment_name=equipment_row['equipment_name'],
                        model_name=equipment_row['model_name'],
                        serial_number=equipment_row['serial_number'],
                        purchase_date=equipment_row['purchase_date']
                    ))
                
                # 3. 응답 데이터 구성
                status = calculate_status(
                    company_row['maintenance_start_date'],
                    company_row['maintenance_end_date']
                )
                
                company = Company(
                    company_id=company_row['company_id'],
                    name=company_row['name'],
                    address=company_row['address'],
                    phone=company_row['phone'],
                    city=extract_city_from_address(company_row['address']),
                    maintenance_start_date=company_row['maintenance_start_date'],
                    maintenance_end_date=company_row['maintenance_end_date'],
                    status=status,
                    equipment=equipment_list
                )
                
                return company
                
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=400, detail="Company ID already exists")
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# --- 기존 NX-API 함수 (변경 없음) ---
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
            verify=False
        ) as client:
            logger.info(f"Sending NX-API command to {NXAPI_ENDPOINT}: {command}")
            response = await client.post(NXAPI_ENDPOINT, json=payload, headers=headers, timeout=15.0)
            
            if response.status_code == 401:
                logger.error(f"NX-API Authentication Failed (401). Response headers: {response.headers}")
            
            response.raise_for_status() 

            response_data = response.json()

            if "result" in response_data and response_data["result"] and "body" in response_data["result"]:
                body_content = response_data["result"]["body"]
                
                logger.debug(f"NX-API response body type: {type(body_content)}")
                logger.debug(f"NX-API response body content: {body_content}")

                if isinstance(body_content, str):
                    return body_content
                elif isinstance(body_content, (dict, list)):
                    return json.dumps(body_content, indent=2, ensure_ascii=False)
                else:
                    return str(body_content)
                    
            elif "error" in response_data and response_data["error"]:
                error_info = response_data["error"]
                return f"NX-API Error: {error_info.get('message', 'Unknown error')} (Code: {error_info.get('code', 'N/A')})\nData: {error_info.get('data', '')}"
            else:
                return "NX-API Error: Unknown response format."
                
    except httpx.HTTPStatusError as e:
        logger.error(f"NX-API HTTPStatusError: {e.response.status_code} - {e.response.text}")
        return f"NX-API HTTP Error: {e.response.status_code} - Review credentials and server response. Response: {e.response.text}"
    except httpx.RequestError as e:
        logger.error(f"NX-API RequestError: {e}")
        return f"NX-API Request Error: Could not connect or SSL issue. Details: {str(e)}"
    except json.JSONDecodeError as e:
        logger.error(f"NX-API JSONDecodeError for command '{command}'. Raw response: {response.text if 'response' in locals() else 'N/A'}", exc_info=True)
        return f"NX-API Error: Failed to decode JSON response from device. Raw response: {response.text if 'response' in locals() else 'N/A'}"
    except Exception as e:
        logger.error(f"NX-API Unhandled exception: {e}", exc_info=True)
        return f"NX-API Unhandled Exception: {str(e)}"

# --- WebSocket endpoint (기존과 동일) ---
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
                    raw_nxapi_output = await execute_real_nxapi_command(command)
                    response_message = f"\n{raw_nxapi_output.strip()}"
            else:
                if command.strip().lower() == "show version": 
                    response_message = f"\nMock 'show version' for {device_id}"
                elif command.strip() == "":
                    response_message = ""
                else:
                    response_message = f"\nCommand '{command}' executed (simulated for {device_id})."
            
            if response_message.strip() == "":
                await websocket.send_text(f"{device_prompt}")
            else:
                if not response_message.endswith('\n'):
                    response_message += '\n'
                await websocket.send_text(f"{response_message}{device_prompt}")

    except WebSocketDisconnect:
        logger.info(f"Device '{device_id}': WebSocket connection closed.")
    except Exception as e:
        logger.error(f"Device '{device_id}': Error - {str(e)}", exc_info=True)
        try:
            await websocket.send_text(f"An error occurred: {str(e)}\n{device_prompt}")
        except Exception:
            pass 
    finally:
        logger.info(f"Device '{device_id}': Cleaned up WebSocket connection.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)