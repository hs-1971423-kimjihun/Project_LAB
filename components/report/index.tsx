"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Chip,
  Spinner,
  Progress,
  Badge,
  Divider,
  ScrollShadow,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Avatar,
  User,
  Tooltip,
} from "@heroui/react";

// 기존 프로젝트의 아이콘들 import
import { SearchIcon } from "@/components/icons/searchicon";
import { EyeIcon } from "@/components/icons/table/eye-icon";

// 간단한 아이콘 컴포넌트들
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ComputerDesktopIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const DocumentCheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

// 기존 company 데이터 import
import { companies, Company } from "@/data/companyData";

// AI 분석 상태 타입 정의
interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  analysisStatus: "pending" | "analyzing" | "completed" | "failed";
  lastAnalysisDate?: string;
  reportId?: string;
  progress?: number;
}

interface CompanyAnalysis {
  companyId: string;
  overallStatus: "pending" | "analyzing" | "completed" | "partial";
  equipments: Equipment[];
  lastUpdateDate: string;
  completedCount: number;
  totalCount: number;
}

// Mock 데이터 생성
const generateMockAnalysisData = (): CompanyAnalysis[] => {
  return companies.map((company, index) => {
    const equipmentCount = 3 + (index % 5); // 3-7개 장비
    const equipments: Equipment[] = [];
    
    for (let i = 0; i < equipmentCount; i++) {
      const status = Math.random();
      let analysisStatus: Equipment["analysisStatus"];
      
      if (status < 0.4) analysisStatus = "completed";
      else if (status < 0.6) analysisStatus = "analyzing";
      else if (status < 0.9) analysisStatus = "pending";
      else analysisStatus = "failed";
      
      equipments.push({
        id: `${company.id}-eq-${i + 1}`,
        name: `${company.name}-MDS-${9710 + i}`,
        type: "SAN Switch",
        model: `Cisco MDS ${9710 + i}`,
        analysisStatus,
        lastAnalysisDate: analysisStatus === "completed" ? "2024-12-15" : undefined,
        reportId: analysisStatus === "completed" ? `RPT-${company.id}-${i + 1}` : undefined,
        progress: analysisStatus === "analyzing" ? 30 + (Math.random() * 50) : undefined,
      });
    }
    
    const completedCount = equipments.filter(eq => eq.analysisStatus === "completed").length;
    const analyzingCount = equipments.filter(eq => eq.analysisStatus === "analyzing").length;
    
    let overallStatus: CompanyAnalysis["overallStatus"];
    if (completedCount === equipmentCount) overallStatus = "completed";
    else if (analyzingCount > 0 || completedCount > 0) overallStatus = "partial";
    else overallStatus = "pending";
    
    return {
      companyId: company.id,
      overallStatus,
      equipments,
      lastUpdateDate: "2024-12-15",
      completedCount,
      totalCount: equipmentCount,
    };
  });
};

