import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, ChevronRight } from 'lucide-react';
import FieldFeedback from '../FieldFeedback';
import FileUpload from '../FileUpload';
import { useFormConfig } from '../../contexts/FormConfigContext';
import ConfirmModal from '../ConfirmModal';

interface BasicInfoFormProps {
  initialData: any;
  onSave: (data: any, isSubmit?: boolean, stayOnStep?: boolean) => void;
  onDataChange?: (data: any) => void;
  saving: boolean;
  isAdmin?: boolean;
  fieldFeedback?: Record<string, string>;
  onFeedbackChange?: (fieldPath: string, value: string) => void;
}

export default function BasicInfoForm({ initialData, onSave, onDataChange, saving, isAdmin = false, fieldFeedback = {}, onFeedbackChange }: BasicInfoFormProps) {
  const { config } = useFormConfig();
  const faculties = config.lists?.faculties || [];
  const ethnicities = config.lists?.ethnicities || [];
  const religions = config.lists?.religions || [];
  const { register, watch, trigger, formState: { errors } } = useForm({
    mode: 'onChange',
    defaultValues: initialData || {
      nationality: 'Việt Nam',
      currentOccupation: 'Sinh viên',
      religion: 'Không'
    }
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const watchedData = watch();
  const lastDataRef = React.useRef(JSON.stringify(watchedData));

  React.useEffect(() => {
    const currentDataStr = JSON.stringify(watchedData);
    if (onDataChange && currentDataStr !== lastDataRef.current) {
      lastDataRef.current = currentDataStr;
      onDataChange(watchedData);
    }
  }, [watchedData, onDataChange]);

  const isReAdmission = watch('isReAdmission');

  const getDriveImagePreviewUrl = (url: string) => {
    if (!url) return null;
    
    let id = null;
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const match3 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    
    if (match1 && match1[1]) id = match1[1];
    else if (match2 && match2[1]) id = match2[1];
    else if (match3 && match3[1]) id = match3[1];
    
    if (id) {
      return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
    }
    return url;
  };

  const validateAddress = (value: string) => {
    if (!value) return true;
    const lower = value.toLowerCase();
    const hasLevel1 = lower.includes('tổ') || lower.includes('thôn') || lower.includes('xóm') || lower.includes('đường') || lower.includes('số') || lower.includes('đội');
    const hasLevel2 = lower.includes('xã') || lower.includes('phường') || lower.includes('thị trấn');
    const hasLevel3 = lower.includes('tỉnh') || lower.includes('thành phố');
    
    if (!hasLevel1 || !hasLevel2 || !hasLevel3) {
      return 'Gợi ý: Địa chỉ nên có đủ 3 cấp (Tổ/Thôn... Xã/Phường... Tỉnh/Thành phố)';
    }
    return true;
  };

  const validateHometown = (value: string) => {
    if (!value) return true;
    if (!value.includes('Trước đây là') && !value.includes('trước đây là')) {
      return 'Gợi ý: Nên kê khai rõ địa chỉ cũ và mới. VD: Xã A, Tỉnh B (Trước đây là Xã A, Huyện C, Tỉnh B)';
    }
    return true;
  };

  const getFieldConfig = (fieldId: string, defaultLabel: string, defaultRequired: boolean = true) => {
    const fieldConfig = config.fields[fieldId];
    return {
      label: fieldConfig?.label || defaultLabel,
      placeholder: fieldConfig?.placeholder || '',
      required: fieldConfig?.required !== false ? defaultRequired : false,
      hidden: fieldConfig?.hidden === true,
    };
  };

  const fullNameConfig = getFieldConfig('basicInfo.fullName', 'Họ và tên khai sinh');
  const aliasesConfig = getFieldConfig('basicInfo.aliases', 'Tên gọi khác');
  const studentIdConfig = getFieldConfig('basicInfo.studentId', 'Mã số sinh viên');
  const cccdConfig = getFieldConfig('basicInfo.cccd', 'Số Căn cước công dân');
  const dobConfig = getFieldConfig('basicInfo.dob', 'Ngày tháng năm sinh');
  const genderConfig = getFieldConfig('basicInfo.gender', 'Giới tính');
  const classConfig = getFieldConfig('basicInfo.class', 'Lớp sinh hoạt');
  const facultyConfig = getFieldConfig('basicInfo.faculty', 'Khoa');
  const hometownConfig = getFieldConfig('basicInfo.hometown', 'Quê quán');
  const birthplaceConfig = getFieldConfig('basicInfo.birthplace', 'Nơi sinh');
  const ethnicityConfig = getFieldConfig('basicInfo.ethnicity', 'Dân tộc');
  const religionConfig = getFieldConfig('basicInfo.religion', 'Tôn giáo');
  const nationalityConfig = getFieldConfig('basicInfo.nationality', 'Quốc tịch');
  const permanentAddressConfig = getFieldConfig('basicInfo.permanentAddress', 'Nơi đăng ký hộ khẩu thường trú');
  const temporaryAddressConfig = getFieldConfig('basicInfo.temporaryAddress', 'Nơi ở hiện nay');
  const zaloPhoneConfig = getFieldConfig('basicInfo.zaloPhone', 'Số điện thoại (Zalo)');
  const emailConfig = getFieldConfig('basicInfo.email', 'Địa chỉ Email');
  const facebookLinkConfig = getFieldConfig('basicInfo.facebookLink', 'Link Facebook');
  const generalEducationConfig = getFieldConfig('basicInfo.generalEducation', 'Trình độ giáo dục phổ thông');
  const professionalExpertiseConfig = getFieldConfig('basicInfo.professionalExpertise', 'Trình độ chuyên môn');
  const politicalTheoryConfig = getFieldConfig('basicInfo.politicalTheory', 'Lý luận chính trị');
  const foreignLanguageConfig = getFieldConfig('basicInfo.foreignLanguage', 'Ngoại ngữ');
  const itSkillConfig = getFieldConfig('basicInfo.itSkill', 'Tin học');
  const minorityLanguageConfig = getFieldConfig('basicInfo.minorityLanguage', 'Tiếng dân tộc thiểu số', false);
  const currentOccupationConfig = getFieldConfig('basicInfo.currentOccupation', 'Nghề nghiệp hiện nay');
  const scienceTechConfig = getFieldConfig('basicInfo.scienceTech', 'Khoa học công nghệ', false);
  const highestDegreeConfig = getFieldConfig('basicInfo.highestDegree', 'Học vị cao nhất', false);
  const highestTitleConfig = getFieldConfig('basicInfo.highestTitle', 'Học hàm cao nhất', false);
  const youthUnionJoinDateConfig = getFieldConfig('basicInfo.youthUnionJoinDate', 'Ngày vào Đoàn TNCS Hồ Chí Minh');
  const youthUnionJoinPlaceConfig = getFieldConfig('basicInfo.youthUnionJoinPlace', 'Nơi kết nạp vào Đoàn');
  
  const isReAdmissionConfig = getFieldConfig('basicInfo.isReAdmission', 'Đối với người xin kết nạp lại vào Đảng (Đánh dấu nếu có)', false);
  const firstAdmissionDateConfig = getFieldConfig('basicInfo.firstAdmissionDate', 'Ngày kết nạp lần 1', false);
  const firstAdmissionPlaceConfig = getFieldConfig('basicInfo.firstAdmissionPlace', 'Nơi kết nạp lần 1', false);
  const firstOfficialDateConfig = getFieldConfig('basicInfo.firstOfficialDate', 'Ngày công nhận chính thức lần 1', false);
  const firstOfficialPlaceConfig = getFieldConfig('basicInfo.firstOfficialPlace', 'Nơi công nhận chính thức lần 1', false);
  const firstIntroducerConfig = getFieldConfig('basicInfo.firstIntroducer', 'Người giới thiệu lần 1', false);

  const getErrorMessages = () => {
    const errorList: string[] = [];
    const fieldLabels: Record<string, string> = {
      profilePhotoUrl: 'Link ảnh thẻ cá nhân',
      fullName: 'Họ và tên khai sinh',
      aliases: 'Tên gọi khác',
      studentId: 'Mã số sinh viên',
      cccd: 'Số Căn cước công dân',
      dob: 'Ngày tháng năm sinh',
      gender: 'Giới tính',
      class: 'Lớp sinh hoạt',
      faculty: 'Khoa',
      hometown: 'Quê quán',
      birthplace: 'Nơi sinh',
      ethnicity: 'Dân tộc',
      religion: 'Tôn giáo',
      nationality: 'Quốc tịch',
      permanentAddress: 'Nơi đăng ký hộ khẩu thường trú',
      temporaryAddress: 'Nơi ở hiện nay',
      zaloPhone: 'Số điện thoại (Zalo)',
      email: 'Địa chỉ Email',
      facebookLink: 'Link Facebook',
      generalEducation: 'Trình độ giáo dục phổ thông',
      professionalExpertise: 'Trình độ chuyên môn',
      politicalTheory: 'Lý luận chính trị',
      foreignLanguage: 'Ngoại ngữ',
      itSkill: 'Tin học',
      minorityLanguage: 'Tiếng dân tộc thiểu số',
      currentOccupation: 'Nghề nghiệp hiện nay',
      scienceTech: 'Khoa học công nghệ',
      highestDegree: 'Học vị cao nhất',
      highestTitle: 'Học hàm cao nhất',
      youthUnionJoinDate: 'Ngày vào Đoàn TNCS Hồ Chí Minh',
      youthUnionJoinPlace: 'Nơi kết nạp vào Đoàn',
      isReAdmission: 'Khai lại (Đã từng kết nạp Đảng)',
      firstAdmissionDate: 'Ngày kết nạp lần 1',
      firstAdmissionPlace: 'Nơi kết nạp lần 1',
      firstOfficialDate: 'Ngày công nhận chính thức lần 1',
      firstOfficialPlace: 'Nơi công nhận chính thức lần 1',
      firstIntroducer: 'Người giới thiệu lần 1',
    };

    Object.keys(errors).forEach(key => {
      if (key === 'customFields') {
         Object.keys(errors.customFields || {}).forEach(customKey => {
           const customField = config.customFields?.find(f => f.id === customKey);
           if (customField) errorList.push(customField.label);
         });
      } else {
         errorList.push(fieldLabels[key] || key);
      }
    });
    return errorList;
  };

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Link ảnh thẻ cá nhân (Google Drive) *</label>
        <p className="text-xs text-gray-500 mb-2">Dán link Google Drive chứa ảnh thẻ 3x4 hoặc 4x6 của bạn (nhớ mở quyền truy cập).</p>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <input
              type="url"
              {...register('profilePhotoUrl', { required: 'Bắt buộc nhập link ảnh thẻ' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder="https://drive.google.com/file/d/..."
            />
            {errors.profilePhotoUrl && <p className="text-red-500 text-xs mt-1">{errors.profilePhotoUrl.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.profilePhotoUrl" feedback={fieldFeedback['basicInfo.profilePhotoUrl']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
          {watchedData.profilePhotoUrl && (
            <div className="w-24 h-32 border border-gray-300 rounded-md overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
              <img 
                src={getDriveImagePreviewUrl(watchedData.profilePhotoUrl) || ''} 
                alt="Preview" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const currentSrc = target.src;
                  
                  // Thử fallback sang uc?export=view nếu thumbnail thất bại
                  if (currentSrc.includes('drive.google.com/thumbnail')) {
                    const idMatch = currentSrc.match(/id=([a-zA-Z0-9_-]+)/);
                    if (idMatch && idMatch[1]) {
                      target.src = `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
                      return;
                    }
                  }
                  
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.classList.add('bg-gray-200');
                    if (!parent.querySelector('.error-text')) {
                      const span = document.createElement('span');
                      span.className = 'error-text text-xs text-gray-500 text-center px-1';
                      span.innerText = 'Không thể tải ảnh (Vui lòng mở quyền truy cập)';
                      parent.appendChild(span);
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!studentIdConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{studentIdConfig.label} {studentIdConfig.required && '*'}</label>
            <input
              {...register('studentId', { 
                required: studentIdConfig.required ? 'Bắt buộc nhập' : false,
                pattern: { value: /^[0-9]{12}$/, message: 'Phải đủ 12 số' }
              })}
              placeholder={studentIdConfig.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
            />
            {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.studentId" feedback={fieldFeedback['basicInfo.studentId']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!cccdConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{cccdConfig.label} {cccdConfig.required && '*'}</label>
            <input
              {...register('cccd', { 
                required: cccdConfig.required ? 'Bắt buộc nhập' : false,
                pattern: { value: /^[0-9]{12}$/, message: 'Phải đủ 12 số' }
              })}
              placeholder={cccdConfig.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
            />
            {errors.cccd && <p className="text-red-500 text-xs mt-1">{errors.cccd.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.cccd" feedback={fieldFeedback['basicInfo.cccd']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!fullNameConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{fullNameConfig.label} {fullNameConfig.required && '*'}</label>
            <input
              {...register('fullName', { required: fullNameConfig.required ? 'Bắt buộc nhập' : false })}
              placeholder={fullNameConfig.placeholder || 'NGUYỄN VĂN A'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red uppercase"
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.fullName" feedback={fieldFeedback['basicInfo.fullName']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!aliasesConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{aliasesConfig.label} {aliasesConfig.required && '*'}</label>
            <input
              {...register('aliases', { required: aliasesConfig.required ? 'Bắt buộc nhập' : false })}
              placeholder={aliasesConfig.placeholder || "Bí danh hoặc tên gọi khác (nếu có)"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
            />
            <FieldFeedback fieldPath="basicInfo.aliases" feedback={fieldFeedback['basicInfo.aliases']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!dobConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{dobConfig.label} {dobConfig.required && '*'}</label>
            <input
              type="date"
              {...register('dob', { required: dobConfig.required ? 'Bắt buộc nhập' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
            />
            {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.dob" feedback={fieldFeedback['basicInfo.dob']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!classConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{classConfig.label} {classConfig.required && '*'}</label>
            <input
              {...register('class', { required: classConfig.required ? 'Bắt buộc nhập' : false })}
              placeholder={classConfig.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
            />
            {errors.class && <p className="text-red-500 text-xs mt-1">{errors.class.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.class" feedback={fieldFeedback['basicInfo.class']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!facultyConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{facultyConfig.label} {facultyConfig.required && '*'}</label>
            <select
              {...register('faculty', { required: facultyConfig.required ? 'Bắt buộc chọn' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
            >
              <option value="">-- Chọn khoa --</option>
              {faculties.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            {errors.faculty && <p className="text-red-500 text-xs mt-1">{errors.faculty.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.faculty" feedback={fieldFeedback['basicInfo.faculty']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!genderConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{genderConfig.label} {genderConfig.required && '*'}</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input type="radio" {...register('gender', { required: genderConfig.required ? 'Bắt buộc chọn' : false })} value="Nam" className="mr-2 text-brand-red focus:ring-brand-red" /> Nam
              </label>
              <label className="flex items-center">
                <input type="radio" {...register('gender')} value="Nữ" className="mr-2 text-brand-red focus:ring-brand-red" /> Nữ
              </label>
            </div>
            {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.gender" feedback={fieldFeedback['basicInfo.gender']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!ethnicityConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ethnicityConfig.label} {ethnicityConfig.required && '*'}</label>
            <select
              {...register('ethnicity', { required: ethnicityConfig.required ? 'Bắt buộc chọn' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
            >
              <option value="">-- Chọn dân tộc --</option>
              {ethnicities.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            {errors.ethnicity && <p className="text-red-500 text-xs mt-1">{errors.ethnicity.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.ethnicity" feedback={fieldFeedback['basicInfo.ethnicity']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!nationalityConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{nationalityConfig.label} {nationalityConfig.required && '*'}</label>
            <input
              {...register('nationality', { required: nationalityConfig.required ? 'Bắt buộc nhập' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={nationalityConfig.placeholder || "Việt Nam"}
            />
            {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.nationality" feedback={fieldFeedback['basicInfo.nationality']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!religionConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{religionConfig.label} {religionConfig.required && '*'}</label>
            <select
              {...register('religion', { required: religionConfig.required ? 'Bắt buộc chọn' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
            >
              <option value="">-- Chọn tôn giáo --</option>
              {religions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.religion && <p className="text-red-500 text-xs mt-1">{errors.religion.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.religion" feedback={fieldFeedback['basicInfo.religion']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp hiện nay *</label>
          <input
            {...register('currentOccupation', { required: 'Bắt buộc nhập' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
            placeholder="Sinh viên"
          />
          {errors.currentOccupation && <p className="text-red-500 text-xs mt-1">{errors.currentOccupation.message as string}</p>}
          <FieldFeedback fieldPath="basicInfo.currentOccupation" feedback={fieldFeedback['basicInfo.currentOccupation']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
        </div>

        {!generalEducationConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{generalEducationConfig.label} {generalEducationConfig.required && '*'}</label>
            <input
              {...register('generalEducation', { required: generalEducationConfig.required ? 'Bắt buộc nhập' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={generalEducationConfig.placeholder || "Lớp mấy, hệ bao nhiêu năm (VD: 12/12 chính quy)"}
            />
            {errors.generalEducation && <p className="text-red-500 text-xs mt-1">{errors.generalEducation.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.generalEducation" feedback={fieldFeedback['basicInfo.generalEducation']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {!professionalExpertiseConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{professionalExpertiseConfig.label} {professionalExpertiseConfig.required && '*'}</label>
            <input
              {...register('professionalExpertise', { required: professionalExpertiseConfig.required ? 'Bắt buộc nhập' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={professionalExpertiseConfig.placeholder || "Bằng cấp, chứng chỉ đào tạo"}
            />
            <FieldFeedback fieldPath="basicInfo.professionalExpertise" feedback={fieldFeedback['basicInfo.professionalExpertise']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Khoa học công nghệ</label>
          <input
            {...register('scienceTech')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
            placeholder="Các văn bằng, chứng chỉ liên quan"
          />
          <FieldFeedback fieldPath="basicInfo.scienceTech" feedback={fieldFeedback['basicInfo.scienceTech']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
        </div>

        {!politicalTheoryConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{politicalTheoryConfig.label} {politicalTheoryConfig.required && '*'}</label>
            <input
              {...register('politicalTheory', { required: politicalTheoryConfig.required ? 'Bắt buộc nhập' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={politicalTheoryConfig.placeholder || "Sơ cấp, trung cấp, cao cấp..."}
            />
            <FieldFeedback fieldPath="basicInfo.politicalTheory" feedback={fieldFeedback['basicInfo.politicalTheory']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!highestDegreeConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{highestDegreeConfig.label} {highestDegreeConfig.required && '*'}</label>
            <input
              {...register('highestDegree', { required: highestDegreeConfig.required ? 'Bắt buộc nhập' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={highestDegreeConfig.placeholder || "Cử nhân, Thạc sĩ, Tiến sĩ..."}
            />
            <FieldFeedback fieldPath="basicInfo.highestDegree" feedback={fieldFeedback['basicInfo.highestDegree']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!highestTitleConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{highestTitleConfig.label} {highestTitleConfig.required && '*'}</label>
            <input
              {...register('highestTitle', { required: highestTitleConfig.required ? 'Bắt buộc nhập' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={highestTitleConfig.placeholder || "Phó Giáo sư, Giáo sư..."}
            />
            <FieldFeedback fieldPath="basicInfo.highestTitle" feedback={fieldFeedback['basicInfo.highestTitle']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {!foreignLanguageConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{foreignLanguageConfig.label} {foreignLanguageConfig.required && '*'}</label>
            <input
              {...register('foreignLanguage', { required: foreignLanguageConfig.required ? 'Bắt buộc nhập' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={foreignLanguageConfig.placeholder || "Bằng đại học hoặc chứng chỉ (IELTS, TOEFL...)"}
            />
            <FieldFeedback fieldPath="basicInfo.foreignLanguage" feedback={fieldFeedback['basicInfo.foreignLanguage']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!itSkillConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{itSkillConfig.label} {itSkillConfig.required && '*'}</label>
            <input
              {...register('itSkill', { required: itSkillConfig.required ? 'Bắt buộc nhập' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={itSkillConfig.placeholder || "Bằng đại học hoặc chứng chỉ"}
            />
            <FieldFeedback fieldPath="basicInfo.itSkill" feedback={fieldFeedback['basicInfo.itSkill']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!minorityLanguageConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{minorityLanguageConfig.label} {minorityLanguageConfig.required && '*'}</label>
            <input
              {...register('minorityLanguage', { required: minorityLanguageConfig.required ? 'Bắt buộc nhập' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={minorityLanguageConfig.placeholder || "Nếu có"}
            />
            <FieldFeedback fieldPath="basicInfo.minorityLanguage" feedback={fieldFeedback['basicInfo.minorityLanguage']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {!zaloPhoneConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zaloPhoneConfig.label} {zaloPhoneConfig.required && '*'}</label>
            <input
              {...register('zaloPhone', { 
                required: zaloPhoneConfig.required ? 'Bắt buộc nhập' : false,
                pattern: { value: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={zaloPhoneConfig.placeholder || "0912345678"}
            />
            {errors.zaloPhone && <p className="text-red-500 text-xs mt-1">{errors.zaloPhone.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.zaloPhone" feedback={fieldFeedback['basicInfo.zaloPhone']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!facebookLinkConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{facebookLinkConfig.label} {facebookLinkConfig.required && '*'}</label>
            <input
              {...register('facebookLink', { required: facebookLinkConfig.required ? 'Bắt buộc nhập' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={facebookLinkConfig.placeholder || "https://facebook.com/..."}
            />
            <FieldFeedback fieldPath="basicInfo.facebookLink" feedback={fieldFeedback['basicInfo.facebookLink']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!emailConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{emailConfig.label} {emailConfig.required && '*'}</label>
            <input
              type="email"
              {...register('email', { 
                required: emailConfig.required ? 'Bắt buộc nhập' : false,
                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Email không hợp lệ' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={emailConfig.placeholder || "email@example.com"}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.email" feedback={fieldFeedback['basicInfo.email']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}
      </div>

      <div className="space-y-4">
        {!permanentAddressConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{permanentAddressConfig.label} {permanentAddressConfig.required && '*'}</label>
            <input
              {...register('permanentAddress', { 
                required: permanentAddressConfig.required ? 'Bắt buộc nhập' : false,
                validate: validateAddress
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={permanentAddressConfig.placeholder || "Tổ/Thôn/Xóm... Xã/Phường... Tỉnh/Thành phố"}
            />
            {errors.permanentAddress && <p className="text-red-500 text-xs mt-1">{errors.permanentAddress.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.permanentAddress" feedback={fieldFeedback['basicInfo.permanentAddress']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!temporaryAddressConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{temporaryAddressConfig.label} {temporaryAddressConfig.required && '*'}</label>
            <input
              {...register('temporaryAddress', { 
                required: temporaryAddressConfig.required ? 'Bắt buộc nhập' : false,
                validate: validateAddress
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={temporaryAddressConfig.placeholder || "Tổ/Thôn/Xóm... Xã/Phường... Tỉnh/Thành phố"}
            />
            {errors.temporaryAddress && <p className="text-red-500 text-xs mt-1">{errors.temporaryAddress.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.temporaryAddress" feedback={fieldFeedback['basicInfo.temporaryAddress']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!hometownConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{hometownConfig.label} {hometownConfig.required && '*'}</label>
            <input
              {...register('hometown', { 
                required: hometownConfig.required ? 'Bắt buộc nhập' : false,
                validate: validateHometown
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={hometownConfig.placeholder || "Xã Vĩnh Thủy, tỉnh Quảng Trị (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị)"}
            />
            {errors.hometown && <p className="text-red-500 text-xs mt-1">{errors.hometown.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.hometown" feedback={fieldFeedback['basicInfo.hometown']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}

        {!birthplaceConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{birthplaceConfig.label} {birthplaceConfig.required && '*'}</label>
            <input
              {...register('birthplace', { 
                required: birthplaceConfig.required ? 'Bắt buộc nhập' : false,
                validate: validateHometown
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={birthplaceConfig.placeholder || "Xã Vĩnh Thủy, tỉnh Quảng Trị (Trước đây là Xã Vĩnh Thủy, huyện Vĩnh Linh, tỉnh Quảng Trị)"}
            />
            {errors.birthplace && <p className="text-red-500 text-xs mt-1">{errors.birthplace.message as string}</p>}
            <FieldFeedback fieldPath="basicInfo.birthplace" feedback={fieldFeedback['basicInfo.birthplace']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!youthUnionJoinDateConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{youthUnionJoinDateConfig.label} {youthUnionJoinDateConfig.required && '*'}</label>
            <input
              type="date"
              {...register('youthUnionJoinDate', { required: youthUnionJoinDateConfig.required ? 'Bắt buộc nhập' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
            />
            <FieldFeedback fieldPath="basicInfo.youthUnionJoinDate" feedback={fieldFeedback['basicInfo.youthUnionJoinDate']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}
        {!youthUnionJoinPlaceConfig.hidden && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{youthUnionJoinPlaceConfig.label} {youthUnionJoinPlaceConfig.required && '*'}</label>
            <input
              {...register('youthUnionJoinPlace', { required: youthUnionJoinPlaceConfig.required ? 'Bắt buộc nhập' : false })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
              placeholder={youthUnionJoinPlaceConfig.placeholder || "Nơi kết nạp"}
            />
            <FieldFeedback fieldPath="basicInfo.youthUnionJoinPlace" feedback={fieldFeedback['basicInfo.youthUnionJoinPlace']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
          </div>
        )}
      </div>

      {!isReAdmissionConfig.hidden && (
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <label className="flex items-center mb-4 cursor-pointer">
            <input
              type="checkbox"
              {...register('isReAdmission')}
              className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-brand-red mr-2"
            />
            <span className="font-medium text-gray-800">{isReAdmissionConfig.label || 'Đối với người xin kết nạp lại vào Đảng (Đánh dấu nếu có)'}</span>
          </label>

          {isReAdmission && (
            <div className="space-y-4 pt-2 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!firstAdmissionDateConfig.hidden && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{firstAdmissionDateConfig.label} {firstAdmissionDateConfig.required && '*'}</label>
                    <input
                      type="date"
                      {...register('firstAdmissionDate', { required: (isReAdmission && firstAdmissionDateConfig.required) ? 'Bắt buộc nhập' : false })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
                    />
                  </div>
                )}
                {!firstAdmissionPlaceConfig.hidden && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{firstAdmissionPlaceConfig.label} {firstAdmissionPlaceConfig.required && '*'}</label>
                    <input
                      {...register('firstAdmissionPlace', { required: (isReAdmission && firstAdmissionPlaceConfig.required) ? 'Bắt buộc nhập' : false })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
                      placeholder={firstAdmissionPlaceConfig.placeholder}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!firstOfficialDateConfig.hidden && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{firstOfficialDateConfig.label} {firstOfficialDateConfig.required && '*'}</label>
                    <input
                      type="date"
                      {...register('firstOfficialDate', { required: (isReAdmission && firstOfficialDateConfig.required) ? 'Bắt buộc nhập' : false })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
                    />
                  </div>
                )}
                {!firstOfficialPlaceConfig.hidden && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{firstOfficialPlaceConfig.label} {firstOfficialPlaceConfig.required && '*'}</label>
                    <input
                      {...register('firstOfficialPlace', { required: (isReAdmission && firstOfficialPlaceConfig.required) ? 'Bắt buộc nhập' : false })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
                      placeholder={firstOfficialPlaceConfig.placeholder}
                    />
                  </div>
                )}
              </div>
              {!firstIntroducerConfig.hidden && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{firstIntroducerConfig.label} {firstIntroducerConfig.required && '*'}</label>
                  <input
                    {...register('firstIntroducer', { required: (isReAdmission && firstIntroducerConfig.required) ? 'Bắt buộc nhập' : false })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
                    placeholder={firstIntroducerConfig.placeholder}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Render Custom Fields */}
      {config.customFields && config.customFields.filter(f => f.section === 'basicInfo').length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-800 mb-4">Thông tin bổ sung</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {config.customFields.filter(f => f.section === 'basicInfo').map(field => (
              <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && '*'}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    {...register(`customFields.${field.id}`, { required: field.required ? 'Bắt buộc nhập' : false })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : (
                  <input
                    type={field.type}
                    {...register(`customFields.${field.id}`, { required: field.required ? 'Bắt buộc nhập' : false })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-red focus:border-brand-red"
                    placeholder={field.placeholder}
                  />
                )}
                {errors.customFields?.[field.id] && <p className="text-red-500 text-xs mt-1">{errors.customFields[field.id]?.message as string}</p>}
                <FieldFeedback fieldPath={`basicInfo.customFields.${field.id}`} feedback={fieldFeedback[`basicInfo.customFields.${field.id}`]} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-8 border-t border-gray-100">
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            const isValid = await trigger();
            if (!isValid) {
              setShowConfirmModal(true);
            } else {
              onSave(watch(), false, false);
            }
          }}
          disabled={saving}
          className="group relative bg-brand-red text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-red-900/20 hover:bg-brand-red-dark transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          Tiếp tục
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Thông tin chưa đầy đủ hoặc không hợp lệ"
        message="Bạn chưa điền đầy đủ hoặc điền sai một số thông tin bắt buộc. Bạn có chắc chắn muốn lưu tạm và tiếp tục không?"
        errors={getErrorMessages()}
        confirmText="Lưu và tiếp tục"
        cancelText="Kiểm tra lại"
        onConfirm={() => {
          setShowConfirmModal(false);
          onSave(watch(), false, false);
        }}
        onCancel={() => setShowConfirmModal(false)}
      />
    </form>
  );
}
