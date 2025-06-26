// components/inspection/InteractiveMap.tsx
"use client";

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './leaflet-styles.css';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Chip, 
  Divider 
} from '@heroui/react';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

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

// Leaflet 기본 아이콘 설정 (Next.js에서 필요)
const createCustomIcon = (color: string) => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.596 0 0 5.596 0 12.5C0 21.875 12.5 41 12.5 41S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0Z" fill="${color}"/>
        <circle cx="12.5" cy="12.5" r="6" fill="white"/>
      </svg>
    `)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// 상태별 색상 매핑
const getStatusColor = (status: string) => {
  switch (status) {
    case "active": return "#10B981"; // green
    case "pending": return "#F59E0B"; // amber
    case "inactive": return "#EF4444"; // red
    default: return "#6B7280"; // gray
  }
};

// 한국의 중심 좌표
const KOREA_CENTER: LatLngTuple = [36.5, 127.5];

// 지역별 좌표 매핑 (대략적인 위치)
const getCityCoordinates = (city: string): LatLngTuple => {
  const coordinates: { [key: string]: LatLngTuple } = {
    '서울': [37.5665, 126.9780],
    '부산': [35.1796, 129.0756],
    '대구': [35.8714, 128.6014],
    '인천': [37.4563, 126.7052],
    '광주': [35.1595, 126.8526],
    '대전': [36.3504, 127.3845],
    '울산': [35.5384, 129.3114],
    '세종': [36.4800, 127.2890],
    '경기': [37.4138, 127.5183],
    '강원': [37.8228, 128.1555],
    '충북': [36.6357, 127.4919],
    '충남': [36.5184, 126.8000],
    '전북': [35.7175, 127.1530],
    '전남': [34.8679, 126.991],
    '경북': [36.4919, 128.8889],
    '경남': [35.4606, 128.2132],
    '제주': [33.4996, 126.5312],
  };
  return coordinates[city] || KOREA_CENTER;
};

// 주소를 기반으로 좌표 추정 (실제로는 geocoding API 사용 권장)
const getCompanyCoordinates = (company: Company): LatLngTuple => {
  const cityCoords = getCityCoordinates(company.city || '기타');
  
  // 같은 도시 내에서 약간의 랜덤 오프셋 추가 (시각적 분산을 위해)
  const hashCode = company.company_id.toString().split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const offsetLat = (hashCode % 20 - 10) / 1000; // -0.01 ~ 0.01 범위
  const offsetLng = ((hashCode >> 5) % 20 - 10) / 1000;
  
  return [cityCoords[0] + offsetLat, cityCoords[1] + offsetLng];
};

interface InteractiveMapProps {
  companies: Company[];
  selectedCompany: Company | null;
  onCompanySelect: (company: Company) => void;
  selectedCity?: string;
}

// 지도 중심 업데이트 컴포넌트
const MapUpdater: React.FC<{ center: LatLngTuple; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  companies,
  selectedCompany,
  onCompanySelect,
  selectedCity
}) => {
  // 지도 중심점과 줌 레벨 계산
  const mapCenter = useMemo(() => {
    if (selectedCity) {
      return getCityCoordinates(selectedCity);
    }
    return KOREA_CENTER;
  }, [selectedCity]);

  const mapZoom = selectedCity ? 11 : 7;

  const getStatusColorForChip = (status: string) => {
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

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        {/* 지도 중심 업데이트 */}
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* OpenStreetMap 타일 레이어 */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 업체 마커들 */}
        {companies.map((company) => {
          const position = getCompanyCoordinates(company);
          const icon = createCustomIcon(getStatusColor(company.status));
          
          return (
            <Marker
              key={company.company_id}
              position={position}
              icon={icon}
              eventHandlers={{
                click: () => {
                  onCompanySelect(company);
                },
              }}
            >
              <Popup className="custom-popup" minWidth={300}>
                <Card className="shadow-none border-none bg-transparent">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between w-full">
                      <h3 className="font-bold text-lg">{company.name}</h3>
                      <Chip
                        size="sm"
                        variant="dot"
                        color={getStatusColorForChip(company.status)}
                      >
                        {getStatusText(company.status)}
                      </Chip>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPinIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{company.address}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700">{company.phone}</span>
                      </div>
                      
                      {company.maintenance_start_date && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-700">
                            유지보수: {formatDate(company.maintenance_start_date)}
                          </span>
                        </div>
                      )}

                      <Divider className="my-2" />
                      
                      <Button
                        size="sm"
                        color="primary"
                        className="w-full"
                        onPress={() => onCompanySelect(company)}
                      >
                        상세 정보 보기
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* 지도 범례 */}
      <Card className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <h4 className="font-semibold text-sm">상태별 범례</h4>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="space-y-1">
            {Object.entries({
              '유지보수 중': '#10B981',
              '예정': '#F59E0B',
              '종료': '#EF4444',
            }).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-700">{status}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 업체 수 표시 */}
      <Card className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm">
        <CardBody className="py-2 px-3">
          <div className="flex items-center gap-2">
            <BuildingOffice2Icon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">
              총 {companies.length}개 업체
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default InteractiveMap;