const fs = require('fs');
const path = require('path');

const inputFolder = 'F:\\map\\date';
const outputFile = 'F:\\map\\districts_summary.json';

const files = [
  'MOJ-Sales-2025-Q1.csv',
  'MOJ-Sales-2025-Q2.csv',
  'MOJ-Sales-2025-Q3.csv',
  'MOJ-Sales-2025-Q4.csv'
];

// Coordinate mapping functions
function getDistrictCoordinates(city, district) {
  const cityClean = city.trim().replace(/^منطقة\s+/, '').trim();
  const districtClean = district.trim().replace(/\s+/g, ' ');
  
  const cityCoords = {
    "الرياض": { lat: 24.7136, lng: 46.6753 },
    "جدة": { lat: 21.5433, lng: 39.1728 },
    "جده": { lat: 21.5433, lng: 39.1728 },
    "الدمام": { lat: 26.4207, lng: 50.0888 },
    "الخبر": { lat: 26.2172, lng: 50.1971 },
    "المدينة المنورة": { lat: 24.5246, lng: 39.5692 },
    "مكة المكرمة": { lat: 21.3891, lng: 39.8579 },
    "مكه المكرمه": { lat: 21.3891, lng: 39.8579 },
    "خميس مشيط": { lat: 18.3064, lng: 42.7301 },
    "الهفوف": { lat: 25.3644, lng: 49.5894 },
    "الطائف": { lat: 21.2854, lng: 40.4182 },
    "حائل": { lat: 27.5219, lng: 41.6907 },
    "حفر الباطن": { lat: 28.4322, lng: 45.9556 },
    "تبوك": { lat: 20.3957, lng: 36.5715 },
    "جيزان": { lat: 16.8892, lng: 42.5511 },
    "بريدة": { lat: 26.3260, lng: 43.9750 },
    "بريده": { lat: 26.3260, lng: 43.9750 },
    "نجران": { lat: 17.4933, lng: 44.1272 },
    "أبها": { lat: 18.2164, lng: 42.5053 },
    "ينبع": { lat: 24.0891, lng: 38.0637 },
    "الجبيل": { lat: 27.0112, lng: 49.6583 },
    "المزاحمية": { lat: 24.4751, lng: 46.2570 },
    "المزاحميه": { lat: 24.4751, lng: 46.2570 }
  };
  
  const districtCoords = {
    // الرياض
    "الرياض/الجنادرية": { lat: 24.8430, lng: 46.8570 },
    "الرياض/الجنادريه": { lat: 24.8430, lng: 46.8570 },
    "الرياض/النظيم": { lat: 24.7930, lng: 46.8770 },
    "الرياض/نمار": { lat: 24.5730, lng: 46.5470 },
    "الرياض/الرمال": { lat: 24.8230, lng: 46.8170 },
    "الرياض/الخير": { lat: 24.9730, lng: 46.5770 },
    "الرياض/عريض": { lat: 24.4530, lng: 46.6170 },
    "الرياض/المعيزلية": { lat: 24.8030, lng: 46.8270 },
    "الرياض/المعيزليه": { lat: 24.8030, lng: 46.8270 },
    "الرياض/العزيزية": { lat: 24.5930, lng: 46.7570 },
    "الرياض/العزيزيه": { lat: 24.5930, lng: 46.7570 },
    "الرياض/بدر": { lat: 24.5530, lng: 46.7170 },
    "الرياض/الدار البيضاء": { lat: 24.5630, lng: 46.7570 },
    "الرياض/الياسمين": { lat: 24.8130, lng: 46.6370 },
    "الرياض/الملقا": { lat: 24.8030, lng: 46.6070 },
    "الرياض/النرجس": { lat: 24.8330, lng: 46.6870 },
    "الرياض/طويق": { lat: 24.6130, lng: 46.5170 },
    "الرياض/المهدية": { lat: 24.6930, lng: 46.5470 },
    "الرياض/المهديه": { lat: 24.6930, lng: 46.5470 },
    "الرياض/لبن": { lat: 24.6330, lng: 46.5370 },
    "الرياض/النسيم": { lat: 24.7330, lng: 46.8070 },
    "الرياض/الشفاء": { lat: 24.5530, lng: 46.6770 },
    "الرياض/قرطبة": { lat: 24.8030, lng: 46.7370 },
    "الرياض/قرطبه": { lat: 24.8030, lng: 46.7370 },
    "الرياض/العليا": { lat: 24.7030, lng: 46.6770 },
    
    // جدة
    "جده/ المروة": { lat: 21.6130, lng: 39.2070 },
    "جده/ المروه": { lat: 21.6130, lng: 39.2070 },
    "جدة/ المروة": { lat: 21.6130, lng: 39.2070 },
    "جده/ الواحة": { lat: 21.5730, lng: 39.2370 },
    "جده/ الواحه": { lat: 21.5730, lng: 39.2370 },
    "جده/ جوهرة العروس": { lat: 21.8530, lng: 39.0570 },
    "جده/ جوهره العروس": { lat: 21.8530, lng: 39.0570 },
    "جده/ الصفا": { lat: 21.5830, lng: 39.2070 },
    "جده/ الصوارى": { lat: 21.7530, lng: 39.1270 },
    "جده/ الصواري": { lat: 21.7530, lng: 39.1270 },
    "جده/ الفيحاء": { lat: 21.5030, lng: 39.2270 },
    "جده/ الفيحا": { lat: 21.5030, lng: 39.2270 },
    "جده/ المنار": { lat: 21.6130, lng: 39.2470 },
    "جده/ الريان": { lat: 21.6830, lng: 39.2570 },
    "جده/ الحمدانية": { lat: 21.7430, lng: 39.2170 },
    "جده/ الحمدانيه": { lat: 21.7430, lng: 39.2170 },
    "جده/ الياقوت": { lat: 21.7630, lng: 39.1170 },
    "جده/العزيزية": { lat: 21.5530, lng: 39.1970 },
    "جده/العزيزيه": { lat: 21.5530, lng: 39.1970 },
    "جده/ الفيصلية": { lat: 21.5630, lng: 39.1770 },
    "جده/ الفيصليه": { lat: 21.5630, lng: 39.1770 },
    "جده/ النعيم": { lat: 21.6230, lng: 39.1570 },
    
    // الدمام
    "الدمام/ الشعلة": { lat: 26.3630, lng: 50.1270 },
    "الدمام/ الشعله": { lat: 26.3630, lng: 50.1270 },
    "الدمام/ طيبة": { lat: 26.3530, lng: 50.0670 },
    "الدمام/ طيبه": { lat: 26.3530, lng: 50.0670 },
    "الدمام/ النور": { lat: 26.3930, lng: 50.0570 },
    "الدمام/ الشاطئ": { lat: 26.4630, lng: 50.1170 },
    "الدمام/ المنتزه": { lat: 26.4330, lng: 50.1070 },
    "الدمام/ الفرسان": { lat: 26.3330, lng: 50.0470 },
    "الدمام/ الضاحية": { lat: 26.3830, lng: 49.9970 },
    "الدمام/ الضاحيه": { lat: 26.3830, lng: 49.9970 }
  };
  
  const fullKey = `${cityClean}/${districtClean}`;
  if (districtCoords[fullKey]) {
    return districtCoords[fullKey];
  }
  
  // Default to city center or Riyadh center
  const center = cityCoords[cityClean] || cityCoords["الرياض"];
  
  // Calculate a deterministic offset so districts in the same city are spread out
  let hashVal = 0;
  const combined = cityClean + districtClean;
  for (let i = 0; i < combined.length; i++) {
    hashVal = combined.charCodeAt(i) + ((hashVal << 5) - hashVal);
  }
  
  // Normalize offsets between -0.05 and 0.05 degrees
  const offsetLat = ((Math.abs(hashVal) % 1000) / 1000 - 0.5) * 0.08;
  const offsetLng = ((Math.abs(hashVal >> 3) % 1000) / 1000 - 0.5) * 0.08;
  
  return {
    lat: Number((center.lat + offsetLat).toFixed(4)),
    lng: Number((center.lng + offsetLng).toFixed(4))
  };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const districts = {};

console.log('Processing Saudi MOJ Real Estate Data for 2025...');

files.forEach(file => {
  const filePath = path.join(inputFolder, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }
  
  console.log(`Processing file: ${file}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  
  // Header row
  // المنطقة,المدينة,المدينة / الحي,الرقم المرجعي للصفقة,تاريخ الصفقة ميلادي,تاريخ الصفقة هجري,تصنيف العقار,عدد العقارات,السعر,المساحة
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    const cols = parseCSVLine(line);
    if (cols.length < 10) continue;
    
    const region = cols[0];
    const city = cols[1].trim();
    let cityDistrict = cols[2].trim(); // e.g., "الرياض/الرمال" or "الطائف/ الجودية "
    const transactionId = cols[3];
    const dateG = cols[4];
    const dateH = cols[5];
    const classification = cols[6].trim(); // سكني، تجاري، زراعي، إلخ
    const count = parseInt(cols[7]) || 1;
    
    // Parse price, clean quotes and commas
    const priceStr = cols[8].replace(/"/g, '').replace(/,/g, '');
    const price = parseFloat(priceStr);
    
    // Parse area
    const areaStr = cols[9].replace(/"/g, '').replace(/,/g, '');
    const area = parseFloat(areaStr);
    
    if (isNaN(price) || isNaN(area) || price <= 0 || area <= 0) continue;
    
    // Extract district name
    let districtName = cityDistrict;
    if (cityDistrict.includes('/')) {
      const parts = cityDistrict.split('/');
      districtName = parts[parts.length - 1].trim();
    }
    
    if (!districtName || districtName === 'أخرى' || districtName === 'خارج حدود الاحياء') {
      districtName = 'أخرى / عام';
    }
    
    const key = `${city}/${districtName}`;
    
    if (!districts[key]) {
      districts[key] = {
        city: city,
        district: districtName,
        region: region,
        totalSales: 0,
        totalArea: 0,
        transactionCount: 0,
        classifications: {},
        recentTransactions: []
      };
    }
    
    const dist = districts[key];
    dist.totalSales += price;
    dist.totalArea += area;
    dist.transactionCount += count;
    
    dist.classifications[classification] = (dist.classifications[classification] || 0) + count;
    
    // Save sample transaction
    if (dist.recentTransactions.length < 5) {
      dist.recentTransactions.push({
        id: transactionId,
        date: dateG,
        classification: classification,
        price: price,
        area: area,
        pricePerM2: Number((price / area).toFixed(2))
      });
    } else {
      // Keep transactions with high values or update
      // Just keep 5 transactions
      dist.recentTransactions.push({
        id: transactionId,
        date: dateG,
        classification: classification,
        price: price,
        area: area,
        pricePerM2: Number((price / area).toFixed(2))
      });
      dist.recentTransactions.sort((a, b) => b.price - a.price);
      dist.recentTransactions = dist.recentTransactions.slice(0, 5);
    }
  }
});

// Final processing and geocoding
const resultList = [];
console.log('Calculating statistics and geocoding...');

for (const key in districts) {
  const item = districts[key];
  if (item.transactionCount < 3) continue;
  
  const coords = getDistrictCoordinates(item.city, item.district);
  
  const avgPrice = Number((item.totalSales / item.transactionCount).toFixed(0));
  const avgArea = Number((item.totalArea / item.transactionCount).toFixed(2));
  const avgPricePerSquareMeter = Number((item.totalSales / item.totalArea).toFixed(2));
  
  // Find dominant property classification
  let maxCount = 0;
  let dominantClass = 'سكني';
  for (const [cls, count] of Object.entries(item.classifications)) {
    if (count > maxCount) {
      maxCount = count;
      dominantClass = cls;
    }
  }
  
  resultList.push({
    city: item.city,
    district: item.district,
    region: item.region,
    lat: coords.lat,
    lng: coords.lng,
    transactionCount: item.transactionCount,
    totalSales: item.totalSales,
    totalArea: item.totalArea,
    averagePrice: avgPrice,
    averageArea: avgArea,
    averagePricePerM2: avgPricePerSquareMeter,
    dominantClassification: dominantClass,
    classificationsCount: item.classifications,
    recentTransactions: item.recentTransactions
  });
}

// Sort by transaction volume
resultList.sort((a, b) => b.transactionCount - a.transactionCount);

// Save output
console.log(`Writing aggregated data for ${resultList.length} districts to ${outputFile}...`);
fs.writeFileSync(outputFile, JSON.stringify(resultList, null, 2), 'utf-8');
console.log('Data processing completed successfully!');
