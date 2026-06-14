import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  message,
  Space,
  Popconfirm,
  Tag,
  Row,
  Col,
  Select,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  ReloadOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { rentedRoomService } from '../../services/rentedRoomService';
import { roomService } from '../../services/roomService';
import { houseService } from '../../services/houseService';
import { tenantService } from '../../services/tenantService';
import { contractRequestService } from '../../services/contractRequestService';
import { viewingService } from '../../services/viewingService';
import { contractExtensionRequestService } from '../../services/contractExtensionRequestService';
import SignaturePad from '../../components/SignaturePad';
import dayjs from 'dayjs';
import { generateContractPdf } from '../../services/contractPdfExport';

const { Option } = Select;

const Contracts = () => {
  console.log('Contracts component loaded');

  const [contracts, setContracts] = useState([]);
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extensionLoading, setExtensionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    showSizeChanger: true,
    pageSizeOptions: ['5', '10', '20', '50'],
    showQuickJumper: true,
    showTotal: (total) => `Tổng cộng ${total} hợp đồng`,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [requestMode, setRequestMode] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const roomId = searchParams.get('room');
  const houseId = searchParams.get('house');
  const action = searchParams.get('action');
  const viewingId = searchParams.get('viewingId');
  const tenantNameParam = searchParams.get('tenantName');
  const tenantPhoneParam = searchParams.get('tenantPhone');
  const isRequestMode = action === 'request' && !!viewingId;

  const [roomsAll, setRoomsAll] = useState([]);
  const [tenantOptions, setTenantOptions] = useState([]);
  const [tenantLoading, setTenantLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    houseId: null,
    roomId: null,
    status: null,
    tenantName: '',
    startDate: null,
    endDate: null,
  });
  const [landlordSignature, setLandlordSignature] = useState(null);

  const roomsMap = useMemo(() => {
    const m = {};
    roomsAll.forEach(r => { m[r.room_id] = r; });
    rooms.forEach(r => { m[r.room_id] = r; }); // prefer freshly selected list
    return m;
  }, [roomsAll, rooms]);

  const availableRoomsForCreate = useMemo(() => {
    const source = rooms.length ? rooms : roomsAll;
    return source.filter((room) => room.is_available);
  }, [rooms, roomsAll]);

  const syncMonthlyRentFromRoom = (targetRoomId) => {
    const rid = Number(targetRoomId ?? form.getFieldValue('room_id'));
    if (!rid) {
      form.setFieldsValue({ 
        monthly_rent: undefined,
        water_price: undefined,
        internet_price: undefined,
        general_price: undefined,
        electricity_unit_price: undefined
      });
      return;
    }

    const selectedRoom = roomsMap[rid] || roomsAll.find(r => r.room_id === rid) || rooms.find(r => r.room_id === rid);
    if (selectedRoom) {
      const updates = {};
      if (selectedRoom.price !== undefined && selectedRoom.price !== null) {
        updates.monthly_rent = selectedRoom.price;
      }
      if (selectedRoom.water_price !== undefined && selectedRoom.water_price !== null) {
        updates.water_price = selectedRoom.water_price;
      }
      if (selectedRoom.internet_price !== undefined && selectedRoom.internet_price !== null) {
        updates.internet_price = selectedRoom.internet_price;
      }
      if (selectedRoom.general_price !== undefined && selectedRoom.general_price !== null) {
        updates.general_price = selectedRoom.general_price;
      }
      if (selectedRoom.electricity_price !== undefined && selectedRoom.electricity_price !== null) {
        updates.electricity_unit_price = selectedRoom.electricity_price;
      }
      
      if (Object.keys(updates).length > 0) {
        form.setFieldsValue(updates);
      }
    }
  };

  useEffect(() => {
    console.log('Main useEffect running, roomId:', roomId, 'houseId:', houseId);
    fetchHouses();
    if (roomId) {
      fetchContractsByRoom(roomId);
    } else {
      fetchAllContracts();
    }
    loadExtensionRequests();
  }, [roomId]);

  useEffect(() => {
    // Tự động mở modal tạo hợp đồng nếu action=create
    if (action === 'create' && roomId && !modalVisible) {
      const rid = parseInt(roomId, 10);
      const targetRoom = roomsMap[rid];
      if (targetRoom && !targetRoom.is_available) {
        message.warning('Phòng này đang được thuê, không thể tạo hợp đồng mới.');
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('action');
        setSearchParams(newParams);
        return;
      }

      // Mở modal
      setEditingContract(null);
      form.resetFields();
      if (houseId) {
        form.setFieldsValue({ house_id: parseInt(houseId) });
      }
      if (roomId) {
        form.setFieldsValue({ room_id: rid });
        syncMonthlyRentFromRoom(rid);
      }
      setModalVisible(true);
    }
  }, [action, roomId, houseId, modalVisible, form, roomsMap]);

  useEffect(() => {
    if (isRequestMode && roomId && !modalVisible) {
      const rid = parseInt(roomId, 10);
      const targetRoom = roomsMap[rid] || roomsAll.find(r => r.room_id === rid);
      setEditingContract(null);
      setRequestMode(true);
      form.resetFields();
      if (targetRoom?.house_id) {
        form.setFieldsValue({ house_id: targetRoom.house_id });
      }
      if (rid) {
        form.setFieldsValue({ room_id: rid });
        syncMonthlyRentFromRoom(rid);
      }
      form.setFieldsValue({
        tenant_name: tenantNameParam || undefined,
        tenant_phone: tenantPhoneParam || undefined,
      });
      setModalVisible(true);
    }
  }, [isRequestMode, roomId, modalVisible, form, roomsMap, roomsAll, tenantNameParam, tenantPhoneParam]);

  useEffect(() => {
    if (!requestMode || !roomId || !modalVisible) return;

    const ensureHouseLinked = async () => {
      const existingHouseId = form.getFieldValue('house_id');
      if (existingHouseId) return;

      try {
        const room = await roomService.getById(Number(roomId));
        if (room?.house_id) {
          form.setFieldsValue({
            house_id: room.house_id,
            room_id: room.room_id ?? Number(roomId),
          });
          fetchRooms(room.house_id);
          syncMonthlyRentFromRoom(room.room_id ?? Number(roomId));
        }
      } catch (_) {
        // Ignore lookup failure; user can still select house manually if needed
      }
    };

    ensureHouseLinked();
  }, [requestMode, roomId, modalVisible, form]);

  useEffect(() => {
    // Khi modal đang mở và dữ liệu phòng vừa tải xong, đồng bộ lại tiền thuê theo phòng đã chọn
    if (!modalVisible || editingContract) return;
    const rid = form.getFieldValue('room_id');
    if (rid) {
      syncMonthlyRentFromRoom(rid);
    }
  }, [modalVisible, editingContract, roomsMap, form]);

  useEffect(() => {
    if (modalVisible) {
      loadTenants();
    }
  }, [modalVisible]);

  useEffect(() => {
    // Load all rooms for name mapping
    (async () => {
      try {
        const allRooms = await roomService.getAll();
        setRoomsAll(allRooms);
      } catch (_) {}
    })();
  }, []);

  const fetchHouses = async () => {
    try {
      console.log('Fetching houses...');
      const data = await houseService.getAll();
      console.log('Houses fetched:', data);
      setHouses(data);
      setError(null);
    } catch (error) {
      console.error('Lỗi khi tải danh sách nhà trọ:', error);
      setError('Lỗi khi tải danh sách nhà trọ: ' + (error?.message || 'Không xác định'));
    }
  };

  const fetchRooms = async (houseId) => {
    try {
      const data = await roomService.getByHouse(houseId);
      setRooms(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách phòng!');
    }
  };

  const fetchContractsByRoom = async (roomId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await rentedRoomService.getByRoom(roomId);
      console.log('Contracts by room loaded:', data);
      setContracts(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách hợp đồng:', error);
      setError('Lỗi khi tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rentedRoomService.getAll();
      console.log('All contracts loaded:', data);
      setContracts(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách hợp đồng:', error);
      setError('Lỗi khi tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  const loadExtensionRequests = async () => {
    setExtensionLoading(true);
    try {
      const data = await contractExtensionRequestService.getLandlordRequests();
      setExtensionRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Lỗi khi tải yêu cầu gia hạn hợp đồng');
    } finally {
      setExtensionLoading(false);
    }
  };

  const handleApproveExtension = async (id) => {
    try {
      await contractExtensionRequestService.approve(id);
      message.success('Đã duyệt gia hạn hợp đồng');
      await loadExtensionRequests();
      if (roomId) {
        fetchContractsByRoom(roomId);
      } else {
        fetchAllContracts();
      }
    } catch (error) {
      message.error('Không thể duyệt yêu cầu gia hạn');
    }
  };

  const handleRejectExtension = async (id) => {
    try {
      await contractExtensionRequestService.reject(id);
      message.success('Đã từ chối yêu cầu gia hạn');
      await loadExtensionRequests();
    } catch (error) {
      message.error('Không thể từ chối yêu cầu gia hạn');
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleCreate = () => {
    setRequestMode(false);
    if (roomId) {
      const rid = parseInt(roomId, 10);
      const targetRoom = roomsMap[rid];
      if (targetRoom && !targetRoom.is_available) {
        message.warning('Phòng này đang được thuê, không thể tạo hợp đồng mới.');
        return;
      }
    }

    setEditingContract(null);
    form.resetFields();
    setLandlordSignature(null);
    if (houseId) {
      form.setFieldsValue({ house_id: parseInt(houseId) });
    }
    if (roomId) {
      const rid = parseInt(roomId);
      form.setFieldsValue({ room_id: rid });
      syncMonthlyRentFromRoom(rid);
    } else {
      form.setFieldsValue({ monthly_rent: undefined });
    }
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setRequestMode(false);
    setLandlordSignature(null);
    // Clear action param from URL so it doesn't auto-open again
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('action');
    newParams.delete('viewingId');
    newParams.delete('tenantName');
    newParams.delete('tenantPhone');
    setSearchParams(newParams);
  };

  const loadTenants = async (search = '') => {
    try {
      setTenantLoading(true);
      const data = await tenantService.lookup(search);
      setTenantOptions(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Lỗi khi tải danh sách khách thuê!');
    } finally {
      setTenantLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingContract(record);
    // Load rooms for the house if available
    if (record.room && record.room.house_id) {
      fetchRooms(record.room.house_id);
      form.setFieldsValue({
        house_id: record.room.house_id,
      });
    }
    form.setFieldsValue({
      ...record,
      tenant_id: record.tenant_id,
      tenant_name: record.tenant_name,
      tenant_phone: record.tenant_phone,
      start_date: dayjs(record.start_date),
      end_date: dayjs(record.end_date),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await rentedRoomService.terminate(id);
      message.success('Chấm dứt hợp đồng thành công!');
      if (roomId) {
        fetchContractsByRoom(roomId);
      } else {
        fetchAllContracts();
      }
    } catch (error) {
      message.error('Lỗi khi chấm dứt hợp đồng!');
    }
  };

  const handleSubmit = async (values) => {
    try {
      // Validate số người không vượt quá sức chứa
      const selectedRoom = roomsMap[values.room_id];
      if (selectedRoom && values.number_of_tenants > selectedRoom.capacity) {
        message.error(`Số người thuê (${values.number_of_tenants} người) không được vượt quá sức chứa của phòng (${selectedRoom.capacity} người)!`);
        return;
      }

      // If creating new contract, enforce monthly_rent from selected room price
      let submitValues = { ...values };
      // Remove house_id - it's only for selecting rooms
      delete submitValues.house_id;
      if (!editingContract && values.room_id) {
        const selectedRoom = roomsMap[values.room_id];
        if (selectedRoom) {
          submitValues.monthly_rent = selectedRoom.price;
        }
      }

      const submitData = {
        ...submitValues,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
        landlord_signature: landlordSignature,
        sign_metadata: JSON.stringify({
          signed_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
      };

      if (requestMode && viewingId) {
        if (!landlordSignature) {
          message.error('Vui lòng ký vào hợp đồng!');
          return;
        }
        delete submitData.tenant_id;
        delete submitData.tenant_name;
        delete submitData.tenant_phone;
        await contractRequestService.createForViewing(Number(viewingId), submitData);
        message.success('Đã gửi yêu cầu hợp đồng cho người thuê!');
      } else if (editingContract) {
        await rentedRoomService.update(editingContract.rr_id, submitData);
        message.success('Cập nhật hợp đồng thành công!');
      } else {
        await rentedRoomService.create(submitData);
        message.success('Tạo hợp đồng thành công!');
      }
      handleModalClose();
      if (roomId) {
        fetchContractsByRoom(roomId);
      } else {
        fetchAllContracts();
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Lỗi khi lưu hợp đồng!';
      message.error(errorMsg);
    }
  };

  const handleFilterChange = (changedFields) => {
    setFilters({ ...filters, ...changedFields });
  };

  const handleClearFilters = () => {
    setFilters({
      houseId: null,
      roomId: null,
      status: null,
      tenantName: '',
      startDate: null,
      endDate: null,
    });
    setRooms([]);
    setSearchParams({});
    fetchAllContracts();
  };

  const handleExportPdf = async (record) => {
    try {
      // Get house info
      const houseId = record.room?.house_id || roomsMap[record.room_id]?.house_id;
      let houseInfo = houseId ? housesById[houseId] : null;

      if (!houseInfo && houseId) {
        try {
          houseInfo = await houseService.getById(houseId);
        } catch (_) {}
      }

      // Get landlord info from localStorage
      let landlordInfo = {};
      try {
        const userInfo = JSON.parse(localStorage.getItem('user_info') || 'null');
        landlordInfo = {
          name: userInfo?.fullname || userInfo?.name || userInfo?.brandName || '',
          phone: userInfo?.phone || '',
        };
      } catch (_) {}

      generateContractPdf(record, houseInfo || {}, landlordInfo);
      message.success('Đã xuất file PDF hợp đồng!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      message.error('Lỗi khi xuất file PDF hợp đồng!');
    }
  };

  // Filter contracts based on filter state
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      // Filter by house
      if (filters.houseId) {
        const contractRoom = contract.room || roomsMap[contract.room_id];
        if (!contractRoom || contractRoom.house_id !== filters.houseId) {
          return false;
        }
      }

      // Filter by room
      if (filters.roomId && contract.room_id !== filters.roomId) {
        return false;
      }

      // Filter by status
      if (filters.status !== null && filters.status !== undefined) {
        if (filters.status === 'active' && !contract.is_active) return false;
        if (filters.status === 'inactive' && contract.is_active) return false;
      }

      // Filter by tenant name
      if (filters.tenantName && !contract.tenant_name?.toLowerCase().includes(filters.tenantName.toLowerCase())) {
        return false;
      }

      // Filter by start date
      if (filters.startDate) {
        const contractStart = dayjs(contract.start_date);
        if (contractStart.isBefore(filters.startDate, 'day')) {
          return false;
        }
      }

      // Filter by end date
      if (filters.endDate) {
        const contractEnd = dayjs(contract.end_date);
        if (contractEnd.isAfter(filters.endDate, 'day')) {
          return false;
        }
      }

      return true;
    });
  }, [contracts, filters, roomsMap]);

  const housesById = useMemo(() => {
    const m = {};
    houses.forEach(h => { m[h.house_id] = h; });
    return m;
  }, [houses]);

  const columns = [
    {
      title: 'Tên khách thuê',
      dataIndex: 'tenant_name',
      key: 'tenant_name',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'tenant_phone',
      key: 'tenant_phone',
    },
    {
      title: 'Số người',
      dataIndex: 'number_of_tenants',
      key: 'number_of_tenants',
      render: (value) => `${value} người`,
    },
    {
      title: 'Phòng',
      dataIndex: 'room',
      key: 'room',
      render: (_, record) => record.room?.name || roomsMap[record.room_id]?.name || 'N/A',
    },
    {
      title: 'Nhà trọ',
      dataIndex: 'room',
      key: 'house_name',
      render: (_, record) => {
        const hid = record.room?.house_id || roomsMap[record.room_id]?.house_id;
        return housesById[hid]?.name || 'N/A';
      },
    },
    {
      title: 'Tiền thuê/tháng',
      dataIndex: 'monthly_rent',
      key: 'monthly_rent',
      render: (price) => `${price.toLocaleString()} VNĐ`,
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Đang thuê' : 'Đã kết thúc'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 320,
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Button
            type="link"
            icon={<FilePdfOutlined />}
            onClick={() => handleExportPdf(record)}
            style={{ color: '#cf1322' }}
          >
            Xuất PDF
          </Button>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/app/invoices?contract=${record.rr_id}`)}
          >
            Hóa đơn
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          {record.is_active && (
            <Popconfirm
              title="Bạn có chắc chắn muốn chấm dứt hợp đồng này?"
              onConfirm={() => handleDelete(record.rr_id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Chấm dứt
              </Button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  const extensionColumns = [
    {
      title: 'Phòng',
      dataIndex: 'roomName',
      key: 'roomName',
    },
    {
      title: 'Khách thuê',
      dataIndex: 'tenantName',
      key: 'tenantName',
    },
    {
      title: 'Ngày kết thúc hiện tại',
      dataIndex: 'currentEndDate',
      key: 'currentEndDate',
      render: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Ngày kết thúc đề xuất',
      dataIndex: 'requestedEndDate',
      key: 'requestedEndDate',
      render: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (value) => <Tag color={value === 'PENDING' ? 'gold' : value === 'APPROVED' ? 'green' : 'red'}>{value}</Tag>,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        const disabled = record.status !== 'PENDING';
        return (
          <Space>
            <Button type="primary" size="small" onClick={() => handleApproveExtension(record.extensionRequestId)} disabled={disabled}>
              Duyệt
            </Button>
            <Button size="small" danger onClick={() => handleRejectExtension(record.extensionRequestId)} disabled={disabled}>
              Từ chối
            </Button>
          </Space>
        );
      },
    },
  ];

  console.log('Rendering Contracts, houses:', houses.length, 'contracts:', contracts.length, 'loading:', loading, 'roomId:', roomId, 'action:', action);

  return (
    <div>
      {error && (
        <Card className="dash-animate-fade-in-up" style={{ marginBottom: 16, borderColor: '#ff4d4f', backgroundColor: '#fff1f0' }}>
          <p style={{ color: '#ff4d4f', margin: 0 }}>
            <strong>Lỗi:</strong> {error}
          </p>
        </Card>
      )}
      <Card className="dash-animate-fade-in-up"         title={`Quản lý hợp đồng thuê${roomId ? ` - ${rooms.find(r => r.room_id === parseInt(roomId))?.name || 'Phòng ' + roomId}` : ''}`}
        extra={
          action !== 'create' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo hợp đồng mới
            </Button>
          )
        }
      >
        {/* Show filters only if not in create mode and no specific room selected */}
        {action !== 'create' && !roomId && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 16 }}>
              {/* Filter Row */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                  <div style={{ color: '#888', marginBottom: '8px', fontSize: '13px' }}>Nhà trọ</div>
                  <Select
                    placeholder="Chọn nhà trọ"
                    style={{ width: '100%' }}
                    allowClear
                    value={filters.houseId}
                    onChange={(value) => {
                      if (value) {
                        fetchRooms(value);
                        handleFilterChange({ houseId: value, roomId: null });
                      } else {
                        setRooms([]);
                        handleFilterChange({ houseId: null, roomId: null });
                      }
                    }}
                  >
                    {houses.map(house => (
                      <Option key={house.house_id} value={house.house_id}>
                        {house.name}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                  <div style={{ color: '#888', marginBottom: '8px', fontSize: '13px' }}>Phòng</div>
                  <Select
                    placeholder="Chọn phòng"
                    style={{ width: '100%' }}
                    allowClear
                    disabled={!filters.houseId}
                    value={filters.roomId}
                    onChange={(value) => {
                      if (value) {
                        setSearchParams({ room: value });
                        handleFilterChange({ roomId: value });
                      } else {
                        setSearchParams({});
                        handleFilterChange({ roomId: null });
                      }
                    }}
                  >
                    {rooms.map(room => (
                      <Option key={room.room_id} value={room.room_id}>
                        {room.name}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                  <div style={{ color: '#888', marginBottom: '8px', fontSize: '13px' }}>Tên khách thuê</div>
                  <Input
                    placeholder="Nhập tên khách thuê"
                    value={filters.tenantName}
                    onChange={(e) => handleFilterChange({ tenantName: e.target.value })}
                    allowClear
                  />
                </div>

                <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
                  <div style={{ color: '#888', marginBottom: '8px', fontSize: '13px' }}>Trạng thái</div>
                  <Select
                    placeholder="Tất cả"
                    style={{ width: '100%' }}
                    allowClear
                    value={filters.status}
                    onChange={(value) => handleFilterChange({ status: value })}
                  >
                    <Option value="active">Đang thuê</Option>
                    <Option value="inactive">Đã kết thúc</Option>
                  </Select>
                </div>

                <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
                  <div style={{ color: '#888', marginBottom: '8px', fontSize: '13px' }}>Ngày bắt đầu</div>
                  <DatePicker
                    placeholder="Chọn ngày"
                    style={{ width: '100%' }}
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange({ startDate: date })}
                    allowClear
                  />
                </div>

                <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
                  <div style={{ color: '#888', marginBottom: '8px', fontSize: '13px' }}>Ngày kết thúc</div>
                  <DatePicker
                    placeholder="Chọn ngày"
                    style={{ width: '100%' }}
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange({ endDate: date })}
                    allowClear
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="primary" icon={<ReloadOutlined />} onClick={handleClearFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Show table or empty message */}
        {action !== 'create' && (
          <>
            {filteredContracts.length > 0 ? (
              <Table className="dash-animate-fade-in-up"                 columns={columns}
                dataSource={filteredContracts}
                rowKey="rr_id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fafafa', borderRadius: '4px' }}>
                <p style={{ fontSize: '16px', color: '#999', margin: 0 }}>
                  {loading ? 'Đang tải...' : 'Chưa có hợp đồng nào'}
                </p>
                {roomId && !loading && (
                  <Button type="primary" onClick={handleCreate} style={{ marginTop: '16px' }}>
                    Tạo hợp đồng cho phòng này
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      <Card className="dash-animate-fade-in-up" title="Yêu cầu gia hạn hợp đồng" style={{ marginTop: 16 }}>
        <Table className="dash-animate-fade-in-up"           rowKey="extensionRequestId"
          loading={extensionLoading}
          dataSource={extensionRequests}
          columns={extensionColumns}
          pagination={{ pageSize: 6 }}
        />
      </Card>

      <Modal
        title={editingContract ? 'Sửa hợp đồng' : 'Tạo hợp đồng mới'}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={(changedValues) => {
            // Re-validate number_of_tenants and sync rent when room changes
            if (changedValues.room_id) {
              form.validateFields(['number_of_tenants']);
              syncMonthlyRentFromRoom(changedValues.room_id);
            }
          }}
        >
          {requestMode && (
            <div style={{ marginBottom: 16, color: '#666' }}>
              Hợp đồng sẽ được gửi cho người thuê xác nhận.
            </div>
          )}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="house_id"
                label="Nhà Trọ"
                rules={[{ required: true, message: 'Vui lòng chọn nhà trọ!' }]}
              >
                <Select
                  placeholder="Chọn nhà trọ"
                  disabled={requestMode}
                  onChange={(value) => {
                    // Load rooms when house changes
                    if (value) {
                      fetchRooms(value);
                      // Clear room selection
                      form.setFieldsValue({ room_id: undefined, monthly_rent: undefined });
                    }
                  }}
                >
                  {houses.map(house => (
                    <Option key={house.house_id} value={house.house_id}>
                      {house.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="room_id"
                label="Phòng"
                rules={[{ required: true, message: 'Vui lòng chọn phòng!' }]}
              >
                <Select
                  placeholder="Chọn phòng"
                  disabled={requestMode || !!roomId || !!editingContract}
                  onChange={(value) => {
                    syncMonthlyRentFromRoom(value);
                  }}
                >
                  {(editingContract ? (rooms.length ? rooms : roomsAll) : availableRoomsForCreate).map(room => (
                    <Option key={room.room_id} value={room.room_id}>
                      {room.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {requestMode ? (
              <>
                <Col span={12}>
                  <Form.Item name="tenant_phone" label="Số điện thoại (khách thuê)">
                    <Input placeholder="Số điện thoại" disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="tenant_name" label="Tên khách thuê">
                    <Input placeholder="Tên khách thuê" disabled />
                  </Form.Item>
                </Col>
              </>
            ) : (
              <>
                <Col span={12}>
                  <Form.Item
                    name="tenant_id"
                    label="Số điện thoại (khách thuê)"
                    rules={[{ required: true, message: 'Vui lòng chọn số điện thoại khách thuê!' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Chọn số điện thoại"
                      loading={tenantLoading}
                      optionFilterProp="label"
                      onSearch={(value) => loadTenants(value)}
                      onChange={(value) => {
                        const selected = tenantOptions.find(t => t.tenant_id === value);
                        if (selected) {
                          form.setFieldsValue({
                            tenant_name: selected.fullname,
                            tenant_phone: selected.phone,
                          });
                        } else {
                          form.setFieldsValue({ tenant_name: undefined, tenant_phone: undefined });
                        }
                      }}
                      filterOption={false}
                      allowClear
                    >
                      {tenantOptions.map(t => (
                        <Option key={t.tenant_id} value={t.tenant_id} label={t.phone || ''}>
                          {t.phone || 'N/A'} {t.fullname ? `- ${t.fullname}` : ''}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="tenant_name" label="Tên khách thuê">
                    <Input placeholder="Tên khách thuê" disabled />
                  </Form.Item>
                  <Form.Item name="tenant_phone" hidden>
                    <Input />
                  </Form.Item>
                </Col>
              </>
            )}
           </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="number_of_tenants"
                label="Số người thuê"
                rules={[
                  { required: true, message: 'Vui lòng nhập số người thuê!' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const selectedRoom = roomsMap[form.getFieldValue('room_id')];
                      if (selectedRoom && value > selectedRoom.capacity) {
                        return Promise.reject(new Error(`Không được vượt quá sức chứa ${selectedRoom.capacity} người!`));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  min={1}
                  max={10}
                  style={{ width: '100%' }}
                  placeholder="Số người"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="monthly_rent"
                label="Tiền thuê/tháng (VNĐ)"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Tiền thuê"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  disabled
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="deposit"
                label="Tiền cọc (VNĐ)"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Tiền cọc"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="water_price"
                label="Giá tiền nước (VNĐ/người/tháng)"
                rules={[{ required: true, message: 'Vui lòng nhập giá tiền nước!' }]}
                initialValue={80000}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Giá tiền nước"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="internet_price"
                label="Giá tiền wifi (VNĐ/phòng/tháng)"
                rules={[{ required: true, message: 'Vui lòng nhập giá tiền wifi!' }]}
                initialValue={100000}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Giá tiền wifi"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="general_price"
                label="Giá dịch vụ chung (VNĐ/người/tháng)"
                rules={[{ required: true, message: 'Vui lòng nhập giá dịch vụ!' }]}
                initialValue={100000}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Giá dịch vụ"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="initial_electricity_num"
                label="Số điện ban đầu (kWh)"
                rules={[{ required: true, message: 'Vui lòng nhập số điện ban đầu!' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Số điện ban đầu"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="electricity_unit_price"
                label="Đơn giá điện (VNĐ/kWh)"
                rules={[{ required: true, message: 'Vui lòng nhập đơn giá điện!' }]}
                initialValue={3500}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Đơn giá điện"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_date"
                label="Ngày bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_date"
                label="Ngày kết thúc"
                rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>


          <Form.Item
            name="contract_url"
            label="Link hợp đồng"
          >
            <Input placeholder="Nhập link hợp đồng (nếu có)" />
          </Form.Item>

          {requestMode && (
            <>
              <Divider>Chữ ký</Divider>
              <SignaturePad
                label="Chữ ký chủ trọ (Bên A)"
                onSignatureChange={setLandlordSignature}
                width={400}
                height={150}
              />
            </>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleModalClose}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingContract ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Contracts;
