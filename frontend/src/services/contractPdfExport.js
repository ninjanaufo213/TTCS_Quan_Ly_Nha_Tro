import { jsPDF } from 'jspdf';
import RobotoFonts from '../fonts/roboto-fonts';

/**
 * Xuất PDF Hợp Đồng Thuê Phòng Trọ — Chuẩn pháp lý Việt Nam
 *
 * Margins: trái 30mm, phải 20mm, trên 20mm, dưới 20mm (chuẩn văn bản hành chính VN)
 * Font: Roboto (hỗ trợ Unicode tiếng Việt)
 * Kích cỡ giấy: A4 (210 x 297 mm)
 */

// ───────── Helpers ─────────

const formatMoney = (value) => {
  if (value === null || value === undefined) return '...............';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat('vi-VN').format(num);
};

const formatDate = (value) => {
  if (!value) return '......./......./...............';
  const d = new Date(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const extractDateParts = (value) => {
  if (!value) return { day: '......', month: '......', year: '..........' };
  const d = new Date(value);
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    year: String(d.getFullYear()),
  };
};

const numberToVietnameseWords = (num) => {
  if (num === null || num === undefined || Number.isNaN(Number(num))) return '';
  const n = Number(num);
  if (n === 0) return 'không';

  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ'];

  const readThreeDigits = (hundreds, tens, units_digit, hasHigher) => {
    let result = '';
    if (hundreds > 0) {
      result += ones[hundreds] + ' trăm';
      if (tens === 0 && units_digit > 0) {
        result += ' lẻ ' + ones[units_digit];
      } else if (tens > 0) {
        if (tens === 1) {
          result += ' mười';
        } else {
          result += ' ' + ones[tens] + ' mươi';
        }
        if (units_digit > 0) {
          if (units_digit === 1 && tens > 1) {
            result += ' mốt';
          } else if (units_digit === 5 && tens >= 1) {
            result += ' lăm';
          } else {
            result += ' ' + ones[units_digit];
          }
        }
      }
    } else if (tens > 0) {
      if (hasHigher) result += 'không trăm ';
      if (tens === 1) {
        result += 'mười';
      } else {
        result += ones[tens] + ' mươi';
      }
      if (units_digit > 0) {
        if (units_digit === 1 && tens > 1) {
          result += ' mốt';
        } else if (units_digit === 5 && tens >= 1) {
          result += ' lăm';
        } else {
          result += ' ' + ones[units_digit];
        }
      }
    } else if (units_digit > 0) {
      if (hasHigher) result += 'không trăm lẻ ';
      result += ones[units_digit];
    }
    return result.trim();
  };

  // Split number into groups of 3
  const str = String(Math.abs(Math.floor(n)));
  const groups = [];
  let s = str;
  while (s.length > 0) {
    groups.unshift(s.slice(Math.max(0, s.length - 3)));
    s = s.slice(0, Math.max(0, s.length - 3));
  }

  const parts = [];
  for (let i = 0; i < groups.length; i++) {
    const g = parseInt(groups[i], 10);
    if (g === 0) continue;
    const hundreds = Math.floor(g / 100);
    const tens = Math.floor((g % 100) / 10);
    const u = g % 10;
    const unitIndex = groups.length - 1 - i;
    const text = readThreeDigits(hundreds, tens, u, i > 0);
    if (text) {
      parts.push(text + (units[unitIndex] ? ' ' + units[unitIndex] : ''));
    }
  }

  let result = parts.join(' ');
  return result.charAt(0).toUpperCase() + result.slice(1);
};

// ───────── Font Setup ─────────

const setupFonts = (doc) => {
  doc.addFileToVFS('Roboto-Regular.ttf', RobotoFonts['Roboto-Regular']);
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoFonts['Roboto-Bold']);
  doc.addFileToVFS('Roboto-Italic.ttf', RobotoFonts['Roboto-Italic']);
  doc.addFileToVFS('Roboto-BoldItalic.ttf', RobotoFonts['Roboto-BoldItalic']);

  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.addFont('Roboto-Italic.ttf', 'Roboto', 'italic');
  doc.addFont('Roboto-BoldItalic.ttf', 'Roboto', 'bolditalic');

  doc.setFont('Roboto', 'normal');
};

// ───────── PDF Layout Constants ─────────

