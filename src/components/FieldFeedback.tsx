import React, { useState } from 'react';
import { Check, Send, MessageSquarePlus, X } from 'lucide-react';

interface FieldFeedbackProps {
  fieldPath: string;
  feedback?: string;
  onFeedbackChange?: (fieldPath: string, value: string) => void;
  isAdmin: boolean;
}

export default function FieldFeedback({ fieldPath, feedback, onFeedbackChange, isAdmin }: FieldFeedbackProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isFixed = feedback?.includes('(Đã sửa)');

  if (isAdmin) {
    if (!feedback && !isEditing) {
      return (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-brand-red transition-colors"
          >
            <MessageSquarePlus size={12} /> Thêm nhận xét
          </button>
        </div>
      );
    }

    return (
      <div className="mt-1 flex gap-2 items-start">
        <textarea
          value={feedback || ''}
          onChange={(e) => onFeedbackChange && onFeedbackChange(fieldPath, e.target.value)}
          placeholder="Nhập nhận xét hoặc yêu cầu sửa đổi..."
          rows={2}
          className={`flex-grow px-2.5 py-1.5 text-sm border rounded-md placeholder-yellow-500 focus:outline-none focus:ring-2 resize-none transition-all ${
            isFixed 
              ? 'border-green-300 bg-green-50 text-green-800 focus:ring-green-500/50' 
              : 'border-yellow-300 bg-yellow-50/50 text-yellow-900 focus:ring-yellow-500/50'
          }`}
          autoFocus={isEditing && !feedback}
        />
        <div className="flex flex-col gap-1 flex-shrink-0">
          {feedback ? (
            <button
              type="button"
              onClick={() => {
                onFeedbackChange && onFeedbackChange(fieldPath, '');
                setIsEditing(false);
              }}
              className="flex items-center justify-center px-2 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors shadow-sm"
              title="Đánh dấu đã hoàn tất và xóa nhận xét"
            >
              <Check size={14} className="mr-1" /> Hoàn tất
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Hủy"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (feedback) {
    return (
      <div className={`mt-1.5 text-sm p-2 rounded-md border flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2 ${
        isFixed 
          ? 'text-green-700 bg-green-50 border-green-200' 
          : 'text-red-700 bg-red-50 border-red-200'
      }`}>
        <div className="flex-1">
          <span className="font-bold mr-1">{isFixed ? 'Đã báo sửa:' : 'Yêu cầu sửa:'}</span> 
          <span className="whitespace-pre-wrap">{feedback.replace('(Đã sửa)', '').trim()}</span>
        </div>
        {!isFixed && onFeedbackChange && (
          <button
            type="button"
            onClick={() => onFeedbackChange(fieldPath, `${feedback} (Đã sửa)`)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm flex-shrink-0"
          >
            <Send size={14} /> Báo cáo đã sửa
          </button>
        )}
      </div>
    );
  }

  return null;
}
