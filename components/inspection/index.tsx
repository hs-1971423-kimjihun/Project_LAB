"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Select,
  SelectItem,
  Chip,
  Badge,
  Avatar,
  User,
  Divider,
  Spacer,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Progress,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  DateRangePicker,
  Textarea
} from "@heroui/react";
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  BuildingOffice2Icon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  EyeIcon,
  FunnelIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import {parseDate} from "@internationalized/date";

// 지도 컴포넌트 import
import InteractiveMap from "./InteractiveMap";

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
interface Equipment {
  id: number;
  company_id: number;
  equipment_name: string;
  model_name?: string;
  serial_number?: string;
  purchase_date?: string;
}

interface Company {
  company_id: number;
  name: string;
  address: string;
  phone: string;
  city?: string;
  maintenance_start_date?: string;
  maintenance_end_date?: string;
  status: "active" | "inactive" | "pending";
  equipment: Equipment[];
}

// 신규 등록을 위한 타입
interface EquipmentCreate {
  equipment_name: string;
  model_name?: string;
  serial_number?: string;
  purchase_date?: string;
}

interface CompanyCreate {
  name: string;
  address: string;
  phone: string;
  maintenance_start_date?: string;
  maintenance_end_date?: string;
  equipment: EquipmentCreate[];
}

