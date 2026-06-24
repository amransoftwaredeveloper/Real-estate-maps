import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Popup, 
  useMap 
} from 'react-leaflet';
import { 
  GoogleMap, 
  useJsApiLoader, 
  CircleF 
} from '@react-google-maps/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  MapPin, 
  Filter, 
  TrendingUp, 
  Layers, 
  DollarSign, 
  Maximize2, 
  Activity, 
  X, 
  Settings, 
  Database,
  ChevronLeft,
  Info,
  Calendar,
  Compass
} from 'lucide-react';
import districtsData from '../districts_summary.json';

const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0a0f1d" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0f1d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#182e2f" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#222a3f" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1b2131" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#343e56" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1320" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0e1320" }],
  },
];

// Constants for styling and coordinates
const CITY_COORDINATES = {
  "الرياض": { lat: 24.7136, lng: 46.6753, zoom: 11 },
  "جدة": { lat: 21.5433, lng: 39.1728, zoom: 11 },
  "جده": { lat: 21.5433, lng: 39.1728, zoom: 11 },
  "الدمام": { lat: 26.4207, lng: 50.0888, zoom: 11 },
  "الخبر": { lat: 26.2172, lng: 50.1971, zoom: 11 },
  "المدينة المنورة": { lat: 24.5246, lng: 39.5692, zoom: 11 },
  "مكة المكرمة": { lat: 21.3891, lng: 39.8579, zoom: 11 },
  "الطائف": { lat: 21.2854, lng: 40.4182, zoom: 11 },
  "حائل": { lat: 27.5219, lng: 41.6907, zoom: 11 },
  "خميس مشيط": { lat: 18.3064, lng: 42.7301, zoom: 11 },
  "الهفوف": { lat: 25.3644, lng: 49.5894, zoom: 11 },
  "حفر الباطن": { lat: 28.4322, lng: 45.9556, zoom: 11 },
  "تبوك": { lat: 20.3957, lng: 36.5715, zoom: 11 },
  "جيزان": { lat: 16.8892, lng: 42.5511, zoom: 11 }
};

const CLASSIFICATION_COLORS = {
  "سكني": "#10b981", // Green
  "تجاري": "#3b82f6", // Blue
  "زراعي": "#f59e0b", // Yellow/Orange
  "صناعي": "#8b5cf6", // Purple
  "أخرى": "#9ca3af"   // Gray
};

const CLASSIFICATION_TRANSLATIONS = {
  "سكني": "سكني",
  "تجاري": "تجاري",
  "زراعي": "زراعي",
  "صناعي": "صناعي",
  "أخرى / عام": "أخرى"
};

