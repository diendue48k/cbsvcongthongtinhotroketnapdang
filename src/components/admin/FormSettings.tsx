import React, { useState } from 'react';
import { useFormConfig, CustomField, DEFAULT_CONFIG } from '../../contexts/FormConfigContext';
import { Save, Plus, Trash2, RotateCcw, Settings, FileText, LayoutList, ListPlus, List, Calendar } from 'lucide-react';

export default function FormSettings() {
  const { config, updateConfig, loading } = useFormConfig();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  
  // Local state to edit before saving
  const [templates, setTemplates] = useState(config.templates || {});
  const [fields, setFields] = useState(config.fields || {});
  const [customFields, setCustomFields] = useState<CustomField[]>(config.customFields || []);
  const [lists, setLists] = useState(config.lists || { faculties: [], ethnicities: [], religions: [] });
  const [activities, setActivities] = useState(config.activities || []);

  if (loading) return <div>Đang tải cấu hình...</div>;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig({ templates, fields, customFields, lists, activities });
      alert('Lưu cấu hình thành công!');
    } catch (error) {
      console.error(error);
      alert('Lỗi khi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateChange = (key: string, value: string) => {
    setTemplates({ ...templates, [key]: value });
  };

  const loadDefaultTemplate = (key: string) => {
    setTemplates({ ...templates, [key]: DEFAULT_CONFIG.templates[key] });
  };

  const loadAllDefaultTemplates = () => {
    if (confirm('Bạn có chắc chắn muốn tải lại tất cả các mẫu mặc định? Nội dung hiện tại sẽ bị ghi đè.')) {
      setTemplates({ ...DEFAULT_CONFIG.templates });
    }
  };

  const handleFieldChange = (fieldId: string, key: string, value: any) => {
    setFields({
      ...fields,
      [fieldId]: {
        ...(fields[fieldId] || {}),
        [key]: value
      }
    });
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: `custom_${Date.now()}`,
      section: 'basicInfo',
      label: 'Trường mới',
      type: 'text',
      required: false,
      placeholder: ''
    };
    setCustomFields([...customFields, newField]);
  };

  const updateCustomField = (id: string, key: keyof CustomField, value: any) => {
    setCustomFields(customFields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  const handleListChange = (key: string, value: string) => {
    const newList = value.split('\n').map(item => item.trim()).filter(item => item !== '');
    setLists({ ...lists, [key]: newList });
  };

  const addActivity = () => {
    setActivities([...activities, { id: Date.now().toString(), name: '', organizer: '', time: '', details: '' }]);
  };

  const updateActivity = (id: string, key: string, value: string) => {
    setActivities(activities.map(a => a.id === id ? { ...a, [key]: value } : a));
  };

  const removeActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const tabs = [
    { id: 'templates', label: 'Nội dung mẫu', icon: <FileText size={16} /> },
    { id: 'fields', label: 'Trường dữ liệu', icon: <LayoutList size={16} /> },
    { id: 'custom', label: 'Trường bổ sung', icon: <ListPlus size={16} /> },
    { id: 'lists', label: 'Danh sách chọn', icon: <List size={16} /> },
    { id: 'activities', label: 'Hoạt động', icon: <Calendar size={16} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-brand-red text-white shadow-md shadow-brand-red/20' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[500px]">
        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Cấu hình nội dung mẫu (Templates)</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Tùy chỉnh các mẫu văn bản gợi ý cho sinh viên khi điền form.</p>
              </div>
              <button
                onClick={loadAllDefaultTemplates}
                className="flex items-center gap-2 text-xs font-black text-brand-red hover:underline uppercase tracking-widest bg-red-50 px-4 py-2 rounded-xl"
              >
                <RotateCcw size={14} /> Tải lại tất cả mẫu mặc định
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">Mẫu Tự nhận xét (Self Assessment)</label>
                    <button onClick={() => loadDefaultTemplate('selfAssessment')} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">Sử dụng mẫu mặc định</button>
                  </div>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                    rows={4}
                    value={templates.selfAssessment || ''}
                    onChange={(e) => handleTemplateChange('selfAssessment', e.target.value)}
                    placeholder="Nhập nội dung mẫu cho phần tự nhận xét..."
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">Mẫu Lịch sử bản thân (Personal History)</label>
                    <button onClick={() => loadDefaultTemplate('personalHistory')} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">Sử dụng mẫu mặc định</button>
                  </div>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                    rows={4}
                    value={templates.personalHistory || ''}
                    onChange={(e) => handleTemplateChange('personalHistory', e.target.value)}
                    placeholder="Nhập nội dung mẫu cho phần lịch sử bản thân..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest">Mẫu Thông tin khác (Khen thưởng, kỷ luật...)</label>
                    <button onClick={() => loadDefaultTemplate('otherInfo')} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">Sử dụng mẫu mặc định</button>
                  </div>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                    rows={4}
                    value={templates.otherInfo || ''}
                    onChange={(e) => handleTemplateChange('otherInfo', e.target.value)}
                    placeholder="Nhập nội dung mẫu cho phần thông tin khác..."
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">Mẫu Lịch sử gia đình</h4>
                
                {[
                  { id: 'familyHistory_ongNoi', label: 'Ông nội' },
                  { id: 'familyHistory_baNoi', label: 'Bà nội' },
                  { id: 'familyHistory_ongNgoai', label: 'Ông ngoại' },
                  { id: 'familyHistory_baNgoai', label: 'Bà ngoại' },
                  { id: 'familyHistory_chaRuot', label: 'Cha ruột' },
                  { id: 'familyHistory_meRuot', label: 'Mẹ ruột' },
                  { id: 'familyHistory_emRuot', label: 'Anh/Chị/Em ruột' },
                  { id: 'familyHistory_voChong', label: 'Vợ/Chồng' },
                  { id: 'familyHistory_conCai', label: 'Con cái' },
                  { id: 'familyHistory_boVoChong', label: 'Bố vợ/chồng' },
                  { id: 'familyHistory_meVoChong', label: 'Mẹ vợ/chồng' },
                  { id: 'familyHistory_ongNoiVoChong', label: 'Ông nội vợ/chồng' },
                  { id: 'familyHistory_baNoiVoChong', label: 'Bà nội vợ/chồng' },
                  { id: 'familyHistory_ongNgoaiVoChong', label: 'Ông ngoại vợ/chồng' },
                  { id: 'familyHistory_baNgoaiVoChong', label: 'Bà ngoại vợ/chồng' },
                  { id: 'familyHistory_anhChiEmVoChong', label: 'Anh/Chị/Em vợ/chồng' },
                ].map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">{item.label}</label>
                      <button onClick={() => loadDefaultTemplate(item.id)} className="text-[9px] font-bold text-blue-600 hover:underline">Sử dụng mẫu mặc định</button>
                    </div>
                    <textarea
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                      rows={2}
                      value={templates[item.id] || ''}
                      onChange={(e) => handleTemplateChange(item.id, e.target.value)}
                      placeholder={`Nhập nội dung mẫu cho phần lịch sử gia đình (${item.label})...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fields Tab */}
        {activeTab === 'fields' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Cấu hình các trường dữ liệu (Fields)</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Tùy chỉnh tiêu đề (label), placeholder và trạng thái bắt buộc của các trường có sẵn trên toàn bộ hệ thống.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {[
                // Thông tin cơ bản
                { id: 'basicInfo.fullName', defaultLabel: 'Họ và tên khai sinh', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.aliases', defaultLabel: 'Tên gọi khác', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.studentId', defaultLabel: 'Mã số sinh viên', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.cccd', defaultLabel: 'Số Căn cước công dân', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.dob', defaultLabel: 'Ngày tháng năm sinh', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.gender', defaultLabel: 'Giới tính', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.class', defaultLabel: 'Lớp sinh hoạt', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.faculty', defaultLabel: 'Khoa', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.hometown', defaultLabel: 'Quê quán', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.birthplace', defaultLabel: 'Nơi sinh', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.ethnicity', defaultLabel: 'Dân tộc', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.religion', defaultLabel: 'Tôn giáo', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.nationality', defaultLabel: 'Quốc tịch', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.permanentAddress', defaultLabel: 'Nơi đăng ký hộ khẩu thường trú', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.temporaryAddress', defaultLabel: 'Nơi ở hiện nay', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.zaloPhone', defaultLabel: 'Số điện thoại (Zalo)', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.email', defaultLabel: 'Địa chỉ Email', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.facebookLink', defaultLabel: 'Link Facebook', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.generalEducation', defaultLabel: 'Trình độ giáo dục phổ thông', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.professionalExpertise', defaultLabel: 'Trình độ chuyên môn', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.politicalTheory', defaultLabel: 'Lý luận chính trị', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.foreignLanguage', defaultLabel: 'Ngoại ngữ', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.itSkill', defaultLabel: 'Tin học', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.minorityLanguage', defaultLabel: 'Tiếng dân tộc thiểu số', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.currentOccupation', defaultLabel: 'Nghề nghiệp hiện nay', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.scienceTech', defaultLabel: 'Khoa học công nghệ', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.highestDegree', defaultLabel: 'Học vị cao nhất', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.highestTitle', defaultLabel: 'Học hàm cao nhất', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.youthUnionJoinDate', defaultLabel: 'Ngày vào Đoàn TNCS Hồ Chí Minh', section: 'Thông tin cơ bản' },
                { id: 'basicInfo.youthUnionJoinPlace', defaultLabel: 'Nơi kết nạp vào Đoàn', section: 'Thông tin cơ bản' },
                
                // Kết nạp lại
                { id: 'basicInfo.isReAdmission', defaultLabel: 'Đối với người xin kết nạp lại', section: 'Kết nạp lại' },
                { id: 'basicInfo.firstAdmissionDate', defaultLabel: 'Ngày kết nạp lần 1', section: 'Kết nạp lại' },
                { id: 'basicInfo.firstAdmissionPlace', defaultLabel: 'Nơi kết nạp lần 1', section: 'Kết nạp lại' },
                { id: 'basicInfo.firstOfficialDate', defaultLabel: 'Ngày công nhận chính thức lần 1', section: 'Kết nạp lại' },
                { id: 'basicInfo.firstOfficialPlace', defaultLabel: 'Nơi công nhận chính thức lần 1', section: 'Kết nạp lại' },
                { id: 'basicInfo.firstIntroducer', defaultLabel: 'Người giới thiệu lần 1', section: 'Kết nạp lại' },
                
                // Điều kiện kết nạp
                { id: 'conditions.trainingClasses', defaultLabel: 'Những lớp đào tạo, bồi dưỡng đã qua', section: 'Điều kiện kết nạp' },
                { id: 'conditions.academicScores', defaultLabel: 'Điểm học tập và rèn luyện', section: 'Điều kiện kết nạp' },
                { id: 'conditions.academicTranscriptUrl', defaultLabel: 'Link bảng điểm học tập, rèn luyện', section: 'Điều kiện kết nạp' },
                { id: 'conditions.residenceProof', defaultLabel: 'Minh chứng cư trú tại Đà Nẵng', section: 'Điều kiện kết nạp' },
                
                // Lịch sử bản thân
                { id: 'personalHistory.history', defaultLabel: 'Lịch sử bản thân', section: 'Lịch sử bản thân' },
                
                // Lịch sử gia đình
                { id: 'familyHistory.relation', defaultLabel: 'Quan hệ', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.fullName', defaultLabel: 'Họ và tên', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.birthYear', defaultLabel: 'Năm sinh', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.deathYear', defaultLabel: 'Năm mất (nếu có)', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.hometown', defaultLabel: 'Quê quán', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.birthplace', defaultLabel: 'Nơi sinh', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.permanentAddress', defaultLabel: 'Chỗ ở hiện nay', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.religion', defaultLabel: 'Tôn giáo', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.ethnicity', defaultLabel: 'Dân tộc', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.nationality', defaultLabel: 'Quốc tịch', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.job', defaultLabel: 'Nghề nghiệp', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.cccd', defaultLabel: 'Số CCCD', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.isPartyMember', defaultLabel: 'Là Đảng viên ĐCSVN', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.partyDetails', defaultLabel: 'Thông tin Đảng viên', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.history', defaultLabel: 'Quá trình công tác, sinh sống', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.rewards', defaultLabel: 'Khen thưởng', section: 'Lịch sử gia đình' },
                { id: 'familyHistory.politicalAttitude', defaultLabel: 'Thái độ chính trị', section: 'Lịch sử gia đình' },
                
                // Thông tin khác
                { id: 'otherInfo.historicalCharacteristics', defaultLabel: 'Đặc điểm lịch sử', section: 'Thông tin khác' },
                { id: 'otherInfo.rewards', defaultLabel: 'Khen thưởng', section: 'Thông tin khác' },
                { id: 'otherInfo.disciplines', defaultLabel: 'Kỷ luật', section: 'Thông tin khác' },
                { id: 'otherInfo.abroadTrips', defaultLabel: 'Đi nước ngoài', section: 'Thông tin khác' },
                
                // Tự nhận xét
                { id: 'selfAssessment.selfAssessment', defaultLabel: 'Nội dung tự nhận xét', section: 'Tự nhận xét' },
              ].map((field) => (
                <div key={field.id} className="border border-slate-100 p-5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight">{field.defaultLabel} <span className="text-[10px] font-bold text-slate-400">({field.id})</span></h4>
                    <span className="text-[10px] font-black bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-lg uppercase tracking-widest">{field.section}</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tiêu đề (Label) tùy chỉnh</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                        value={fields[field.id]?.label || ''}
                        onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                        placeholder={`Mặc định: ${field.defaultLabel}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nội dung gợi ý (Placeholder)</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                        value={fields[field.id]?.placeholder || ''}
                        onChange={(e) => handleFieldChange(field.id, 'placeholder', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-6 pt-2 border-t border-slate-100">
                      <label className="flex items-center gap-2 text-xs font-black text-slate-700 cursor-pointer uppercase tracking-widest">
                        <input
                          type="checkbox"
                          checked={fields[field.id]?.required !== false}
                          onChange={(e) => handleFieldChange(field.id, 'required', e.target.checked)}
                          className="rounded-lg text-brand-red focus:ring-brand-red w-4 h-4"
                        />
                        <span>Bắt buộc nhập</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-black text-slate-700 cursor-pointer uppercase tracking-widest">
                        <input
                          type="checkbox"
                          checked={fields[field.id]?.hidden === true}
                          onChange={(e) => handleFieldChange(field.id, 'hidden', e.target.checked)}
                          className="rounded-lg text-brand-red focus:ring-brand-red w-4 h-4"
                        />
                        <span>Ẩn trường này</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Fields Tab */}
        {activeTab === 'custom' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Trường dữ liệu bổ sung</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Thêm các trường mới vào các phần của form.</p>
              </div>
              <button
                onClick={addCustomField}
                className="flex items-center gap-2 text-xs font-black bg-blue-50 text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all uppercase tracking-widest"
              >
                <Plus size={16} /> Thêm trường mới
              </button>
            </div>

            <div className="space-y-4">
              {customFields.length === 0 ? (
                <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center">
                  <ListPlus size={48} className="mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">Chưa có trường bổ sung nào.</p>
                  <p className="text-xs mt-2">Nhấn "Thêm trường mới" để bắt đầu.</p>
                </div>
              ) : (
                customFields.map((field) => (
                  <div key={field.id} className="border border-slate-100 p-5 rounded-2xl bg-slate-50/50 flex gap-6 items-start relative group">
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Phần (Section)</label>
                        <select
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                          value={field.section}
                          onChange={(e) => updateCustomField(field.id, 'section', e.target.value)}
                        >
                          <option value="basicInfo">Thông tin cơ bản</option>
                          <option value="conditions">Điều kiện kết nạp</option>
                          <option value="personalHistory">Lịch sử bản thân</option>
                          <option value="familyHistory">Lịch sử gia đình</option>
                          <option value="otherInfo">Thông tin khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tiêu đề (Label)</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                          value={field.label}
                          onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Loại dữ liệu</label>
                        <select
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                          value={field.type}
                          onChange={(e) => updateCustomField(field.id, 'type', e.target.value as any)}
                        >
                          <option value="text">Văn bản ngắn</option>
                          <option value="textarea">Văn bản dài</option>
                          <option value="date">Ngày tháng</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nội dung gợi ý (Placeholder)</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                          value={field.placeholder}
                          onChange={(e) => updateCustomField(field.id, 'placeholder', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center pt-2 md:col-span-2">
                        <label className="flex items-center gap-2 text-xs font-black text-slate-700 cursor-pointer uppercase tracking-widest">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateCustomField(field.id, 'required', e.target.checked)}
                            className="rounded-lg text-brand-red focus:ring-brand-red w-4 h-4"
                          />
                          <span>Bắt buộc nhập</span>
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCustomField(field.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-brand-red p-2 bg-white border border-slate-200 rounded-xl transition-all hover:bg-red-50 opacity-0 group-hover:opacity-100"
                      title="Xóa trường này"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Lists Tab */}
        {activeTab === 'lists' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Danh sách cấu hình (Dropdown Lists)</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Cấu hình danh sách các lựa chọn cho các trường dropdown (mỗi dòng một lựa chọn).</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-3">Danh sách Khoa</label>
                <textarea
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                  rows={15}
                  value={lists.faculties?.join('\n') || ''}
                  onChange={(e) => handleListChange('faculties', e.target.value)}
                  placeholder="Nhập danh sách khoa, mỗi dòng một tên khoa..."
                />
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-3">Danh sách Dân tộc</label>
                <textarea
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                  rows={15}
                  value={lists.ethnicities?.join('\n') || ''}
                  onChange={(e) => handleListChange('ethnicities', e.target.value)}
                  placeholder="Nhập danh sách dân tộc, mỗi dòng một dân tộc..."
                />
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-3">Danh sách Tôn giáo</label>
                <textarea
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                  rows={15}
                  value={lists.religions?.join('\n') || ''}
                  onChange={(e) => handleListChange('religions', e.target.value)}
                  placeholder="Nhập danh sách tôn giáo, mỗi dòng một tôn giáo..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Danh sách hoạt động (Activities)</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Cấu hình danh sách các hoạt động cho sinh viên chưa đủ điều kiện minh chứng.</p>
              </div>
              <button
                onClick={addActivity}
                className="flex items-center gap-2 text-xs font-black bg-blue-50 text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all uppercase tracking-widest"
              >
                <Plus size={16} /> Thêm hoạt động mới
              </button>
            </div>

            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center">
                  <Calendar size={48} className="mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">Chưa có hoạt động nào.</p>
                  <p className="text-xs mt-2">Nhấn "Thêm hoạt động mới" để bắt đầu.</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="border border-slate-100 p-5 rounded-2xl bg-slate-50/50 flex gap-6 items-start relative group">
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tên hoạt động</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                          value={activity.name}
                          onChange={(e) => updateActivity(activity.id, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Đơn vị tổ chức</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                          value={activity.organizer}
                          onChange={(e) => updateActivity(activity.id, 'organizer', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Thời gian tổ chức</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                          value={activity.time}
                          onChange={(e) => updateActivity(activity.id, 'time', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Chi tiết</label>
                        <textarea
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                          rows={2}
                          value={activity.details}
                          onChange={(e) => updateActivity(activity.id, 'details', e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeActivity(activity.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-brand-red p-2 bg-white border border-slate-200 rounded-xl transition-all hover:bg-red-50 opacity-0 group-hover:opacity-100"
                      title="Xóa hoạt động này"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center px-8 py-3.5 bg-brand-red text-white text-xs font-black rounded-xl hover:bg-brand-red-dark transition-all shadow-lg shadow-brand-red/20 disabled:opacity-50 group uppercase tracking-widest"
        >
          <Settings className="mr-2 w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
          {saving ? 'Đang lưu cấu hình...' : 'Lưu tất cả thay đổi'}
        </button>
      </div>
    </div>
  );
}
