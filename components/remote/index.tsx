"use client";
import { Button, Input, Card, CardBody, CardHeader, Divider, Listbox, ListboxItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Chip, ScrollShadow } from "@heroui/react";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { DotsIcon } from "@/components/icons/accounts/dots-icon";
import { ExportIcon } from "@/components/icons/accounts/export-icon";
import { Terminal } from '@xterm/xterm';
import { FitAddon } from 'xterm-addon-fit';
import '@xterm/xterm/css/xterm.css'; // CSS 파일 임포트
import { companies } from "@/data/companyData";

// Cisco 장비 타입 정의
interface CiscoDevice {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'firewall' | 'wireless';
  model: string;
  ip: string;
  status: 'online' | 'offline' | 'maintenance';
}

// 각 회사별 Cisco 장비 생성 함수
const generateCiscoDevices = (companyId: string): CiscoDevice[] => {
  const deviceTypes = ['router', 'switch', 'firewall', 'wireless'] as const;
  const models = {
    router: ['ISR4331', 'ISR4451', 'ASR1001-X', 'ISR1100'],
    switch: ['Catalyst 9300', 'Catalyst 3850', 'Nexus 9000', 'Catalyst 2960'],
    firewall: ['ASA 5506-X', 'FTD 2130', 'ASA 5516-X', 'FTD 2140'],
    wireless: ['Catalyst 9800', 'Aironet 2800', 'Meraki MR56', 'Aironet 3800']
  };
  
  const numDevices = Math.floor(Math.random() * 4) + 3; // 3-6개 장비
  const devices: CiscoDevice[] = [];
  
  for (let i = 0; i < numDevices; i++) {
    const type = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
    const modelList = models[type];
    const model = modelList[Math.floor(Math.random() * modelList.length)];
    const status = Math.random() > 0.1 ? 'online' : (Math.random() > 0.5 ? 'offline' : 'maintenance');
    
    devices.push({
      id: `${companyId}-device-${i + 1}`,
      name: `${type.toUpperCase()}-${i + 1}`,
      type,
      model,
      ip: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      status
    });
  }
  
  return devices;
};

