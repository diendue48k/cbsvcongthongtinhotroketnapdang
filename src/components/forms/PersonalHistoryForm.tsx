import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Eye, EyeOff, ChevronRight, ChevronLeft, Loader2, Info, AlertTriangle, Sparkles } from 'lucide-react';
import FieldFeedback from '../FieldFeedback';
import { useFormConfig } from '../../contexts/FormConfigContext';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from '../ConfirmModal';

interface PersonalHistoryFormProps {
  initialData: any;
  onSave: (data: any, isSubmit?: boolean, stayOnStep?: boolean) => void;
  onDataChange?: (data: any) => void;
  onBack: () => void;
  saving: boolean;
  isAdmin?: boolean;
  fieldFeedback?: Record<string, string>;
  onFeedbackChange?: (fieldPath: string, value: string) => void;
}

export default function PersonalHistoryForm({ initialData, onSave, onDataChange, onBack, saving, isAdmin = false, fieldFeedback = {}, onFeedbackChange }: PersonalHistoryFormProps) {
  const { config } = useFormConfig();
  // Handle migration from old array format to new object format
  const defaultHistory = Array.isArray(initialData) ? initialData : (initialData?.history?.length > 0 ? initialData.history : [
    { timeRange: '', description: '' }
  ]);
  const defaultJobHistory = initialData?.jobHistory?.length > 0 ? initialData.jobHistory : [
    { startDate: '', endDate: '', description: '', position: '' }
  ];
  const defaultCurrentResidence = Array.isArray(initialData) ? '' : (initialData?.currentResidence || '');

  const { register, control, trigger, formState: { errors }, watch } = useForm<any>({
    mode: 'onChange',
    defaultValues: {
      history: defaultHistory,
      jobHistory: defaultJobHistory,
      currentResidence: defaultCurrentResidence
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

  const historyValues = watch('history');
  const jobHistoryValues = watch('jobHistory');

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "history"
  });

  const { fields: jobFields, append: appendJob, remove: removeJob } = useFieldArray({
    control,
    name: "jobHistory"
  });

  const handleAutoSuggest = () => {
    replace([
      { timeRange: '... - ...', description: 'Còn nhỏ ở với bố mẹ tại...' },
      { timeRange: '... - ...', description: 'Học sinh trường Tiểu học...' },
      { timeRange: '... - ...', description: 'Học sinh trường Trung học cơ sở...' },
      { timeRange: '... - ...', description: 'Học sinh trường Trung học phổ thông...' },
      { timeRange: '... - nay', description: 'Sinh viên trường Đại học...' }
    ]);
  };

  const validateNoDots = (value: string) => {
    if (value && value.includes('...')) {
      return 'Vui lòng điền thông tin cụ thể, không để trống (...)';
    }
    return true;
  };

  const validateDescription = (value: string) => {
    return validateNoDots(value); 
  };

  const checkContinuity = (history: any[]) => {
    const warnings: string[] = [];
    for (let i = 0; i < history.length - 1; i++) {
      const currentEnd = history[i]?.timeRange?.split('-')[1]?.trim();
      const nextStart = history[i + 1]?.timeRange?.split('-')[0]?.trim();
      if (currentEnd && nextStart && currentEnd !== nextStart && currentEnd !== 'nay' && currentEnd !== '...' && nextStart !== '...') {
        warnings.push(`Giai đoạn ${i + 1} và ${i + 2} có vẻ không liên tục (${currentEnd} -> ${nextStart}).`);
      }
    }
    return warnings;
  };

  const checkJobContinuity = (jobHistory: any[]) => {
    const warnings: string[] = [];
    for (let i = 0; i < jobHistory.length - 1; i++) {
      const currentEnd = jobHistory[i]?.endDate?.trim();
      const nextStart = jobHistory[i + 1]?.startDate?.trim();
      if (currentEnd && nextStart && currentEnd !== nextStart && currentEnd !== 'nay' && currentEnd !== '...' && nextStart !== '...') {
        warnings.push(`Công việc ${i + 1} và ${i + 2} có vẻ không liên tục (${currentEnd} -> ${nextStart}).`);
      }
    }
    return warnings;
  };

  const checkFormat = (desc: string) => {
    if (!desc) return null;
    if (desc.includes('...') || desc.length < 10) return null;
    const hasOldLocation = desc.includes('Trước đây là') || desc.includes('trước đây là');
    const hasLocationKeywords = desc.toLowerCase().includes('tại') || desc.toLowerCase().includes('xã') || desc.toLowerCase().includes('phường') || desc.toLowerCase().includes('tỉnh');
    if (hasLocationKeywords && !hasOldLocation) {
      return 'Lưu ý: Nếu có thay đổi địa danh hành chính, vui lòng ghi rõ (Trước đây là...) theo ví dụ.';
    }
    return null;
  };

  const getErrorMessages = () => {
    const errorList: string[] = [];
    if (errors.history) errorList.push('Tóm tắt quá trình từ thời niên thiếu');
    if (errors.jobHistory) errorList.push('Nghề nghiệp và chức vụ');
    if (errors.currentResidence) errorList.push('Nơi cư trú hiện nay');
    
    if (errors.customFields) {
       Object.keys(errors.customFields).forEach(customKey => {
         const customField = config.customFields?.find(f => f.id === customKey);
         if (customField) errorList.push(customField.label);
       });
    }
    return errorList;
  };

  const continuityWarnings = checkContinuity(historyValues || []);
  const jobContinuityWarnings = checkJobContinuity(jobHistoryValues || []);
  const [showSample, setShowSample] = useState(false);

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-red/10 text-brand-red rounded-xl flex items-center justify-center">
                <Info size={20} />
              </div>
              Lịch sử chính trị của bản thân
            </h3>
            <p className="text-sm text-gray-500 mt-1">Tóm tắt quá trình từ thời niên thiếu cho đến nay.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowSample(!showSample)}
              className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              {showSample ? <><EyeOff size={16} /> Ẩn mẫu</> : <><Eye size={16} /> Xem mẫu</>}
            </button>
            <button
              type="button"
              onClick={handleAutoSuggest}
              className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              <Sparkles size={16} />
              Gợi ý hoàn thiện
            </button>
            <button
              type="button"
              onClick={() => append({ timeRange: '', description: '' })}
              className="flex items-center gap-2 text-xs font-bold text-brand-red hover:text-brand-red-dark bg-red-50 px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              <Plus size={16} /> Thêm giai đoạn
            </button>
          </div>
        </div>
        
        <AnimatePresence>
          {showSample && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gray-50 p-6 rounded-2xl mb-8 text-sm text-gray-800 border border-gray-200 shadow-inner">
                <p className="font-bold mb-4 text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-red"></div>
                  Mẫu kê khai Lịch sử chính trị bản thân:
                </p>
                {config.templates?.personalHistory ? (
                  <div className="whitespace-pre-wrap font-mono text-xs text-gray-600 leading-relaxed bg-white p-4 rounded-xl border border-gray-100">
                    {config.templates.personalHistory}
                  </div>
                ) : (
                  <div className="space-y-3 font-mono text-xs bg-white p-4 rounded-xl border border-gray-100">
                    <div className="grid grid-cols-12 gap-4 border-b border-gray-50 pb-2"><div className="col-span-3 font-bold text-brand-red">1994 - 2000</div><div className="col-span-9">Còn nhỏ, sinh sống cùng bố mẹ tại Xã Vĩnh Thủy, Huyện Vĩnh Linh, tỉnh Quảng Trị.</div></div>
                    <div className="grid grid-cols-12 gap-4 border-b border-gray-50 pb-2"><div className="col-span-3 font-bold text-brand-red">2000 - 2005</div><div className="col-span-9">Học sinh trường Tiểu học Vĩnh Thủy, Huyện Vĩnh Linh, tỉnh Quảng Trị.</div></div>
                    <div className="grid grid-cols-12 gap-4 border-b border-gray-50 pb-2"><div className="col-span-3 font-bold text-brand-red">2005 - 2009</div><div className="col-span-9">Học sinh trường THCS Vĩnh Thủy, Huyện Vĩnh Linh, tỉnh Quảng Trị.</div></div>
                    <div className="grid grid-cols-12 gap-4 border-b border-gray-50 pb-2"><div className="col-span-3 font-bold text-brand-red">2009 - 2012</div><div className="col-span-9">Học sinh trường THPT Vĩnh Linh, Huyện Vĩnh Linh, tỉnh Quảng Trị.</div></div>
                    <div className="grid grid-cols-12 gap-4 border-b border-gray-50 pb-2"><div className="col-span-3 font-bold text-brand-red">2012 - 2016</div><div className="col-span-9">Sinh viên trường Đại học Bách Khoa Hà Nội, Quận Hai Bà Trưng, TP. Hà Nội.</div></div>
                    <div className="grid grid-cols-12 gap-4"><div className="col-span-3 font-bold text-brand-red">2016 - nay</div><div className="col-span-9">Làm kỹ sư phần mềm tại Công ty ABC, Quận Cầu Giấy, TP. Hà Nội.</div></div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-blue-50 p-6 rounded-2xl mb-8 text-sm text-blue-800 border border-blue-100 shadow-sm">
          <p className="font-bold mb-3 flex items-center gap-2">
            <Info size={18} className="text-blue-600" />
            Hướng dẫn kê khai:
          </p>
          <ul className="space-y-2 list-none text-xs">
            <li className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
              Tóm tắt quá trình từ thời niên thiếu cho đến nay. Các mốc thời gian phải liên tục.
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
              Ghi rõ địa danh hành chính (cũ và mới nếu có thay đổi).
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
              <span>Ví dụ: <strong className="text-blue-900">1994 – 2000</strong>: Còn nhỏ, sinh sống cùng bố mẹ tại Xã Vĩnh Thủy, tỉnh Quảng Trị (Trước đây là Xã Vĩnh Thủy, Huyện Vĩnh Linh, tỉnh Quảng Trị).</span>
            </li>
          </ul>
        </div>

        {continuityWarnings.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-50 p-4 rounded-2xl mb-8 text-sm text-yellow-800 border border-yellow-200 flex gap-4 shadow-sm"
          >
            <AlertTriangle className="text-yellow-600 shrink-0" size={24} />
            <div>
              <p className="font-bold mb-1">Cảnh báo mốc thời gian:</p>
              <ul className="list-disc pl-5 text-xs space-y-1">
                {continuityWarnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {fields.map((field, index) => {
              const formatWarning = checkFormat(historyValues?.[index]?.description);
              return (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                key={field.id} 
                className="flex flex-col md:flex-row gap-4 items-start bg-gray-50/50 p-5 rounded-2xl border border-gray-100 hover:border-brand-red/20 transition-all group"
              >
                <div className="w-full md:w-1/4">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Giai đoạn *</label>
                  <input
                    {...register(`history.${index}.timeRange` as const, { 
                      required: 'Bắt buộc',
                      validate: validateNoDots
                    })}
                    placeholder="VD: 1994 - 2000"
                    className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all bg-white ${errors?.history?.[index]?.timeRange ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {errors?.history?.[index]?.timeRange && (
                    <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.history[index]?.timeRange?.message || 'Bắt buộc'}</p>
                  )}
                  <FieldFeedback fieldPath={`personalHistory.history.${index}.timeRange`} feedback={fieldFeedback[`personalHistory.history.${index}.timeRange`]} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
                </div>
                <div className="w-full md:w-3/4 flex gap-3">
                  <div className="flex-grow">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Mô tả chi tiết *</label>
                    <textarea
                      {...register(`history.${index}.description` as const, { 
                        required: 'Bắt buộc',
                        validate: validateDescription
                      })}
                      rows={2}
                      placeholder="Còn nhỏ, sinh sống cùng bố mẹ tại..."
                      className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all bg-white ${errors?.history?.[index]?.description ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {formatWarning && (
                      <p className="text-yellow-600 text-[10px] mt-1 italic font-medium flex items-center gap-1">
                        <Info size={12} />
                        {formatWarning}
                      </p>
                    )}
                    {errors?.history?.[index]?.description && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.history[index]?.description?.message || 'Bắt buộc'}</p>
                    )}
                    <FieldFeedback fieldPath={`personalHistory.history.${index}.description`} feedback={fieldFeedback[`personalHistory.history.${index}.description`]} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-gray-400 hover:text-red-500 p-2 h-fit mt-6 bg-white rounded-xl border border-gray-100 hover:border-red-100 transition-all active:scale-95 shadow-sm"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </motion.div>
            )})}
          </AnimatePresence>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-100">
          <label className="block text-sm font-bold text-gray-700 mb-2">Hiện đang cư trú/tạm trú tại *</label>
          <p className="text-xs text-gray-500 mb-4">Ghi rõ địa chỉ hiện tại bạn đang sinh sống (Tổ/Thôn/Xóm... Xã/Phường... Tỉnh/Thành phố)</p>
          <input
            {...register('currentResidence', { 
              required: 'Bắt buộc nhập',
              validate: validateNoDots
            })}
            placeholder="VD: Số nhà 123, đường ABC, phường XYZ, quận 1, TP. HCM"
            className={`w-full px-5 py-3 text-sm border rounded-2xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all ${errors?.currentResidence ? 'border-red-500 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'}`}
          />
          {errors?.currentResidence && (
            <p className="text-red-500 text-xs mt-2 font-medium">{errors.currentResidence.message as string}</p>
          )}
          <FieldFeedback fieldPath="personalHistory.currentResidence" feedback={fieldFeedback['personalHistory.currentResidence']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-8 border-b pb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-red/10 text-brand-red rounded-xl flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            Những công việc, chức vụ đã qua
          </h3>
          <button
            type="button"
            onClick={() => appendJob({ startDate: '', endDate: '', description: '', position: '' })}
            className="flex items-center gap-2 text-xs font-bold text-brand-red hover:text-brand-red-dark bg-red-50 px-4 py-2 rounded-xl transition-all active:scale-95"
          >
            <Plus size={16} /> Thêm công việc
          </button>
        </div>

        <div className="bg-blue-50 p-6 rounded-2xl mb-8 text-sm text-blue-800 border border-blue-100 shadow-sm">
          <p className="font-bold mb-3 flex items-center gap-2">
            <Info size={18} className="text-blue-600" />
            Hướng dẫn kê khai:
          </p>
          <ul className="space-y-2 list-none text-xs">
            <li className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
              Khai dạng bảng (Từ tháng/năm đến tháng/năm; Làm việc gì, ở đâu; Chức vụ) đảm bảo tính liên tục theo tháng.
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
              <span>Ví dụ: <strong className="text-blue-900">09/2023 – nay</strong>: Sinh viên lớp 48K22.3, Khoa Thương mại điện tử, Trường Đại học Kinh tế, Đại học Đà Nẵng. Chức vụ: Sinh viên.</span>
            </li>
          </ul>
        </div>

        {jobContinuityWarnings.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-50 p-4 rounded-2xl mb-8 text-sm text-yellow-800 border border-yellow-200 flex gap-4 shadow-sm"
          >
            <AlertTriangle className="text-yellow-600 shrink-0" size={24} />
            <div>
              <p className="font-bold mb-1">Cảnh báo mốc thời gian công việc:</p>
              <ul className="list-disc pl-5 text-xs space-y-1">
                {jobContinuityWarnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {jobFields.map((field, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                key={field.id} 
                className="flex flex-col md:flex-row gap-6 items-start border border-gray-100 p-6 rounded-3xl bg-gray-50/50 hover:border-brand-red/20 transition-all group"
              >
                <div className="w-full md:w-1/4 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Từ tháng/năm *</label>
                    <input
                      {...register(`jobHistory.${index}.startDate` as const, { required: 'Bắt buộc' })}
                      placeholder="VD: 09/2023"
                      className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all bg-white ${errors?.jobHistory?.[index]?.startDate ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors?.jobHistory?.[index]?.startDate && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.jobHistory[index]?.startDate?.message || 'Bắt buộc'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Đến tháng/năm *</label>
                    <input
                      {...register(`jobHistory.${index}.endDate` as const, { required: 'Bắt buộc' })}
                      placeholder="VD: nay"
                      className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all bg-white ${errors?.jobHistory?.[index]?.endDate ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors?.jobHistory?.[index]?.endDate && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.jobHistory[index]?.endDate?.message || 'Bắt buộc'}</p>
                    )}
                  </div>
                </div>
                
                <div className="w-full md:w-3/4 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Làm việc gì, ở đâu *</label>
                    <textarea
                      {...register(`jobHistory.${index}.description` as const, { required: 'Bắt buộc' })}
                      rows={2}
                      placeholder="Sinh viên lớp 48K22.3, Khoa Thương mại điện tử, Trường Đại học Kinh tế..."
                      className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all bg-white ${errors?.jobHistory?.[index]?.description ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors?.jobHistory?.[index]?.description && (
                      <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.jobHistory[index]?.description?.message || 'Bắt buộc'}</p>
                    )}
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="flex-grow">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Chức vụ *</label>
                      <input
                        {...register(`jobHistory.${index}.position` as const, { required: 'Bắt buộc' })}
                        placeholder="VD: Sinh viên, Lớp trưởng, Bí thư..."
                        className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all bg-white ${errors?.jobHistory?.[index]?.position ? 'border-red-500' : 'border-gray-200'}`}
                      />
                      {errors?.jobHistory?.[index]?.position && (
                        <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.jobHistory[index]?.position?.message || 'Bắt buộc'}</p>
                      )}
                    </div>
                    {jobFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeJob(index)}
                        className="text-gray-400 hover:text-red-500 p-2 h-fit mt-6 bg-white rounded-xl border border-gray-100 hover:border-red-100 transition-all active:scale-95 shadow-sm"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Render Custom Fields for Personal History */}
      {config.customFields && config.customFields.filter(f => f.section === 'personalHistory').length > 0 && (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h4 className="text-lg font-bold text-gray-900 mb-6 border-b pb-4">Thông tin bổ sung (Lịch sử bản thân)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {config.customFields.filter(f => f.section === 'personalHistory').map(field => (
              <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {field.label} {field.required && '*'}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    {...register(`customFields.${field.id}`, { required: field.required ? 'Bắt buộc nhập' : false })}
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all bg-gray-50/50"
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : (
                  <input
                    type={field.type}
                    {...register(`customFields.${field.id}`, { required: field.required ? 'Bắt buộc nhập' : false })}
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all bg-gray-50/50"
                    placeholder={field.placeholder}
                  />
                )}
                {errors.customFields?.[field.id] && <p className="text-red-500 text-xs mt-2 font-medium">{errors.customFields[field.id]?.message as string}</p>}
                <FieldFeedback fieldPath={`personalHistory.customFields.${field.id}`} feedback={fieldFeedback[`personalHistory.customFields.${field.id}`]} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-8 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={async () => {
              const isValid = await trigger();
              if (!isValid) {
                setShowConfirmModal(true);
              } else {
                onSave(watch(), false, false);
              }
            }}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-red text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-red-900/20 hover:bg-brand-red-dark transition-all active:scale-95 disabled:opacity-50"
          >
            Tiếp tục
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
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
    </motion.form>
  );
}
