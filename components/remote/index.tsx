"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  Card,
  Input,
  Listbox,
  ListboxItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ScrollShadow,
  CardBody, // HeroUI CardBody 추가
  CardHeader, // HeroUI CardHeader 추가
} from "@heroui/react"; // HeroUI 컴포넌트 사용 가정

import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { FitAddon } from 'xterm-addon-fit';

// companyData.ts의 경로를 실제 프로젝트 구조에 맞게 수정해주세요.
// 예: import { companies, Company } from '../../data/companyData';
// 또는 tsconfig.json에 paths alias가 설정되어 있다면 그대로 사용 가능합니다.
import { companies, Company } from '@/data/companyData';

interface Device {
  id: string;
  name: string;
  companyId: string;
  type: string; // 예: "Cisco MDS 9710"
}
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
};

interface XTerminalModalProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
}

const XTerminalModal: React.FC<XTerminalModalProps> = ({ device, isOpen, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const commandHistory = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const currentLineBuffer = useRef<string>('');

  // WebSocket 인스턴스를 위한 Ref
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isOpen && terminalRef.current && device) { // device가 유효한지 확인 추가
      // 기존 터미널 인스턴스가 있다면 정리 (device 변경 시 재연결을 위해)
      if (termInstance.current) {
        termInstance.current.dispose();
        termInstance.current = null;
      }
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }

      const xterm = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        theme: { /* ... 이전 테마 설정 ... */
          background: '#000000',
          foreground: '#00FF00',
          cursor: '#00FF00',
          selectionBackground: '#008000',
          black: '#000000',
          red: '#FF0000',
          green: '#00FF00',
          yellow: '#FFFF00',
          blue: '#0084D1',
          magenta: '#FF00FF',
          cyan: '#00FFFF',
          white: '#FFFFFF',
          brightBlack: '#808080',
          brightRed: '#FF0000',
          brightGreen: '#00FF00',
          brightYellow: '#FFFF00',
          brightBlue: '#0084D1',
          brightMagenta: '#FF00FF',
          brightCyan: '#00FFFF',
          brightWhite: '#FFFFFF'
        },
        rows: 25,
        convertEol: true,
      });

      const addon = new FitAddon();
      fitAddon.current = addon;
      xterm.loadAddon(addon);
      xterm.open(terminalRef.current);
      addon.fit();
      termInstance.current = xterm;

      // --- 실제 WebSocket 연결 로직 ---
      // FastAPI 서버 주소와 포트를 확인하세요 (예: ws://localhost:8000)
      const socketUrl = `ws://192.168.0.131:8000/ws/${device.id}`;
      ws.current = new WebSocket(socketUrl);

      ws.current.onopen = () => {
        logger.info(`WebSocket: Connected to ${socketUrl}`);
        // 백엔드에서 초기 메시지(프롬프트 포함)를 보내므로, 프론트에서 별도 작성 불필요
        // termInstance.current?.write(`Connecting to ${device.name}...\r\n`);
      };

      ws.current.onmessage = (event) => {
        // 백엔드로부터 받은 메시지(프롬프트 포함)를 터미널에 바로 출력
        termInstance.current?.write(event.data as string);
      };

      ws.current.onclose = (event) => {
        logger.info(`WebSocket: Disconnected from ${socketUrl}. Code: ${event.code}, Reason: ${event.reason}`);
        if (termInstance.current && !event.wasClean) {
            termInstance.current.write(`\r\n\r\n[WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason || 'N/A'}]\r\n`);
        } else if (termInstance.current) {
            termInstance.current.write('\r\n\r\n[WebSocket connection closed.]\r\n');
        }
      };

      ws.current.onerror = (error) => {
        logger.error("WebSocket Error: ", error);
        termInstance.current?.write(`\r\n\r\n[WebSocket error. See console for details.]\r\n`);
      };
      // --- WebSocket 연결 로직 끝 ---

      xterm.onData((data: string) => {
        if (!termInstance.current || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
          // 웹소켓이 연결되지 않았거나 준비되지 않은 경우 입력 무시 또는 사용자에게 알림
          if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
            logger.warn("WebSocket not open. Cannot send data.");
            termInstance.current?.write("\r\n[Cannot send command: WebSocket not open.]\r\n");
          }
          return;
        }
        const code = data.charCodeAt(0);

        if (code === 13) { // Enter
          if (currentLineBuffer.current.trim() !== "") {
            commandHistory.current.unshift(currentLineBuffer.current);
            if (commandHistory.current.length > 50) commandHistory.current.pop();
          }
          historyIndex.current = -1;
          
          // 실제 WebSocket으로 명령어 전송
          ws.current.send(currentLineBuffer.current); 
          // 백엔드가 에코 및 프롬프트를 처리하므로 프론트엔드에서 추가 write는 필요 없음
          // termInstance.current.write('\r\n'); // 로컬 에코 대신 서버 응답 기다림

          currentLineBuffer.current = '';
        } else if (code === 127 || code === 8) { // Backspace
          if (currentLineBuffer.current.length > 0) {
            // 현재 라인의 실제 프롬프트 길이를 고려해야 하지만,
            // 백엔드가 프롬프트를 보내므로 간단히 처리하거나,
            // 터미널의 cursorX 위치와 실제 입력 시작 위치를 비교해야 함.
            // 여기서는 간단히 백스페이스만 처리.
            termInstance.current.write('\b \b');
            currentLineBuffer.current = currentLineBuffer.current.slice(0, -1);
          }
        } else if (code === 27) { // Escape sequences (e.g., arrow keys)
            if (data === '\x1b[A') { // Arrow Up
              if (historyIndex.current < commandHistory.current.length - 1) {
                historyIndex.current++;
                termInstance.current.write('\x1b[2K\r'); // 현재 줄 지우기
                // 백엔드에서 오는 프롬프트를 기다리거나, 마지막 수신 프롬프트를 저장해두었다가 사용해야 함
                // 지금은 임시로 '>' 사용 또는 백엔드 응답을 기다리도록 수정.
                // 여기서는 일단 로컬 버퍼만 채우고, 사용자가 엔터 시 전송.
                // 실제로는 터미널에 이전 명령어를 다시 그려줘야 함.
                // 이 부분은 더 정교한 프롬프트 관리가 필요.
                // 가장 간단한 방법은 백엔드가 프롬프트를 항상 보내주므로,
                // 다음 프롬프트가 올 때까지 기다리는 것.
                // 여기서는 로컬 버퍼만 채우고, 터미널 표시는 최소화
                 const BOLD_BLUE = '\x1b[1;34m';
                 const RESET_COLOR = '\x1b[0m';
                 const PROMPT_PLACEHOLDER = `${BOLD_BLUE}> ${RESET_COLOR}`; // 임시 프롬프트
                 termInstance.current.write(PROMPT_PLACEHOLDER); // 임시 프롬프트 표시
                currentLineBuffer.current = commandHistory.current[historyIndex.current];
                termInstance.current.write(currentLineBuffer.current);
              }
            } else if (data === '\x1b[B') { // Arrow Down
              if (historyIndex.current > 0) {
                historyIndex.current--;
                termInstance.current.write('\x1b[2K\r');
                // 임시 프롬프트
                 const BOLD_BLUE = '\x1b[1;34m';
                 const RESET_COLOR = '\x1b[0m';
                 const PROMPT_PLACEHOLDER = `${BOLD_BLUE}> ${RESET_COLOR}`;
                 termInstance.current.write(PROMPT_PLACEHOLDER);
                currentLineBuffer.current = commandHistory.current[historyIndex.current];
                termInstance.current.write(currentLineBuffer.current);
              } else {
                historyIndex.current = -1;
                termInstance.current.write('\x1b[2K\r');
                 const BOLD_BLUE = '\x1b[1;34m';
                 const RESET_COLOR = '\x1b[0m';
                 const PROMPT_PLACEHOLDER = `${BOLD_BLUE}> ${RESET_COLOR}`;
                 termInstance.current.write(PROMPT_PLACEHOLDER);
                currentLineBuffer.current = '';
              }
            }
        } else if (code >= 32 && code <= 126 || data.length > 1) { // Printable characters or pasted multi-char data
          currentLineBuffer.current += data;
          termInstance.current.write(data);
        }
      });

      const handleResize = () => fitAddon.current?.fit();
      window.addEventListener('resize', handleResize);
      setTimeout(() => { // Ensure modal is rendered and terminal can focus
        fitAddon.current?.fit();
        termInstance.current?.focus();
      }, 300);

      return () => { // Cleanup on component unmount or before re-render due to deps change
        window.removeEventListener('resize', handleResize);
        if (ws.current) {
          logger.info("Closing WebSocket connection from cleanup.");
          ws.current.close();
          ws.current = null;
        }
        if (termInstance.current) {
          termInstance.current.dispose();
          termInstance.current = null;
        }
        fitAddon.current = null; // fitAddon은 xterm 인스턴스에 종속적이므로 함께 정리
      };
    } else if (!isOpen && ws.current) { // Modal is closed, ensure WebSocket is closed
        logger.info("Modal closed, closing WebSocket connection.");
        ws.current.close();
        ws.current = null;
    }
  }, [isOpen, device]); // device 변경 시에도 WebSocket 및 터미널 재생성

  // Modal이 실제로 화면에 나타난 후 xterm의 크기를 맞추고 포커스
  useEffect(() => {
    if (isOpen && termInstance.current && fitAddon.current) {
      setTimeout(() => {
        fitAddon.current?.fit();
        termInstance.current?.focus();
      }, 150); // Modal 애니메이션 시간 고려
    }
  }, [isOpen]);



  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" backdrop="opaque" placement="center" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><line x1="7" y1="8" x2="17" y2="8"></line><line x1="7" y1="12" x2="17" y2="12"></line><line x1="7" y1="16" x2="12" y2="16"></line></svg>
          <span>{device?.name || 'Terminal'} - Virtual Console</span> {/* device가 null일 수 있음을 대비 */}
        </ModalHeader>
        <ModalBody className="p-0"> {/* Padding 제거하여 터미널이 꽉 차게 */}
          {/* Card 스타일을 Modal 내부에 적용 */}
          <Card className="shadow-none rounded-none border-none">
            <CardBody className="p-2"> {/* 터미널 주변에 약간의 패딩 */}
              <div ref={terminalRef} style={{ height: '500px', width: '100%', background: '#000000' }} />
            </CardBody>
          </Card>
        </ModalBody>
        <ModalFooter className="bg-gray-100 dark:bg-gray-800 rounded-b-lg">
          <Button color="danger" variant="flat" onPress={onClose}>
            Close Session
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};


