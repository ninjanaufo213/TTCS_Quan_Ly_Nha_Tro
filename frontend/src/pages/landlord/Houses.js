import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  App,
  Space,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { houseService } from '../../services/houseService';
import { useNavigate } from 'react-router-dom';
import LocationSelector from '../../components/LocationSelector';
import MapPicker from '../../components/MapPicker';
import locationData from '../../data/vn_locations.json';

const Houses = () => {
  const { message } = App.useApp();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHouse, setEditingHouse] = useState(null);
  const [addressData, setAddressData] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    showSizeChanger: true,
    pageSizeOptions: ['5', '10', '20', '50'],
    showQuickJumper: true,
    showTotal: (total) => `Tổng cộng ${total} nhà trọ`,
  });
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    setLoading(true);
    try {
      const data = await houseService.getAll();
      setHouses(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách nhà trọ!');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleCreate = () => {
    setEditingHouse(null);
    setAddressData({});
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingHouse(record);
    
    // Tìm mã code từ tên để map vào LocationSelector
    let pCode = "", dCode = "", wCode = "";
    
    // Tìm province có chứa district của record
    for (const p of locationData) {
      const d = p.districts?.find(dist => dist.name === record.district);
      if (d) {
        pCode = p.code;
        dCode = d.code;
        const w = d.wards?.find(ward => ward.name === record.ward);
        if (w) {
          wCode = w.code;
        }
        break;
      }
    }

    setAddressData({
      provinceCode: pCode,
      districtCode: dCode,
      wardCode: wCode
    });

    form.setFieldsValue({
      ...record,
      latitude: record.latitude || null,
      longitude: record.longitude || null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await houseService.delete(id, { message });
      message.success('Xóa nhà trọ thành công!');
      fetchHouses();
    } catch (error) {
      console.error('Delete house error:', error);
      const errorMessage = error.response?.data?.detail || 'Lỗi khi xóa nhà trọ!';
      message.error(errorMessage);
    }
  };

  const handleSubmit = async (values) => {
    try {
      await (editingHouse
        ? houseService.update(editingHouse.house_id, values)
        : houseService.create(values));

      message.success(editingHouse ? 'Cập nhật nhà trọ thành công!' : 'Tạo nhà trọ thành công!');
      setModalVisible(false);
      fetchHouses();
    } catch (error) {
      const detail = error?.response?.data?.detail;
      message.error(detail || 'Lỗi khi lưu nhà trọ!');
    }
  };

  const columns = [
    {
      title: 'Tên nhà trọ',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Số tầng',
      dataIndex: 'floor_count',
      key: 'floor_count',
      render: (value) => value ? `${value} tầng` : 'N/A',
    },
    {
      title: 'Phường/Xã',
      dataIndex: 'ward',
      key: 'ward',
    },
    {
      title: 'Quận/Huyện',
      dataIndex: 'district',
      key: 'district',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address_line',
      key: 'address_line',
      ellipsis: true,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A',
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 260,
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/app/rooms?house=${record.house_id}`)}
          >
            Xem phòng
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa nhà trọ này?"
            onConfirm={() => handleDelete(record.house_id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card className="dash-animate-fade-in-up"         title="Quản lý nhà trọ"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo nhà trọ mới
          </Button>
        }
      >
        <Table className="dash-animate-fade-in-up"           columns={columns}
          dataSource={houses}
          rowKey="house_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingHouse ? 'Sửa nhà trọ' : 'Tạo nhà trọ mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Tên nhà trọ"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhà trọ!' }]}
          >
            <Input placeholder="Nhập tên nhà trọ" />
          </Form.Item>

          <Form.Item
            name="floor_count"
            label="Số tầng"
            rules={[{ required: true, message: 'Vui lòng nhập số tầng!' }]}
          >
            <InputNumber
              min={1}
              max={20}
              style={{ width: '100%' }}
              placeholder="Nhập số tầng"
            />
          </Form.Item>

          {/* Ẩn input để ant design form vẫn lấy được giá trị khi submit */}
          <Form.Item name="ward" hidden><Input /></Form.Item>
          <Form.Item name="district" hidden><Input /></Form.Item>
          <Form.Item name="latitude" hidden><Input /></Form.Item>
          <Form.Item name="longitude" hidden><Input /></Form.Item>

          <Form.Item 
            label="Khu vực (Tỉnh/Thành - Quận/Huyện - Phường/Xã)" 
            required
          >
            <LocationSelector
              key={modalVisible ? (addressData.districtCode || 'new') : 'closed'}
              selectedAddress={addressData}
              onChange={(data) => {
                form.setFieldsValue({
                  district: data.districtName,
                  ward: data.wardName
                });
              }}
            />
          </Form.Item>

          <Form.Item
            name="address_line"
            label="Địa chỉ chi tiết (Số nhà, tên đường...)"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập địa chỉ chi tiết"
            />
          </Form.Item>

          <Form.Item label="Vị trí trên bản đồ">
            <MapPicker
              key={modalVisible ? (editingHouse ? `edit-${editingHouse.house_id}` : 'create') : 'closed'}
              initialPosition={
                editingHouse && editingHouse.latitude && editingHouse.longitude
                  ? { lat: editingHouse.latitude, lng: editingHouse.longitude }
                  : undefined
              }
              onChange={({ lat, lng }) => {
                form.setFieldsValue({
                  latitude: lat,
                  longitude: lng,
                });
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingHouse ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Houses;
