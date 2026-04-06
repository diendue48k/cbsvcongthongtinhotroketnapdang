import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import FieldFeedback from '../FieldFeedback';
import { useFormConfig } from '../../contexts/FormConfigContext';
import ConfirmModal from '../ConfirmModal';

interface OtherInfoFormProps {
  initialData: any;
  onSave: (data: any, isSubmit?: boolean, stayOnStep?: boolean) => void;
  onDataChange?: (data: any) => void;
  onBack: () => void;
  saving: boolean;
  isAdmin?: boolean;
  fieldFeedback?: Record<string, string>;
  onFeedbackChange?: (fieldPath: string, value: string) => void;
}

export default function OtherInfoForm({ initialData, onSave, onDataChange, onBack, saving, isAdmin = false, fieldFeedback = {}, onFeedbackChange }: OtherInfoFormProps) {
  const { config } = useFormConfig();
  const { register, control, trigger, formState: { errors }, watch } = useForm<any>({
    mode: 'onChange',
    defaultValues: {
      historicalCharacteristics: initialData?.historicalCharacteristics || config.templates?.otherInfo || 'Từ nhỏ đến nay: Luôn chấp hành tốt các chủ trương, đường lối chính sách của Đảng và pháp luật của Nhà nước',
      abroadTrips: initialData?.abroadTrips?.length > 0 ? initialData.abroadTrips : [],
      rewards: initialData?.rewards?.length > 0 ? initialData.rewards : [],
      disciplines: initialData?.disciplines?.length > 0 ? initialData.disciplines : []
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

  const { fields: abroadFields, append: appendAbroad, remove: removeAbroad } = useFieldArray({
    control,
    name: "abroadTrips"
  });

  const { fields: rewardFields, append: appendReward, remove: removeReward } = useFieldArray({
    control,
    name: "rewards"
  });

  const { fields: disciplineFields, append: appendDiscipline, remove: removeDiscipline } = useFieldArray({
    control,
    name: "disciplines"
  });

  const getFieldConfig = (fieldId: string, defaultLabel: string, defaultRequired: boolean = true) => {
    const fieldConfig = config.fields[fieldId];
    return {
      label: fieldConfig?.label || defaultLabel,
      placeholder: fieldConfig?.placeholder || '',
      required: fieldConfig?.required !== false ? defaultRequired : false,
      hidden: fieldConfig?.hidden === true,
    };
  };

  const historicalCharacteristicsConfig = getFieldConfig('otherInfo.historicalCharacteristics', 'Đặc điểm lịch sử');
  const rewardsConfig = getFieldConfig('otherInfo.rewards', 'Khen thưởng', false);
  const disciplinesConfig = getFieldConfig('otherInfo.disciplines', 'Kỷ luật', false);
  const abroadTripsConfig = getFieldConfig('otherInfo.abroadTrips', 'Đi nước ngoài', false);

  const getErrorMessages = () => {
    const errorList: string[] = [];
    if (errors.historicalCharacteristics) errorList.push('Đặc điểm lịch sử (Nhận xét chung)');
    if (errors.abroadTrips) errorList.push('Đi nước ngoài');
    if (errors.rewards) errorList.push('Khen thưởng');
    if (errors.disciplines) errorList.push('Kỷ luật');
    
    if (errors.customFields) {
       Object.keys(errors.customFields).forEach(customKey => {
         const customField = config.customFields?.find(f => f.id === customKey);
         if (customField) errorList.push(customField.label);
       });
    }
    return errorList;
  };

  return (
    <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
      {/* Đặc điểm lịch sử */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Đặc điểm lịch sử</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nhận xét chung *</label>
          <textarea
            {...register('historicalCharacteristics', { required: 'Bắt buộc nhập' })}
            rows={3}
            className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-brand-red focus:border-brand-red ${errors?.historicalCharacteristics ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors?.historicalCharacteristics && (
            <p className="text-red-500 text-xs mt-1">{errors.historicalCharacteristics.message as string}</p>
          )}
          <FieldFeedback fieldPath="otherInfo.historicalCharacteristics" feedback={fieldFeedback['otherInfo.historicalCharacteristics']} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
        </div>
      </div>

      {/* Đi nước ngoài */}
      <div>
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-medium text-gray-900">Đi nước ngoài</h3>
          <button
            type="button"
            onClick={() => appendAbroad({ timeRange: '', details: '' })}
            className="flex items-center gap-1 text-sm text-brand-red hover:text-brand-red-dark bg-red-50 px-3 py-1 rounded-md"
          >
            <Plus size={16} /> Thêm chuyến đi
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Chú ý: Chỉ xuất các chuyến đi nước ngoài từ 3 tháng trở lên. Nếu không có, để trống (hệ thống sẽ tự in chữ "Không").</p>

        {abroadFields.length === 0 ? (
          <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-md text-center border border-gray-200">
            Không có chuyến đi nước ngoài nào từ 3 tháng trở lên.
          </div>
        ) : (
          <div className="space-y-4">
            {abroadFields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start border border-gray-200 p-4 rounded-md bg-gray-50">
                <div className="w-1/3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Thời gian (Từ tháng/năm - Đến tháng/năm) *</label>
                  <input
                    {...register(`abroadTrips.${index}.timeRange` as const, { required: 'Bắt buộc' })}
                    placeholder="VD: 01/2020 - 06/2020"
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-brand-red focus:border-brand-red ${errors?.abroadTrips?.[index]?.timeRange ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors?.abroadTrips?.[index]?.timeRange && (
                    <p className="text-red-500 text-xs mt-1">{errors.abroadTrips[index]?.timeRange?.message || 'Bắt buộc'}</p>
                  )}
                </div>
                <div className="w-2/3 flex gap-2 items-start">
                  <div className="flex-grow">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nội dung (Đi đâu, làm gì) *</label>
                    <textarea
                      {...register(`abroadTrips.${index}.details` as const, { required: 'Bắt buộc' })}
                      rows={2}
                      placeholder="Đi học trao đổi tại Nhật Bản..."
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-brand-red focus:border-brand-red ${errors?.abroadTrips?.[index]?.details ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors?.abroadTrips?.[index]?.details && (
                      <p className="text-red-500 text-xs mt-1">{errors.abroadTrips[index]?.details?.message || 'Bắt buộc'}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAbroad(index)}
                    className="text-red-500 hover:text-red-700 p-2 h-fit mt-5"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Khen thưởng */}
      <div>
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-medium text-gray-900">Khen thưởng</h3>
          <button
            type="button"
            onClick={() => appendReward({ monthYear: '', reason: '', form: '' })}
            className="flex items-center gap-1 text-sm text-brand-red hover:text-brand-red-dark bg-red-50 px-3 py-1 rounded-md"
          >
            <Plus size={16} /> Thêm khen thưởng
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Chú ý: Chỉ xuất các khen thưởng từ bằng khen trở lên. Nếu không có, để trống (hệ thống sẽ tự in chữ "Không").</p>

        {rewardFields.length === 0 ? (
          <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-md text-center border border-gray-200">
            Không có khen thưởng nào từ bằng khen trở lên.
          </div>
        ) : (
          <div className="space-y-4">
            {rewardFields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start border border-gray-200 p-4 rounded-md bg-gray-50">
                <div className="w-1/4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tháng/năm *</label>
                  <input
                    {...register(`rewards.${index}.monthYear` as const, { required: 'Bắt buộc' })}
                    placeholder="VD: 05/2023"
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-brand-red focus:border-brand-red ${errors?.rewards?.[index]?.monthYear ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors?.rewards?.[index]?.monthYear && (
                    <p className="text-red-500 text-xs mt-1">{errors.rewards[index]?.monthYear?.message || 'Bắt buộc'}</p>
                  )}
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lý do *</label>
                  <input
                    {...register(`rewards.${index}.reason` as const, { required: 'Bắt buộc' })}
                    placeholder="Đạt thành tích xuất sắc trong..."
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-brand-red focus:border-brand-red ${errors?.rewards?.[index]?.reason ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors?.rewards?.[index]?.reason && (
                    <p className="text-red-500 text-xs mt-1">{errors.rewards[index]?.reason?.message || 'Bắt buộc'}</p>
                  )}
                </div>
                <div className="w-1/4 flex gap-2 items-start">
                  <div className="flex-grow">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Hình thức *</label>
                    <input
                      {...register(`rewards.${index}.form` as const, { required: 'Bắt buộc' })}
                      placeholder="Bằng khen của..."
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-brand-red focus:border-brand-red ${errors?.rewards?.[index]?.form ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors?.rewards?.[index]?.form && (
                      <p className="text-red-500 text-xs mt-1">{errors.rewards[index]?.form?.message || 'Bắt buộc'}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeReward(index)}
                    className="text-red-500 hover:text-red-700 p-2 h-fit mt-5"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kỷ luật */}
      <div>
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-medium text-gray-900">Kỷ luật</h3>
          <button
            type="button"
            onClick={() => appendDiscipline({ monthYear: '', reason: '', form: '' })}
            className="flex items-center gap-1 text-sm text-brand-red hover:text-brand-red-dark bg-red-50 px-3 py-1 rounded-md"
          >
            <Plus size={16} /> Thêm kỷ luật
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Nếu không có, để trống (hệ thống sẽ tự in chữ "Không").</p>

        {disciplineFields.length === 0 ? (
          <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-md text-center border border-gray-200">
            Không có kỷ luật nào.
          </div>
        ) : (
          <div className="space-y-4">
            {disciplineFields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start border border-gray-200 p-4 rounded-md bg-gray-50">
                <div className="w-1/4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tháng/năm *</label>
                  <input
                    {...register(`disciplines.${index}.monthYear` as const, { required: 'Bắt buộc' })}
                    placeholder="VD: 05/2023"
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-brand-red focus:border-brand-red ${errors?.disciplines?.[index]?.monthYear ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors?.disciplines?.[index]?.monthYear && (
                    <p className="text-red-500 text-xs mt-1">{errors.disciplines[index]?.monthYear?.message || 'Bắt buộc'}</p>
                  )}
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lý do *</label>
                  <input
                    {...register(`disciplines.${index}.reason` as const, { required: 'Bắt buộc' })}
                    placeholder="Vi phạm quy định..."
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-brand-red focus:border-brand-red ${errors?.disciplines?.[index]?.reason ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors?.disciplines?.[index]?.reason && (
                    <p className="text-red-500 text-xs mt-1">{errors.disciplines[index]?.reason?.message || 'Bắt buộc'}</p>
                  )}
                </div>
                <div className="w-1/4 flex gap-2 items-start">
                  <div className="flex-grow">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Hình thức *</label>
                    <input
                      {...register(`disciplines.${index}.form` as const, { required: 'Bắt buộc' })}
                      placeholder="Khiển trách..."
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-brand-red focus:border-brand-red ${errors?.disciplines?.[index]?.form ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors?.disciplines?.[index]?.form && (
                      <p className="text-red-500 text-xs mt-1">{errors.disciplines[index]?.form?.message || 'Bắt buộc'}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDiscipline(index)}
                    className="text-red-500 hover:text-red-700 p-2 h-fit mt-5"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Render Custom Fields for Other Info */}
      {config.customFields && config.customFields.filter(f => f.section === 'otherInfo').length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-800 mb-4">Thông tin bổ sung (Thông tin khác)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {config.customFields.filter(f => f.section === 'otherInfo').map(field => (
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
                <FieldFeedback fieldPath={`otherInfo.customFields.${field.id}`} feedback={fieldFeedback[`otherInfo.customFields.${field.id}`]} onFeedbackChange={onFeedbackChange} isAdmin={isAdmin} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
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
            className="bg-brand-red text-white px-6 py-2 rounded-md hover:bg-brand-red-dark transition-colors disabled:opacity-50"
          >
            Tiếp tục
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
    </form>
  );
}
