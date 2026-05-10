import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import { useLocation } from '../hooks/useLocation';

const LocationSelector = ({ selectedAddress, onChange, className = "" }) => {
  const { provinces, districts, wards, fetchDistricts, fetchWards } = useLocation();

  const [selectedProvince, setSelectedProvince] = useState(selectedAddress?.provinceCode || "");
  const [selectedDistrict, setSelectedDistrict] = useState(selectedAddress?.districtCode || "");
  const [selectedWard, setSelectedWard] = useState(selectedAddress?.wardCode || "");

  // Sync clear from parent
  useEffect(() => {
    if (!selectedAddress || Object.keys(selectedAddress).length === 0) {
      if (selectedProvince !== "") setSelectedProvince("");
      if (selectedDistrict !== "") setSelectedDistrict("");
      if (selectedWard !== "") setSelectedWard("");
    }
  }, [selectedAddress]);

  // Đẩy dữ liệu lên form cha
  useEffect(() => {
    if (onChange) {
      // Tìm tên để có thể lưu xuống DB nếu muốn
      const provinceName = provinces.find(p => p.code.toString() === selectedProvince.toString())?.name || "";
      const districtName = districts.find(d => d.code.toString() === selectedDistrict.toString())?.name || "";
      const wardName = wards.find(w => w.code.toString() === selectedWard.toString())?.name || "";

      onChange({
        provinceCode: selectedProvince,
        provinceName,
        districtCode: selectedDistrict,
        districtName,
        wardCode: selectedWard,
        wardName
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince, selectedDistrict, selectedWard]);

  // Handle khi đổi Tỉnh
  const handleProvinceChange = (value) => {
    setSelectedProvince(value);
    setSelectedDistrict(""); 
    setSelectedWard("");     
    fetchDistricts(value);
  };

  // Handle khi đổi Huyện
  const handleDistrictChange = (value) => {
    setSelectedDistrict(value);
    setSelectedWard("");     
    fetchWards(selectedProvince, value); 
  };

  // Nạp lại danh sách Huyện/Xã nếu đã có giá trị sẵn từ props (Ví dụ lúc edit form)
  useEffect(() => {
    if (selectedProvince) {
      fetchDistricts(selectedProvince);
    }
    if (selectedProvince && selectedDistrict) {
      fetchWards(selectedProvince, selectedDistrict);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hàm filter dùng chung cho tính năng tìm kiếm của Select
  const filterOption = (input, option) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Cột Tỉnh / Thành */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh / Thành phố</label>
        <Select
          style={{ width: '100%' }}
          placeholder="-- Chọn Tỉnh/Thành phố --"
          value={selectedProvince || undefined}
          onChange={handleProvinceChange}
          showSearch
          optionFilterProp="children"
          filterOption={filterOption}
          options={provinces.map(p => ({ label: p.name, value: p.code }))}
        />
      </div>

      {/* Cột Quận / Huyện */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quận / Huyện</label>
        <Select
          style={{ width: '100%' }}
          placeholder="-- Chọn Quận/Huyện --"
          value={selectedDistrict || undefined}
          onChange={handleDistrictChange}
          disabled={!selectedProvince}
          showSearch
          optionFilterProp="children"
          filterOption={filterOption}
          options={districts.map(d => ({ label: d.name, value: d.code }))}
        />
      </div>

      {/* Cột Phường / Xã */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phường / Xã</label>
        <Select
          style={{ width: '100%' }}
          placeholder="-- Chọn Phường/Xã --"
          value={selectedWard || undefined}
          onChange={(value) => setSelectedWard(value)}
          disabled={!selectedDistrict}
          showSearch
          optionFilterProp="children"
          filterOption={filterOption}
          options={wards.map(w => ({ label: w.name, value: w.code }))}
        />
      </div>
    </div>
  );
};

export default LocationSelector;