// Component to dynamically pan, zoom the map and notify zoom changes
function MapController({ city, center, zoom, onZoomChange }) {
  const map = useMap();
  const lastFlownCityRef = useRef(null);
  const onZoomChangeRef = useRef(onZoomChange);

  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  });
  
  useEffect(() => {
    if (city !== lastFlownCityRef.current) {
      lastFlownCityRef.current = city;
      if (center) {
        map.flyTo(center, zoom, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    }
  }, [city, center, zoom, map]);

  useEffect(() => {
    const handleZoom = () => {
      if (onZoomChangeRef.current) {
        onZoomChangeRef.current(map.getZoom());
      }
    };
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  return null;
}

function App() {
  // Application State
  const [data, setData] = useState(districtsData);
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [selectedClassification, setSelectedClassification] = useState('الكل');
  const [colorMode, setColorMode] = useState('classification'); // 'classification' or 'price'
  const [sortBy, setSortBy] = useState('transactions'); // 'transactions', 'price', 'pricePerM2'
  
  // Slider limits & values state
  const [priceRange, setPriceRange] = useState(10000000); // Max filter value (up to 10M SAR)
  const [areaRange, setAreaRange] = useState(5000); // Max filter value (up to 5000 sqm)
  
  // Selection and Details Drawer
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  
  // Get initial state once, and keep it constant for this session to prevent loader conflicts
  const initialApiKey = useMemo(() => {
    let savedKey = localStorage.getItem('google_maps_api_key');
    // Auto-correct typo key or empty key on startup to ensure Google Maps works directly
    if (!savedKey || savedKey.trim() === '' || savedKey === 'AIzaSyAtGGtHxkyT4Vjh0Xfa1Bc6bxAtbuD_TA') {
      savedKey = 'AIzaSyAtGGtHxkyT4Vjhn0Xfa1Bc6bxAtbuD_TA';
      localStorage.setItem('google_maps_api_key', savedKey);
      localStorage.setItem('use_google_maps', 'true');
    }
    return savedKey;
  }, []);

  const initialUseGoogleMaps = useMemo(() => {
    let savedKey = localStorage.getItem('google_maps_api_key');
    // If the key is the correct default key, we always force Google Maps to be active by default
    if (savedKey === 'AIzaSyAtGGtHxkyT4Vjhn0Xfa1Bc6bxAtbuD_TA') {
      return true;
    }
    const stored = localStorage.getItem('use_google_maps');
    if (stored !== null) {
      return stored === 'true';
    }
    return true;
  }, []);

  // Map Type state (Leaflet vs Google Maps Mock/Real)
  const [useGoogleMaps, setUseGoogleMaps] = useState(initialUseGoogleMaps);
  const [showApiModal, setShowApiModal] = useState(false);
  const [googleApiKey, setGoogleApiKey] = useState(initialApiKey);
  const [mapType, setMapType] = useState('dark'); // base map selection (dark or light)
  
  // Shared Map state to prevent uncontrolled render jumps
  const [mapCenter, setMapCenter] = useState({ lat: 24.0, lng: 45.0 });
  const [mapZoom, setMapZoom] = useState(6);
  const mapRef = useRef(null);

  // Pan/Zoom when selected city changes
  useEffect(() => {
    if (selectedCity !== 'الكل' && CITY_COORDINATES[selectedCity]) {
      const coords = CITY_COORDINATES[selectedCity];
      setMapCenter({ lat: coords.lat, lng: coords.lng });
      setMapZoom(coords.zoom);
    } else {
      setMapCenter({ lat: 24.0, lng: 45.0 });
      setMapZoom(6);
    }
  }, [selectedCity]);

  const activeMapType = mapZoom >= 13 ? 'satellite' : mapType;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: initialApiKey || 'dummy_key'
  });

  const [googleAuthFailed, setGoogleAuthFailed] = useState(false);

  // Trace Google Maps script loading status and authentication
  useEffect(() => {
    console.log("📍 [خرائط جوجل] بدء تهيئة المكتبة بالمفتاح:", initialApiKey);
    
    const handleAuthFailure = () => {
      setGoogleAuthFailed(true);
    };

    window.addEventListener('google-maps-auth-failed', handleAuthFailure);
    
    if (window.googleMapsAuthFailed) {
      setGoogleAuthFailed(true);
    }

    return () => {
      window.removeEventListener('google-maps-auth-failed', handleAuthFailure);
    };
  }, [initialApiKey]);

  useEffect(() => {
    if (isLoaded) {
      console.log("✅ [خرائط جوجل] تم تحميل سكربت خرائط جوجل بنجاح في المتصفح.");
    }
  }, [isLoaded]);

  useEffect(() => {
    if (loadError) {
      console.error("❌ [خرائط جوجل] حدث خطأ أثناء تحميل السكربت (Loader Error):", loadError);
    }
  }, [loadError]);

  // Extract unique cities list
  const citiesList = useMemo(() => {
    const cities = new Set(districtsData.map(d => d.city));
    return ['الكل', ...Array.from(cities)];
  }, []);

  // Handle fly to city coordinates
  const mapViewport = useMemo(() => {
    if (selectedCity !== 'الكل' && CITY_COORDINATES[selectedCity]) {
      return {
        center: [CITY_COORDINATES[selectedCity].lat, CITY_COORDINATES[selectedCity].lng],
        zoom: CITY_COORDINATES[selectedCity].zoom
      };
    }
    // Default Saudi Arabia center
    return {
      center: [24.0, 45.0],
      zoom: 6
    };
  }, [selectedCity]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return districtsData.filter(d => {
      const matchCity = selectedCity === 'الكل' || d.city === selectedCity;
      const matchClass = selectedClassification === 'الكل' || d.dominantClassification === selectedClassification;
      const matchPrice = d.averagePrice <= priceRange;
      const matchArea = d.averageArea <= areaRange;
      return matchCity && matchClass && matchPrice && matchArea;
    }).sort((a, b) => {
      if (sortBy === 'transactions') return b.transactionCount - a.transactionCount;
      if (sortBy === 'price') return b.averagePrice - a.averagePrice;
      if (sortBy === 'pricePerM2') return b.averagePricePerM2 - a.averagePricePerM2;
      return 0;
    });
  }, [selectedCity, selectedClassification, priceRange, areaRange, sortBy]);

  // Global KPIs for filtered data
  const kpis = useMemo(() => {
    if (filteredData.length === 0) {
      return { totalTransactions: 0, avgPrice: 0, avgPricePerM2: 0 };
    }
    
    let totalTransactions = 0;
    let totalPriceSum = 0;
    let totalAreaSum = 0;
    
    filteredData.forEach(d => {
      totalTransactions += d.transactionCount;
      totalPriceSum += d.totalSales;
      totalAreaSum += d.totalArea;
    });
    
    return {
      totalTransactions,
      avgPrice: Math.round(totalPriceSum / totalTransactions),
      avgPricePerM2: Number((totalPriceSum / totalAreaSum).toFixed(2))
    };
  }, [filteredData]);

  // Top districts chart data
  const topDistrictsChartData = useMemo(() => {
    return filteredData.slice(0, 5).map(d => ({
      name: `${d.city}/${d.district}`,
      الصفقات: d.transactionCount,
      السعر: Math.round(d.averagePrice / 1000) // in thousands
    }));
  }, [filteredData]);

  // Classification breakdown for selected district
  const districtClassificationChartData = useMemo(() => {
    if (!selectedDistrict) return [];
    
    return Object.entries(selectedDistrict.classificationsCount).map(([name, value]) => ({
      name,
      value,
      color: CLASSIFICATION_COLORS[name] || CLASSIFICATION_COLORS['أخرى']
    }));
  }, [selectedDistrict]);

  // Color mapper for markers based on pricing
  const getPriceColor = (price) => {
    if (price < 300000) return '#10b981'; // Green (Low)
    if (price < 1000000) return '#3b82f6'; // Blue (Medium)
    if (price < 3000000) return '#f59e0b'; // Orange (High)
    return '#ef4444'; // Red (Very High)
  };

  // Formatting helpers
  const formatCurrency = (val) => {
    if (val >= 1e6) {
      return (val / 1e6).toFixed(2) + ' مليون ر.س';
    }
    return val.toLocaleString('ar-SA') + ' ر.س';
  };

  const formatArea = (val) => {
    return Math.round(val).toLocaleString('ar-SA') + ' م²';
  };

  const saveApiKey = () => {
    const trimmed = googleApiKey.trim();
    localStorage.setItem('google_maps_api_key', trimmed);
    localStorage.setItem('use_google_maps', trimmed !== '' ? 'true' : 'false');
    setShowApiModal(false);
    window.location.reload();
  };

  const clearApiKey = () => {
    localStorage.removeItem('google_maps_api_key');
    localStorage.setItem('use_google_maps', 'false');
    setShowApiModal(false);
    window.location.reload();
  };

  return (
    <div className="app-container">

      {/* Main Section */}
      <main className="main-content">
        
        {/* Sidebar Controls */}
        <aside className="sidebar">
          
          {/* KPI Dashboard */}
          <div className="kpi-container">
            <div className="kpi-card glass">
              <span className="kpi-value">{(kpis.totalTransactions).toLocaleString('ar-SA')}</span>
              <span className="kpi-label">إجمالي الصفقات</span>
            </div>
            <div className="kpi-card glass">
              <span className="kpi-value" style={{ color: '#60a5fa' }}>
                {kpis.avgPrice >= 1e6 ? `${(kpis.avgPrice / 1e6).toFixed(1)}M` : `${Math.round(kpis.avgPrice / 1000)}k`}
              </span>
              <span className="kpi-label">متوسط السعر</span>
            </div>
            <div className="kpi-card glass">
              <span className="kpi-value" style={{ color: '#34d399' }}>
                {Math.round(kpis.avgPricePerM2).toLocaleString('ar-SA')}
              </span>
              <span className="kpi-label">سعر المتر ر.س</span>
            </div>
          </div>

          {/* Filter Panel */}
          <div className="filter-section glass">
            <h3 className="section-title">
              <Filter size={18} color="#3b82f6" />
              <span>فلاتر البحث والتحكم</span>
            </h3>

            {/* City Selector */}
            <div className="filter-group">
              <label>المدينة</label>
              <select 
                className="custom-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                {citiesList.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Classification Selector */}
            <div className="filter-group">
              <label>تصنيف العقار السائد</label>
              <select 
                className="custom-select"
                value={selectedClassification}
                onChange={(e) => setSelectedClassification(e.target.value)}
              >
                <option value="الكل">كل التصنيفات</option>
                <option value="سكني">سكني</option>
                <option value="تجاري">تجاري</option>
                <option value="زراعي">زراعي</option>
                <option value="صناعي">صناعي</option>
              </select>
            </div>

            {/* Price Slider */}
            <div className="filter-group">
              <div className="range-values">
                <label>الحد الأقصى للسعر</label>
                <span>{formatCurrency(priceRange)}</span>
              </div>
              <input 
                type="range" 
                className="range-slider"
                min="50000" 
                max="10000000" 
                step="50000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
              />
            </div>

            {/* Area Slider */}
            <div className="filter-group">
              <div className="range-values">
                <label>الحد الأقصى للمساحة</label>
                <span>{formatArea(areaRange)}</span>
              </div>
              <input 
                type="range" 
                className="range-slider"
                min="100" 
                max="10000" 
                step="100"
                value={areaRange}
                onChange={(e) => setAreaRange(Number(e.target.value))}
              />
            </div>

            {/* Sort Selector */}
            <div className="filter-group">
              <label>ترتيب قائمة الأحياء</label>
              <select 
                className="custom-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="transactions">الأكثر نشاطاً (عدد الصفقات)</option>
                <option value="price">الأعلى سعراً في المتوسط</option>
                <option value="pricePerM2">أعلى سعر متر مربع</option>
              </select>
            </div>
          </div>

          {/* Color Mode Tabs */}
          <div className="filter-section glass">
            <h3 className="section-title">
              <Layers size={18} color="#8b5cf6" />
              <span>طريقة تلوين الخريطة</span>
            </h3>
            <div className="tabs-container">
              <button 
                className={`tab-btn ${colorMode === 'classification' ? 'active' : ''}`}
                onClick={() => setColorMode('classification')}
              >
                حسب نوع العقار
              </button>
              <button 
                className={`tab-btn ${colorMode === 'price' ? 'active' : ''}`}
                onClick={() => setColorMode('price')}
              >
                حسب السعر
              </button>
            </div>
          </div>

          {/* Visual Analytics Summary */}
          <div className="filter-section glass" style={{ flex: 1, minHeight: '260px' }}>
            <h3 className="section-title">
              <TrendingUp size={18} color="#10b981" />
              <span>الأحياء الأكثر نشاطاً صفقات</span>
            </h3>
            
            {topDistrictsChartData.length > 0 ? (
              <div style={{ width: '100%', height: '200px', marginTop: '10px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart 
                    data={topDistrictsChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                  >
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#9ca3af" 
                      width={100}
                      tickFormatter={(tick) => tick.length > 15 ? tick.substring(tick.indexOf('/') + 1) : tick}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#161e39', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar 
                      dataKey="الصفقات" 
                      fill="url(#colorBarGradient)" 
                      radius={[0, 4, 4, 0]}
                    >
                      {/* Gradient defs are handled in SVG context */}
                    </Bar>
                    <defs>
                      <linearGradient id="colorBarGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="map-placeholder">
                <Info size={24} />
                <span>لا توجد بيانات كافية للرسم</span>
              </div>
            )}
          </div>
        </aside>

        {/* Map view Container */}
        <section className="map-container">
          
          {/* Map Controls Overlay (Satellite / Map Toggle) */}
          <div className="map-type-selector" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`map-type-btn ${mapType === 'dark' ? 'active' : ''}`}
                onClick={() => setMapType('dark')}
              >
                خريطة داكنة
              </button>
              <button 
                className={`map-type-btn ${mapType === 'light' ? 'active' : ''}`}
                onClick={() => setMapType('light')}
              >
                خريطة مضيئة
              </button>
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              backgroundColor: 'rgba(10, 15, 29, 0.9)', 
              color: mapZoom >= 13 ? '#34d399' : '#9ca3af',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-main)',
              backdropFilter: 'var(--glass-blur)'
            }}>
              <span className={mapZoom >= 13 ? 'marker-pulse' : ''} style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: mapZoom >= 13 ? '#10b981' : '#6b7280',
                display: 'inline-block'
              }}></span>
              <strong>
                {mapZoom >= 13 
                  ? 'نمط الأقمار الصناعية (جوجل إيرث) نشط حالياً (التقريب ≥ 13)' 
                  : `قرب الخريطة أكثر لتبديل تلقائي للأقمار الصناعية (مستوى التقريب: ${Math.round(mapZoom)} / 13)`
                }
              </strong>
            </div>
          </div>

          {/* Map Selector & Loader Conditional */}
          {useGoogleMaps && googleApiKey ? (
            googleAuthFailed ? (
              <div className="map-placeholder" style={{ padding: '24px', textAlign: 'center', backgroundColor: '#0a0f1d' }}>
                <div style={{ color: '#ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <Info size={48} />
                  <strong style={{ fontSize: '1.25rem', fontWeight: 850 }}>فشل مصادقة مفتاح خرائط جوجل</strong>
                  <p style={{ maxWidth: '500px', fontSize: '0.85rem', color: '#9ca3af', lineHeight: '1.7', direction: 'rtl' }}>
                    لم تتمكن الخريطة من التحقق من مفتاح الـ API الخاص بك. قد يكون المفتاح غير صالح، أو لم يتم ربط بطاقة الدفع (Billing) بحساب جوجل كلاود الخاص بك، أو أن خدمة <strong>Maps JavaScript API</strong> غير مفعلة في المشروع.
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-primary" onClick={() => setShowApiModal(true)}>
                      تعديل مفتاح الخريطة
                    </button>
                    <button className="btn btn-secondary" onClick={clearApiKey}>
                      استخدام الخريطة الحرة البديلة (Leaflet)
                    </button>
                  </div>
                </div>
              </div>
            ) : isLoaded ? (
              <GoogleMap
                mapContainerClassName="leaflet-container"
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={mapZoom}
                mapTypeId={activeMapType === 'satellite' ? 'hybrid' : 'roadmap'}
                onLoad={(map) => { 
                  mapRef.current = map; 
                }}
                onDragEnd={() => {
                  if (mapRef.current) {
                    const center = mapRef.current.getCenter();
                    setMapCenter({ lat: center.lat(), lng: center.lng() });
                  }
                }}
                onZoomChanged={() => {
                  if (mapRef.current) {
                    setMapZoom(mapRef.current.getZoom());
                    const center = mapRef.current.getCenter();
                    setMapCenter({ lat: center.lat(), lng: center.lng() });
                  }
                }}
                options={{
                  styles: activeMapType === 'dark' ? GOOGLE_MAPS_DARK_STYLE : [],
                  mapTypeControl: false,
                  streetViewControl: false,
                  zoomControl: true,
                  fullscreenControl: false
                }}
              >
                {filteredData.map((district) => {
                  const radius = Math.max(200, Math.min(6000, 100 + Math.log2(district.transactionCount) * 450));
                  const color = colorMode === 'classification' 
                    ? (CLASSIFICATION_COLORS[district.dominantClassification] || CLASSIFICATION_COLORS['أخرى'])
                    : getPriceColor(district.averagePrice);

                  return (
                    <CircleF
                      key={`${district.city}-${district.district}`}
                      center={{ lat: district.lat, lng: district.lng }}
                      radius={radius}
                      options={{
                        fillColor: color,
                        fillOpacity: 0.4,
                        strokeColor: color,
                        strokeOpacity: 0.8,
                        strokeWeight: 1.5,
                        clickable: true
                      }}
                      onClick={() => {
                        setSelectedDistrict(district);
                      }}
                    />
                  );
                })}
              </GoogleMap>
            ) : (
              <div className="map-placeholder">
                <span>جاري تحميل خرائط جوجل...</span>
              </div>
            )
          ) : (
            <MapContainer 
              center={mapViewport.center} 
              zoom={mapViewport.zoom} 
              scrollWheelZoom={true}
              zoomControl={true}
            >
              {activeMapType === 'satellite' ? (
                <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              ) : activeMapType === 'dark' ? (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
              ) : (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              )}

              <MapController 
                city={selectedCity}
                center={mapViewport.center} 
                zoom={mapViewport.zoom} 
                onZoomChange={(zoom) => setMapZoom(zoom)}
              />

              {filteredData.map((district) => {
                const radius = Math.max(7, Math.min(28, 5 + Math.log2(district.transactionCount) * 2.8));
                const color = colorMode === 'classification' 
                  ? (CLASSIFICATION_COLORS[district.dominantClassification] || CLASSIFICATION_COLORS['أخرى'])
                  : getPriceColor(district.averagePrice);

                return (
                  <CircleMarker
                    key={`${district.city}-${district.district}`}
                    center={[district.lat, district.lng]}
                    radius={radius}
                    pathOptions={{
                      fillColor: color,
                      color: color,
                      weight: 1.5,
                      opacity: 0.9,
                      fillOpacity: 0.5
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedDistrict(district);
                      }
                    }}
                  >
                    <Popup>
                      <div style={{ direction: 'rtl', textAlign: 'right', minWidth: '150px' }}>
                        <h4 style={{ fontWeight: 800, margin: '0 0 4px 0', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                          حي {district.district}
                        </h4>
                        <div style={{ fontSize: '0.8rem', margin: '4px 0' }}>
                          <strong>المدينة:</strong> {district.city}<br />
                          <strong>الصفقات:</strong> {district.transactionCount}<br />
                          <strong>متوسط السعر:</strong> {formatCurrency(district.averagePrice)}<br />
                          <strong>سعر المتر:</strong> {Math.round(district.averagePricePerM2).toLocaleString('ar-SA')} ر.س/م²
                        </div>
                        <span 
                          className={`badge badge-${district.dominantClassification === 'سكني' ? 'residential' : district.dominantClassification === 'تجاري' ? 'commercial' : district.dominantClassification === 'زراعي' ? 'agricultural' : district.dominantClassification === 'صناعي' ? 'industrial' : 'other'}`}
                          style={{ marginTop: '4px', display: 'inline-block' }}
                        >
                          {district.dominantClassification}
                        </span>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}

          {/* Map Legend */}
          <div className="map-legend glass">
            <span className="legend-title">مفتاح الخريطة</span>
            {colorMode === 'classification' ? (
              <>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: CLASSIFICATION_COLORS['سكني'] }}></div>
                  <span>سكني</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: CLASSIFICATION_COLORS['تجاري'] }}></div>
                  <span>تجاري</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: CLASSIFICATION_COLORS['زراعي'] }}></div>
                  <span>زراعي</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: CLASSIFICATION_COLORS['صناعي'] }}></div>
                  <span>صناعي</span>
                </div>
              </>
            ) : (
              <>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: getPriceColor(100000) }}></div>
                  <span>أقل من 300 ألف ر.س</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: getPriceColor(500000) }}></div>
                  <span>300 ألف - 1 مليون ر.س</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: getPriceColor(1500000) }}></div>
                  <span>1 مليون - 3 مليون ر.س</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: getPriceColor(5000000) }}></div>
                  <span>أكثر من 3 مليون ر.س</span>
                </div>
              </>
            )}
          </div>

          {/* Detailed District Side Drawer */}
          <div className={`details-drawer glass ${selectedDistrict ? 'open' : ''}`}>
            {selectedDistrict && (
              <>
                <div className="drawer-header">
                  <div className="drawer-title-group">
                    <h2>حي {selectedDistrict.district}</h2>
                    <p>{selectedDistrict.city} - المنطقة {selectedDistrict.region}</p>
                  </div>
                  <button 
                    className="close-drawer-btn"
                    onClick={() => setSelectedDistrict(null)}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Key Metrics */}
                <div className="details-grid">
                  <div className="detail-card">
                    <span className="detail-card-label">متوسط السعر</span>
                    <span className="detail-card-value" style={{ color: '#60a5fa' }}>
                      {formatCurrency(selectedDistrict.averagePrice)}
                    </span>
                  </div>
                  <div className="detail-card">
                    <span className="detail-card-label">متوسط سعر المتر</span>
                    <span className="detail-card-value" style={{ color: '#34d399' }}>
                      {Math.round(selectedDistrict.averagePricePerM2).toLocaleString('ar-SA')} ر.س
                    </span>
                  </div>
                  <div className="detail-card">
                    <span className="detail-card-label">متوسط المساحة</span>
                    <span className="detail-card-value">
                      {formatArea(selectedDistrict.averageArea)}
                    </span>
                  </div>
                  <div className="detail-card">
                    <span className="detail-card-label">حجم الصفقات</span>
                    <span className="detail-card-value">
                      {selectedDistrict.transactionCount} صفقة
                    </span>
                  </div>
                </div>

                {/* Distribution Chart */}
                <div className="chart-container">
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', display: 'block', color: '#fff' }}>
                    توزيع صفقات الحي حسب نوع العقار
                  </span>
                  <div style={{ width: '100%', height: '140px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={districtClassificationChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={50}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {districtClassificationChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconSize={8} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* List of Recent Sample Transactions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} color="#3b82f6" />
                    صفقات مميزة تمت في الحي مؤخراً
                  </span>

                  <div className="transaction-list">
                    {selectedDistrict.recentTransactions.map((tx, idx) => (
                      <div className="transaction-item" key={idx}>
                        <div className="transaction-info">
                          <span className="transaction-id">رقم الصفقة: {tx.id}</span>
                          <div className="transaction-meta">
                            <span 
                              className={`badge badge-${tx.classification === 'سكني' ? 'residential' : tx.classification === 'تجاري' ? 'commercial' : tx.classification === 'زراعي' ? 'agricultural' : tx.classification === 'صناعي' ? 'industrial' : 'other'}`}
                            >
                              {tx.classification}
                            </span>
                            <span>{formatArea(tx.area)}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <span className="transaction-price">{formatCurrency(tx.price)}</span>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>
                            {Math.round(tx.pricePerM2).toLocaleString('ar-SA')} ر.س/م²
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Google Maps API Key Modal */}
      {showApiModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h3>إعداد مفتاح خرائط جوجل (Google Maps API)</h3>
              <button 
                className="close-drawer-btn"
                onClick={() => setShowApiModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                يقوم التطبيق حالياً بعرض الخرائط عبر محرك خرائط مفتوح المصدر (Leaflet) مدمج بشكل داكن وجميل.
                إذا كنت ترغب بالتبديل إلى خرائط جوجل الرسمية ومميزاتها (الصور الفضائية الفاخرة، التجوّل الافتراضي، الخرائط المجسمة)، يرجى إدخال مفتاح الـ API الخاص بك هنا:
              </p>
              
              <input 
                type="text" 
                className="api-input"
                placeholder="AIzaSy..."
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
              />

              <p style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                * ملاحظة: يتم حفظ المفتاح محلياً في متصفحك (LocalStorage) فقط ولا يتم مشاركته مع أي خادم خارجي.
              </p>
            </div>
            <div className="modal-footer">
              {googleApiKey && (
                <button 
                  className="btn btn-secondary" 
                  onClick={clearApiKey}
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                >
                  إلغاء وربط الخريطة الحرة
                </button>
              )}
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowApiModal(false)}
              >
                إغلاق
              </button>
              <button 
                className="btn btn-primary"
                onClick={saveApiKey}
              >
                تفعيل وحفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
