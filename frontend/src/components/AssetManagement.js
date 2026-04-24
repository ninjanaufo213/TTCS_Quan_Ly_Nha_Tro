import React, { useState } from 'react';
import {
  Table,
  Button,
  Form,
  Input,
  Row,
  Col,
  Empty,
  Image,
  Tag,
  Popconfirm,
  App,
  Space,
  Upload
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { assetService } from '../services/assetService';

const AssetManagement = ({ roomId, roomName, assets, onAssetsUpdate }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [editingAsset, setEditingAsset] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [imageFileList, setImageFileList] = useState([]);

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

  const getAssetImageUrl = (asset) => resolveImageUrl(asset?.imageUrl || asset?.image_url);

  const handleAddAsset = async (values) => {
    try {
      const imageFile = imageFileList[0]?.originFileObj || null;
      await assetService.create(roomId, {
        name: values.name,
        image: imageFile
      });
      message.success('Thêm tài sản thành công!');
      form.resetFields();
      setIsFormVisible(false);
      setImageFileList([]);
      onAssetsUpdate();
    } catch (error) {
      console.error('Error adding asset:', error);
      message.error('Lỗi khi thêm tài sản!');
    }
  };

  const handleUpdateAsset = async (values) => {
    try {
      const imageFile = imageFileList[0]?.originFileObj || null;
      await assetService.update(editingAsset.asset_id, {
        name: values.name,
        image: imageFile
      });
      message.success('Cập nhật tài sản thành công!');
      form.resetFields();
      setEditingAsset(null);
      setIsFormVisible(false);
      setImageFileList([]);
      onAssetsUpdate();
    } catch (error) {
      console.error('Error updating asset:', error);
      message.error('Lỗi khi cập nhật tài sản!');
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    form.setFieldsValue({
      name: asset.name
    });
    setImageFileList([]);
    setIsFormVisible(true);
  };

  const handleDeleteAsset = async (assetId) => {
    try {
      await assetService.delete(assetId);
      message.success('Xóa tài sản thành công!');
      onAssetsUpdate();
    } catch (error) {
      console.error('Error deleting asset:', error);
      message.error('Lỗi khi xóa tài sản!');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setEditingAsset(null);
    setIsFormVisible(false);
    setImageFileList([]);
  };

  const columns = [
    {
      title: 'STT',
      dataIndex: 'asset_id',
      key: 'asset_id',
      width: '5%',
      render: (_, record, index) => index + 1
    },
    {
      title: 'Tên tài sản',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: '25%',
      render: (_, record) => {
        const imageUrl = getAssetImageUrl(record);
        if (!imageUrl) {
          return <Tag color="default">Không có</Tag>;
        }
        return (
          <Space>
            <Image
              src={imageUrl}
              alt="asset"
              width={50}
              height={50}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={{ width: 200 }}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect fill="%23f0f0f0" width="50" height="50"/%3E%3C/svg%3E';
              }}
            />
          </Space>
        );
      }
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '15%',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-'
    },
    {
      title: 'Hành động',
      key: 'action',
      width: '15%',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa tài sản?"
            description="Bạn có chắc chắn muốn xóa tài sản này?"
            onConfirm={() => handleDeleteAsset(record.asset_id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Danh sách tài sản phòng {roomName} ({assets.length})</h3>
        {!isFormVisible && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingAsset(null);
            form.resetFields();
            setIsFormVisible(true);
          }}>
            Thêm tài sản
          </Button>
        )}
      </div>

      {isFormVisible && (
        <div style={{ backgroundColor: '#f5f5f5', padding: 16, marginBottom: 20, borderRadius: 4 }}>
          <h4>{editingAsset ? 'Cập nhật tài sản' : 'Thêm tài sản mới'}</h4>
          <Form
            form={form}
            layout="vertical"
            onFinish={editingAsset ? handleUpdateAsset : handleAddAsset}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Tên tài sản"
                  rules={[{ required: true, message: 'Vui lòng nhập tên tài sản!' }]}
                >
                  <Input placeholder="VD: Quạt, Giường, Bàn, TV..." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="image"
                  label="Hình ảnh"
                >
                  <Upload
                    listType="picture"
                    maxCount={1}
                    beforeUpload={() => false}
                    fileList={imageFileList}
                    onChange={({ fileList }) => setImageFileList(fileList)}
                  >
                    <Button icon={<PlusOutlined />}>Chọn ảnh</Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={handleCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit">
                  {editingAsset ? 'Cập nhật' : 'Thêm tài sản'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      )}

      {assets.length === 0 && !isFormVisible ? (
        <Empty
          description="Chưa có tài sản nào"
          style={{ marginTop: 40, marginBottom: 40 }}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingAsset(null);
            form.resetFields();
            setIsFormVisible(true);
          }}>
            Thêm tài sản đầu tiên
          </Button>
        </Empty>
      ) : (
        <Table
          columns={columns}
          dataSource={assets}
          rowKey="asset_id"
          size="small"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      )}
    </div>
  );
};

export default AssetManagement;

