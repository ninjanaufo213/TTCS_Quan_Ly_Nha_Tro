import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button, Typography, Space } from 'antd';
import { ClearOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const SignaturePad = ({ 
  onSignatureChange, 
  disabled = false, 
  label = 'Chữ ký', 
  value = null,
  width = 400,
  height = 200 
}) => {
  const sigRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (value && sigRef.current && !disabled) {
      // If there's a saved value and component isn't disabled, load it into the canvas
      sigRef.current.fromDataURL(value, { width, height });
      setIsEmpty(false);
    }
  }, [value, disabled, width, height]);

  const handleClear = () => {
    if (sigRef.current) {
      sigRef.current.clear();
      setIsEmpty(true);
      if (onSignatureChange) onSignatureChange(null);
    }
  };

  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      setIsEmpty(false);
      const dataUrl = sigRef.current.getCanvas().toDataURL('image/png');
      if (onSignatureChange) onSignatureChange(dataUrl);
    }
  };

  // If disabled and there's a saved signature, show it as an image
  if (disabled && value) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <Space>
            <Text strong>{label}</Text>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            <Text type="success" style={{ fontSize: 12 }}>Đã ký</Text>
          </Space>
        </div>
        <div style={{
          border: '1px solid #d9d9d9',
          borderRadius: 8,
          padding: 8,
          backgroundColor: '#fafafa',
          display: 'inline-block'
        }}>
          <img 
            src={value} 
            alt="Chữ ký" 
            style={{ maxWidth: width, maxHeight: height, display: 'block' }} 
          />
        </div>
      </div>
    );
  }

  // If disabled and no value, show empty placeholder
  if (disabled && !value) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <Text strong>{label}</Text>
        </div>
        <div style={{
          width,
          height,
          border: '2px dashed #d9d9d9',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          color: '#bfbfbf'
        }}>
          <Text type="secondary">Chưa ký</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <Text strong>{label}</Text>
          {!isEmpty && (
            <>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />
              <Text type="success" style={{ fontSize: 12 }}>Đã ký</Text>
            </>
          )}
        </Space>
        <Button 
          size="small" 
          icon={<ClearOutlined />} 
          onClick={handleClear}
          disabled={isEmpty}
        >
          Xóa chữ ký
        </Button>
      </div>
      <div style={{
        border: isEmpty ? '2px dashed #d9d9d9' : '2px solid #1890ff',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        cursor: 'crosshair',
        transition: 'border-color 0.3s ease',
        width: 'fit-content'
      }}>
        <SignatureCanvas
          ref={sigRef}
          penColor="#000"
          backgroundColor="#fff"
          canvasProps={{
            width,
            height,
            style: { display: 'block' }
          }}
          onEnd={handleEnd}
        />
      </div>
      <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
        Vui lòng ký vào ô trên bằng chuột hoặc màn hình cảm ứng
      </Text>
    </div>
  );
};

export default SignaturePad;
