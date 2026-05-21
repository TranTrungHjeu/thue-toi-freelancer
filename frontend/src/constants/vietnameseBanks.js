/**
 * Danh sách ngân hàng Việt Nam phổ biến hỗ trợ VietQR / SePay.
 *  - `code` là mã VietQR (dùng để build QR động hoặc đối soát với cổng SePay).
 *  - `shortName` hiển thị trên dropdown chính.
 *  - `name` là tên đầy đủ, dùng cho tìm kiếm.
 *  - `bin` là mã BIN của Napas (tham khảo, không bắt buộc).
 */
export const VIETNAMESE_BANKS = [
  { code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại thương Việt Nam', bin: '970436' },
  { code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam', bin: '970407' },
  { code: 'MB', shortName: 'MB Bank', name: 'Ngân hàng TMCP Quân Đội', bin: '970422' },
  { code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', bin: '970418' },
  { code: 'ICB', shortName: 'VietinBank', name: 'Ngân hàng TMCP Công thương Việt Nam', bin: '970415' },
  { code: 'ACB', shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu', bin: '970416' },
  { code: 'VPB', shortName: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', bin: '970432' },
  { code: 'AGRIBANK', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam', bin: '970405' },
  { code: 'TPB', shortName: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong', bin: '970423' },
  { code: 'STB', shortName: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín', bin: '970403' },
  { code: 'HDB', shortName: 'HDBank', name: 'Ngân hàng TMCP Phát triển TP.HCM', bin: '970437' },
  { code: 'SHB', shortName: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội', bin: '970443' },
  { code: 'VIB', shortName: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam', bin: '970441' },
  { code: 'EIB', shortName: 'Eximbank', name: 'Ngân hàng TMCP Xuất nhập khẩu Việt Nam', bin: '970431' },
  { code: 'MSB', shortName: 'MSB', name: 'Ngân hàng TMCP Hàng Hải', bin: '970426' },
  { code: 'OCB', shortName: 'OCB', name: 'Ngân hàng TMCP Phương Đông', bin: '970448' },
  { code: 'LPB', shortName: 'LPBank', name: 'Ngân hàng TMCP Lộc Phát Việt Nam', bin: '970449' },
  { code: 'SCB', shortName: 'SCB', name: 'Ngân hàng TMCP Sài Gòn', bin: '970429' },
  { code: 'SGB', shortName: 'Saigonbank', name: 'Ngân hàng TMCP Sài Gòn Công Thương', bin: '970400' },
  { code: 'BVB', shortName: 'BVBank', name: 'Ngân hàng TMCP Bản Việt', bin: '970454' },
  { code: 'PVCB', shortName: 'PVcomBank', name: 'Ngân hàng TMCP Đại Chúng Việt Nam', bin: '970412' },
  { code: 'BAOVIETBANK', shortName: 'BaoVietBank', name: 'Ngân hàng TMCP Bảo Việt', bin: '970438' },
  { code: 'ABB', shortName: 'ABBank', name: 'Ngân hàng TMCP An Bình', bin: '970425' },
  { code: 'KLB', shortName: 'KienlongBank', name: 'Ngân hàng TMCP Kiên Long', bin: '970452' },
  { code: 'NAB', shortName: 'Nam A Bank', name: 'Ngân hàng TMCP Nam Á', bin: '970428' },
  { code: 'NCB', shortName: 'NCB', name: 'Ngân hàng TMCP Quốc Dân', bin: '970419' },
  { code: 'BAB', shortName: 'Bac A Bank', name: 'Ngân hàng TMCP Bắc Á', bin: '970409' },
  { code: 'PGB', shortName: 'PGBank', name: 'Ngân hàng TMCP Thịnh Vượng và Phát triển', bin: '970430' },
  { code: 'VAB', shortName: 'VietABank', name: 'Ngân hàng TMCP Việt Á', bin: '970427' },
  { code: 'EAB', shortName: 'DongA Bank', name: 'Ngân hàng TMCP Đông Á', bin: '970406' },
  { code: 'CBB', shortName: 'CBBank', name: 'Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam', bin: '970444' },
  { code: 'OCEANBANK', shortName: 'OceanBank', name: 'Ngân hàng TM TNHH MTV Đại Dương', bin: '970414' },
  { code: 'VRB', shortName: 'VRB', name: 'Ngân hàng Liên doanh Việt - Nga', bin: '970421' },
  { code: 'COOPBANK', shortName: 'Co-opBank', name: 'Ngân hàng Hợp tác xã Việt Nam', bin: '970446' },
  { code: 'IVB', shortName: 'IndovinaBank', name: 'Ngân hàng TNHH Indovina', bin: '970434' },
  { code: 'WOO', shortName: 'Woori Bank', name: 'Ngân hàng TNHH MTV Woori Việt Nam', bin: '970457' },
  { code: 'SHBVN', shortName: 'Shinhan Bank', name: 'Ngân hàng TNHH MTV Shinhan Việt Nam', bin: '970424' },
  { code: 'HSBC', shortName: 'HSBC', name: 'HSBC Việt Nam', bin: '458761' },
  { code: 'PBVN', shortName: 'Public Bank', name: 'Ngân hàng TNHH MTV Public Việt Nam', bin: '970439' },
  { code: 'SC', shortName: 'Standard Chartered', name: 'Ngân hàng Standard Chartered Việt Nam', bin: '970410' },
  { code: 'UOB', shortName: 'UOB', name: 'Ngân hàng UOB Việt Nam', bin: '970458' },
  { code: 'CIMB', shortName: 'CIMB Bank', name: 'Ngân hàng TNHH MTV CIMB Việt Nam', bin: '422589' },
  { code: 'CITIBANK', shortName: 'Citibank', name: 'Citibank Việt Nam', bin: '533948' },
  { code: 'KEBHANAHCM', shortName: 'KEB Hana HCM', name: 'KEB Hana Bank Chi nhánh TP. Hồ Chí Minh', bin: '970466' },
  { code: 'KEBHANAHN', shortName: 'KEB Hana HN', name: 'KEB Hana Bank Chi nhánh Hà Nội', bin: '970467' },
  { code: 'VBSP', shortName: 'VBSP', name: 'Ngân hàng Chính sách Xã hội Việt Nam', bin: '999888' },
];

/**
 * Tìm thông tin ngân hàng theo mã (case-insensitive).
 */
export const findBankByCode = (code) => {
  if (!code) return null;
  const upper = String(code).toUpperCase();
  return VIETNAMESE_BANKS.find((bank) => bank.code === upper) || null;
};

/**
 * Build URL ảnh VietQR động (img.vietqr.io) cho 1 giao dịch chuyển khoản đến tài khoản đích.
 * Khi admin/người chuyển dùng app ngân hàng quét QR này, các trường (số tiền, nội dung,
 * người nhận) sẽ được điền sẵn — không cần copy/paste mã đơn vào memo.
 *
 * @param {object} params
 * @param {string} params.bankCode      mã VietQR (vd "VCB", "MB"). Bắt buộc.
 * @param {string} params.accountNumber số tài khoản đích. Bắt buộc.
 * @param {string|number} [params.amount]   số tiền (VND). Optional - nếu không có sẽ để trống.
 * @param {string} [params.addInfo]     nội dung chuyển khoản (vd order code).
 * @param {string} [params.accountName] tên chủ tài khoản (đối soát).
 * @param {string} [params.template]    'compact' | 'compact2' | 'qr_only' | 'print'. Mặc định 'compact2'.
 * @returns {string|null} URL ảnh QR hoặc null nếu thiếu trường bắt buộc.
 */
export const buildVietQrImageUrl = ({
  bankCode,
  accountNumber,
  amount,
  addInfo,
  accountName,
  template = 'compact2',
}) => {
  if (!bankCode || !accountNumber) return null;
  const params = new URLSearchParams();
  if (amount !== undefined && amount !== null && String(amount).trim() !== '') {
    params.set('amount', String(amount));
  }
  if (addInfo) params.set('addInfo', addInfo);
  if (accountName) params.set('accountName', accountName);
  const query = params.toString();
  const base = `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${encodeURIComponent(
    accountNumber
  )}-${template}.jpg`;
  return query ? `${base}?${query}` : base;
};

/**
 * Tìm theo tên ngân hàng (so khớp gần đúng) - dùng khi chỉ có bankName chứ không có bankCode.
 */
export const findBankByName = (name) => {
  if (!name) return null;
  const lower = String(name).trim().toLowerCase();
  return (
    VIETNAMESE_BANKS.find(
      (bank) =>
        bank.shortName.toLowerCase() === lower ||
        bank.name.toLowerCase() === lower
    ) ||
    VIETNAMESE_BANKS.find(
      (bank) =>
        bank.shortName.toLowerCase().includes(lower) ||
        bank.name.toLowerCase().includes(lower)
    ) ||
    null
  );
};