const PAGE = {
  LEFT: 30,    // lề trái 30mm (chuẩn)
  RIGHT: 20,   // lề phải 20mm
  TOP: 20,     // lề trên 20mm
  BOTTOM: 20,  // lề dưới 20mm
  WIDTH: 210,  // A4 width
  HEIGHT: 297, // A4 height
};

const CONTENT_WIDTH = PAGE.WIDTH - PAGE.LEFT - PAGE.RIGHT; // 160mm

// ───────── Drawing Helpers ─────────

/**
 * Auto-wrap text and handle page breaks
 */
const addWrappedText = (doc, text, x, y, maxWidth, lineHeight, options = {}) => {
  const { align = 'left', fontStyle = 'normal', fontSize = 12 } = options;
  doc.setFont('Roboto', fontStyle);
  doc.setFontSize(fontSize);

  const lines = doc.splitTextToSize(text, maxWidth);
  let currentY = y;

  for (const line of lines) {
    if (currentY > PAGE.HEIGHT - PAGE.BOTTOM - 10) {
      doc.addPage();
      currentY = PAGE.TOP;
    }

    let textX = x;
    if (align === 'center') {
      textX = x + maxWidth / 2;
    } else if (align === 'right') {
      textX = x + maxWidth;
    }

    doc.text(line, textX, currentY, { align });
    currentY += lineHeight;
  }

  return currentY;
};

/**
 * Check page break and add new page if needed
 */
const checkPageBreak = (doc, y, neededSpace = 20) => {
  if (y > PAGE.HEIGHT - PAGE.BOTTOM - neededSpace) {
    doc.addPage();
    return PAGE.TOP;
  }
  return y;
};

// ───────── Main Export Function ─────────

/**
 * Generate and download contract PDF
 *
 * @param {Object} contractData - data from RentedRoomResponse
 * @param {Object} houseInfo    - data from HouseResponse
 * @param {Object} landlordInfo - { name, phone } of landlord
 */
