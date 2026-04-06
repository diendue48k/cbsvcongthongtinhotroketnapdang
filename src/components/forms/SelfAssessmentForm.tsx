import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import FieldFeedback from '../FieldFeedback';
import { useFormConfig } from '../../contexts/FormConfigContext';
import { motion } from 'motion/react';
import ConfirmModal from '../ConfirmModal';

interface SelfAssessmentFormProps {
  initialData: any;
  onSave: (data: any, isSubmit?: boolean, stayOnStep?: boolean) => void;
  onDataChange?: (data: any) => void;
  onBack: () => void;
  saving: boolean;
  isAdmin?: boolean;
  fieldFeedback?: Record<string, string>;
  onFeedbackChange?: (fieldPath: string, value: string) => void;
}

export default function SelfAssessmentForm({ initialData, onSave, onDataChange, onBack, saving, isAdmin = false, fieldFeedback = {}, onFeedbackChange }: SelfAssessmentFormProps) {
  const { config } = useFormConfig();
  const { register, trigger, setValue, watch, formState: { errors } } = useForm({
    mode: 'onChange',
    defaultValues: initialData || {}
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const watchedData = watch();
  const lastDataRef = React.useRef(JSON.stringify(watchedData));

  useEffect(() => {
    const currentDataStr = JSON.stringify(watchedData);
    if (onDataChange && currentDataStr !== lastDataRef.current) {
      lastDataRef.current = currentDataStr;
      onDataChange(watchedData);
    }
  }, [watchedData, onDataChange]);

  useEffect(() => {
    if (!initialData?.selfAssessment && config.templates?.selfAssessment) {
      setValue('selfAssessment', config.templates.selfAssessment);
    }
  }, [config.templates?.selfAssessment, initialData?.selfAssessment, setValue]);

  const getErrorMessages = () => {
    const errorList: string[] = [];
    if (errors.selfAssessment) errorList.push('Tự nhận xét bản thân');
    return errorList;
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-red/10 text-brand-red rounded-xl flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          Tự nhận xét bản thân
        </h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Người khai tự nhận xét về ưu, khuyết điểm, phẩm chất chính trị, đạo đức lối sống, năng lực công tác và quan hệ quần chúng. 
          <span className="italic text-brand-red ml-1">Hãy viết một cách trung thực và đầy đủ nhất.</span>
        </p>
        <div className="relative group">
          <textarea
            {...register('selfAssessment', { required: 'Bắt buộc nhập' })}
            rows={10}
            placeholder={config.templates?.selfAssessment || "Tôi tự nhận thấy bản thân có những ưu điểm..."}
            className={`w-full px-6 py-5 text-sm border rounded-2xl focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all bg-gray-50/50 group-hover:bg-white ${errors?.selfAssessment ? 'border-red-500 bg-red-50/30' : 'border-gray-200 shadow-inner'}`}
          />
          {errors?.selfAssessment && (
            <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.selfAssessment.message as string}
            </p>
          )}
          <FieldFeedback fieldPath="selfAssessment.selfAssessment" feedback={fieldFeedback['selfAssessment.selfAssessment']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-3xl p-10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-red/5 rounded-full -ml-16 -mb-16 blur-2xl"></div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-8 text-center uppercase tracking-widest">Cam đoan và ký tên</h3>
        
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <p className="font-bold text-gray-800 text-lg leading-relaxed italic relative">
            <span className="text-4xl text-brand-red/20 absolute -top-4 -left-6 font-serif">"</span>
            Tôi cam đoan đã khai đầy đủ, rõ ràng, trung thực và chịu trách nhiệm trước Đảng về những nội dung đã khai trong lý lịch
            <span className="text-4xl text-brand-red/20 absolute -bottom-8 -right-6 font-serif">"</span>
          </p>
        </div>

        <div className="flex justify-end pr-10">
          <div className="text-center w-72 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm">
            <p className="text-xs text-gray-500 mb-3 font-medium">Ngày ...... tháng ...... năm .........</p>
            <p className="font-black text-gray-900 mb-20 tracking-widest">NGƯỜI KHAI</p>
            <div className="w-full h-px bg-gray-200 mb-2"></div>
            <p className="text-xs text-gray-400 italic">Họ và tên người khai</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-10 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </button>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              const isValid = await trigger();
              if (!isValid) {
                setShowConfirmModal(true);
              } else {
                onSave(watch(), true, false);
              }
            }}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-red text-white px-10 py-3 rounded-xl font-bold text-sm shadow-lg shadow-red-900/20 hover:bg-brand-red-dark transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang nộp...
              </>
            ) : (
              <>
                Hoàn thành & Nộp hồ sơ
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Thông tin chưa đầy đủ hoặc không hợp lệ"
        message="Bạn chưa điền đầy đủ hoặc điền sai một số thông tin bắt buộc. Bạn có chắc chắn muốn nộp hồ sơ không?"
        errors={getErrorMessages()}
        confirmText="Nộp hồ sơ"
        cancelText="Kiểm tra lại"
        onConfirm={() => {
          setShowConfirmModal(false);
          onSave(watch(), true, false);
        }}
        onCancel={() => setShowConfirmModal(false)}
      />
    </motion.form>
  );
}
