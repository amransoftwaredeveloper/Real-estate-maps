import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'

// Global Google Maps Auth Failure handler - registered immediately before React mounts
window.googleMapsAuthFailed = false;
window.gm_authFailure = () => {
  console.error("❌ [خرائط جوجل] فشل مصادقة مفتاح API (Google Maps API Authentication Failure)!");
  console.error("الأسباب الشائعة المسببة لهذا الخطأ:");
  console.error("1. المفتاح غير مفعل عليه خدمة 'Maps JavaScript API'.");
  console.error("2. لم يتم تفعيل الدفع والبطاقة الائتمانية (Billing Account) لحساب جوجل كلاود المرتبط.");
  console.error("3. المفتاح غير صالح (Invalid API Key) أو يحتوي على أحرف خاطئة.");
  console.error("4. وجود قيود نطاق (HTTP Referrer Restrictions) تمنع تشغيله على localhost أو النطاق الحالي.");
  
  window.googleMapsAuthFailed = true;
  window.dispatchEvent(new Event('google-maps-auth-failed'));
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
