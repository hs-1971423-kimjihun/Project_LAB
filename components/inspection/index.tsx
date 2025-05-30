"use client";

import React, { useState, useMemo } from "react";
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
  useDisclosure
} from "@heroui/react";
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  BuildingOffice2Icon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon,
  EyeIcon,
  FunnelIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

// 실제 데이터 import
import { companies, cities, Company } from "@/data/companyData";
// 지도 컴포넌트 import
import InteractiveMap from "./InteractiveMap";

// 확장된 Company 인터페이스 (표시용 추가 정보)
interface ExtendedCompany extends Company {
  phone?: string;
  email?: string;
  category?: string;
  rating?: number;
  status?: "active" | "inactive" | "pending";
  employees?: number;
  description?: string;
}

// 기본 데이터에 추가 정보를 생성하는 함수
const generateExtendedData = (company: Company): ExtendedCompany => {
  // 회사명이나 주소를 기반으로 카테고리 추정
  const getCategory = (name: string) => {
    if (name.includes("대학교") || name.includes("대학원")) return "교육기관";
    if (name.includes("병원") || name.includes("의료")) return "의료기관";
    if (name.includes("시청") || name.includes("공단") || name.includes("공사") || name.includes("위원회")) return "공공기관";
    if (name.includes("금융") || name.includes("투자") || name.includes("카드") || name.includes("생명") || name.includes("해상")) return "금융업";
    if (name.includes("건설") || name.includes("타이어") || name.includes("제약") || name.includes("화학")) return "제조업";
    if (name.includes("통신") || name.includes("DS") || name.includes("정보")) return "IT/통신";
    return "기타";
  };

  // 간단한 해시 함수로 일관된 랜덤 값 생성
  const hash = company.id.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  const randomSeed = Math.abs(hash);
  
  return {
    ...company,
    phone: `0${2 + (randomSeed % 6)}-${String(randomSeed % 9000 + 1000)}-${String(randomSeed % 9000 + 1000)}`,
    email: `contact@${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.kr`,
    category: getCategory(company.name),
    rating: 3.5 + (randomSeed % 20) / 10, // 3.5 ~ 5.5
    status: (["active", "active", "active", "pending", "inactive"] as const)[randomSeed % 5],
    employees: 50 + (randomSeed % 300),
    description: `${company.name}는 ${getCategory(company.name)} 분야의 전문 기업입니다.`
  };
};

export const Inspection = () => {
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<ExtendedCompany | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // 확장 데이터 생성
  const extendedCompanies = useMemo(() => 
    companies.map(generateExtendedData), []);

  const handleCitySelect = async (city: string) => {
    setIsLoading(true);
    setSelectedCity(city);
    setSelectedCompany(null);
    
    // 로딩 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
  };

  const handleCompanySelect = (company: ExtendedCompany) => {
    setSelectedCompany(company);
    onOpen(); // 모달 열기
  };

  const categories = useMemo(() => {
    const categorySet = new Set(extendedCompanies.map(company => company.category));
    return Array.from(categorySet);
  }, [extendedCompanies]);

  const filteredCompanies = useMemo(() => {
    let filtered = extendedCompanies;
    
    if (selectedCity) {
      filtered = filtered.filter(company => company.city === selectedCity);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(company => company.category === selectedCategory);
    }
    
    return filtered;
  }, [extendedCompanies, selectedCity, searchQuery, selectedCategory]);

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
      case "active": return "유지보수";
      case "pending": return "중단";
      case "inactive": return "종료";
      default: return "알 수 없음";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 섹션 */}
        {/* <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardBody className="text-center py-8">
            <h1 className="text-4xl font-bold mb-2">🏢 업체 정보 조회 시스템</h1>
            <p className="text-blue-100 text-lg">
              지역별 업체 정보를 검색하고 상세 정보를 확인하세요
            </p>
          </CardBody>
        </Card> */}

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

              {/* 카테고리 필터 */}
              <Select
                label="업종 필터"
                placeholder="업종을 선택하세요"
                selectedKeys={selectedCategory ? [selectedCategory] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSelectedCategory(selected || "");
                }}
                startContent={<BuildingOffice2Icon className="w-4 h-4" />}
                variant="bordered"
                color="primary"
              >
                {categories.map((category) => (
                  <SelectItem key={category || ""}>
                    {category || ""}
                  </SelectItem>
                ))}
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
              {selectedCategory && (
                <Chip
                  onClose={() => setSelectedCategory("")}
                  variant="flat"
                  color="secondary"
                  startContent={<BuildingOffice2Icon className="w-3 h-3" />}
                >
                  업종: {selectedCategory}
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
                <h2 className="text-xl font-semibold text-gray-800">
                  업체 목록
                </h2>
                <Badge 
                  content={filteredCompanies.length} 
                  color="primary" 
                  size="lg"
                >
                  <div className="w-8 h-8" />
                </Badge>
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
                    <div key={company.id}>
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
                                color={getStatusColor(company.status || "")}
                              >
                                {getStatusText(company.status || "")}
                              </Chip>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-1">
                              {company.address}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{company.phone}</span>
                              <span>{company.category}</span>
                              {/* <div className="flex items-center gap-1">
                                {renderStars(company.rating || 0)}
                                <span>{company.rating?.toFixed(1)}</span>
                              </div> */}
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
                            <div className="flex items-center gap-3">
                              <EnvelopeIcon className="w-5 h-5 text-purple-600" />
                              <span>{selectedCompany.email}</span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      {/* 평가 및 통계
                      <Card className="shadow-sm">
                        <CardHeader>
                          <h3 className="text-lg font-semibold">평가 및 통계</h3>
                        </CardHeader>
                        <CardBody>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">평점</p>
                              <div className="flex items-center gap-2">
                                {renderStars(selectedCompany.rating || 0)}
                                <span className="font-semibold">{selectedCompany.rating?.toFixed(1)}/5</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">직원 수</p>
                              <p className="font-semibold">{selectedCompany.employees}명</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">업종</p>
                              <Chip size="sm" variant="flat" color="secondary">
                                {selectedCompany.category}
                              </Chip>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">상태</p>
                              <Chip 
                                size="sm" 
                                variant="dot" 
                                color={getStatusColor(selectedCompany.status || "")}
                              >
                                {getStatusText(selectedCompany.status || "")}
                              </Chip>
                            </div>
                          </div>
                        </CardBody>
                      </Card> */}

                      {/* 설명 */}
                      <Card className="shadow-sm">
                        <CardHeader>
                          <h3 className="text-lg font-semibold">관리 장비</h3>
                        </CardHeader>
                        <CardBody>
                          {/* <p className="text-gray-700">{selectedCompany.description}</p> */}

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

        <Spacer y={8} />

        {/* 푸터 */}
        <Card className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
          <CardBody className="text-center py-6">
            <p className="text-gray-300">
              업데이트는 CompanyData.ts, 전화번호, Chip요소는 랜덤값
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