export const Remote = () => {

    // "Real SAN" 테스트 장비 정의
  const realSanDevice: Device = {
    id: 'real-san-device', // 백엔드에서 이 ID로 구분합니다.
    name: 'Real SAN (NX-API Test)',
    companyId: 'nxapi-sandbox', // 임의의 companyId
    type: 'Cisco NX-OS Sandbox'
  };

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeTerminalDevice, setActiveTerminalDevice] = useState<Device | null>(null);
  const [companySearchTerm, setCompanySearchTerm] = useState("");

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const handleCompanySelect = (companyIdKey: React.Key) => {
    const companyId = companyIdKey as string;
    setSelectedCompanyId(companyId);
    const company = companies.find(c => c.id === companyId);
    if (company) {
      // 회사별 임의의 MDS 스위치 장비 생성
      setDevices([
        { id: `${company.id}-mds1`, name: `${company.name}-MDS-9710`, companyId: company.id, type: "Cisco MDS 9710 Director" },
        { id: `${company.id}-mds2`, name: `${company.name}-MDS-9148S`, companyId: company.id, type: "Cisco MDS 9148S Fabric Switch" },
        { id: `${company.id}-mds3`, name: `${company.name}-MDS-9250i`, companyId: company.id, type: "Cisco MDS 9250i Multiservice Switch" },
        { id: `${company.id}-mds4`, name: `${company.name}-MDS-9396S`, companyId: company.id, type: "Cisco MDS 9396S Fabric Switch" },
      ]);
      setActiveTerminalDevice(null);
    }
  };

  const handleDeviceClick = (device: Device) => {
    setActiveTerminalDevice(device);
  };

  const handleCloseTerminal = () => {
    setActiveTerminalDevice(null);
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
    company.city.toLowerCase().includes(companySearchTerm.toLowerCase())
  );

  return (
    <div className="my-6 sm:my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-6 sm:gap-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">NXAPI Remote Console</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Company List Section */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card className="shadow-md">
            <CardHeader className="p-4 border-b dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">Select Company</h2>
            </CardHeader>
            <CardBody className="p-4">
              <Input
                aria-label="Search company by name or city"
                placeholder="Search company or city..."
                value={companySearchTerm}
                onValueChange={setCompanySearchTerm}
                isClearable
                fullWidth
                className="mb-4"
              />
              <ScrollShadow hideScrollBar className="h-[300px] sm:h-[400px] md:h-[500px] border dark:border-gray-700 rounded-md">
                {filteredCompanies.length > 0 ? (
                  <Listbox
                    aria-label="Companies"
                    variant="flat"
                    disallowEmptySelection
                    selectionMode="single"
                    selectedKeys={selectedCompanyId ? new Set([selectedCompanyId]) : undefined}
                    onSelectionChange={(keys) => {
                      const selection = keys as Set<React.Key>;
                      if (selection instanceof Set && selection.size > 0) {
                        const firstSelectedKey = selection.values().next().value;
                        if (firstSelectedKey !== undefined) {
                          handleCompanySelect(firstSelectedKey);
                        }
                      }
                    }}
                  >
                    {filteredCompanies.map((company) => (
                      <ListboxItem
                        key={company.id}
                        textValue={company.name}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm sm:text-base">{company.name}</span>
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{company.address}</span>
                        </div>
                      </ListboxItem>
                    ))}
                  </Listbox>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">No companies found.</div>
                )}
              </ScrollShadow>
            </CardBody>
          </Card>
        </div>

        {/* Devices Section */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          <Card className="shadow-md">
            <CardHeader className="p-4 border-b dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">
                {selectedCompany ? `${selectedCompany.name} - Cisco Devices (MDS)` : "Select a company to view devices"}
              </h2>
            </CardHeader>
            <CardBody className="p-4">
              {selectedCompany && devices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {devices.map((device) => (
                    <Card
                      isPressable
                      onPress={() => handleDeviceClick(device)}
                      key={device.id}
                      className="hover:shadow-lg transition-shadow border dark:border-gray-700"
                    >
                      <CardBody className="p-4 items-center text-center">
                        {/* ... (기존 장비 아이콘 등) ... */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 dark:text-blue-400 mb-2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                        <h3 className="font-semibold text-sm sm:text-base mb-1">{device.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{device.type}</p>
                        <Button size="sm" color="primary" variant="solid" onPress={() => handleDeviceClick(device)} className="mt-3 w-full sm:w-auto">
                          Connect
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : selectedCompany ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">No devices found for this company.</div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">Please select a company from the list.</div>
              )}
            </CardBody>
          </Card>

          {/* "Real SAN" Test Card 추가 */}
          <Card className="shadow-md mt-6">
            <CardHeader className="p-4 border-b dark:border-gray-700">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">
                    NX-API Sandbox Test
                </h2>
            </CardHeader>
            <CardBody className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    <Card
                      isPressable
                      onPress={() => handleDeviceClick(realSanDevice)}
                      key={realSanDevice.id}
                      className="hover:shadow-lg transition-shadow border dark:border-gray-700"
                    >
                      <CardBody className="p-4 items-center text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 dark:text-green-400 mb-2"> {/* 아이콘 색상 변경 */}
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <path d="m9 12 2 2 4-4"></path>
                        </svg>
                        <h3 className="font-semibold text-sm sm:text-base mb-1">{realSanDevice.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{realSanDevice.type}</p>
                        <Button size="sm" color="success" variant="solid" onPress={() => handleDeviceClick(realSanDevice)} className="mt-3 w-full sm:w-auto">
                          Connect to Real SAN
                        </Button>
                      </CardBody>
                    </Card>
                </div>
            </CardBody>
          </Card>

        </div>
      </div>

      {/* Terminal Modal */}
      {activeTerminalDevice && (
        <XTerminalModal
          device={activeTerminalDevice}
          isOpen={!!activeTerminalDevice}
          onClose={handleCloseTerminal}
        />
      )}
    </div>
  );
};


export default Remote;