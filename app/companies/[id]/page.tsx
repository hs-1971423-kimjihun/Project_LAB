"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Chip,
  Divider,
  Spacer,
  Spinner,
  Breadcrumbs,
  BreadcrumbItem
} from "@heroui/react";
import { 
  BuildingOffice2Icon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PencilIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

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

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;
  
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}`);
        
        if (!response.ok) {
          throw new Error('Company not found');
        }
        
        const data = await response.json();
        setCompany(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

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

  const calculateDuration = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return '-';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays}일`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-gray-600">업체 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <p className="text-red-600 font-semibold mb-2">오류가 발생했습니다</p>
            <p className="text-gray-600">{error || '업체를 찾을 수 없습니다.'}</p>
            <Button 
              color="primary" 
              className="mt-4"
              startContent={<ArrowLeftIcon className="w-4 h-4" />}
              onPress={() => router.back()}
            >
              돌아가기
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* 브레드크럼 */}
        <Breadcrumbs className="mb-6">
          <BreadcrumbItem onPress={() => router.push('/')}>홈</BreadcrumbItem>
          <BreadcrumbItem onPress={() => router.push('/inspection')}>업체 관리</BreadcrumbItem>
          <BreadcrumbItem>{company.name}</BreadcrumbItem>
        </Breadcrumbs>

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="light"
              onPress={() => router.back()}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{company.name}</h1>
              <p className="text-gray-600 mt-1">{company.city} 지역</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Chip
              variant="dot"
              color={getStatusColor(company.status)}
              size="lg"
            >
              {getStatusText(company.status)}
            </Chip>
            <Button
              color="primary"
              startContent={<PencilIcon className="w-4 h-4" />}
            >
              수정
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 상세 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <Card className="shadow-lg">
              <CardHeader>
                <h2 className="text-xl font-semibold">기본 정보</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <BuildingOffice2Icon className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">업체 ID</p>
                      <p className="font-medium">#{company.company_id}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">주소</p>
                      <p className="font-medium">{company.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <PhoneIcon className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">전화번호</p>
                      <p className="font-medium">{company.phone}</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 관리 장비 */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-xl font-semibold">관리 장비</h2>
                  <Chip size="sm" variant="flat" color="primary">
                    총 {company.equipment.length}개
                  </Chip>
                </div>
              </CardHeader>
              <CardBody>
                {company.equipment && company.equipment.length > 0 ? (
                  <div className="space-y-3">
                    {company.equipment.map((equip, index) => (
                      <Card key={equip.id} className="shadow-sm">
                        <CardBody>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 mb-2">
                                {equip.equipment_name}
                              </h3>
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                {equip.model_name && (
                                  <div>
                                    <span className="font-medium">모델명:</span> {equip.model_name}
                                  </div>
                                )}
                                {equip.serial_number && (
                                  <div>
                                    <span className="font-medium">시리얼:</span> {equip.serial_number}
                                  </div>
                                )}
                                {equip.purchase_date && (
                                  <div>
                                    <span className="font-medium">구매일:</span> {formatDate(equip.purchase_date)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Chip size="sm" variant="flat">
                              #{index + 1}
                            </Chip>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BuildingOffice2Icon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">등록된 장비가 없습니다.</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* 오른쪽: 유지보수 정보 */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <h2 className="text-xl font-semibold">유지보수 정보</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <CalendarIcon className="w-4 h-4" />
                      시작일
                    </div>
                    <p className="font-medium text-lg">
                      {formatDate(company.maintenance_start_date)}
                    </p>
                  </div>
                  <Divider />
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <CalendarIcon className="w-4 h-4" />
                      종료일
                    </div>
                    <p className="font-medium text-lg">
                      {formatDate(company.maintenance_end_date)}
                    </p>
                  </div>
                  <Divider />
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <ClockIcon className="w-4 h-4" />
                      계약 기간
                    </div>
                    <p className="font-medium text-lg">
                      {calculateDuration(company.maintenance_start_date, company.maintenance_end_date)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 빠른 작업 */}
            <Card className="shadow-lg">
              <CardHeader>
                <h2 className="text-xl font-semibold">빠른 작업</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <Button className="w-full justify-start" variant="flat">
                    유지보수 일정 연장
                  </Button>
                  <Button className="w-full justify-start" variant="flat">
                    장비 추가
                  </Button>
                  <Button className="w-full justify-start" variant="flat">
                    연락처 수정
                  </Button>
                  <Button className="w-full justify-start" variant="flat" color="danger">
                    업체 삭제
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}