export const Inspection = () => {
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
  // 신규등록 모달 관련 상태
  const { 
    isOpen: isCreateOpen, 
    onOpen: onCreateOpen, 
    onOpenChange: onCreateOpenChange 
  } = useDisclosure();
  const [createLoading, setCreateLoading] = useState(false);
  const [newCompany, setNewCompany] = useState<CompanyCreate>({
    name: '',
    address: '',
    phone: '',
    maintenance_start_date: undefined,
    maintenance_end_date: undefined,
    equipment: []
  });
  const [newEquipment, setNewEquipment] = useState<EquipmentCreate>({
    equipment_name: '',
    model_name: '',
    serial_number: '',
    purchase_date: undefined
  });

  // API에서 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        setError(null);

        // 회사 데이터 가져오기
        const companiesResponse = await fetch(`${API_BASE_URL}/api/companies`);
        if (!companiesResponse.ok) throw new Error('Failed to fetch companies');
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData);

        // 도시 데이터 가져오기
        const citiesResponse = await fetch(`${API_BASE_URL}/api/cities`);
        if (!citiesResponse.ok) throw new Error('Failed to fetch cities');
        const citiesData = await citiesResponse.json();
        setCities(citiesData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCitySelect = async (city: string) => {
    setIsLoading(true);
    setSelectedCity(city);
    setSelectedCompany(null);
    
    // 로딩 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    onOpen(); // 모달 열기
  };

  const filteredCompanies = useMemo(() => {
    let filtered = companies;
    
    if (selectedCity) {
      filtered = filtered.filter(company => company.city === selectedCity);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(company => company.status === selectedStatus);
    }
    
    return filtered;
  }, [companies, selectedCity, searchQuery, selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "pending": return "warning"; 
      case "inactive": return "danger";
      default: return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "유지보수 중";
      case "pending": return "예정";
      case "inactive": return "종료";
      default: return "알 수 없음";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 신규 회사 등록
  const handleCreateCompany = async () => {
    try {
      setCreateLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCompany),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create company');
      }
      
      const createdCompany = await response.json();
      
      // 목록 새로고침
      const updatedCompaniesResponse = await fetch(`${API_BASE_URL}/api/companies`);
      const updatedCompanies = await updatedCompaniesResponse.json();
      setCompanies(updatedCompanies);
      
      // 상태 초기화
      setNewCompany({
        name: '',
        address: '',
        phone: '',
        maintenance_start_date: undefined,
        maintenance_end_date: undefined,
        equipment: []
      });
      
      onCreateOpenChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : '등록 중 오류가 발생했습니다.');
    } finally {
      setCreateLoading(false);
    }
  };

  // 장비 추가
  const handleAddEquipment = () => {
    if (!newEquipment.equipment_name) {
      alert('장비명을 입력해주세요.');
      return;
    }
    
    setNewCompany(prev => ({
      ...prev,
      equipment: [...prev.equipment, { ...newEquipment }]
    }));
    
    // 장비 입력 폼 초기화
    setNewEquipment({
      equipment_name: '',
      model_name: '',
      serial_number: '',
      purchase_date: undefined
    });
  };

  // 장비 삭제
  const handleRemoveEquipment = (index: number) => {
    setNewCompany(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }));
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <p className="text-red-600 font-semibold mb-2">오류가 발생했습니다</p>
            <p className="text-gray-600">{error}</p>
            <Button 
              color="primary" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              다시 시도
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* 필터 및 검색 섹션 */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">검색 및 필터</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 도시 선택 */}
              <Select
                label="도시 선택"
                placeholder="도시를 선택하세요"
                selectedKeys={selectedCity ? [selectedCity] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  handleCitySelect(selected || "");
                }}
                startContent={<MapPinIcon className="w-4 h-4" />}
                variant="bordered"
                color="primary"
              >
                {cities.map((city) => (
                  <SelectItem key={city}>
                    {city}
                  </SelectItem>
                ))}
              </Select>

              {/* 검색 */}
              <Input
                label="업체명/주소 검색"
                placeholder="검색어를 입력하세요"
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                isClearable
                variant="bordered"
                color="primary"
              />

              {/* 상태 필터 */}
              <Select
                label="상태 필터"
                placeholder="상태를 선택하세요"
                selectedKeys={selectedStatus ? [selectedStatus] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSelectedStatus(selected || "");
                }}
                startContent={<BuildingOffice2Icon className="w-4 h-4" />}
                variant="bordered"
                color="primary"
              >
                <SelectItem key="active">유지보수 중</SelectItem>
                <SelectItem key="pending">예정</SelectItem>
                <SelectItem key="inactive">종료</SelectItem>
              </Select>
            </div>

            <Spacer y={4} />

            {/* 활성 필터 표시 */}
            <div className="flex flex-wrap gap-2">
              {selectedCity && (
                <Chip
                  onClose={() => setSelectedCity("")}
                  variant="flat"
                  color="primary"
                  startContent={<MapPinIcon className="w-3 h-3" />}
                >
                  도시: {selectedCity}
                </Chip>
              )}
              {selectedStatus && (
                <Chip
                  onClose={() => setSelectedStatus("")}
                  variant="flat"
                  color="secondary"
                  startContent={<BuildingOffice2Icon className="w-3 h-3" />}
                >
                  상태: {getStatusText(selectedStatus)}
                </Chip>
              )}
              {searchQuery && (
                <Chip
                  onClose={() => setSearchQuery("")}
                  variant="flat"
                  color="success"
                  startContent={<MagnifyingGlassIcon className="w-3 h-3" />}
                >
                  검색: {searchQuery}
                </Chip>
              )}
            </div>
          </CardBody>
        </Card>

        {/* 결과 표시 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 왼쪽: 업체 목록 */}
          <Card className="shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-800">
                    업체 목록
                  </h2>
                  <Badge 
                    content={filteredCompanies.length} 
                    color="primary" 
                    size="lg"
                  >
                    <div className="w-3 h-8" />
                  </Badge>
                </div>

                <div className="flex items-center">
                  <Button
                    color="primary"
                    size="sm"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={onCreateOpen}
                  >
                    신규등록
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Spinner size="lg" color="primary" />
                  <Spacer y={2} />
                  <p className="text-gray-600">업체 정보를 불러오는 중...</p>
                </div>
              ) : filteredCompanies.length > 0 ? (
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredCompanies.map((company, index) => (
                    <div key={company.company_id}>
                      <div
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-l-4 border-transparent hover:border-blue-500"
                        onClick={() => handleCompanySelect(company)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-800">
                                {company.name}
                              </h3>
                              <Chip
                                size="sm"
                                variant="dot"
                                color={getStatusColor(company.status)}
                              >
                                {getStatusText(company.status)}
                              </Chip>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-1">
                              {company.address}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{company.phone}</span>
                              {company.maintenance_start_date && (
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3" />
                                  {formatDate(company.maintenance_start_date)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {index < filteredCompanies.length - 1 && <Divider />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BuildingOffice2Icon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    업체가 없습니다
                  </h3>
                  <p className="text-gray-500">
                    다른 조건으로 검색해보세요
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* 오른쪽: 인터랙티브 지도 */}
          <Card className="shadow-lg">
            <CardHeader className="border-b border-gray-200">
              <div className="flex justify-between items-center w-full">
                <h2 className="text-xl font-semibold text-gray-800">
                  관리업체
                </h2>
                {selectedCity && (
                  <Chip variant="flat" color="primary">
                    {selectedCity} 지역
                  </Chip>
                )}
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="h-[600px] relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
                    <Spinner size="lg" color="primary" />
                    <Spacer y={2} />
                    <p className="text-gray-600">지도를 불러오는 중...</p>
                  </div>
                ) : (
                  <InteractiveMap
                    companies={filteredCompanies}
                    selectedCompany={selectedCompany}
                    onCompanySelect={handleCompanySelect}
                    selectedCity={selectedCity}
                  />
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 업체 상세 정보 모달 */}
        <Modal 
          isOpen={isOpen} 
          onOpenChange={onOpenChange}
          size="2xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">업체 상세 정보</h2>
                    <Chip
                      variant="dot"
                      color={getStatusColor(selectedCompany?.status || "")}
                    >
                      {getStatusText(selectedCompany?.status || "")}
                    </Chip>
                  </div>
                </ModalHeader>
                <ModalBody>
                  {selectedCompany && (
                    <div className="space-y-6">
                      {/* 기본 정보 */}
                      <Card className="shadow-sm">
                        <CardHeader>
                          <h3 className="text-lg font-semibold">기본 정보</h3>
                        </CardHeader>
                        <CardBody>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <BuildingOffice2Icon className="w-5 h-5 text-blue-600" />
                              <span className="font-medium">{selectedCompany.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <MapPinIcon className="w-5 h-5 text-green-600" />
                              <span>{selectedCompany.address}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <PhoneIcon className="w-5 h-5 text-orange-600" />
                              <span>{selectedCompany.phone}</span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      {/* 유지보수 정보 */}
                      <Card className="shadow-sm">
                        <CardHeader>
                          <h3 className="text-lg font-semibold">유지보수 정보</h3>
                        </CardHeader>
                        <CardBody>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">시작일</p>
                              <p className="font-medium">
                                {formatDate(selectedCompany.maintenance_start_date)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">종료일</p>
                              <p className="font-medium">
                                {formatDate(selectedCompany.maintenance_end_date)}
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      {/* 관리 장비 */}
                      <Card className="shadow-sm">
                        <CardHeader>
                          <h3 className="text-lg font-semibold">관리 장비</h3>
                        </CardHeader>
                        <CardBody>
                          {selectedCompany.equipment && selectedCompany.equipment.length > 0 ? (
                            <div className="space-y-3">
                              {selectedCompany.equipment.map((equip) => (
                                <div key={equip.id} className="border rounded-lg p-3">
                                  <div className="font-medium text-gray-800 mb-1">
                                    {equip.equipment_name}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                    {equip.model_name && (
                                      <div>모델: {equip.model_name}</div>
                                    )}
                                    {equip.serial_number && (
                                      <div>시리얼: {equip.serial_number}</div>
                                    )}
                                    {equip.purchase_date && (
                                      <div>구매일: {formatDate(equip.purchase_date)}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-4">
                              등록된 장비가 없습니다.
                            </p>
                          )}
                        </CardBody>
                      </Card>
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    닫기
                  </Button>
                  <Button color="primary" onPress={onClose}>
                    연락하기
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* 신규 업체 등록 모달 */}
        <Modal 
          isOpen={isCreateOpen} 
          onOpenChange={onCreateOpenChange}
          size="3xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold">신규 업체 등록</h2>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-6">
                    {/* 기본 정보 섹션 */}
                    <Card className="shadow-sm">
                      <CardHeader>
                        <h3 className="text-lg font-semibold">기본 정보</h3>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="업체명"
                            placeholder="업체명을 입력하세요"
                            value={newCompany.name}
                            onValueChange={(value) => setNewCompany(prev => ({ ...prev, name: value }))}
                            isRequired
                            variant="bordered"
                          />
                          <Input
                            label="전화번호"
                            placeholder="전화번호를 입력하세요"
                            value={newCompany.phone}
                            onValueChange={(value) => setNewCompany(prev => ({ ...prev, phone: value }))}
                            isRequired
                            variant="bordered"
                          />
                          <div className="col-span-2">
                            <Textarea
                              label="주소"
                              placeholder="상세 주소를 입력하세요"
                              value={newCompany.address}
                              onValueChange={(value) => setNewCompany(prev => ({ ...prev, address: value }))}
                              isRequired
                              variant="bordered"
                              minRows={2}
                            />
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* 유지보수 기간 섹션 */}
                    <Card className="shadow-sm">
                      <CardHeader>
                        <h3 className="text-lg font-semibold">유지보수 기간</h3>
                      </CardHeader>
                      <CardBody>
                        <DateRangePicker 
                          label="유지보수 기간" 
                          className="max-w-full"
                          variant="bordered"
                          onChange={(value) => {
                            if (value) {
                              setNewCompany(prev => ({
                                ...prev,
                                maintenance_start_date: value.start.toString(),
                                maintenance_end_date: value.end.toString()
                              }));
                            }
                          }}
                        />
                      </CardBody>
                    </Card>

                    {/* 장비 정보 섹션 */}
                    <Card className="shadow-sm">
                      <CardHeader>
                        <h3 className="text-lg font-semibold">장비 정보</h3>
                      </CardHeader>
                      <CardBody>
                        {/* 장비 입력 폼 */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="장비명"
                              placeholder="장비명을 입력하세요"
                              value={newEquipment.equipment_name}
                              onValueChange={(value) => setNewEquipment(prev => ({ ...prev, equipment_name: value }))}
                              variant="bordered"
                            />
                            <Input
                              label="모델명"
                              placeholder="모델명을 입력하세요"
                              value={newEquipment.model_name}
                              onValueChange={(value) => setNewEquipment(prev => ({ ...prev, model_name: value }))}
                              variant="bordered"
                            />
                            <Input
                              label="시리얼 번호"
                              placeholder="시리얼 번호를 입력하세요"
                              value={newEquipment.serial_number}
                              onValueChange={(value) => setNewEquipment(prev => ({ ...prev, serial_number: value }))}
                              variant="bordered"
                            />
                            <Input
                              label="구매일"
                              type="date"
                              placeholder="구매일을 선택하세요"
                              value={newEquipment.purchase_date}
                              onValueChange={(value) => setNewEquipment(prev => ({ ...prev, purchase_date: value }))}
                              variant="bordered"
                            />
                          </div>
                          
                          <Button
                            color="secondary"
                            size="sm"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            onPress={handleAddEquipment}
                            className="w-full"
                          >
                            장비 추가
                          </Button>
                        </div>

                        {/* 추가된 장비 목록 */}
                        {newCompany.equipment.length > 0 && (
                          <>
                            <Divider className="my-4" />
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-600">추가된 장비 목록</p>
                              {newCompany.equipment.map((equip, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex-1">
                                    <div className="font-medium">{equip.equipment_name}</div>
                                    <div className="text-sm text-gray-600">
                                      {equip.model_name && `모델: ${equip.model_name}`}
                                      {equip.serial_number && ` | 시리얼: ${equip.serial_number}`}
                                      {equip.purchase_date && ` | 구매일: ${formatDate(equip.purchase_date)}`}
                                    </div>
                                  </div>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    color="danger"
                                    variant="light"
                                    onPress={() => handleRemoveEquipment(index)}
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </CardBody>
                    </Card>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button 
                    color="danger" 
                    variant="light" 
                    onPress={onClose}
                    isDisabled={createLoading}
                  >
                    취소
                  </Button>
                  <Button 
                    color="primary" 
                    onPress={handleCreateCompany}
                    isLoading={createLoading}
                    isDisabled={
                      !newCompany.name || 
                      !newCompany.address || 
                      !newCompany.phone
                    }
                  >
                    등록
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <Spacer y={8} />

        {/* 푸터 */}
        <Card className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
          <CardBody className="text-center py-6">
            <p className="text-gray-300">
              PostgreSQL 데이터베이스와 연동된 실시간 데이터
            </p>
            <p className="text-sm text-gray-400 mt-2">
              총 {companies.length}개 업체 정보가 등록되어 있습니다
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};