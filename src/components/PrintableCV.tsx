import React from 'react';
import { format } from 'date-fns';

interface PrintableCVProps {
  data: any;
}

const PrintableCV: React.FC<PrintableCVProps> = ({ data }) => {
  if (!data) return <div className="p-10 text-red-500">Không có dữ liệu để hiển thị</div>;

  const { 
    basicInfo = {}, 
    personalHistory = {}, 
    familyHistory: familyHistoryRaw = [], 
    otherInfo = {}, 
    selfAssessment = {},
    conditions = {}
  } = data;

  const familyHistory = Array.isArray(familyHistoryRaw) ? familyHistoryRaw : (familyHistoryRaw?.familyMembers || []);
  const history = Array.isArray(personalHistory) ? personalHistory : (personalHistory?.history || []);
  const jobHistory = personalHistory?.jobHistory || [];

  const safeFormatDate = (dateStr: string, formatStr: string = 'dd/MM/yyyy') => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return format(date, formatStr);
    } catch (e) {
      return dateStr;
    }
  };

  const renderDottedLine = (label: string, value: string, className = "") => (
    <table className={`w-full mb-1 ${className}`} style={{ borderCollapse: 'collapse', border: 'none' }}>
      <tbody>
        <tr>
          <td style={{ width: '1%', whiteSpace: 'nowrap', border: 'none', padding: '0 4px 0 0', verticalAlign: 'bottom' }}>
            <span className="font-medium text-[11pt]" style={{ color: '#111827' }}>{label}:</span>
          </td>
          <td style={{ border: 'none', borderBottom: '1px dotted #4b5563', padding: '0 4px', verticalAlign: 'bottom' }}>
            <span className="text-[11pt]" style={{ color: '#111827' }}>{value || ''}</span>
          </td>
        </tr>
      </tbody>
    </table>
  );

  const renderEmptyLines = (count: number) => {
    return Array.from({ length: count }).map((_, i) => (
      <div key={i} className="border-b border-dotted border-gray-500 h-8 w-full mb-2"></div>
    ));
  };

  const PageWrapper: React.FC<{ children: React.ReactNode, pageNum: number, showPageNum?: boolean }> = ({ children, pageNum, showPageNum = true }) => (
    <div 
      className="pdf-page mx-auto mb-4 relative bg-white" 
      id={`page-${pageNum}`} 
      style={{ 
        padding: '1.5cm',
        width: '210mm',
        minHeight: '297mm',
        fontSize: '11pt',
        lineHeight: '1.6',
        fontFamily: '"Times New Roman", Times, serif',
        color: '#000',
        boxSizing: 'border-box',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      {children}
      {showPageNum && <div className="absolute bottom-8 left-0 w-full text-center text-sm">{pageNum}</div>}
    </div>
  );

  return (
    <div className="printable-cv py-10 overflow-auto bg-gray-200 flex flex-col items-center">
      {/* Page 1: Cover */}
      <PageWrapper pageNum={1} showPageNum={false}>
        <div className="p-10 text-center" style={{ border: '4px double #000', minHeight: '260mm' }}>
          <div className="text-center w-full">
            <p className="text-right text-sm font-bold mb-10">Mẫu 2-KNĐ</p>
            <h2 className="text-xl font-bold uppercase mb-2 tracking-widest">ĐẢNG CỘNG SẢN VIỆT NAM</h2>
            <div className="w-20 h-[1px] mx-auto mb-20 bg-black"></div>
            
            <div className="my-20" style={{ marginTop: '80px', marginBottom: '80px' }}>
              <h1 className="text-5xl font-bold mb-6 tracking-tighter">LÝ LỊCH</h1>
              <h2 className="text-2xl font-bold uppercase tracking-widest">CỦA NGƯỜI XIN VÀO ĐẢNG</h2>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto space-y-8 mb-20 text-left" style={{ marginBottom: '80px' }}>
            {renderDottedLine("Họ và tên khai sinh", basicInfo.fullName?.toUpperCase())}
            {renderDottedLine("Họ và tên thường dùng", basicInfo.aliases)}
            {renderDottedLine("Ngày sinh", safeFormatDate(basicInfo.dob))}
            {renderDottedLine("Quê quán", basicInfo.hometown)}
          </div>

          <div className="w-full text-right pr-10 mb-10">
            <div className="inline-block w-64 ml-auto text-left">
              {renderDottedLine("Số lý lịch", "")}
            </div>
          </div>
        </div>
      </PageWrapper>

      {/* Page 2: Instructions 1 */}
      <PageWrapper pageNum={2} showPageNum={false}>
        <h2 className="text-lg font-bold uppercase text-center mb-4">QUY ĐỊNH VỀ VIỆC VIẾT ĐƠN XIN VÀO ĐẢNG,<br/>KHAI VÀ CHỨNG NHẬN LÝ LỊCH CỦA NGƯỜI XIN VÀO ĐẢNG</h2>
        <div className="text-justify space-y-2">
          <p className="font-bold">I. Đơn xin vào Đảng</p>
          <p>Người vào Đảng phải tự làm đơn, trình bày rõ những nhận thức của mình về mục đích, lý tưởng của Đảng, về động cơ xin vào Đảng.</p>
          <p className="font-bold">II. Khai và chứng nhận lý lịch của người xin vào Đảng (Mẫu 2 - KNĐ)</p>
          <p className="font-bold">1. Yêu cầu</p>
          <p>Người vào Đảng phải tự khai lý lịch của người xin vào Đảng, không nhờ người khác viết hộ; khai trung thực, đầy đủ, rõ ràng theo quy định, không tẩy xóa, sửa chữ; không viết cách dòng; nếu có vấn đề nào không hiểu và không nhớ chính xác thì phải báo cáo với chi bộ.</p>
          <p className="font-bold">2. Các nội dung trong lý lịch của người xin vào Đảng</p>
          <p>(1) <b>Họ và tên khai sinh:</b> Ghi đúng họ, chữ đệm và tên ghi trong giấy khai sinh, bằng chữ in hoa, ví dụ: NGUYỄN VĂN HÙNG.</p>
          <p>(2) <b>Các tên gọi khác:</b> Ghi tên gọi khác hoặc bí danh (nếu có), ghi đầy đủ bằng chữ in thường.</p>
          <p>(3) <b>Sinh ngày ... tháng ... năm ...:</b> Ghi đúng ngày, tháng, năm sinh trong giấy khai sinh.</p>
          <p>(4) <b>Giới tính (nam, nữ):</b> Ghi rõ là nam hoặc nữ.</p>
          <p>(5) <b>Nơi đăng ký khai sinh:</b> Ghi đầy đủ địa danh hành chính như trong giấy khai sinh. Ghi rõ xã (phường, thị trấn), huyện (quận, thị xã, thành phố trực thuộc thành phố, thành phố trực thuộc tỉnh), tỉnh (thành phố trực thuộc Trung ương).</p>
          <p><b>Trường hợp địa danh hành chính có sự thay đổi thì ghi tên địa danh hành chính mới đã được thay đổi và ghi chú (tên cũ) theo địa danh hành chính trước đây.</b></p>
          <p>(6) <b>Quê quán:</b> Ghi đầy đủ địa danh hành chính như trong giấy khai sinh. Trường hợp không biết rõ cha, mẹ đẻ thì ghi theo quê quán của người trực tiếp nuôi dưỡng mình từ nhỏ. <b>Ghi như cách ghi ở mục 5.</b></p>
          <p>(7) <b>Nơi cư trú:</b></p>
          <p>- Nơi thường trú: Ghi đầy đủ số nhà, thôn (xóm, làng, ấp, bản, buôn, phun, sóc), xã (đặc khu), tỉnh, thành phố; số nhà, đường phố, tổ dân phố, phường (đặc khu), tỉnh, thành phố.</p>
          <p>- Nơi tạm trú: trường hợp không có nơi đăng ký thường trú, thì ghi theo nơi đăng ký tạm trú; ghi như cách ghi nơi thường trú. Trường hợp cư trú ở nước ngoài thì ghi theo địa chỉ thường trú hoặc tạm trú ở nước ngoài.</p>
          <p>(8) <b>Dân tộc:</b> Ghi tên dân tộc gốc của bản thân như: Kinh, Thái, Tày, Nùng, Mường... (nếu là con lai người nước ngoài thì ghi rõ quốc tịch, dân tộc</p>
        </div>
      </PageWrapper>

      {/* Page 3: Instructions 2 */}
      <PageWrapper pageNum={3} showPageNum={false}>
        <div className="text-justify space-y-2">
          <p>của bố, mẹ là người nước ngoài).</p>
          <p>(9) <b>Tôn giáo:</b> Theo tôn giáo nào thì ghi rõ (ví dụ: đạo Phật, Công giáo, đạo Hồi, đạo Cao Đài, đạo Hòa Hảo... ghi cả chức sắc trong tôn giáo - nếu có), nếu không theo tôn giáo nào thì ghi chữ “không”.</p>
          <p>(10) <b>Nghề nghiệp hiện nay:</b> Ghi rõ công việc chính đang làm theo hợp đồng lao động hoặc quyết định, tuyển dụng, phân công, bổ nhiệm... Ví dụ: công nhân, nông dân, công chức, viên chức, bác sỹ ngoại khoa, bộ đội, nhà văn, nhà báo, chủ doanh nghiệp, học sinh, sinh viên hoặc chưa có việc làm.</p>
          <p>(11) <b>Trình độ hiện nay:</b></p>
          <p>- Giáo dục phổ thông: Ghi rõ đã học xong lớp mấy, hay tốt nghiệp hệ 10 năm, 12 năm, học phổ thông hay bổ túc văn hóa. Ví dụ: 8/10 phổ thông, 9/12 bổ túc; tốt nghiệp trung học phổ thông hệ 12 năm.</p>
          <p>- Chuyên môn, nghiệp vụ: Đã được đào tạo về chuyên môn, nghiệp vụ gì thì ghi theo chứng chỉ, văn bằng đã được cấp, ví dụ: công nhân kỹ thuật bậc 3, trung cấp thú y, cử nhân luật, kỹ sư cơ khí, bác sỹ ngoại khoa...</p>
          <p>- Khoa học công nghệ: Ghi văn bằng, chứng chỉ về lĩnh vực khoa học công nghệ, đổi mới sáng tạo, chuyển đổi số đã được cấp.</p>
          <p>- Học vị cao nhất: Ghi rõ học vị cao nhất là Tiến sĩ Khoa học, Tiến sĩ, Thạc sĩ, Cử nhân, Kỹ sư và chuyên ngành đào tạo; nếu cùng chuyên ngành đào tạo chỉ ghi học vị cao nhất.</p>
          <p>- Học hàm cao nhất: Ghi rõ chức danh cao nhất được Nhà nước phong (Giáo sư, Phó Giáo sư…).</p>
          <p>- Lý luận chính trị: Ghi theo chứng chỉ, văn bằng cao nhất đã được cấp như: sơ cấp, trung cấp, cao cấp, cử nhân; học tập trung hay không tập trung.</p>
          <p>- Ngoại ngữ: Ghi theo văn bằng, chứng chỉ hoặc chứng nhận đã được cấp. Ghi là đại học tiếng Anh, tiếng Pháp, tiếng Nga... (nếu tốt nghiệp đại học chuyên ngành ngoại ngữ); ghi là: Anh, Pháp, Nga... trình độ A, B, C, D (đối với hệ bồi dưỡng ngoại ngữ). Ghi là IELTS, TOELF, TOEIC… hoặc khung A1, A2, B1, B2, C1, C2 Châu Âu (đối với chứng chỉ ngoại ngữ do các tổ chức quốc tế cấp).</p>
          <p>- Tin học: Ghi trình độ tin học cao nhất theo văn bằng, chứng chỉ đã được cấp. Ghi là đại học (nếu tốt nghiệp đại học chuyên ngành tin học); ghi theo chứng chỉ, chứng nhận đã được cấp đối với hệ bồi dưỡng tin học (tin học văn phòng; tin học trình độ A, B, C...).</p>
          <p>- Tiếng dân tộc thiểu số: Ghi tiếng dân tộc thiểu số đã được cấp chứng chỉ hoặc nói được thành thạo tiếng dân tộc thiểu số nào thì ghi rõ tên dân tộc thiểu số đó.</p>
          <p>(12) <b>Ngày và nơi kết nạp vào Đoàn Thanh niên Cộng sản Hồ Chí Minh:</b> Ghi rõ ngày, tháng, năm và nơi kết nạp vào Đoàn (chi đoàn, đoàn cơ</p>
        </div>
      </PageWrapper>

      {/* Page 4: Instructions 3 */}
      <PageWrapper pageNum={4} showPageNum={false}>
        <div className="text-justify space-y-2">
          <p>sở, đoàn cấp trên trực tiếp cơ sở, đoàn cấp tỉnh).</p>
          <p>(13) <b>Đối với người xin được kết nạp lại vào Đảng:</b></p>
          <p>- Ngày và nơi kết nạp vào Đảng Cộng sản Việt Nam lần thứ nhất: Ghi rõ ngày, tháng, năm và nơi kết nạp vào Đảng (chi bộ, đảng bộ cơ sở, đảng bộ cấp trên trực tiếp của tổ chức cơ sở đảng, đảng bộ trực thuộc Trung ương).</p>
          <p>- Ngày và nơi công nhận chính thức lần thứ nhất: Ghi rõ ngày, tháng, năm và nơi được công nhận chính thức (chi bộ, đảng bộ cơ sở, đảng bộ cấp trên trực tiếp của tổ chức cơ sở đảng, đảng bộ trực thuộc Trung ương).</p>
          <p>- Người giới thiệu vào Đảng lần thứ nhất: Ghi rõ họ, tên, chức vụ, đơn vị công tác của từng người tại thời điểm giới thiệu mình vào Đảng, nếu ban chấp hành đoàn cơ sở hoặc tập thể chi đoàn cơ sở giới thiệu thì ghi rõ tên tổ chức đoàn thanh niên cơ sở và đoàn thanh niên cấp trên trực tiếp (nếu ban chấp hành công đoàn cơ sở giới thiệu thì cũng ghi nội dung tương tự).</p>
          <p>(14) <b>Lịch sử bản thân:</b> Tóm tắt quá trình từ thời niên thiếu cho đến ngày tham gia hoạt động xã hội (như ngày vào Đoàn thanh niên, ngày nhập ngũ, ngày vào học ở các trường đại học, cao đẳng, trung học chuyên nghiệp hoặc ngày tham gia hoạt động trong các tổ chức kinh tế, xã hội...).</p>
          <p>Ví dụ, người xin vào Đảng sinh năm 1985, khai lịch sử bản thân: Từ tháng 9-1991 đến tháng 8-2000 học Tiểu học và Trung học cơ sở tại Trường Vân Hồ, Quận Hai Bà Trưng. Từ tháng 9-2000 đến tháng 6-2003 học Trung học phổ thông tại Trường Trần Nhân Tông, Quận Hai Bà Trưng. Được kết nạp vào Đoàn Thanh niên Cộng sản Hồ Chí Minh ngày 26-3-2001.</p>
          <p>(15) <b>Những công việc, chức vụ đã qua:</b> Ghi đầy đủ, rõ ràng, liên tục (theo tháng) từ khi tham gia hoạt động xã hội; đi làm; đi học đến nay, từng thời gian làm việc gì? Ở đâu? Giữ chức vụ gì về Đảng, chính quyền, trong lực lượng vũ trang, các đoàn thể, các tổ chức văn hóa, giáo dục, khoa học, xã hội... thời gian nhập ngũ, xuất ngũ, tái ngũ, đi học, đi chữa bệnh, bị gián đoạn liên lạc...</p>
          <p>(16) <b>Đặc điểm lịch sử:</b> Ghi rõ lý do bị gián đoạn hoặc không sinh hoạt đảng (nếu có); có bị bắt, bị tù không (do chính quyền nào, từ ngày tháng năm nào đến ngày tháng năm nào, ở đâu). Có tham gia hoặc có quan hệ với các tổ chức chính trị, kinh tế, xã hội nào ở nước ngoài (làm gì, tổ chức nào, trụ sở của tổ chức đặt ở đâu?). Đã tham gia các chức sắc gì trong các tôn giáo.</p>
          <p>(17) <b>Những lớp đào tạo, bồi dưỡng đã qua:</b> Ghi rõ đã học những lớp lý luận chính trị hay chuyên môn, nghiệp vụ nào, theo chương trình gì;</p>
        </div>
      </PageWrapper>

      {/* Page 5: Instructions 4 */}
      <PageWrapper pageNum={5} showPageNum={false}>
        <div className="text-justify space-y-2">
          <p>cấp nào mở, tên trường, thời gian học, ở đâu; học chính quy hay tại chức; tên văn bằng hoặc chứng chỉ được cấp.</p>
          <p>(18) <b>Đi nước ngoài:</b> Ghi rõ thời gian từ tháng năm nào đến tháng năm nào, đi nước nào; cơ quan, đơn vị, tổ chức nào quyết định (chỉ ghi các trường hợp đi học tập, lao động hợp tác, công tác...<b>từ 3 tháng trở lên</b>).</p>
          <p>(19) <b>Khen thưởng:</b> Ghi rõ tháng năm, hình thức được khen thưởng <b>từ bằng khen trở lên</b> hoặc hình thức khen thưởng cao nhất, cấp nào quyết định; các danh hiệu được Nhà nước phong tặng: Anh hùng lao động, Anh hùng lực lượng vũ trang, Thầy thuốc nhân dân, Nhà giáo nhân dân, Nghệ sỹ nhân dân, Nghệ nhân nhân dân, Thầy thuốc ưu tú, Nhà giáo ưu tú, Nghệ sỹ ưu tú, Nghệ nhân ưu tú...</p>
          <p>(20) <b>Kỷ luật:</b> Ghi rõ tháng năm, lý do sai phạm, hình thức kỷ luật (kỷ luật đảng, chính quyền, đoàn thể từ khiển trách trở lên), cấp nào quyết định; kê khai thông tin bị xem xét kỷ luật nhưng không bị kỷ luật hoặc không bị kỷ luật do hết thời hiệu.</p>
          <p>(21) <b>Hoàn cảnh gia đình:</b> Ghi rõ những người chủ yếu trong gia đình như:</p>
          <p>- Đối với ông, bà, nội ngoại của bản thân, của vợ (hoặc chồng): Ghi rõ họ tên, năm sinh, quê quán, nơi cư trú, nghề nghiệp, tôn giáo, dân tộc, quốc tịch, vấn đề liên quan đến tiêu chuẩn chính trị của từng người theo Quy định của Bộ Chính trị và Hướng dẫn của Ban Tổ chức Trung ương về bảo vệ chính trị nội bộ Đảng.</p>
          <p>- Cha, mẹ đẻ (hoặc người nuôi dưỡng trực tiếp từ nhỏ); cha, mẹ vợ (hoặc cha, mẹ chồng); vợ (hoặc chồng). Ghi rõ: họ và tên, năm sinh, nơi sinh, quê quán; nơi cư trú, nghề nghiệp, tôn giáo, dân tộc, quốc tịch, thành phần giai cấp, vấn đề liên quan đến tiêu chuẩn chính trị của từng người theo Quy định của Bộ Chính trị và Hướng dẫn của Ban Tổ chức Trung ương về bảo vệ chính trị nội bộ Đảng; việc chấp hành đường lối, chủ trương của Đảng, chính sách, pháp luật của Nhà nước.</p>
          <p>+ Về thành phần giai cấp: ghi rõ thành phần giai cấp trước cách mạng tháng Tám năm 1945, trong cải cách ruộng đất năm 1954 (ở miền Bắc) hoặc trong cải tạo công, nông, thương nghiệp năm 1976 ở các tỉnh, thành phố phía Nam từ Quảng Trị trở vào như: cố nông, bần nông, trung nông, phú nông, địa chủ, công chức, viên chức, dân nghèo, tiểu thương, tiểu chủ, tiểu tư sản, tư sản... (nếu có sự thay đổi thành phần giai cấp cần ghi rõ lý do). Nếu thành phần gia đình không được quy định ở các thời điểm nêu trên và hiện nay thì bỏ trống mục này.</p>
          <p>+ Về lịch sử chính trị của từng người: Ghi rõ đã tham gia tổ chức cách mạng; làm công tác gì, giữ chức vụ gì? Tham gia hoạt động và giữ chức vụ gì trong tổ chức chính quyền, đoàn thể, đảng phái nào… của</p>
        </div>
      </PageWrapper>

      {/* Page 6: Instructions 5 */}
      <PageWrapper pageNum={6} showPageNum={false}>
        <div className="text-justify space-y-2">
          <p>đế quốc hoặc chế độ cũ; hiện nay, những người đó làm gì? Ở đâu? Nếu đã chết thì ghi rõ lý do chết, năm nào? Tại đâu?</p>
          <p>- Anh chị em ruột của bản thân, của vợ (hoặc chồng); các con bao gồm con đẻ, con nuôi có đăng ký hợp pháp: Ghi rõ họ tên, năm sinh, quốc tịch, nơi cư trú, nghề nghiệp, hoàn cảnh, kinh tế, việc chấp hành đường lối, chủ trương của Đảng, chính sách, pháp luật của Nhà nước, tiền án (nếu có) của từng người.</p>
          <p>(22) <b>Tự nhận xét:</b> Ghi những ưu, khuyết điểm chính của bản thân về các mặt phẩm chất chính trị, đạo đức lối sống, năng lực công tác và quan hệ quần chúng; sự tín nhiệm của quần chúng và đảng viên ở đơn vị công tác, làm việc đối với bản thân như thế nào?</p>
          <p>(23) <b>Cam đoan và ký tên:</b> Ghi rõ “Tôi cam đoan đã khai đầy đủ, rõ ràng, trung thực và chịu trách nhiệm trước Đảng về những nội dung đã khai trong lý lịch”; ngày, tháng, năm, ký và ghi rõ họ tên.</p>
          <p><u>Lưu ý:</u> Chi bộ, cấp ủy cơ sở chưa nhận xét, chưa chứng nhận, ký tên, đóng dấu vào lý lịch mà chỉ đóng dấu giáp lai vào tất cả các trang và ảnh trong lý lịch của người xin vào Đảng; gửi công văn đề nghị thẩm tra hoặc cử đảng viên đi thẩm tra lý lịch. Không được cử người vào Đảng hoặc người thân (bố, mẹ, vợ, chồng, anh, chị, em ruột, con đẻ, con nuôi có đăng ký hợp pháp) của người vào Đảng đi thẩm tra lý lịch.</p>
          <p>(24) <b>Nhận xét của cấp ủy, tổ chức đảng nơi đến thẩm tra lý lịch của người xin vào Đảng:</b></p>
          <p>- Nhận xét của chi ủy, chi bộ; ban thường vụ hoặc của ban chấp hành đảng bộ cơ sở nơi đến thẩm tra:</p>
          <p>Viết những nội dung cần thiết về lý lịch của người xin vào Đảng do cấp ủy nơi có người xin vào Đảng yêu cầu đã đúng, hay chưa đúng hoặc chưa đủ với nội dung người xin vào Đảng đã khai trong lý lịch; tập thể cấp ủy hoặc ban thường vụ cấp ủy thống nhất nội dung ghi vào mục “Nhận xét của cấp ủy, tổ chức đảng...” ở phần cuối bản “Lý lịch của người xin vào Đảng”. Người thay mặt cấp ủy xác nhận, ký tên, ghi rõ chức vụ, đóng dấu của cấp ủy.</p>
          <p>- Nhận xét của cơ quan tham mưu về công tác tổ chức hoặc của thường trực cấp ủy cấp trên trực tiếp của tổ chức cơ sở đảng (nếu có):</p>
          <p>Viết những nội dung cần thiết về lý lịch của người xin vào Đảng do cấp ủy nơi có người xin vào Đảng yêu cầu đã đúng, hay chưa đúng hoặc chưa đủ với nội dung người xin vào Đảng đã khai trong lý lịch; tập thể thường trực cấp ủy hoặc lãnh đạo cơ quan tham mưu về công tác tổ chức cấp ủy thống nhất nội dung ghi vào mục “Nhận xét của cấp ủy, tổ chức đảng...” ở phần cuối bản “Lý lịch của người xin vào Đảng”. Người thay</p>
        </div>
      </PageWrapper>

      {/* Page 7: Instructions 6 */}
      <PageWrapper pageNum={7} showPageNum={false}>
        <div className="text-justify space-y-2">
          <p>mặt thường trực cấp ủy hoặc lãnh đạo cơ quan tham mưu về công tác tổ chức xác nhận, ký tên, ghi rõ chức vụ, đóng dấu của cấp ủy hoặc cơ quan tham mưu về công tác tổ chức.</p>
          <p>(25) <b>Nhận xét của chi ủy hoặc của chi bộ (nơi không có chi ủy):</b></p>
          <p>Sau khi có kết quả thẩm tra, xác minh lý lịch của người xin vào Đảng, chi bộ nhận xét, bí thư hoặc phó bí thư ghi rõ bản lý lịch đã khai đúng sự thật chưa? Không đúng ở điểm nào? Có vấn đề về lịch sử chính trị và chính trị hiện nay không? Quan điểm, lập trường, phẩm chất đạo đức, lối sống và quan hệ quần chúng... của người xin vào Đảng?</p>
          <p>(26) <b>Chứng nhận của cấp ủy cơ sở hoặc cấp ủy cấp trên trực tiếp của tổ chức cơ sở đảng (nơi không có đảng ủy cơ sở):</b></p>
          <p>Cấp ủy cơ sở thẩm định lại kết quả thẩm tra, xác minh và làm rõ những vấn đề chưa rõ hoặc còn nghi vấn trong nội dung lý lịch của người xin vào Đảng. <b>Nếu người xin vào Đảng có vấn đề cần xem xét về chính trị (bao gồm cả lịch sử chính trị và chính trị hiện nay) thì phải được cấp ủy có thẩm quyền kết luận theo Quy định của Bộ Chính trị, Hướng dẫn của Ban Tổ chức Trung ương về bảo vệ chính trị nội bộ Đảng (trước khi xem xét, quyết định kết nạp vào Đảng).</b></p>
          <p>Sau khi tập thể cấp ủy cơ sở, xem xét, kết luận thì đồng chí bí thư hoặc phó bí thư (được ủy quyền hoặc phân công) cấp ủy ghi rõ: <b>“chứng nhận lý lịch của quần chúng... khai tại đảng bộ (hoặc chi bộ) cơ sở... là đúng sự thật; không (hoặc có) vấn đề về lịch sử chính trị và chính trị hiện nay của người vào Đảng theo Quy định của Bộ Chính trị; quần chúng... đủ (hoặc không đủ) điều kiện để xem xét kết nạp vào Đảng”</b>; ghi rõ ngày, tháng, năm, chức vụ, ký tên, họ và tên, đóng dấu của cấp ủy cơ sở. Trường hợp cấp ủy cơ sở chưa có con dấu, thì cấp ủy cấp trên trực tiếp xác nhận chữ ký của bí thư cấp ủy cơ sở, viết rõ chức vụ, ký tên, đóng dấu của cấp ủy..</p>
        </div>
      </PageWrapper>

      {/* Page 8: Sơ lược lý lịch */}
      <PageWrapper pageNum={8}>
        <table className="w-full mb-10" style={{ borderCollapse: 'collapse', border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ width: '3cm', border: 'none', padding: 0, verticalAlign: 'top' }}>
                <div className="w-[3cm] h-[4cm] border border-black flex items-center justify-center text-xs text-center" style={{ width: '3cm', height: '4cm', border: '1px solid black', display: 'table-cell', verticalAlign: 'middle' }}>
                  {basicInfo.profilePhotoUrl ? (
                    <img src={basicInfo.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                  ) : (
                    "Ảnh (3x4)"
                  )}
                </div>
              </td>
              <td style={{ border: 'none', padding: 0, verticalAlign: 'top', textAlign: 'right' }}>
                <h2 className="text-2xl font-bold uppercase mt-10" style={{ marginTop: '40px' }}>SƠ LƯỢC LÝ LỊCH</h2>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="space-y-2">
          {renderDottedLine("(1) Họ và tên khai sinh", basicInfo.fullName?.toUpperCase())}
          {renderDottedLine("(2) Các tên gọi khác", basicInfo.aliases)}
          <table className="w-full mb-1" style={{ borderCollapse: 'collapse', border: 'none' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', border: 'none', padding: '0 8px 0 0', verticalAlign: 'bottom' }}>
                  {renderDottedLine("(3) Sinh ngày", safeFormatDate(basicInfo.dob))}
                </td>
                <td style={{ width: '50%', border: 'none', padding: '0 0 0 8px', verticalAlign: 'bottom' }}>
                  {renderDottedLine("Số căn cước", basicInfo.cccd)}
                </td>
              </tr>
            </tbody>
          </table>
          {renderDottedLine("(4) Giới tính (nam, nữ)", basicInfo.gender)}
          {renderDottedLine("(5) Nơi đăng ký khai sinh", basicInfo.birthplace)}
          {renderDottedLine("(6) Quê quán", basicInfo.hometown)}
          
          <div className="mt-4">
            <p className="font-medium mb-1">(7) Nơi cư trú:</p>
            {renderDottedLine("- Nơi thường trú", basicInfo.permanentAddress, "pl-4")}
            {renderDottedLine("- Nơi tạm trú", basicInfo.temporaryAddress, "pl-4")}
          </div>

          <table className="w-full mb-1" style={{ borderCollapse: 'collapse', border: 'none' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', border: 'none', padding: '0 8px 0 0', verticalAlign: 'bottom' }}>
                  {renderDottedLine("(8) Dân tộc", basicInfo.ethnicity)}
                </td>
                <td style={{ width: '50%', border: 'none', padding: '0 0 0 8px', verticalAlign: 'bottom' }}>
                  {renderDottedLine("Quốc tịch", basicInfo.nationality)}
                </td>
              </tr>
            </tbody>
          </table>
          {renderDottedLine("(9) Tôn giáo", basicInfo.religion)}
          
          <div className="mt-4">
            <p className="font-medium mb-1">(10) Nghề nghiệp hiện nay:</p>
            {renderDottedLine("- Giáo dục phổ thông", basicInfo.generalEducation, "pl-4")}
            {renderDottedLine("- Chuyên môn nghiệp vụ", basicInfo.professionalExpertise, "pl-4")}
            {renderDottedLine("- Khoa học công nghệ", basicInfo.scienceTech, "pl-4")}
            {renderDottedLine("- Học vị cao nhất", basicInfo.highestDegree, "pl-4")}
            {renderDottedLine("- Học hàm cao nhất", basicInfo.highestTitle, "pl-4")}
            {renderDottedLine("- Lý luận chính trị", basicInfo.politicalTheory, "pl-4")}
            {renderDottedLine("- Ngoại ngữ", basicInfo.foreignLanguage, "pl-4")}
            {renderDottedLine("- Tin học", basicInfo.itSkill, "pl-4")}
            {renderDottedLine("- Tiếng dân tộc thiểu số", basicInfo.minorityLanguage, "pl-4")}
          </div>

          {renderDottedLine("(12) Ngày và nơi kết nạp vào Đoàn TNCSHCM", `${basicInfo.youthUnionJoinDate || ''} - ${basicInfo.youthUnionJoinPlace || ''}`)}
          
          <div className="mt-4">
            <p className="font-medium mb-1">(13) Đối với người xin được kết nạp lại vào Đảng:</p>
            {renderDottedLine("- Ngày và nơi kết nạp vào Đảng CSVN lần thứ nhất", basicInfo.firstAdmissionDate, "pl-4")}
            {renderDottedLine("- Ngày và nơi công nhận chính thức lần thứ nhất", basicInfo.firstOfficialDate, "pl-4")}
            {renderDottedLine("- Người giới thiệu vào Đảng lần thứ nhất", basicInfo.firstIntroducer, "pl-4")}
          </div>
        </div>
      </PageWrapper>

      {/* Page 9: Lịch sử bản thân 1 */}
      <PageWrapper pageNum={9}>
        <h2 className="text-lg font-bold uppercase text-center mb-6">(14) LỊCH SỬ BẢN THÂN</h2>
        <div className="whitespace-pre-wrap text-justify leading-loose">
          {history?.map((h: any, i: number) => (
            <p key={i} className="mb-2">
              <span className="font-bold">{h.timeRange}:</span> {h.description}
            </p>
          ))}
          {personalHistory.currentResidence && (
            <p className="mt-4">
              <span className="font-bold">Hiện đang cư trú/tạm trú tại:</span> {personalHistory.currentResidence}
            </p>
          )}
          {renderEmptyLines(20)}
        </div>
      </PageWrapper>

      {/* Page 10: Lịch sử bản thân 2 */}
      <PageWrapper pageNum={10}>
        <h2 className="text-lg font-bold uppercase text-center mb-6">LỊCH SỬ BẢN THÂN</h2>
        <div className="whitespace-pre-wrap text-justify leading-loose">
          {renderEmptyLines(25)}
        </div>
      </PageWrapper>

      {/* Page 11: Những công việc, chức vụ đã qua 1 */}
      <PageWrapper pageNum={11}>
        <h2 className="text-lg font-bold uppercase text-center mb-6">(15) NHỮNG CÔNG VIỆC, CHỨC VỤ ĐÃ QUA</h2>
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr>
              <th className="border border-black p-2 w-1/4">Từ tháng, năm<br/>đến tháng, năm</th>
              <th className="border border-black p-2">Làm việc gì, ở đâu</th>
              <th className="border border-black p-2 w-1/4">Chức vụ</th>
            </tr>
          </thead>
          <tbody>
            {jobHistory?.slice(0, 15).map((j: any, i: number) => (
              <tr key={i}>
                <td className="border border-black p-2 text-center">{j.startDate} - {j.endDate}</td>
                <td className="border border-black p-2">{j.description}</td>
                <td className="border border-black p-2 text-center">{j.position}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 15 - (jobHistory?.slice(0, 15).length || 0)) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageWrapper>

      {/* Page 12: Những công việc, chức vụ đã qua 2 */}
      <PageWrapper pageNum={12}>
        <h2 className="text-lg font-bold uppercase text-center mb-6">NHỮNG CÔNG VIỆC, CHỨC VỤ ĐÃ QUA</h2>
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr>
              <th className="border border-black p-2 w-1/4">Từ tháng, năm<br/>đến tháng, năm</th>
              <th className="border border-black p-2">Làm việc gì, ở đâu</th>
              <th className="border border-black p-2 w-1/4">Chức vụ</th>
            </tr>
          </thead>
          <tbody>
            {jobHistory?.slice(15, 30).map((j: any, i: number) => (
              <tr key={i}>
                <td className="border border-black p-2 text-center">{j.startDate} - {j.endDate}</td>
                <td className="border border-black p-2">{j.description}</td>
                <td className="border border-black p-2 text-center">{j.position}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 15 - (jobHistory?.slice(15, 30).length || 0)) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageWrapper>

      {/* Page 13: Những công việc, chức vụ đã qua 3 */}
      <PageWrapper pageNum={13}>
        <h2 className="text-lg font-bold uppercase text-center mb-6">NHỮNG CÔNG VIỆC, CHỨC VỤ ĐÃ QUA</h2>
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr>
              <th className="border border-black p-2 w-1/4">Từ tháng, năm<br/>đến tháng, năm</th>
              <th className="border border-black p-2">Làm việc gì, ở đâu</th>
              <th className="border border-black p-2 w-1/4">Chức vụ</th>
            </tr>
          </thead>
          <tbody>
            {jobHistory?.slice(30, 45).map((j: any, i: number) => (
              <tr key={i}>
                <td className="border border-black p-2 text-center">{j.startDate} - {j.endDate}</td>
                <td className="border border-black p-2">{j.description}</td>
                <td className="border border-black p-2 text-center">{j.position}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 15 - (jobHistory?.slice(30, 45).length || 0)) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageWrapper>

      {/* Page 14: Đặc điểm lịch sử */}
      <PageWrapper pageNum={14}>
        <h2 className="text-lg font-bold uppercase text-center mb-6">(16) ĐẶC ĐIỂM LỊCH SỬ</h2>
        <div className="whitespace-pre-wrap text-justify leading-loose">
          {otherInfo.historicalCharacteristics || ""}
          {renderEmptyLines(25)}
        </div>
      </PageWrapper>

      {/* Page 15: Đào tạo & Đi nước ngoài */}
      <PageWrapper pageNum={15}>
        <h2 className="text-lg font-bold uppercase text-center mb-6">(17) NHỮNG LỚP ĐÀO TẠO, BỒI DƯỠNG ĐÃ QUA</h2>
        <table className="w-full border-collapse border border-black text-xs mb-10">
          <thead>
            <tr>
              <th className="border border-black p-1">Từ tháng,<br/>năm đến<br/>tháng,<br/>năm</th>
              <th className="border border-black p-1">Ngành học hoặc<br/>tên lớp học</th>
              <th className="border border-black p-1">Tên trường,<br/>cấp phụ trách</th>
              <th className="border border-black p-1">Hình thức<br/>học</th>
              <th className="border border-black p-1">Văn bằng,<br/>chứng chỉ,<br/>trình độ gì</th>
            </tr>
          </thead>
          <tbody>
            {conditions.trainingClasses?.map((t: any, i: number) => (
              <tr key={i}>
                <td className="border border-black p-1 text-center">{t.startDate} - {t.endDate}</td>
                <td className="border border-black p-1">{t.name}</td>
                <td className="border border-black p-1">{t.schoolName}</td>
                <td className="border border-black p-1 text-center">{t.type}</td>
                <td className="border border-black p-1 text-center">{t.certificate}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 6 - (conditions.trainingClasses?.length || 0)) }).map((_, i) => (
              <tr key={`empty-t-${i}`}>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="text-lg font-bold uppercase text-center mb-6">(18) ĐI NƯỚC NGOÀI</h2>
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr>
              <th className="border border-black p-1">Từ tháng,<br/>năm đến<br/>tháng năm</th>
              <th className="border border-black p-1">Nội dung đi</th>
              <th className="border border-black p-1">Nước nào</th>
              <th className="border border-black p-1">Cơ quan, đơn vị, tổ<br/>chức quyết định</th>
            </tr>
          </thead>
          <tbody>
            {otherInfo.abroadTrips?.map((a: any, i: number) => (
              <tr key={i}>
                <td className="border border-black p-1 text-center">{a.timeRange}</td>
                <td className="border border-black p-1">{a.content}</td>
                <td className="border border-black p-1 text-center">{a.country}</td>
                <td className="border border-black p-1 text-center">{a.decisionMaker}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 6 - (otherInfo.abroadTrips?.length || 0)) }).map((_, i) => (
              <tr key={`empty-a-${i}`}>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageWrapper>

      {/* Page 16: Khen thưởng & Kỷ luật */}
      <PageWrapper pageNum={16}>
        <h2 className="text-lg font-bold uppercase text-center mb-6">(19) KHEN THƯỞNG</h2>
        <table className="w-full border-collapse border border-black text-sm mb-10">
          <thead>
            <tr>
              <th className="border border-black p-2 w-1/4">Tháng,<br/>năm</th>
              <th className="border border-black p-2">Lý do, hình thức</th>
              <th className="border border-black p-2 w-1/4">Cấp quyết định</th>
            </tr>
          </thead>
          <tbody>
            {otherInfo.rewards?.map((r: any, i: number) => (
              <tr key={i}>
                <td className="border border-black p-2 text-center">{r.date}</td>
                <td className="border border-black p-2">{r.content}</td>
                <td className="border border-black p-2 text-center">{r.level}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 8 - (otherInfo.rewards?.length || 0)) }).map((_, i) => (
              <tr key={`empty-r-${i}`}>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="text-lg font-bold uppercase text-center mb-6">(20) KỶ LUẬT</h2>
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr>
              <th className="border border-black p-2 w-1/4">Tháng,<br/>năm</th>
              <th className="border border-black p-2">Lý do, hình thức</th>
              <th className="border border-black p-2 w-1/4">Cấp quyết định</th>
            </tr>
          </thead>
          <tbody>
            {otherInfo.disciplines?.map((d: any, i: number) => (
              <tr key={i}>
                <td className="border border-black p-2 text-center">{d.date}</td>
                <td className="border border-black p-2">{d.content}</td>
                <td className="border border-black p-2 text-center">{d.level}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 6 - (otherInfo.disciplines?.length || 0)) }).map((_, i) => (
              <tr key={`empty-d-${i}`}>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
                <td className="border border-black p-4"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageWrapper>

      {/* Page 17-40: Hoàn cảnh gia đình */}
      {Array.from({ length: 24 }).map((_, pageIndex) => {
        const pageNum = 17 + pageIndex;
        return (
          <PageWrapper key={`family-page-${pageNum}`} pageNum={pageNum}>
            <h2 className="text-lg font-bold uppercase text-center mb-6">
              {pageIndex === 0 ? "(21) HOÀN CẢNH GIA ĐÌNH" : "HOÀN CẢNH GIA ĐÌNH"}
            </h2>
            <div className="space-y-6 text-sm">
              {pageIndex === 0 ? (
                <>
                  {familyHistory.map((member: any, index: number) => (
                    <div key={index} className="pb-4 border-b border-gray-300">
                      <p className="font-bold mb-2 uppercase">{member.relation}: {member.fullName}</p>
                      <table className="w-full mb-2" style={{ borderCollapse: 'collapse', border: 'none' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '50%', border: 'none', padding: '2px 8px 2px 0', verticalAlign: 'top' }}>
                              <p><span>Năm sinh:</span> {member.birthYear}</p>
                              <p><span>Nơi cư trú:</span> {member.permanentAddress}</p>
                              <p><span>Dân tộc:</span> {member.ethnicity}</p>
                            </td>
                            <td style={{ width: '50%', border: 'none', padding: '2px 0 2px 8px', verticalAlign: 'top' }}>
                              <p><span>Quê quán:</span> {member.hometown}</p>
                              <p><span>Nghề nghiệp:</span> {member.job}</p>
                              <p><span>Tôn giáo:</span> {member.religion}</p>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={2} style={{ border: 'none', padding: '2px 0', verticalAlign: 'top' }}>
                              <p><span>Thái độ chính trị:</span> {member.politicalAttitude}</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      {member.history && member.history.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold text-xs">Quá trình công tác:</p>
                          <ul className="list-disc pl-5 text-xs">
                            {member.history.map((h: any, hi: number) => (
                              <li key={hi}>{h.timeRange}: {h.description}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                  {renderEmptyLines(Math.max(0, 25 - familyHistory.length * 5))}
                </>
              ) : (
                renderEmptyLines(25)
              )}
            </div>
          </PageWrapper>
        );
      })}

      {/* Page 41: Tự nhận xét & Cam đoan */}
      <PageWrapper pageNum={41}>
        <h2 className="text-lg font-bold uppercase text-center mb-6">(22) TỰ NHẬN XÉT</h2>
        <p className="text-center italic mb-4">(Ghi theo hướng dẫn ở mục 22)</p>
        <div className="whitespace-pre-wrap text-justify leading-loose mb-10">
          {selfAssessment.selfAssessment || ""}
          {renderEmptyLines(8)}
        </div>

        <h2 className="text-lg font-bold uppercase text-center mb-6">(23) CAM ĐOAN VÀ KÝ TÊN</h2>
        <p className="text-center italic mb-4">(Ghi theo hướng dẫn tại mục 23)</p>
        <div className="text-justify leading-loose mb-10">
          Tôi cam đoan đã khai đầy đủ, rõ ràng, trung thực và chịu trách nhiệm trước Đảng về những nội dung đã khai trong lý lịch.
          {renderEmptyLines(4)}
        </div>

        <div className="mt-10 text-right pr-10" style={{ marginTop: '40px', textAlign: 'right', paddingRight: '40px' }}>
          <p className="italic mb-2">............, ngày {format(new Date(), 'dd')} tháng {format(new Date(), 'MM')} năm {format(new Date(), 'yyyy')}</p>
          <p className="font-bold uppercase mr-12" style={{ marginRight: '48px' }}>NGƯỜI KHAI</p>
          <p className="italic text-sm mr-10" style={{ marginRight: '40px' }}>(Ký và ghi rõ họ tên)</p>
          <div className="h-32" style={{ height: '128px' }}></div>
          <p className="font-bold text-xl mr-10" style={{ marginRight: '40px' }}>{basicInfo.fullName?.toUpperCase()}</p>
        </div>
      </PageWrapper>

      {/* Page 42-50: Nhận xét của cấp ủy... */}
      {Array.from({ length: 9 }).map((_, pageIndex) => {
        const pageNum = 42 + pageIndex;
        return (
          <PageWrapper key={`nhan-xet-cap-uy-${pageNum}`} pageNum={pageNum}>
            <h2 className="text-lg font-bold uppercase text-center mb-6">
              {pageIndex === 0 ? "(24) NHẬN XÉT CỦA CẤP ỦY, TỔ CHỨC ĐẢNG NƠI ĐẾN\nTHẨM TRA LÝ LỊCH CỦA NGƯỜI XIN VÀO ĐẢNG" : "NHẬN XÉT CỦA CẤP ỦY, TỔ CHỨC ĐẢNG NƠI ĐẾN THẨM TRA\nLÝ LỊCH CỦA NGƯỜI XIN VÀO ĐẢNG"}
            </h2>
            <div className="space-y-6 text-sm">
              {renderEmptyLines(25)}
            </div>
          </PageWrapper>
        );
      })}

      {/* Page 51: Nhận xét của chi ủy hoặc của chi bộ */}
      <PageWrapper pageNum={51}>
        <h2 className="text-lg font-bold uppercase text-center mb-6">(25) NHẬN XÉT CỦA CHI ỦY HOẶC CỦA CHI BỘ</h2>
        <p className="text-center italic mb-4">(Ghi theo hướng dẫn tại mục 25)</p>
        <div className="space-y-6 text-sm">
          {renderEmptyLines(13)}
        </div>
        <div className="mt-10 text-right pr-10" style={{ marginTop: '40px', textAlign: 'right', paddingRight: '40px' }}>
          <p className="italic mb-2">............, ngày.......tháng.......năm.......</p>
          <p className="font-bold uppercase mr-12" style={{ marginRight: '48px' }}>T/M.......................................</p>
        </div>
      </PageWrapper>

      {/* Page 52: Chứng nhận của cấp ủy cơ sở... */}
      <PageWrapper pageNum={52}>
        <h2 className="text-lg font-bold uppercase text-center mb-6">(26) CHỨNG NHẬN CỦA CẤP ỦY CƠ SỞ HOẶC CẤP ỦY CẤP<br/>TRÊN TRỰC TIẾP CỦA TỔ CHỨC CƠ SỞ ĐẢNG</h2>
        <p className="text-center italic mb-4">(Ghi theo hướng dẫn tại mục 26)</p>
        <div className="space-y-6 text-sm">
          {renderEmptyLines(13)}
        </div>
        <div className="mt-10 text-right pr-10" style={{ marginTop: '40px', textAlign: 'right', paddingRight: '40px' }}>
          <p className="italic mb-2">............, ngày.......tháng.......năm.......</p>
          <p className="font-bold uppercase mr-12" style={{ marginRight: '48px' }}>T/M.......................................</p>
        </div>
      </PageWrapper>
    </div>
  );
};

export default PrintableCV;
