import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, GripVertical, AlertCircle, BookOpen, X, ChevronRight, ChevronLeft, Loader2, Home, CheckCircle2 } from 'lucide-react';
import FieldFeedback from '../FieldFeedback';
import { useFormConfig } from '../../contexts/FormConfigContext';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from '../ConfirmModal';

interface ConditionsFormProps {
  initialData: any;
  basicInfo?: any;
  onSave: (data: any, isSubmit?: boolean, stayOnStep?: boolean) => void;
  onDataChange?: (data: any) => void;
  onBack: () => void;
  saving: boolean;
  isAdmin?: boolean;
  fieldFeedback?: Record<string, string>;
  onFeedbackChange?: (fieldPath: string, value: string) => void;
}

export default function ConditionsForm({ initialData, basicInfo, onSave, onDataChange, onBack, saving, isAdmin = false, fieldFeedback = {}, onFeedbackChange }: ConditionsFormProps) {
  const { config } = useFormConfig();
  const { register, control, trigger, formState: { errors: formErrors }, watch } = useForm<any>({
    mode: 'onChange',
    defaultValues: {
      hasPartyAwarenessClass: initialData?.hasPartyAwarenessClass ?? true,
      trainingClasses: initialData?.trainingClasses?.length > 0 ? initialData.trainingClasses : (
        initialData?.partyAwarenessClass ? [{
          name: 'Lớp bồi dưỡng nhận thức về Đảng',
          schoolName: initialData.partyAwarenessClass.schoolName || '',
          startDate: initialData.partyAwarenessClass.startDate || '',
          endDate: initialData.partyAwarenessClass.endDate || '',
          type: 'Tập trung',
          certificate: 'Giấy chứng nhận',
          certificateUrl: initialData.partyAwarenessClass.certificateUrl || ''
        }] : [{
          name: 'Lớp bồi dưỡng nhận thức về Đảng',
          schoolName: '',
          startDate: '',
          endDate: '',
          type: 'Tập trung',
          certificate: 'Giấy chứng nhận',
          certificateUrl: ''
        }]
      ),
      academicScores: initialData?.academicScores?.length > 0 ? initialData.academicScores : [
        { semester: '', academicScore: '', trainingScore: '' },
        { semester: '', academicScore: '', trainingScore: '' }
      ],
      academicTranscriptUrl: initialData?.academicTranscriptUrl || '',
      certificates: initialData?.certificates?.length > 0 ? initialData.certificates : [
        { monthYear: '', name: '', issuer: '', fileUrl: '' },
        { monthYear: '', name: '', issuer: '', fileUrl: '' }
      ],
      residenceProof: initialData?.residenceProof || {
        type: '',
        fileUrl: ''
      }
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

  const errors = formErrors as any;

  const residenceProof = watch('residenceProof');
  const hasPartyAwarenessClass = watch('hasPartyAwarenessClass');

  const { fields: scoreFields, move: moveScore } = useFieldArray({
    control,
    name: "academicScores"
  });

  const { fields: certFields, append: appendCert, remove: removeCert, move: moveCert } = useFieldArray({
    control,
    name: "certificates"
  });

  const { fields: trainingFields, append: appendTraining, remove: removeTraining } = useFieldArray({
    control,
    name: "trainingClasses"
  });

  const [currentSubStep, setCurrentSubStep] = useState(1);
  const [eligibilityError, setEligibilityError] = useState<string | null>(() => {
    if (initialData?.isEligible === false) {
      return 'Dựa trên điểm học tập và rèn luyện bạn cung cấp, bạn chưa đủ điều kiện để tiếp tục làm hồ sơ kết nạp Đảng tại thời điểm này. Hẹn gặp lại bạn khi đủ điều kiện.';
    }
    return null;
  });
  const [showActivities, setShowActivities] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  const getFieldConfig = (fieldId: string, defaultLabel: string, defaultRequired: boolean = true) => {
    const fieldConfig = config.fields[fieldId];
    return {
      label: fieldConfig?.label || defaultLabel,
      placeholder: fieldConfig?.placeholder || '',
      required: fieldConfig?.required !== false ? defaultRequired : false,
      hidden: fieldConfig?.hidden === true,
    };
  };

  const trainingClassesConfig = getFieldConfig('conditions.trainingClasses', 'Những lớp đào tạo, bồi dưỡng đã qua');
  const academicScoresConfig = getFieldConfig('conditions.academicScores', 'Điểm học tập và rèn luyện');
  const academicTranscriptUrlConfig = getFieldConfig('conditions.academicTranscriptUrl', 'Link bảng điểm học tập, rèn luyện');
  const residenceProofConfig = getFieldConfig('conditions.residenceProof', 'Minh chứng cư trú tại Đà Nẵng');

  const getErrorMessages = () => {
    const errorList: string[] = [];
    
    if (currentSubStep === 1) {
      if (errors.academicScores) {
        errorList.push('Điểm học tập và rèn luyện');
      }
      if (errors.academicTranscriptUrl) {
        errorList.push('Link minh chứng bảng điểm');
      }
      // Also check if NaN
      const score1 = watch('academicScores')?.[0];
      const score2 = watch('academicScores')?.[1];
      if (isNaN(parseFloat(score1?.academicScore)) || isNaN(parseFloat(score1?.trainingScore)) || isNaN(parseFloat(score2?.academicScore)) || isNaN(parseFloat(score2?.trainingScore))) {
        if (!errorList.includes('Điểm học tập và rèn luyện')) {
          errorList.push('Điểm học tập và rèn luyện (Chưa nhập đủ)');
        }
      }
    } else if (currentSubStep === 2) {
      if (errors.hasPartyAwarenessClass) errorList.push('Đã học lớp bồi dưỡng nhận thức về Đảng');
      if (errors.trainingClasses) errorList.push('Thông tin lớp bồi dưỡng nhận thức về Đảng');
    } else if (currentSubStep === 3) {
      if (errors.certificates) errorList.push('Giấy khen / Bằng khen / Chứng nhận');
    } else if (currentSubStep === 4) {
      if (errors.residenceProof) errorList.push('Giấy xác nhận nơi cư trú tại Đà Nẵng');
    }
    
    return errorList;
  };

  const academicScores = watch('academicScores');
  const certificates = watch('certificates');

  // Automatic eligibility check
  React.useEffect(() => {
    if (currentSubStep !== 1 || isAdmin) return;

    const score1 = academicScores[0];
    const score2 = academicScores[1];

    const academic1 = parseFloat(score1.academicScore);
    const training1 = parseFloat(score1.trainingScore);
    const academic2 = parseFloat(score2.academicScore);
    const training2 = parseFloat(score2.trainingScore);

    // Only check if all fields have values
    if (score1.academicScore && score1.trainingScore && score2.academicScore && score2.trainingScore) {
      if (!isNaN(academic1) && !isNaN(training1) && !isNaN(academic2) && !isNaN(training2)) {
        const isCurrentlyEligible = !(academic1 < 2.5 || academic2 < 2.5 || training1 < 80 || training2 < 80);
        
        if (!isCurrentlyEligible && initialData?.isEligible !== false) {
          const errorMsg = 'Dựa trên điểm học tập và rèn luyện bạn cung cấp, bạn chưa đủ điều kiện để tiếp tục làm hồ sơ kết nạp Đảng tại thời điểm này. Hẹn gặp lại bạn khi đủ điều kiện.';
          setEligibilityError(errorMsg);
          onSave({ ...watchedData, isEligible: false }, false, true);
        } else if (isCurrentlyEligible && initialData?.isEligible === false) {
          setEligibilityError(null);
          onSave({ ...watchedData, isEligible: true }, false, true);
        }
      }
    }
  }, [academicScores, currentSubStep, isAdmin, initialData?.isEligible]);

  const [pendingNextStep, setPendingNextStep] = useState<number | null>(null);

  const checkPart1Eligibility = () => {
    if (academicScores.length < 2) return false;
    
    const score1 = academicScores[0];
    const score2 = academicScores[1];

    const academic1 = parseFloat(score1.academicScore);
    const training1 = parseFloat(score1.trainingScore);
    const academic2 = parseFloat(score2.academicScore);
    const training2 = parseFloat(score2.trainingScore);

    if (isNaN(academic1) || isNaN(training1) || isNaN(academic2) || isNaN(training2)) {
      return false; // Will trigger ConfirmModal
    }

    if (academic1 < 2.5 || academic2 < 2.5 || training1 < 80 || training2 < 80) {
      const errorMsg = 'Dựa trên điểm học tập và rèn luyện bạn cung cấp, bạn chưa đủ điều kiện để tiếp tục làm hồ sơ kết nạp Đảng tại thời điểm này. Hẹn gặp lại bạn khi đủ điều kiện.';
      setEligibilityError(errorMsg);
      onSave({ ...watch(), isEligible: false }, false, true);
      return false;
    }

    return true;
  };

  const checkPart3Eligibility = () => {
    const validCerts = certificates.filter((c: any) => c.name && c.issuer && c.fileUrl);
    if (validCerts.length < 2) {
      setShowActivities(true);
      onSave({ ...watch(), isEligible: false }, false, true);
      return false;
    }
    return true;
  };

  const handleNextSubStep = async () => {
    const isValid = await trigger();
    if (currentSubStep === 1) {
      const isEligible = checkPart1Eligibility();
      if (!isValid || (isNaN(parseFloat(academicScores[0]?.academicScore)) || isNaN(parseFloat(academicScores[0]?.trainingScore)) || isNaN(parseFloat(academicScores[1]?.academicScore)) || isNaN(parseFloat(academicScores[1]?.trainingScore)))) {
        setPendingNextStep(2);
        setShowConfirmModal(true);
      } else if (isEligible) {
        setCurrentSubStep(2);
      }
    } else if (currentSubStep === 2) {
      if (!isValid) {
        setPendingNextStep(3);
        setShowConfirmModal(true);
      } else {
        setCurrentSubStep(3);
      }
    } else if (currentSubStep === 3) {
      if (!isValid) {
        setPendingNextStep(4);
        setShowConfirmModal(true);
      } else {
        setCurrentSubStep(4);
      }
    }
  };

  const handlePrevSubStep = () => {
    if (currentSubStep > 1) {
      setCurrentSubStep(currentSubStep - 1);
    } else {
      onBack();
    }
  };

  if (eligibilityError && !isAdmin) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-900 mb-2">Thông báo</h3>
        <p className="text-red-700 mb-6">{eligibilityError}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setEligibilityError(null);
              onSave({ ...watch(), isEligible: true }, false, true);
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm"
          >
            Quay lại sửa điểm
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold text-sm"
          >
            Kết thúc
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {eligibilityError && isAdmin && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-900 uppercase tracking-widest">Cảnh báo: Không đủ điều kiện</h4>
            <p className="text-xs text-red-700 mt-1">{eligibilityError}</p>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              currentSubStep === step ? 'bg-brand-red text-white' : 
              currentSubStep > step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentSubStep > step ? '✓' : step}
            </div>
            <div className="ml-2 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:block">
              {step === 1 ? 'Điểm học tập' : step === 2 ? 'Lớp bồi dưỡng' : step === 3 ? 'Giấy khen/Chứng nhận' : 'Minh chứng cư trú'}
            </div>
            {step < 4 && <div className={`flex-1 h-0.5 mx-4 ${currentSubStep > step ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
          </div>
        ))}
      </div>

      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        <AnimatePresence mode="wait">
          {currentSubStep === 1 && (
            <motion.div 
              key="substep1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center text-xs">1</span>
                Phần 1: {academicScoresConfig.label}
              </h3>
              <p className="text-sm text-gray-500 mb-4 bg-red-50 p-3 rounded-xl border border-red-100 italic">
                Kê khai theo bảng 2 kỳ gần nhất, liên tiếp nhau. 
                <span className="font-bold text-brand-red ml-1">Lưu ý: Nếu học kỳ hè thì ghi chú tính cả kỳ hè vào kỳ 2.</span>
              </p>
              
              <div className="space-y-4">
                {scoreFields.map((field, index) => (
                  <div 
                    key={field.id} 
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-2xl border bg-gray-50 border-gray-200 shadow-sm transition-all hover:border-brand-red/30"
                  >
                    <div className="md:col-span-1 flex items-center justify-center text-gray-400">
                      <span className="font-bold text-lg">{index + 1}</span>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Kỳ - Năm học *</label>
                      <input
                        {...register(`academicScores.${index}.semester` as const, { required: 'Bắt buộc' })}
                        placeholder={index === 1 ? "Kỳ 2 - Năm học 2024-2025 (Bao gồm kỳ hè)" : "Kỳ 1 - Năm học 2024-2025"}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Điểm học tập (Hệ 4.0) *</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`academicScores.${index}.academicScore` as const, { required: 'Bắt buộc', min: 0, max: 4 })}
                        placeholder="≥ 2.5"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Điểm rèn luyện *</label>
                      <input
                        type="number"
                        {...register(`academicScores.${index}.trainingScore` as const, { required: 'Bắt buộc', min: 0, max: 100 })}
                        placeholder="≥ 80"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{academicTranscriptUrlConfig.label} {academicTranscriptUrlConfig.required && '*'}</label>
                <input
                  type="url"
                  {...register('academicTranscriptUrl', { required: academicTranscriptUrlConfig.required ? 'Bắt buộc nhập link bảng điểm' : false })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                  placeholder={academicTranscriptUrlConfig.placeholder || "https://drive.google.com/file/d/..."}
                />
              </div>
            </motion.div>
          )}

          {currentSubStep === 2 && (
            <motion.div 
              key="substep2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center text-xs">2</span>
                Phần 2: Giấy chứng nhận lớp Bồi dưỡng nhận thức về Đảng
              </h3>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-4">Tình trạng học tập của bạn:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`flex items-center p-5 border rounded-2xl cursor-pointer transition-all ${String(hasPartyAwarenessClass) === 'true' ? 'border-brand-red bg-red-50 ring-2 ring-brand-red/20' : 'border-gray-200 hover:bg-gray-50 shadow-sm'}`}>
                    <input 
                      type="radio" 
                      {...register('hasPartyAwarenessClass')} 
                      value="true"
                      className="w-5 h-5 text-brand-red focus:ring-brand-red" 
                    /> 
                    <div className="ml-4">
                      <span className="block text-sm font-bold text-gray-900">Đã học</span>
                      <span className="block text-xs text-gray-500">Đã có giấy chứng nhận hoàn thành lớp bồi dưỡng.</span>
                    </div>
                  </label>
                  <label className={`flex items-center p-5 border rounded-2xl cursor-pointer transition-all ${String(hasPartyAwarenessClass) === 'false' ? 'border-brand-red bg-red-50 ring-2 ring-brand-red/20' : 'border-gray-200 hover:bg-gray-50 shadow-sm'}`}>
                    <input 
                      type="radio" 
                      {...register('hasPartyAwarenessClass')} 
                      value="false"
                      className="w-5 h-5 text-brand-red focus:ring-brand-red" 
                    /> 
                    <div className="ml-4">
                      <span className="block text-sm font-bold text-gray-900">Chưa học</span>
                      <span className="block text-xs text-gray-500">Đăng ký tham gia lớp học khi có thông báo.</span>
                    </div>
                  </label>
                </div>
              </div>

              {String(hasPartyAwarenessClass) === 'true' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-gray-700">Thông tin lớp bồi dưỡng</h4>
                  </div>
                  {trainingFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-200 relative shadow-sm">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tên lớp học *</label>
                        <input
                          {...register(`trainingClasses.${index}.name` as const, { required: 'Bắt buộc' })}
                          placeholder="Lớp bồi dưỡng nhận thức về Đảng..."
                          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tên trường, cấp phụ trách *</label>
                        <input
                          {...register(`trainingClasses.${index}.schoolName` as const, { required: 'Bắt buộc' })}
                          placeholder="Trường Đại học..."
                          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Học từ ngày *</label>
                        <input
                          type="date"
                          {...register(`trainingClasses.${index}.startDate` as const, { required: 'Bắt buộc' })}
                          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Học đến ngày *</label>
                        <input
                          type="date"
                          {...register(`trainingClasses.${index}.endDate` as const, { required: 'Bắt buộc' })}
                          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                        />
                      </div>
                      <div className="md:col-span-2 mt-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Link minh chứng (Google Drive) *</label>
                        <input
                          type="url"
                          {...register(`trainingClasses.${index}.certificateUrl` as const, { required: 'Bắt buộc nhập link minh chứng' })}
                          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                          placeholder="https://drive.google.com/file/d/..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl text-blue-600 shadow-sm">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 text-lg">Đăng ký học Lớp bồi dưỡng nhận thức về Đảng</h4>
                      <p className="text-sm text-blue-800">Hệ thống sẽ tự động lấy thông tin từ hồ sơ của bạn để đăng ký.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm bg-white/60 p-6 rounded-2xl border border-blue-100">
                    <div className="flex justify-between border-b border-blue-50 pb-2"><span className="text-gray-500">Họ và tên:</span> <span className="font-bold text-gray-900">{basicInfo?.fullName || '(Chưa nhập)'}</span></div>
                    <div className="flex justify-between border-b border-blue-50 pb-2"><span className="text-gray-500">MSSV:</span> <span className="font-bold text-gray-900">{basicInfo?.studentId || '(Chưa nhập)'}</span></div>
                    <div className="flex justify-between border-b border-blue-50 pb-2"><span className="text-gray-500">CCCD:</span> <span className="font-bold text-gray-900">{basicInfo?.cccd || '(Chưa nhập)'}</span></div>
                    <div className="flex justify-between border-b border-blue-50 pb-2"><span className="text-gray-500">Lớp:</span> <span className="font-bold text-gray-900">{basicInfo?.class || '(Chưa nhập)'}</span></div>
                    <div className="flex justify-between border-b border-blue-50 pb-2"><span className="text-gray-500">Khoa:</span> <span className="font-bold text-gray-900">{basicInfo?.faculty || '(Chưa nhập)'}</span></div>
                    <div className="flex justify-between border-b border-blue-50 pb-2"><span className="text-gray-500">Ngày sinh:</span> <span className="font-bold text-gray-900">{basicInfo?.dob ? new Date(basicInfo.dob).toLocaleDateString('vi-VN') : '(Chưa nhập)'}</span></div>
                    <div className="md:col-span-2 flex justify-between border-b border-blue-50 pb-2"><span className="text-gray-500">Nơi sinh:</span> <span className="font-bold text-gray-900">{basicInfo?.birthplace || '(Chưa nhập)'}</span></div>
                    <div className="md:col-span-2 flex justify-between border-b border-blue-50 pb-2"><span className="text-gray-500">Quê quán:</span> <span className="font-bold text-gray-900">{basicInfo?.hometown || '(Chưa nhập)'}</span></div>
                    <div className="flex justify-between border-b border-blue-50 pb-2"><span className="text-gray-500">SĐT (Zalo):</span> <span className="font-bold text-gray-900">{basicInfo?.zaloPhone || '(Chưa nhập)'}</span></div>
                    <div className="flex justify-between border-b border-blue-50 pb-2"><span className="text-gray-500">Email:</span> <span className="font-bold text-gray-900">{basicInfo?.email || '(Chưa nhập)'}</span></div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200 flex gap-4">
                    <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600 shrink-0">
                      <AlertCircle size={20} />
                    </div>
                    <p className="text-xs text-yellow-800 leading-relaxed">
                      <span className="font-bold">Lưu ý quan trọng:</span> Vui lòng theo dõi thông báo của Chi bộ Sinh viên để tham gia lớp học. Sau khi có giấy chứng nhận, bạn cần quay lại cập nhật hồ sơ để tiếp tục quy trình.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {currentSubStep === 3 && (
            <motion.div 
              key="substep3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center text-xs">3</span>
                Phần 3: Giấy khen, giấy chứng nhận
              </h3>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-2xl border border-gray-200 mb-6 shadow-sm">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Điều kiện về minh chứng:
                </h4>
                <ul className="text-xs text-gray-600 space-y-2 list-none">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-brand-red"></div>
                    Có ít nhất <span className="font-bold text-brand-red px-1.5 py-0.5 bg-red-50 rounded">02 Giấy khen hoặc Giấy chứng nhận</span>.
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-brand-red"></div>
                    Tính từ thời điểm vào Đại học.
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-brand-red"></div>
                    Về các hoạt động học tập, văn hóa, tình nguyện, ...
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-brand-red"></div>
                    Cấp Khoa, Liên chi Đoàn trở lên.
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-4">Bạn đã đủ điều kiện minh chứng chưa?</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowActivities(false)}
                    className={`flex items-center p-5 border rounded-2xl text-left transition-all ${!showActivities ? 'border-brand-red bg-red-50 ring-2 ring-brand-red/20' : 'border-gray-200 hover:bg-gray-50 shadow-sm'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${!showActivities ? 'border-brand-red bg-brand-red' : 'border-gray-300'}`}>
                      {!showActivities && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="ml-4">
                      <span className="block text-sm font-bold text-gray-900">Đã đủ điều kiện</span>
                      <span className="block text-xs text-gray-500">Tiến hành nhập danh sách minh chứng.</span>
                    </div>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowActivities(true)}
                    className={`flex items-center p-5 border rounded-2xl text-left transition-all ${showActivities ? 'border-brand-red bg-red-50 ring-2 ring-brand-red/20' : 'border-gray-200 hover:bg-gray-50 shadow-sm'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${showActivities ? 'border-brand-red bg-brand-red' : 'border-gray-300'}`}>
                      {showActivities && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="ml-4">
                      <span className="block text-sm font-bold text-gray-900">Chưa đủ điều kiện</span>
                      <span className="block text-xs text-gray-500">Xem danh sách các hoạt động để tham gia.</span>
                    </div>
                  </button>
                </div>
              </div>

              {!showActivities ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Danh sách minh chứng (02-05 mục)</h4>
                    <button
                      type="button"
                      onClick={() => certFields.length < 5 && appendCert({ monthYear: '', name: '', issuer: '', fileUrl: '' })}
                      disabled={certFields.length >= 5}
                      className="flex items-center gap-2 text-xs font-bold text-brand-red hover:text-brand-red-dark bg-red-50 px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Plus size={16} /> Thêm minh chứng
                    </button>
                  </div>
                  <div className="space-y-4">
                    {certFields.map((field, index) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={field.id} 
                        className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 bg-white rounded-2xl border border-gray-200 relative shadow-sm hover:border-brand-red/20 transition-all"
                      >
                        {certFields.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeCert(index)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        <div className="md:col-span-3">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tháng/Năm cấp *</label>
                          <input
                            type="month"
                            {...register(`certificates.${index}.monthYear` as const, { required: 'Bắt buộc' })}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                          />
                        </div>
                        <div className="md:col-span-5">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tên giấy khen/chứng nhận *</label>
                          <input
                            {...register(`certificates.${index}.name` as const, { required: 'Bắt buộc' })}
                            placeholder="Giấy khen Sinh viên 5 tốt..."
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                          />
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Đơn vị cấp *</label>
                          <input
                            {...register(`certificates.${index}.issuer` as const, { required: 'Bắt buộc' })}
                            placeholder="Đoàn Trường..."
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                          />
                        </div>
                        <div className="md:col-span-12">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Link minh chứng (Google Drive) *</label>
                          <input
                            type="url"
                            {...register(`certificates.${index}.fileUrl` as const, { required: 'Bắt buộc' })}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                            placeholder="https://drive.google.com/file/d/..."
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-5 bg-yellow-50 rounded-2xl border border-yellow-200 shadow-sm flex gap-4">
                    <AlertCircle className="text-yellow-600 shrink-0" size={24} />
                    <p className="text-sm text-yellow-800 leading-relaxed">
                      Bạn cần tham gia thêm các hoạt động để đủ điều kiện minh chứng. Dưới đây là danh sách các hoạt động sắp tới được Chi bộ đề xuất:
                    </p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">STT</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tên hoạt động</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Đơn vị tổ chức</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Thời gian</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {config.activities?.length > 0 ? config.activities.map((activity, idx) => (
                          <tr key={activity.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4 text-xs text-gray-500">{idx + 1}</td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-900">{activity.name}</td>
                            <td className="px-6 py-4 text-xs text-gray-600">{activity.organizer}</td>
                            <td className="px-6 py-4 text-xs text-gray-600">{activity.time}</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                type="button"
                                onClick={() => setSelectedActivity(activity)}
                                className="text-brand-red hover:text-brand-red-dark text-xs font-bold px-3 py-1.5 bg-red-50 rounded-lg transition-all active:scale-95"
                              >
                                Chi tiết
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-xs italic">
                              Hiện chưa có hoạt động nào được cập nhật.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm flex gap-4">
                    <BookOpen className="text-blue-600 shrink-0" size={24} />
                    <p className="text-sm text-blue-800 font-medium leading-relaxed">
                      Nhắc nhở: Sau khi tham gia các hoạt động và đủ điều kiện, bạn hãy quay lại để tiến hành thực hiện các bước tiếp theo.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {currentSubStep === 4 && (
            <motion.div 
              key="substep4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                <Home className="w-5 h-5 text-brand-red" />
                Phần 4: {residenceProofConfig.label}
              </h3>
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm">
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-4">Loại hình cư trú {residenceProofConfig.required && '*'}</label>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center group cursor-pointer">
                      <div className="relative flex items-center">
                        <input 
                          type="radio" 
                          {...register('residenceProof.type', { required: residenceProofConfig.required ? 'Bắt buộc chọn' : false })} 
                          value="Tạm trú" 
                          className="w-5 h-5 text-brand-red focus:ring-brand-red border-gray-300" 
                        />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-brand-red transition-colors">Tạm trú</span>
                    </label>
                    <label className="flex items-center group cursor-pointer">
                      <div className="relative flex items-center">
                        <input 
                          type="radio" 
                          {...register('residenceProof.type')} 
                          value="Cư trú" 
                          className="w-5 h-5 text-brand-red focus:ring-brand-red border-gray-300" 
                        />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-brand-red transition-colors">Thường trú (Cư trú)</span>
                    </label>
                  </div>
                </div>

                <AnimatePresence>
                  {residenceProof?.type && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Link minh chứng {residenceProof.type} (Google Drive) {residenceProofConfig.required && '*'}</label>
                      <input
                        type="url"
                        {...register('residenceProof.fileUrl', { required: residenceProofConfig.required ? 'Bắt buộc nhập link minh chứng' : false })}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all bg-white"
                        placeholder={residenceProofConfig.placeholder || "https://drive.google.com/file/d/..."}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={handlePrevSubStep}
            className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentSubStep === 1 ? 'Quay lại' : 'Trở về phần trước'}
          </button>
          <div className="flex gap-3">
            {currentSubStep < 4 ? (
              <button
                type="button"
                onClick={handleNextSubStep}
                className="flex items-center gap-2 bg-brand-red text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-red-900/20 hover:bg-brand-red-dark transition-all active:scale-95"
              >
                Tiếp tục
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const isValid = await trigger();
                  if (!isValid) {
                    setShowConfirmModal(true);
                  } else {
                    const isEligible = !showActivities && checkPart3Eligibility();
                    onSave({ ...watch(), isEligible }, false, false);
                  }
                }}
                disabled={saving}
                className="flex items-center gap-2 bg-brand-red text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-red-900/20 hover:bg-brand-red-dark transition-all active:scale-95 disabled:opacity-50"
              >
                Tiếp tục
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Thông tin chưa đầy đủ hoặc không hợp lệ"
        message="Bạn chưa điền đầy đủ hoặc điền sai một số thông tin bắt buộc. Bạn có chắc chắn muốn lưu tạm và tiếp tục không?"
        errors={getErrorMessages()}
        confirmText="Lưu và tiếp tục"
        cancelText="Kiểm tra lại"
        onConfirm={() => {
          setShowConfirmModal(false);
          if (pendingNextStep) {
            setCurrentSubStep(pendingNextStep);
            setPendingNextStep(null);
          } else {
            const isEligible = !showActivities && checkPart3Eligibility();
            onSave({ ...watch(), isEligible }, false, false);
          }
        }}
        onCancel={() => {
          setShowConfirmModal(false);
          setPendingNextStep(null);
        }}
      />

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedActivity.name}</h3>
              <button onClick={() => setSelectedActivity(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đơn vị tổ chức</p>
                <p className="text-sm text-gray-900 font-medium">{selectedActivity.organizer}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thời gian</p>
                <p className="text-sm text-gray-900 font-medium">{selectedActivity.time}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chi tiết hoạt động</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedActivity.details}</p>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setSelectedActivity(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
