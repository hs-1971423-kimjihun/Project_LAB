// components/inspection/InteractiveMap.tsx
"use client";

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './leaflet-styles.css';
import { Company } from '@/data/companyData';
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
  EnvelopeIcon,
  StarIcon
} from '@heroicons/react/24/outline';

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

// 카테고리별 색상 매핑
const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    '교육기관': '#3B82F6', // blue
    '의료기관': '#EF4444', // red
    '공공기관': '#10B981', // green
    '금융업': '#F59E0B', // amber
    '제조업': '#8B5CF6', // purple
    'IT/통신': '#06B6D4', // cyan
    '기타': '#6B7280', // gray
  };
  return colors[category] || '#6B7280';
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
  const cityCoords = getCityCoordinates(company.city);
  
  // 같은 도시 내에서 약간의 랜덤 오프셋 추가 (시각적 분산을 위해)
  const hashCode = company.id.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const offsetLat = (hashCode % 20 - 10) / 1000; // -0.01 ~ 0.01 범위
  const offsetLng = ((hashCode >> 5) % 20 - 10) / 1000;
  
  return [cityCoords[0] + offsetLat, cityCoords[1] + offsetLng];
};

interface ExtendedCompany extends Company {
  phone?: string;
  email?: string;
  category?: string;
  rating?: number;
  status?: "active" | "inactive" | "pending";
  employees?: number;
  description?: string;
}

interface InteractiveMapProps {
  companies: ExtendedCompany[];
  selectedCompany: ExtendedCompany | null;
  onCompanySelect: (company: ExtendedCompany) => void;
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
      case "active": return "운영중";
      case "pending": return "심사중";
      case "inactive": return "중단";
      default: return "알 수 없음";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
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
          const icon = createCustomIcon(getCategoryColor(company.category || '기타'));
          
          return (
            <Marker
              key={company.id}
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
                        color={getStatusColor(company.status || "")}
                      >
                        {getStatusText(company.status || "")}
                      </Chip>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPinIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{company.address}</span>
                      </div>
                      
                      {company.phone && (
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-700">{company.phone}</span>
                        </div>
                      )}
                      
                      {company.category && (
                        <div className="flex items-center gap-2">
                          <BuildingOffice2Icon className="w-4 h-4 text-purple-600" />
                          <Chip size="sm" variant="flat" color="secondary">
                            {company.category}
                          </Chip>
                        </div>
                      )}

                      {company.rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {renderStars(company.rating)}
                          </div>
                          <span className="text-sm font-medium">{company.rating.toFixed(1)}</span>
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
          <h4 className="font-semibold text-sm">업종별 범례</h4>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="space-y-1">
            {Object.entries({
              '교육기관': '#3B82F6',
              '의료기관': '#EF4444',
              '공공기관': '#10B981',
              '금융업': '#F59E0B',
              '제조업': '#8B5CF6',
              'IT/통신': '#06B6D4',
              '기타': '#6B7280',
            }).map(([category, color]) => (
              <div key={category} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-700">{category}</span>
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