export const Report = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
  const analysisData = useMemo(() => generateMockAnalysisData(), []);

  // 검색 필터링
  const filteredAnalysisData = useMemo(() => {
    return analysisData.filter(analysis => {
      const company = companies.find(c => c.id === analysis.companyId);
      if (!company) return false;
      
      return company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             company.city.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [analysisData, searchQuery]);

  const selectedCompanyData = useMemo(() => {
    if (!selectedCompany) return null;
    return analysisData.find(analysis => analysis.companyId === selectedCompany);
  }, [selectedCompany, analysisData]);

  const selectedCompanyInfo = useMemo(() => {
    if (!selectedCompany) return null;
    return companies.find(c => c.id === selectedCompany);
  }, [selectedCompany]);

  const getStatusIcon = (status: CompanyAnalysis["overallStatus"]) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-5 h-5 text-success" />;
      case "analyzing":
      case "partial":
        return <Spinner size="sm" />;
      case "pending":
        return <ClockIcon className="w-5 h-5 text-warning" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-danger" />;
    }
  };

  const getStatusChip = (status: CompanyAnalysis["overallStatus"], completedCount: number, totalCount: number) => {
    switch (status) {
      case "completed":
        return (
          <Chip
            startContent={<CheckCircleIcon className="w-4 h-4" />}
            color="success"
            variant="flat"
            size="sm"
          >
            완료
          </Chip>
        );
      case "partial":
        return (
          <Chip
            color="warning"
            variant="flat"
            size="sm"
          >
            {completedCount}/{totalCount}
          </Chip>
        );
      case "analyzing":
        return (
          <Chip
            startContent={<Spinner size="sm" />}
            color="primary"
            variant="flat"
            size="sm"
          >
            분석중
          </Chip>
        );
      case "pending":
        return (
          <Chip
            color="default"
            variant="flat"
            size="sm"
          >
            대기중
          </Chip>
        );
      default:
        return (
          <Chip
            color="danger"
            variant="flat"
            size="sm"
          >
            오류
          </Chip>
        );
    }
  };

  const getEquipmentStatusChip = (equipment: Equipment) => {
    switch (equipment.analysisStatus) {
      case "completed":
        return (
          <Chip
            startContent={<CheckCircleIcon className="w-4 h-4" />}
            color="success"
            variant="flat"
            size="sm"
          >
            분석완료
          </Chip>
        );
      case "analyzing":
        return (
          <Chip
            startContent={<Spinner size="sm" />}
            color="primary"
            variant="flat"
            size="sm"
          >
            분석중 {equipment.progress ? Math.round(equipment.progress) : 0}%
          </Chip>
        );
      case "pending":
        return (
          <Chip
            color="default"
            variant="flat"
            size="sm"
          >
            대기중
          </Chip>
        );
      case "failed":
        return (
          <Chip
            color="danger"
            variant="flat"
            size="sm"
          >
            분석실패
          </Chip>
        );
    }
  };

  const handleCompanyClick = (companyId: string) => {
    setSelectedCompany(companyId);
  };

  const handleEquipmentClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    onOpen();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="w-full text-center">
              <h1 className="text-2xl font-bold mb-2">🤖 AI 장비 분석 현황</h1>
              <p className="text-blue-100">
                월 단위 자동 분석 진행 상황을 실시간으로 확인하세요
              </p>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 왼쪽: 업체 목록 */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg h-fit">
              <CardHeader className="border-b border-gray-200">
                <div className="w-full">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">업체 목록</h2>
                  <Input
                    placeholder="업체명 또는 도시로 검색..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    startContent={<SearchIcon />}
                    isClearable
                    variant="bordered"
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <ScrollShadow className="max-h-[600px]">
                  {filteredAnalysisData.map((analysis) => {
                    const company = companies.find(c => c.id === analysis.companyId);
                    if (!company) return null;
                    
                    return (
                      <div key={analysis.companyId}>
                        <div
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-l-4 ${
                            selectedCompany === analysis.companyId
                              ? "border-blue-500 bg-blue-50"
                              : "border-transparent"
                          }`}
                          onClick={() => handleCompanyClick(analysis.companyId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusIcon(analysis.overallStatus)}
                                <h3 className="font-semibold text-gray-800">
                                  {company.name}
                                </h3>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">
                                {company.city} • {company.address}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                {getStatusChip(analysis.overallStatus, analysis.completedCount, analysis.totalCount)}
                                <span className="text-xs text-gray-500">
                                  {analysis.lastUpdateDate}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Divider />
                      </div>
                    );
                  })}
                </ScrollShadow>
              </CardBody>
            </Card>
          </div>

          {/* 오른쪽: 장비 목록 또는 전체 현황 */}
          <div className="lg:col-span-2">
            {selectedCompanyData && selectedCompanyInfo ? (
              <Card className="shadow-lg">
                <CardHeader className="border-b border-gray-200">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {selectedCompanyInfo.name} - 장비 분석 현황
                      </h2>
                      <Button
                        variant="light"
                        size="sm"
                        onPress={() => setSelectedCompany(null)}
                      >
                        목록으로
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>총 {selectedCompanyData.totalCount}개 장비</span>
                      <span>완료 {selectedCompanyData.completedCount}개</span>
                      <span>진행률 {Math.round((selectedCompanyData.completedCount / selectedCompanyData.totalCount) * 100)}%</span>
                    </div>
                    
                    <Progress
                      value={(selectedCompanyData.completedCount / selectedCompanyData.totalCount) * 100}
                      color="success"
                      className="mt-2"
                    />
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCompanyData.equipments.map((equipment) => (
                      <Card
                        key={equipment.id}
                        isPressable={equipment.analysisStatus === "completed"}
                        onPress={() => equipment.analysisStatus === "completed" && handleEquipmentClick(equipment)}
                        className={`border transition-all duration-200 ${
                          equipment.analysisStatus === "completed"
                            ? "hover:shadow-md cursor-pointer"
                            : "cursor-default"
                        }`}
                      >
                        <CardBody className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <ComputerDesktopIcon className="w-5 h-5 text-blue-600" />
                              <span className="font-medium">{equipment.name}</span>
                            </div>
                            {getEquipmentStatusChip(equipment)}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{equipment.model}</p>
                          
                          {equipment.analysisStatus === "analyzing" && equipment.progress && (
                            <Progress
                              value={equipment.progress}
                              color="primary"
                              size="sm"
                              className="mb-2"
                            />
                          )}
                          
                          {equipment.lastAnalysisDate && (
                            <p className="text-xs text-gray-500">
                              마지막 분석: {equipment.lastAnalysisDate}
                            </p>
                          )}
                          
                          {equipment.analysisStatus === "completed" && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                              <EyeIcon size={12} fill="currentColor" />
                              <span>리포트 보기</span>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ) : (
              /* 전체 현황 대시보드 */
              <Card className="shadow-lg">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-800">전체 분석 현황</h2>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="border border-gray-200">
                      <CardBody className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {filteredAnalysisData.length}
                        </div>
                        <div className="text-sm text-gray-600">총 업체</div>
                      </CardBody>
                    </Card>
                    
                    <Card className="border border-gray-200">
                      <CardBody className="text-center">
                        <div className="text-2xl font-bold text-success">
                          {filteredAnalysisData.filter(a => a.overallStatus === "completed").length}
                        </div>
                        <div className="text-sm text-gray-600">분석완료</div>
                      </CardBody>
                    </Card>
                    
                    <Card className="border border-gray-200">
                      <CardBody className="text-center">
                        <div className="text-2xl font-bold text-warning">
                          {filteredAnalysisData.filter(a => a.overallStatus === "partial" || a.overallStatus === "analyzing").length}
                        </div>
                        <div className="text-sm text-gray-600">진행중</div>
                      </CardBody>
                    </Card>
                    
                    <Card className="border border-gray-200">
                      <CardBody className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {filteredAnalysisData.reduce((sum, a) => sum + a.totalCount, 0)}
                        </div>
                        <div className="text-sm text-gray-600">총 장비</div>
                      </CardBody>
                    </Card>
                  </div>
                  
                  <div className="text-center text-gray-500">
                    <ComputerDesktopIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">업체를 선택하세요</h3>
                    <p>왼쪽 목록에서 업체를 클릭하면 해당 업체의 장비 분석 현황을 확인할 수 있습니다.</p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

        {/* 장비 상세 모달 */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  <div className="flex items-center gap-2">
                    <DocumentCheckIcon className="w-6 h-6 text-green-600" />
                    <span>분석 리포트 - {selectedEquipment?.name}</span>
                  </div>
                </ModalHeader>
                <ModalBody>
                  {selectedEquipment && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">장비명</label>
                          <p className="font-semibold">{selectedEquipment.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">모델</label>
                          <p className="font-semibold">{selectedEquipment.model}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">리포트 ID</label>
                          <p className="font-semibold">{selectedEquipment.reportId}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">분석 일자</label>
                          <p className="font-semibold">{selectedEquipment.lastAnalysisDate}</p>
                        </div>
                      </div>
                      
                      <Divider />
                      
                      <div>
                        <h4 className="font-semibold mb-2">분석 결과 요약</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-700">
                            • 전체적인 시스템 상태: 양호<br/>
                            • 성능 지표: 정상 범위 내<br/>
                            • 권장 조치사항: 정기 점검 지속<br/>
                            • 다음 분석 예정일: 2025-01-15
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          ⚠️ 이 리포트는 AI가 자동 생성한 결과입니다. 
                          관리자의 최종 검토가 필요합니다.
                        </p>
                      </div>
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    닫기
                  </Button>
                  <Button color="success" onPress={onClose}>
                    승인
                  </Button>
                  <Button color="warning" onPress={onClose}>
                    재검토 요청
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default Report;