export const generateContractPdf = (contractData, houseInfo, landlordInfo = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  setupFonts(doc);

  let y = PAGE.TOP;
  const x = PAGE.LEFT;

  // ── 1. QUỐC HIỆU ──
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(13);
  y = addWrappedText(
    doc,
    'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
    x, y, CONTENT_WIDTH, 6,
    { align: 'center', fontStyle: 'bold', fontSize: 13 }
  );

  // Tiêu ngữ
  doc.setFont('Roboto', 'bolditalic');
  doc.setFontSize(13);
  y = addWrappedText(
    doc,
    'Độc lập – Tự do – Hạnh phúc',
    x, y, CONTENT_WIDTH, 6,
    { align: 'center', fontStyle: 'bolditalic', fontSize: 13 }
  );

  // Dòng gạch
  const centerX = x + CONTENT_WIDTH / 2;
  const lineLen = 60;
  doc.setLineWidth(0.3);
  doc.line(centerX - lineLen / 2, y, centerX + lineLen / 2, y);
  y += 10;

  // ── 2. TIÊU ĐỀ HỢP ĐỒNG ──
  y = checkPageBreak(doc, y, 20);
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(16);
  y = addWrappedText(
    doc,
    'HỢP ĐỒNG THUÊ PHÒNG TRỌ',
    x, y, CONTENT_WIDTH, 8,
    { align: 'center', fontStyle: 'bold', fontSize: 16 }
  );
  y += 4;

  // ── 3. NGÀY THÁNG & ĐỊA CHỈ ──
  const today = extractDateParts(new Date().toISOString());
  const address = [houseInfo?.addressLine || houseInfo?.address_line, houseInfo?.ward, houseInfo?.district]
    .filter(Boolean).join(', ') || '.......................................................................';

  y = addWrappedText(
    doc,
    `Hôm nay ngày ${today.day} tháng ${today.month} năm ${today.year}; tại địa chỉ: ${address}`,
    x, y, CONTENT_WIDTH, 6,
    { fontSize: 12 }
  );
  y += 4;

  // ── 4. THÔNG TIN CÁC BÊN ──
  y = checkPageBreak(doc, y, 40);
  y = addWrappedText(doc, 'Chúng tôi gồm:', x, y, CONTENT_WIDTH, 6, { fontStyle: 'bold', fontSize: 12 });
  y += 2;

  // Bên A
  y = addWrappedText(doc, '1. Đại diện bên cho thuê phòng trọ (Bên A):', x, y, CONTENT_WIDTH, 6, { fontStyle: 'bold', fontSize: 12 });
  const landlordName = landlordInfo?.name || '...........................................................................';
  const landlordPhone = landlordInfo?.phone || '....................................................';
  y = addWrappedText(doc, `Ông/Bà: ${landlordName}`, x + 5, y, CONTENT_WIDTH - 5, 6, { fontSize: 12 });
  y = addWrappedText(doc, `Số điện thoại: ${landlordPhone}`, x + 5, y, CONTENT_WIDTH - 5, 6, { fontSize: 12 });
  y += 2;

  // Bên B
  y = addWrappedText(doc, '2. Bên thuê phòng trọ (Bên B):', x, y, CONTENT_WIDTH, 6, { fontStyle: 'bold', fontSize: 12 });
  const tenantName = contractData.tenant_name || contractData.tenantName || '...........................................................................';
  const tenantPhone = contractData.tenant_phone || contractData.tenantPhone || '....................................................';
  y = addWrappedText(doc, `Ông/Bà: ${tenantName}`, x + 5, y, CONTENT_WIDTH - 5, 6, { fontSize: 12 });
  y = addWrappedText(doc, `Số điện thoại: ${tenantPhone}`, x + 5, y, CONTENT_WIDTH - 5, 6, { fontSize: 12 });
  y += 2;

  y = addWrappedText(
    doc,
    'Sau khi bàn bạc trên tinh thần dân chủ, hai bên cùng có lợi, cùng thống nhất như sau:',
    x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
  );
  y += 4;

  // ── 5. ĐIỀU 1: ĐỐI TƯỢNG CHO THUÊ ──
  y = checkPageBreak(doc, y, 30);
  y = addWrappedText(doc, 'ĐIỀU 1: ĐỐI TƯỢNG CHO THUÊ', x, y, CONTENT_WIDTH, 7, { fontStyle: 'bold', fontSize: 13 });

  const roomName = contractData.room?.name || contractData.roomName || 'phòng trọ';
  const houseName = houseInfo?.name || '';
  const roomLabel = houseName ? `${roomName} - ${houseName}` : roomName;

  y = addWrappedText(
    doc,
    `Bên A đồng ý cho bên B thuê 01 phòng ở tại: ${roomLabel}`,
    x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
  );
  y = addWrappedText(
    doc,
    `Địa chỉ: ${address}`,
    x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
  );

  const numberOfTenants = contractData.number_of_tenants || contractData.numberOfTenants || '...';
  y = addWrappedText(
    doc,
    `Số người ở: ${numberOfTenants} người`,
    x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
  );
  y += 4;

  // ── 6. ĐIỀU 2: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN ──
  y = checkPageBreak(doc, y, 40);
  y = addWrappedText(doc, 'ĐIỀU 2: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN', x, y, CONTENT_WIDTH, 7, { fontStyle: 'bold', fontSize: 13 });

  const monthlyRent = contractData.monthly_rent || contractData.monthlyRent;
  const deposit = contractData.deposit;

  y = addWrappedText(
    doc,
    `- Giá thuê: ${formatMoney(monthlyRent)} đồng/tháng (Bằng chữ: ${numberToVietnameseWords(monthlyRent)} đồng).`,
    x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
  );

  y = addWrappedText(
    doc,
    `- Tiền đặt cọc: ${formatMoney(deposit)} đồng (Bằng chữ: ${numberToVietnameseWords(deposit)} đồng).`,
    x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
  );

  y = addWrappedText(
    doc,
    '- Hình thức thanh toán: Thanh toán vào đầu mỗi tháng.',
    x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
  );

  y = addWrappedText(
    doc,
    '- Trong quá trình cho thuê, Bên A không được tự ý tăng giá thuê phòng. Mọi thay đổi về giá phải được hai bên thống nhất bằng văn bản.',
    x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
  );
  y += 4;

  // ── 7. ĐIỀU 3: DỊCH VỤ VÀ PHÍ PHÁT SINH ──
  y = checkPageBreak(doc, y, 40);
  y = addWrappedText(doc, 'ĐIỀU 3: DỊCH VỤ VÀ PHÍ PHÁT SINH', x, y, CONTENT_WIDTH, 7, { fontStyle: 'bold', fontSize: 13 });

  const electricityPrice = contractData.electricity_unit_price || contractData.electricityUnitPrice;
  const waterPrice = contractData.water_price || contractData.waterPrice;
  const internetPrice = contractData.internet_price || contractData.internetPrice;
  const generalPrice = contractData.general_price || contractData.generalPrice;

  y = addWrappedText(
    doc,
    `- Tiền điện: ${formatMoney(electricityPrice)} đ/kWh, tính theo chỉ số công tơ, thanh toán vào cuối các tháng.`,
    x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
  );
  y = addWrappedText(
    doc,
    `- Tiền nước: ${formatMoney(waterPrice)} đ/người/tháng, thanh toán vào đầu các tháng.`,
    x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
  );
  y = addWrappedText(
    doc,
    `- Tiền wifi: ${formatMoney(internetPrice)} đ/phòng/tháng.`,
    x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
  );
  y = addWrappedText(
    doc,
    `- Phí dịch vụ chung: ${formatMoney(generalPrice)} đ/người/tháng.`,
    x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
  );
  y += 4;

  // ── 8. ĐIỀU 4: THỜI HẠN HỢP ĐỒNG ──
  y = checkPageBreak(doc, y, 30);
  y = addWrappedText(doc, 'ĐIỀU 4: THỜI HẠN HỢP ĐỒNG', x, y, CONTENT_WIDTH, 7, { fontStyle: 'bold', fontSize: 13 });

  const startDate = contractData.start_date || contractData.startDate;
  const endDate = contractData.end_date || contractData.endDate;
  const startParts = extractDateParts(startDate);
  const endParts = extractDateParts(endDate);

  y = addWrappedText(
    doc,
    `Hợp đồng có giá trị kể từ ngày ${startParts.day} tháng ${startParts.month} năm ${startParts.year} đến ngày ${endParts.day} tháng ${endParts.month} năm ${endParts.year}.`,
    x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
  );

  // Tính số tháng
  if (startDate && endDate) {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const diffMonths = (eDate.getFullYear() - sDate.getFullYear()) * 12 + (eDate.getMonth() - sDate.getMonth());
    if (diffMonths > 0) {
      y = addWrappedText(
        doc,
        `Thời hạn hợp đồng: ${diffMonths} tháng.`,
        x, y, CONTENT_WIDTH, 6, { fontSize: 12 }
      );
    }
  }
  y += 4;

  // ── 9. ĐIỀU 5: TRÁCH NHIỆM CỦA CÁC BÊN ──
  y = checkPageBreak(doc, y, 60);
  y = addWrappedText(doc, 'ĐIỀU 5: TRÁCH NHIỆM CỦA CÁC BÊN', x, y, CONTENT_WIDTH, 7, { fontStyle: 'bold', fontSize: 13 });

  // Bên A
  y = addWrappedText(doc, '* Trách nhiệm của bên A:', x, y, CONTENT_WIDTH, 6, { fontStyle: 'bold', fontSize: 12 });
  const benADuties = [
    'Tạo mọi điều kiện thuận lợi để bên B thực hiện theo hợp đồng.',
    'Cung cấp nguồn điện, nước, wifi cho bên B sử dụng.',
    'Đảm bảo an ninh, trật tự khu vực cho thuê.',
  ];
  for (const duty of benADuties) {
    y = checkPageBreak(doc, y, 10);
    y = addWrappedText(doc, `- ${duty}`, x, y, CONTENT_WIDTH, 6, { fontSize: 12 });
  }
  y += 2;

  // Bên B
  y = addWrappedText(doc, '* Trách nhiệm của bên B:', x, y, CONTENT_WIDTH, 6, { fontStyle: 'bold', fontSize: 12 });
  const benBDuties = [
    'Thanh toán đầy đủ các khoản tiền theo đúng thỏa thuận.',
    'Bảo quản các trang thiết bị và cơ sở vật chất của bên A trang bị cho ban đầu (làm hỏng phải sửa, mất phải đền).',
    'Không được tự ý sửa chữa, cải tạo cơ sở vật chất khi chưa được sự đồng ý của bên A.',
    'Giữ gìn vệ sinh trong và ngoài khuôn viên của phòng trọ.',
    'Bên B phải chấp hành mọi quy định của pháp luật Nhà nước và quy định của địa phương.',
    'Nếu bên B cho khách ở qua đêm thì phải báo và được sự đồng ý của chủ nhà đồng thời phải chịu trách nhiệm về các hành vi vi phạm pháp luật của khách trong thời gian ở lại.',
  ];
  for (const duty of benBDuties) {
    y = checkPageBreak(doc, y, 10);
    y = addWrappedText(doc, `- ${duty}`, x, y, CONTENT_WIDTH, 6, { fontSize: 12 });
  }
  y += 4;

  // ── 10. ĐIỀU 6: ĐIỀU KHOẢN CHUNG ──
  y = checkPageBreak(doc, y, 50);
  y = addWrappedText(doc, 'ĐIỀU 6: ĐIỀU KHOẢN CHUNG', x, y, CONTENT_WIDTH, 7, { fontStyle: 'bold', fontSize: 13 });

  const generalClauses = [
    'Hai bên phải tạo điều kiện cho nhau thực hiện hợp đồng.',
    'Trong thời gian hợp đồng còn hiệu lực nếu bên nào vi phạm các điều khoản đã thỏa thuận thì bên còn lại có quyền đơn phương chấm dứt hợp đồng; nếu sự vi phạm hợp đồng đó gây tổn thất cho bên bị vi phạm hợp đồng thì bên vi phạm hợp đồng phải bồi thường thiệt hại.',
    'Một trong hai bên muốn chấm dứt hợp đồng trước thời hạn thì phải báo trước cho bên kia ít nhất 30 ngày và hai bên phải có sự thống nhất.',
    'Bên A phải trả lại tiền đặt cọc cho bên B khi hợp đồng kết thúc (trừ trường hợp bên B vi phạm hợp đồng).',
    'Bên nào vi phạm điều khoản chung thì phải chịu trách nhiệm trước pháp luật.',
    'Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ một bản.',
  ];
  for (const clause of generalClauses) {
    y = checkPageBreak(doc, y, 10);
    y = addWrappedText(doc, `- ${clause}`, x, y, CONTENT_WIDTH, 6, { fontSize: 12 });
  }
  y += 10;

  // ── 11. CHỮ KÝ ──
  y = checkPageBreak(doc, y, 60);

  const leftSignX = x;
  const rightSignX = x + CONTENT_WIDTH / 2 + 10;
  const signBlockWidth = CONTENT_WIDTH / 2 - 10;

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(13);
  doc.text('ĐẠI DIỆN BÊN B', leftSignX + signBlockWidth / 2, y, { align: 'center' });
  doc.text('ĐẠI DIỆN BÊN A', rightSignX + signBlockWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('Roboto', 'italic');
  doc.setFontSize(11);
  doc.text('(Ký, ghi rõ họ tên)', leftSignX + signBlockWidth / 2, y, { align: 'center' });
  doc.text('(Ký, ghi rõ họ tên)', rightSignX + signBlockWidth / 2, y, { align: 'center' });
  y += 4;

  // Embed signature images if available
  const tenantSig = contractData.tenant_signature || contractData.tenantSignature;
  const landlordSig = contractData.landlord_signature || contractData.landlordSignature;
  const sigWidth = 50;
  const sigHeight = 25;

  if (tenantSig) {
    try {
      doc.addImage(tenantSig, 'PNG', leftSignX + (signBlockWidth - sigWidth) / 2, y, sigWidth, sigHeight);
    } catch (e) {
      console.warn('Could not embed tenant signature:', e);
    }
  }
  if (landlordSig) {
    try {
      doc.addImage(landlordSig, 'PNG', rightSignX + (signBlockWidth - sigWidth) / 2, y, sigWidth, sigHeight);
    } catch (e) {
      console.warn('Could not embed landlord signature:', e);
    }
  }
  y += sigHeight + 4;

  // Print signer names below signatures
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(12);
  doc.text(tenantName, leftSignX + signBlockWidth / 2, y, { align: 'center' });
  doc.text(landlordName, rightSignX + signBlockWidth / 2, y, { align: 'center' });

  // Add e-contract legal notice
  y += 10;
  doc.setFont('Roboto', 'italic');
  doc.setFontSize(9);
  if (tenantSig || landlordSig) {
    y = addWrappedText(
      doc,
      'Hợp đồng này được giao kết bằng phương thức điện tử theo Luật Giao dịch điện tử 2023 và có giá trị pháp lý tương đương hợp đồng văn bản.',
      x, y, CONTENT_WIDTH, 4,
      { fontSize: 9, fontStyle: 'italic' }
    );
  }

  // ── Save ──
  const fileName = `Hop_dong_thue_phong_${(contractData.room?.name || contractData.roomName || 'phong').replace(/\s+/g, '_')}_${formatDate(startDate).replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};

export default generateContractPdf;
