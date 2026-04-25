import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  App, // Import App
  Space,
  Popconfirm,
  Tag,
  Row,
  Col,
  Upload
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { roomService } from '../../services/roomService';
import { houseService } from '../../services/houseService';
import { assetService } from '../../services/assetService';
import AssetManagement from '../../components/AssetManagement';

const { TextArea } = Input;
const { Option } = Select;

const Rooms = () => {
  const { message } = App.useApp(); // Use hook to get message
  const [rooms, setRooms] = useState([]);
  const [houses, setHouses] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [assetModalVisible, setAssetModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [imageFileList, setImageFileList] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    showSizeChanger: true,
    pageSizeOptions: ['5', '10', '20', '50'],
    showQuickJumper: true,
    showTotal: (total) => `Tổng cộng ${total} phòng`,
  });
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');
  const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');
  const resolveImageUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (!apiOrigin) return url;
    const normalized = url.startsWith('/') ? url : `/${url}`;
    return `${apiOrigin}${normalized}`;
  };

  const houseId = searchParams.get('house');

  useEffect(() => {
    fetchHouses();
    if (houseId) {
      fetchRooms(houseId);
    } else {
      fetchAllRooms();
    }
  }, [houseId]);

  const fetchHouses = async () => {
    try {
      const data = await houseService.getAll();
      setHouses(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách nhà trọ!');
    }
  };

  const fetchRooms = async (houseId) => {
    setLoading(true);
    try {
      const data = await roomService.getByHouse(houseId);
      console.log('Rooms data from API:', data);
      setRooms(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách phòng!');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRooms = async () => {
    setLoading(true);
    try {
      const data = await roomService.getAll();
      console.log('All rooms data from API:', data);
      setRooms(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách phòng!');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async (roomId) => {
    try {
      const data = await assetService.getByRoom(roomId);
      setAssets(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách tài sản!');
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleCreate = () => {
    setEditingRoom(null);
    form.resetFields();
    setImageFileList([]);
    if (houseId) {
      form.setFieldsValue({ house_id: parseInt(houseId) });
    }
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRoom(record);
    form.setFieldsValue(record);
    const existingImages = Array.isArray(record.images)
      ? record.images.map((img, index) => {
          const imageUrl = resolveImageUrl(img.image_url || img.imageUrl);
          return {
            uid: img.image_id ? String(img.image_id) : `existing-${index}`,
            name: `room-image-${index + 1}`,
            status: 'done',
            url: imageUrl,
            thumbUrl: imageUrl
          };
        })
      : [];
    setImageFileList(existingImages);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await roomService.delete(id, { message });
      message.success('Xóa phòng thành công!');
      if (houseId) {
        fetchRooms(houseId);
      } else {
        fetchAllRooms();
      }
    } catch (error) {
      console.error('Delete room error:', error);
      // Display error message from backend or default message
      const errorMessage = error.response?.data?.detail || 'Lỗi khi xóa phòng!';
      message.error(errorMessage);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const savedRoom = editingRoom
        ? await roomService.update(editingRoom.room_id, values)
        : await roomService.create(values);

      const files = imageFileList.map((file) => file.originFileObj).filter(Boolean);
      if (files.length > 0) {
        await roomService.uploadImages(savedRoom.room_id, files);
      }

      message.success(editingRoom ? 'Cập nhật phòng thành công!' : 'Tạo phòng thành công!');
      setModalVisible(false);
      setImageFileList([]);
      if (houseId) {
        fetchRooms(houseId);
      } else {
        fetchAllRooms();
      }
    } catch (error) {
      message.error('Lỗi khi lưu phòng!');
    }
  };

   const handleViewAssets = (record) => {
     setSelectedRoom(record);
     fetchAssets(record.room_id);
     setAssetModalVisible(true);
   };

  const housesById = useMemo(() => {
    const m = {};
    houses.forEach(h => { m[h.house_id] = h; });
    return m;
  }, [houses]);

  const columns = [
    {
      title: 'Tên phòng',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Sức chứa',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (value) => `${value} người`,
    },
    {
      title: 'Giá thuê',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `${price.toLocaleString()} VNĐ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_available',
      key: 'is_available',
      render: (available) => (
        <Tag color={available ? 'green' : 'red'}>
          {available ? 'Trống' : 'Đã thuê'}
        </Tag>
      ),
    },
    {
      title: 'Nhà trọ',
      dataIndex: 'house',
      key: 'house',
      render: (_, record) => (record.house?.name) || housesById[record.house_id]?.name || 'N/A',
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 280,
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Button
            type="link"
            icon={<HomeOutlined />}
            onClick={() => handleViewAssets(record)}
          >
            Tài sản
          </Button>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => {
              let houseId = record.houseId || record.house_id;
              if (!houseId && record.house) {
                houseId = record.house.house_id || record.house.houseId;
              }
              if (!houseId && record.house_id) {
                houseId = record.house_id;
              }
              console.log('View contracts - Record:', record, 'HouseId:', houseId);
              if (houseId) {
                navigate(`/app/contracts?house=${houseId}&room=${record.room_id}`);
              } else {
                message.error('Không tìm thấy nhà trọ. Vui lòng làm mới trang.');
              }
            }}
          >
            Xem hợp đồng
          </Button>
          <Button
            type="link"
            icon={<PlusOutlined />}
            disabled={!record.is_available}
            onClick={() => {
              if (!record.is_available) {
                message.warning('Phòng này đang được thuê, không thể tạo hợp đồng mới.');
                return;
              }

              let houseId = record.houseId || record.house_id;
              if (!houseId && record.house) {
                houseId = record.house.house_id || record.house.houseId;
              }
              if (!houseId && record.house_id) {
                houseId = record.house_id;
              }
              console.log('Create contract - Record:', record, 'HouseId:', houseId);
              if (houseId) {
                navigate(`/app/contracts?house=${houseId}&room=${record.room_id}&action=create`);
              } else {
                message.error('Không tìm thấy nhà trọ. Vui lòng làm mới trang.');
              }
            }}
          >
            Tạo hợp đồng
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa phòng này?"
            onConfirm={() => handleDelete(record.room_id)}
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
      <Card
        title={`Quản lý phòng trọ${houseId ? ` - ${houses.find(h => h.house_id === parseInt(houseId))?.name}` : ''}`}
        extra={
          <Space>
            {!houseId && (
              <Select
                placeholder="Chọn nhà trọ"
                style={{ width: 200 }}
                allowClear
                onChange={(value) => {
                  if (value) {
                    setSearchParams({ house: value });
                  } else {
                    setSearchParams({});
                  }
                }}
              >
                {houses.map(house => (
                  <Option key={house.house_id} value={house.house_id}>
                    {house.name}
                  </Option>
                ))}
              </Select>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo phòng mới
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={rooms}
          rowKey="room_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingRoom ? 'Sửa phòng' : 'Tạo phòng mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setImageFileList([]);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Tên phòng"
            rules={[{ required: true, message: 'Vui lòng nhập tên phòng!' }]}
          >
            <Input placeholder="Nhập tên phòng (VD: P101)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="capacity"
                label="Sức chứa"
                rules={[{ required: true, message: 'Vui lòng nhập sức chứa!' }]}
              >
                <InputNumber
                  min={1}
                  max={10}
                  style={{ width: '100%' }}
                  placeholder="Số người"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá thuê (VNĐ)"
                rules={[{ required: true, message: 'Vui lòng nhập giá thuê!' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Giá thuê"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="house_id"
            label="Nhà trọ"
            rules={[{ required: true, message: 'Vui lòng chọn nhà trọ!' }]}
          >
            <Select placeholder="Chọn nhà trọ" disabled={!!houseId}>
              {houses.map(house => (
                <Option key={house.house_id} value={house.house_id}>
                  {house.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea
              rows={3}
              placeholder="Mô tả phòng trọ"
            />
          </Form.Item>

          <Form.Item label="Hình ảnh phòng">
            <Upload
              listType="picture"
              multiple
              beforeUpload={() => false}
              fileList={imageFileList}
              onChange={({ fileList }) => setImageFileList(fileList)}
            >
              <Button icon={<PlusOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRoom ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

       <Modal
         title={`Quản lý tài sản phòng ${selectedRoom?.name}`}
         open={assetModalVisible}
         onCancel={() => setAssetModalVisible(false)}
         footer={null}
         width={1100}
         styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
       >
         <AssetManagement 
           roomId={selectedRoom?.room_id}
           roomName={selectedRoom?.name}
           assets={assets}
           onAssetsUpdate={() => {
             if (selectedRoom) {
               fetchAssets(selectedRoom.room_id);
             }
           }}
         />
       </Modal>
    </div>
  );
};

export default Rooms;