export const Remote = () => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [devices, setDevices] = useState<CiscoDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<CiscoDevice | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 회사 선택 시 장비 목록 생성
  useEffect(() => {
    if (selectedCompany) {
      const generatedDevices = generateCiscoDevices(selectedCompany);
      setDevices(generatedDevices);
    }
  }, [selectedCompany]);

  // 터미널 초기화
  useEffect(() => {
    if (isOpen && terminalRef.current && selectedDevice) {
      // Terminal 인스턴스 생성
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#1a1a1a',
          foreground: '#ffffff',
          cursor: '#ffffff',
          // selection: '#4a9eff'
        }
      });

      fitAddon.current = new FitAddon();
      term.loadAddon(fitAddon.current);
      
      term.open(terminalRef.current);
      fitAddon.current.fit();
      
      terminalInstance.current = term;

      // 초기 환영 메시지
      term.writeln(`Connecting to ${selectedDevice.name} (${selectedDevice.ip})...`);
      term.writeln('');
      term.writeln(`${selectedDevice.name}> `);

      // WebSocket 연결 (FastAPI 서버)
      const ws = new WebSocket(`ws://localhost:8000/ws/terminal/${selectedDevice.id}`);
      wsRef.current = ws;

      ws.onopen = () => {
        term.writeln('Connected successfully!');
        term.writeln('');
        term.write(`${selectedDevice.name}> `);
      };

      ws.onmessage = (event) => {
        term.write(event.data);
      };

      ws.onerror = (error) => {
        term.writeln('\r\nConnection error occurred');
      };

      ws.onclose = () => {
        term.writeln('\r\nConnection closed');
      };

      // 터미널 입력 처리
      let command = '';
      term.onData((data) => {
        if (data === '\r') { // Enter key
          if (command.trim()) {
            // FastAPI 서버로 명령어 전송
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                command: command,
                deviceId: selectedDevice.id
              }));
            }
            command = '';
          }
          term.write('\r\n' + `${selectedDevice.name}> `);
        } else if (data === '\u007F') { // Backspace
          if (command.length > 0) {
            command = command.slice(0, -1);
            term.write('\b \b');
          }
        } else {
          command += data;
          term.write(data);
        }
      });

      // 창 크기 조정 시 터미널 크기 조정
      const handleResize = () => {
        if (fitAddon.current) {
          fitAddon.current.fit();
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (wsRef.current) {
          wsRef.current.close();
        }
        term.dispose();
      };
    }
  }, [isOpen, selectedDevice]);

  const handleDeviceClick = (device: CiscoDevice) => {
    if (device.status === 'online') {
      setSelectedDevice(device);
      onOpen();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'danger';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'router': return '🔀';
      case 'switch': return '🔌';
      case 'firewall': return '🛡️';
      case 'wireless': return '📡';
      default: return '📟';
    }
  };

  return (
    <div className="my-10 px-4 lg:px-6 max-w-[95rem] mx-auto w-full flex flex-col gap-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">원격 장비 관리 시스템</h1>
        <p className="text-default-500">NX-API를 통한 실시간 장비 접속</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 회사 목록 */}
        <div className="lg:col-span-1">
          <Card className="h-[600px]">
            <CardHeader>
              <h3 className="text-lg font-semibold">회사 목록</h3>
            </CardHeader>
            <Divider />
            <CardBody className="p-0">
              <ScrollShadow className="h-[530px]">
                <Listbox
                  aria-label="회사 선택"
                  onAction={(key) => setSelectedCompany(key as string)}
                  selectedKeys={selectedCompany ? [selectedCompany] : []}
                  selectionMode="single"
                >
                  {companies.map((company) => (
                    <ListboxItem
                      key={company.id}
                      description={company.city}
                    >
                      {company.name}
                    </ListboxItem>
                  ))}
                </Listbox>
              </ScrollShadow>
            </CardBody>
          </Card>
        </div>

        {/* 장비 목록 */}
        <div className="lg:col-span-3">
          {selectedCompany ? (
            <div>
              <h3 className="text-xl font-semibold mb-4">
                {companies.find(c => c.id === selectedCompany)?.name} - Cisco 장비 현황
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {devices.map((device) => (
                  <Card 
                    key={device.id}
                    isPressable={device.status === 'online'}
                    isDisabled={device.status !== 'online'}
                    onPress={() => handleDeviceClick(device)}
                    className={device.status !== 'online' ? 'opacity-60' : 'hover:scale-105 transition-transform'}
                  >
                    <CardHeader className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getDeviceIcon(device.type)}</span>
                        <div>
                          <h4 className="font-semibold">{device.name}</h4>
                          <p className="text-small text-default-500">{device.model}</p>
                        </div>
                      </div>
                      <Chip 
                        color={getStatusColor(device.status)} 
                        size="sm" 
                        variant="flat"
                      >
                        {device.status}
                      </Chip>
                    </CardHeader>
                    <CardBody className="pt-0">
                      <div className="text-small">
                        <p className="text-default-600">IP 주소: {device.ip}</p>
                        <p className="text-default-600">장비 유형: {device.type}</p>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <p className="text-xl text-default-500 mb-2">회사를 선택해주세요</p>
                <p className="text-default-400">좌측 목록에서 회사를 선택하면 해당 회사의 Cisco 장비를 확인할 수 있습니다</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 터미널 모달 */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedDevice && getDeviceIcon(selectedDevice.type)}</span>
                  <span>{selectedDevice?.name} - {selectedDevice?.model}</span>
                </div>
                <p className="text-small text-default-500">IP: {selectedDevice?.ip}</p>
              </ModalHeader>
              <ModalBody className="p-0">
                <div 
                  ref={terminalRef} 
                  className="w-full h-[500px] bg-black p-2"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  연결 종료
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};