#!/usr/bin/env python3
"""
Cisco 샌드박스 환경에서 SNMP 설정 및 테스트를 수행하는 Python 스크립트

필요한 라이브러리 설치:
pip install requests easysnmp
또는
pip install requests pysnmp-ng
"""

import json
import requests
import urllib3
import socket
import struct
import time

# SNMP 라이브러리 import (선택적)
try:
    from pysnmp.hlapi import (
        getCmd, nextCmd, SnmpEngine, CommunityData, 
        UdpTransportTarget, ContextData, ObjectType, ObjectIdentity
    )
    PYSNMP_AVAILABLE = True
except ImportError:
    PYSNMP_AVAILABLE = False

try:
    from easysnmp import Session
    EASYSNMP_AVAILABLE = True
except ImportError:
    EASYSNMP_AVAILABLE = False

# SSL 경고 비활성화 (샌드박스 환경용)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class CiscoSandboxSNMP:
    def __init__(self):
        # Cisco Sandbox 설정
        self.NXAPI_HOST_URL = "https://sbx-nxos-mgmt.cisco.com"
        self.NXAPI_USERNAME = "admin"
        self.NXAPI_PASSWORD = "Admin_1234!"
        self.NXAPI_ENDPOINT_URL = f"{self.NXAPI_HOST_URL}/ins"
        
        # SNMP 설정
        self.SNMP_HOST = "sbx-nxos-mgmt.cisco.com"
        self.SNMP_PORT = 161
        self.SNMP_COMMUNITY = "MyPythonTestRO"
        
        # 세션 생성
        self.session = requests.Session()
        self.session.auth = (self.NXAPI_USERNAME, self.NXAPI_PASSWORD)
        self.session.verify = False
        self.session.headers.update({
            'Content-Type': 'application/json'
        })

    def send_nxapi_command(self, commands):
        """NX-API를 통해 명령어 전송"""
        if isinstance(commands, str):
            commands = [commands]
        
        payload = {
            "ins_api": {
                "version": "1.0",
                "type": "cli_conf",
                "chunk": "0",
                "sid": "1",
                "input": "; ".join(commands),
                "output_format": "json"
            }
        }
        
        try:
            response = self.session.post(self.NXAPI_ENDPOINT_URL, 
                                       data=json.dumps(payload))
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"NX-API 명령 실행 오류: {e}")
            return None

    def configure_snmp(self):
        """SNMP 설정 구성 (상세 설정)"""
        print("SNMP 서비스를 활성화하고 설정을 구성합니다...")
        print("-" * 50)
        
        # 1단계: SNMP 기능 활성화
        print("1단계: SNMP 기능 활성화...")
        feature_commands = [
            "configure terminal",
            "feature snmp",
            "exit"
        ]
        
        result = self.send_nxapi_command(feature_commands)
        if result:
            print("✅ SNMP 기능 활성화 완료")
        else:
            print("❌ SNMP 기능 활성화 실패")
            return False
        
        # 2단계: SNMP 커뮤니티 및 기본 설정
        print("2단계: SNMP 커뮤니티 및 기본 설정...")
        community_commands = [
            "configure terminal",
            f"snmp-server community {self.SNMP_COMMUNITY} group network-operator",
            f"snmp-server community public group network-operator",  # 추가 테스트용
            "snmp-server contact admin@company.com",
            "snmp-server location Cisco-Sandbox-Lab",
            "exit"
        ]
        
        result = self.send_nxapi_command(community_commands)
        if result:
            print("✅ SNMP 커뮤니티 설정 완료")
        else:
            print("❌ SNMP 커뮤니티 설정 실패")
            return False
        
        # 3단계: SNMP 서버 추가 설정
        print("3단계: SNMP 서버 추가 설정...")
        server_commands = [
            "configure terminal",
            "snmp-server enable traps",
            "snmp-server enable traps bgp",
            "snmp-server enable traps entity",
            "snmp-server enable traps license",
            "snmp-server enable traps bridge",
            "exit"
        ]
        
        result = self.send_nxapi_command(server_commands)
        if result:
            print("✅ SNMP 서버 추가 설정 완료")
        else:
            print("⚠️ SNMP 서버 추가 설정 실패 (계속 진행)")
        
        # 4단계: 설정 저장
        print("4단계: 설정 저장...")
        save_commands = ["copy running-config startup-config"]
        
        result = self.send_nxapi_command(save_commands)
        if result:
            print("✅ 설정 저장 완료")
        else:
            print("⚠️ 설정 저장 실패 (계속 진행)")
        
        print("-" * 50)
        print("✅ SNMP 설정이 완료되었습니다.")
        return True

    def verify_snmp_config(self):
        """SNMP 설정 상세 확인"""
        print("\nSNMP 설정 상태를 상세히 확인합니다...")
        print("-" * 50)
        
        # 1. SNMP 기능 상태 확인
        print("1. SNMP 기능 상태 확인:")
        self._check_command("show feature | include snmp")
        
        # 2. SNMP 커뮤니티 확인
        print("\n2. SNMP 커뮤니티 확인:")
        self._check_command("show snmp community")
        
        # 3. SNMP 연락처 및 위치 확인
        print("\n3. SNMP 시스템 정보 확인:")
        self._check_command("show snmp contact")
        self._check_command("show snmp location")
        
        # 4. SNMP 서버 상태 확인
        print("\n4. SNMP 서버 상태 확인:")
        self._check_command("show snmp")
        
        # 5. SNMP 프로세스 확인
        print("\n5. SNMP 프로세스 확인:")
        self._check_command("show processes | include snmp")
        
        # 6. SNMP 통계 확인
        print("\n6. SNMP 통계 확인:")
        self._check_command("show snmp stats")
        
        print("-" * 50)
        print("✅ SNMP 설정 확인이 완료되었습니다.")

    def _check_command(self, command):
        """개별 명령어 실행 및 결과 출력"""
        payload = {
            "ins_api": {
                "version": "1.0",
                "type": "cli_show",
                "chunk": "0",
                "sid": "1",
                "input": command,
                "output_format": "json"
            }
        }
        
        try:
            response = self.session.post(self.NXAPI_ENDPOINT_URL, 
                                       data=json.dumps(payload))
            if response.status_code == 200:
                result = response.json()
                print(f"  ✅ {command}: 성공")
                # 결과 출력 (간단하게)
                if 'ins_api' in result and 'outputs' in result['ins_api']:
                    outputs = result['ins_api']['outputs']
                    if outputs and 'body' in outputs[0]:
                        body = outputs[0]['body']
                        if isinstance(body, dict):
                            # 주요 정보만 출력
                            for key, value in body.items():
                                if isinstance(value, (str, int, bool)):
                                    print(f"     {key}: {value}")
                        elif isinstance(body, str) and body.strip():
                            print(f"     결과: {body[:100]}...")
            else:
                print(f"  ❌ {command}: 실패 ({response.status_code})")
        except Exception as e:
            print(f"  ❌ {command}: 오류 - {e}")

    def restart_snmp_service(self):
        """SNMP 서비스 재시작 시도"""
        print("\nSNMP 서비스 재시작을 시도합니다...")
        print("-" * 50)
        
        # NX-OS에서는 feature를 끄고 다시 켜는 방식으로 재시작
        restart_commands = [
            "configure terminal",
            "no feature snmp",
            "feature snmp",
            "exit"
        ]
        
        result = self.send_nxapi_command(restart_commands)
        if result:
            print("✅ SNMP 서비스 재시작 완료")
            # 재시작 후 잠시 대기
            print("⏱️ 서비스 안정화를 위해 5초 대기 중...")
            time.sleep(5)
            return True
        else:
            print("❌ SNMP 서비스 재시작 실패")
            return False

    def test_easysnmp(self):
        """easysnmp 라이브러리 사용 테스트"""
        if not EASYSNMP_AVAILABLE:
            print("easysnmp 라이브러리가 설치되지 않았습니다.")
            print("설치 명령: pip install easysnmp")
            return False
            
        try:
            print("\n[EasySNMP] SNMP 테스트를 시작합니다...")
            print(f"대상 호스트: {self.SNMP_HOST}")
            print(f"커뮤니티: {self.SNMP_COMMUNITY}")
            print("-" * 50)
            
            # SNMP 세션 생성
            session = Session(hostname=self.SNMP_HOST, 
                            community=self.SNMP_COMMUNITY, 
                            version=2)
            
            # 테스트할 OID들
            test_oids = [
                ('1.3.6.1.2.1.1.1.0', 'System Description'),
                ('1.3.6.1.2.1.1.3.0', 'System Uptime'),
                ('1.3.6.1.2.1.1.4.0', 'System Contact'),
                ('1.3.6.1.2.1.1.5.0', 'System Name'),
                ('1.3.6.1.2.1.1.6.0', 'System Location'),
            ]
            
            success_count = 0
            for oid, description in test_oids:
                try:
                    result = session.get(oid)
                    print(f"{description}: {result.value}")
                    success_count += 1
                except Exception as e:
                    print(f"{description} ({oid}): 오류 - {e}")
            
            print("-" * 50)
            print(f"EasySNMP 테스트 결과: {success_count}/{len(test_oids)} 성공")
            return success_count > 0
            
        except Exception as e:
            print(f"EasySNMP 테스트 중 오류: {e}")
            return False

    def test_pysnmp_ng(self):
        """pysnmp-ng 라이브러리 사용 테스트"""
        if not PYSNMP_AVAILABLE:
            print("pysnmp 또는 pysnmp-ng 라이브러리가 제대로 설치되지 않았습니다.")
            print("설치 명령: pip install pysnmp 또는 pip install pysnmp-ng")
            return False
            
        try:
            print("\n[PySNMP-NG] SNMP 테스트를 시작합니다...")
            print(f"대상 호스트: {self.SNMP_HOST}")
            print(f"커뮤니티: {self.SNMP_COMMUNITY}")
            print("-" * 50)
            
            # 테스트할 OID들
            test_oids = [
                ('1.3.6.1.2.1.1.1.0', 'System Description'),
                ('1.3.6.1.2.1.1.3.0', 'System Uptime'),
                ('1.3.6.1.2.1.1.4.0', 'System Contact'),
                ('1.3.6.1.2.1.1.5.0', 'System Name'),
                ('1.3.6.1.2.1.1.6.0', 'System Location'),
            ]
            
            success_count = 0
            for oid, description in test_oids:
                try:
                    iterator = getCmd(
                        SnmpEngine(),
                        CommunityData(self.SNMP_COMMUNITY),
                        UdpTransportTarget((self.SNMP_HOST, self.SNMP_PORT)),
                        ContextData(),
                        ObjectType(ObjectIdentity(oid))
                    )
                    
                    errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
                    
                    if errorIndication:
                        print(f"{description}: 오류 - {errorIndication}")
                    elif errorStatus:
                        print(f"{description}: 오류 - {errorStatus.prettyPrint()}")
                    else:
                        for varBind in varBinds:
                            print(f"{description}: {varBind[1]}")
                            success_count += 1
                            
                except Exception as e:
                    print(f"{description} ({oid}): 예외 - {e}")
            
            print("-" * 50)
            print(f"PySNMP-NG 테스트 결과: {success_count}/{len(test_oids)} 성공")
            return success_count > 0
            
        except Exception as e:
            print(f"PySNMP-NG 테스트 중 오류: {e}")
            return False

    def create_snmp_packet(self, oid, community):
        """간단한 SNMP GET 패킷 생성"""
        # SNMP v2c GET 패킷 구조를 직접 생성
        # 이는 매우 기본적인 구현으로, 실제 프로덕션에서는 적절한 라이브러리를 사용해야 합니다.
        
        # OID를 바이트로 변환
        oid_parts = [int(x) for x in oid.split('.')]
        oid_bytes = b''
        for part in oid_parts:
            if part < 128:
                oid_bytes += bytes([part])
            else:
                # 큰 숫자는 여러 바이트로 인코딩 (간단화된 버전)
                oid_bytes += bytes([part])
        
        # 커뮤니티 스트링
        community_bytes = community.encode('ascii')
        
        # 기본적인 SNMP v2c GET 패킷 헤더
        # 실제로는 더 복잡한 ASN.1 인코딩이 필요합니다
        packet = (
            b'\x30'  # SEQUENCE
            + bytes([0x20 + len(community_bytes) + len(oid_bytes)])  # 길이 (추정)
            + b'\x02\x01\x01'  # 버전 (v2c = 1)
            + b'\x04' + bytes([len(community_bytes)]) + community_bytes  # 커뮤니티
            + b'\xa0\x10'  # PDU 타입 (GET)
            + b'\x02\x01\x01'  # Request ID
            + b'\x02\x01\x00'  # Error Status
            + b'\x02\x01\x00'  # Error Index
            + b'\x30\x08'  # Variable bindings
            + b'\x30\x06'  # Variable binding
            + b'\x06' + bytes([len(oid_bytes)]) + oid_bytes  # OID
            + b'\x05\x00'  # NULL value
        )
        
        return packet

    def test_raw_snmp(self):
        """원시 소켓을 사용한 SNMP 테스트 (개선된 패킷)"""
        print("\n[Raw Socket] SNMP 연결 테스트를 시작합니다...")
        print("-" * 50)
        
        try:
            # UDP 소켓 생성
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(10)
            
            # 더 정확한 SNMP v2c GET 패킷 생성 (시스템 설명 조회)
            community = self.SNMP_COMMUNITY.encode('ascii')
            
            # SNMP 패킷 구성 요소
            # 1. OID: 1.3.6.1.2.1.1.1.0 (sysDescr)
            oid_bytes = bytes([0x2b, 0x06, 0x01, 0x02, 0x01, 0x01, 0x01, 0x00])
            
            # 2. Variable binding
            varbind = (
                bytes([0x30, 0x0c]) +  # SEQUENCE (variable binding)
                bytes([0x06, 0x08]) +  # OBJECT IDENTIFIER (length 8)
                oid_bytes +            # OID
                bytes([0x05, 0x00])    # NULL
            )
            
            # 3. Variable bindings list
            varbinds = (
                bytes([0x30, len(varbind)]) +  # SEQUENCE (varbinds)
                varbind
            )
            
            # 4. PDU
            pdu_content = (
                bytes([0x02, 0x01, 0x01]) +    # Request ID
                bytes([0x02, 0x01, 0x00]) +    # Error status
                bytes([0x02, 0x01, 0x00]) +    # Error index
                varbinds
            )
            pdu = bytes([0xa0, len(pdu_content)]) + pdu_content  # GetRequest PDU
            
            # 5. Community
            community_part = bytes([0x04, len(community)]) + community
            
            # 6. Version
            version = bytes([0x02, 0x01, 0x01])  # SNMPv2c
            
            # 7. 전체 패킷
            message_content = version + community_part + pdu
            snmp_packet = bytes([0x30, len(message_content)]) + message_content
            
            print(f"SNMP 패킷 전송 중... ({len(snmp_packet)} bytes)")
            print(f"패킷 hex: {snmp_packet.hex()}")
            
            sock.sendto(snmp_packet, (self.SNMP_HOST, self.SNMP_PORT))
            
            try:
                response, addr = sock.recvfrom(1500)
                print(f"✅ 응답 받음: {len(response)} bytes from {addr}")
                print(f"응답 데이터 (hex): {response[:50].hex()}...")
                
                # 간단한 응답 파싱 시도
                if len(response) > 10 and response[0] == 0x30:
                    print("✅ 유효한 SNMP 응답으로 보입니다.")
                    
                    # 응답에서 시스템 설명 추출 시도
                    try:
                        # 매우 기본적인 파싱 (완전하지 않음)
                        if len(response) > 50:
                            # 시스템 설명이 포함된 부분 찾기
                            for i in range(30, min(len(response) - 10, 100)):
                                if response[i] == 0x04:  # OCTET STRING
                                    length = response[i + 1]
                                    if length > 0 and length < 200 and i + 2 + length <= len(response):
                                        desc = response[i + 2:i + 2 + length]
                                        try:
                                            desc_str = desc.decode('ascii', errors='ignore')
                                            if len(desc_str) > 5 and any(c.isalpha() for c in desc_str):
                                                print(f"✅ 시스템 설명: {desc_str[:100]}")
                                                break
                                        except:
                                            continue
                    except Exception as e:
                        print(f"응답 파싱 중 오류: {e}")
                    
                    return True
                else:
                    print("❓ 응답을 받았지만 SNMP 형식이 아닙니다.")
                    return False
                    
            except socket.timeout:
                print("❌ 응답 타임아웃")
                return False
                
        except Exception as e:
            print(f"❌ Raw Socket 테스트 오류: {e}")
            return False
        finally:
            sock.close()

    def test_connectivity(self):
        """기본 연결성 테스트"""
        print("\n[연결성 테스트] 네트워크 연결을 확인합니다...")
        print("-" * 50)
        
        try:
            # DNS 해석 테스트
            import socket
            ip = socket.gethostbyname(self.SNMP_HOST)
            print(f"✅ DNS 해석 성공: {self.SNMP_HOST} -> {ip}")
            
            # TCP 연결 테스트 (SSH 포트)
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((self.SNMP_HOST, 22))
            sock.close()
            
            if result == 0:
                print("✅ SSH 포트(22) 연결 성공")
            else:
                print("❌ SSH 포트(22) 연결 실패")
            
            # UDP 포트 161 연결 가능성 테스트
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(2)
            try:
                sock.sendto(b'test', (self.SNMP_HOST, self.SNMP_PORT))
                print("✅ UDP 161 포트로 패킷 전송 가능")
                return True
            except Exception as e:
                print(f"❌ UDP 161 포트 전송 실패: {e}")
                return False
            finally:
                sock.close()
                
        except Exception as e:
            print(f"❌ 연결성 테스트 오류: {e}")
            return False

    def run_full_test(self):
        """전체 테스트 실행"""
        print("=" * 60)
        print("Cisco 샌드박스 SNMP 테스트 시작")
        print("=" * 60)
        
        # 1. 기본 연결성 테스트
        print("🔍 1단계: 기본 연결성 테스트")
        connectivity_ok = self.test_connectivity()
        
        if not connectivity_ok:
            print("❌ 네트워크 연결에 문제가 있어 테스트를 중단합니다.")
            return
        
        # 2. SNMP 설정
        print("\n🔧 2단계: SNMP 설정 구성")
        if not self.configure_snmp():
            print("❌ SNMP 설정 실패로 테스트를 중단합니다.")
            return
        
        # 3. 설정 확인
        print("\n🔍 3단계: SNMP 설정 확인")
        self.verify_snmp_config()
        
        # 4. SNMP 서비스 재시작 (설정 적용 보장)
        print("\n🔄 4단계: SNMP 서비스 재시작")
        self.restart_snmp_service()
        
        # 5. 설정 적용 대기
        print("\n⏱️ 5단계: 설정 적용 대기 (10초)")
        print("SNMP 설정이 완전히 적용될 때까지 잠시 기다립니다...")
        for i in range(10, 0, -1):
            print(f"  {i}초 남음...", end='\r')
            time.sleep(1)
        print("  완료!           ")
        
        # 6. 다양한 SNMP 라이브러리 테스트
        print("\n🧪 6단계: SNMP 기능 테스트")
        easysnmp_success = self.test_easysnmp()
        pysnmp_success = self.test_pysnmp_ng()
        raw_success = self.test_raw_snmp()
        
        # 7. 추가 테스트 (public 커뮤니티로도 시도)
        if not (easysnmp_success or pysnmp_success):
            print("\n🔄 7단계: 대체 커뮤니티로 재테스트")
            original_community = self.SNMP_COMMUNITY
            self.SNMP_COMMUNITY = "public"
            print(f"커뮤니티를 '{self.SNMP_COMMUNITY}'로 변경하여 재테스트...")
            
            public_easysnmp = self.test_easysnmp()
            public_pysnmp = self.test_pysnmp_ng()
            
            # 원래 커뮤니티로 복원
            self.SNMP_COMMUNITY = original_community
            
            if public_easysnmp or public_pysnmp:
                print(f"✅ 'public' 커뮤니티로 성공! 원래 커뮤니티 '{original_community}' 설정을 확인하세요.")
            else:
                print("❌ 'public' 커뮤니티로도 실패")
        
        # 결과 요약
        print("\n" + "=" * 60)
        print("🏁 최종 테스트 결과 요약")
        print("=" * 60)
        print(f"네트워크 연결성: {'✅ 성공' if connectivity_ok else '❌ 실패'}")
        print(f"EasySNMP 테스트: {'✅ 성공' if easysnmp_success else '❌ 실패'}")
        print(f"PySNMP 테스트: {'✅ 성공' if pysnmp_success else '❌ 실패'}")
        print(f"Raw Socket 테스트: {'✅ 성공' if raw_success else '❌ 실패'}")
        
        overall_success = easysnmp_success or pysnmp_success or raw_success
        
        if overall_success:
            print("\n🎉 SNMP 테스트가 성공적으로 완료되었습니다!")
            print("💡 권장사항:")
            if easysnmp_success:
                print("   - EasySNMP 라이브러리가 잘 작동합니다. 이를 사용하는 것을 권장합니다.")
            elif pysnmp_success:
                print("   - PySNMP 라이브러리가 잘 작동합니다.")
            print(f"   - SNMP 커뮤니티: {self.SNMP_COMMUNITY}")
            print(f"   - SNMP 호스트: {self.SNMP_HOST}")
        else:
            print("\n❌ 모든 SNMP 테스트가 실패했습니다.")
            print("\n🔍 문제 해결 가이드:")
            print("1. SNMP 설정 문제:")
            print("   - 샌드박스에서 SNMP 기능이 제한될 수 있습니다")
            print("   - 다른 커뮤니티 스트링을 시도해보세요 (예: 'public')")
            print("2. 라이브러리 설치:")
            print("   - pip install easysnmp")
            print("   - pip install pysnmp-ng")
            print("3. 네트워크 설정:")
            print("   - 방화벽이 UDP 161 포트를 차단하고 있을 수 있습니다")
            print("   - VPN 연결 상태를 확인하세요")
            
        print("\n" + "=" * 60)

def main():
    """메인 함수"""
    try:
        snmp_tester = CiscoSandboxSNMP()
        snmp_tester.run_full_test()
    except KeyboardInterrupt:
        print("\n테스트가 사용자에 의해 중단되었습니다.")
    except Exception as e:
        print(f"예상치 못한 오류가 발생했습니다: {e}")

if __name__ == "__main__":
    main()