import { useState, useMemo } from 'react';
import locationData from '../data/vn_locations.json';

export const useLocation = () => {
  // Lấy danh sách Tỉnh/Thành phố
  const provinces = useMemo(() => {
    return locationData.map(p => ({
      code: p.code,
      name: p.name
    }));
  }, []);

  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  // Hàm lấy danh sách Quận/Huyện dựa vào mã Tỉnh
  const fetchDistricts = (provinceCode) => {
    if (!provinceCode) {
      setDistricts([]);
      setWards([]);
      return;
    }
    
    // Ép kiểu provinceCode về số nếu cần (tuỳ thuộc vào kiểu dữ liệu trong file json và select box)
    const province = locationData.find(p => p.code.toString() === provinceCode.toString());
    
    if (province && province.districts) {
      setDistricts(province.districts.map(d => ({
        code: d.code,
        name: d.name
      })));
    } else {
      setDistricts([]);
    }
    setWards([]); // Reset xã khi đổi tỉnh
  };

  // Hàm lấy danh sách Phường/Xã dựa vào mã Tỉnh và Huyện
  const fetchWards = (provinceCode, districtCode) => {
    if (!provinceCode || !districtCode) {
      setWards([]);
      return;
    }
    
    const province = locationData.find(p => p.code.toString() === provinceCode.toString());
    if (province && province.districts) {
      const district = province.districts.find(d => d.code.toString() === districtCode.toString());
      if (district && district.wards) {
        setWards(district.wards.map(w => ({
          code: w.code,
          name: w.name
        })));
        return;
      }
    }
    setWards([]);
  };

  return { provinces, districts, wards, fetchDistricts, fetchWards };
};
