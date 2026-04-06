import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link, useSearchParams } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';
import BasicInfoForm from '../components/forms/BasicInfoForm';
import ConditionsForm from '../components/forms/ConditionsForm';
import PersonalHistoryForm from '../components/forms/PersonalHistoryForm';
import FamilyHistoryForm from '../components/forms/FamilyHistoryForm';
import OtherInfoForm from '../components/forms/OtherInfoForm';
import SelfAssessmentForm from '../components/forms/SelfAssessmentForm';
import PrintableCV from '../components/PrintableCV';
import { Eye, X, Download, Loader2, FileText, Home, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STEPS = [
  'Thông tin cơ bản',
  'Điều kiện kết nạp',
  'Lịch sử bản thân',
  'Lịch sử gia đình',
  'Thông tin khác',
  'Tự nhận xét'
];

const getFieldLabel = (path: string) => {
  const parts = path.split('.');
  const section = parts[0];

  if (section === 'basicInfo') {
    const labels: Record<string, string> = {
      profilePhotoUrl: 'Link ảnh thẻ',
      studentId: 'Mã số sinh viên',
      cccd: 'Căn cước công dân',
      fullName: 'Họ và tên',
      dob: 'Ngày sinh',
      class: 'Lớp',
      faculty: 'Khoa',
      gender: 'Giới tính',
      ethnicity: 'Dân tộc',
      religion: 'Tôn giáo',
      zaloPhone: 'Số điện thoại Zalo',
      facebookLink: 'Link Facebook',
      email: 'Email',
      permanentAddress: 'Nơi thường trú',
      temporaryAddress: 'Nơi tạm trú',
      hometown: 'Quê quán',
      birthplace: 'Nơi sinh',
      youthUnionJoinDate: 'Ngày vào Đoàn',
      youthUnionJoinPlace: 'Nơi vào Đoàn',
      discipline: 'Kỷ luật'
    };
    return `Thông tin cơ bản - ${labels[parts[1]] || parts[1]}`;
  }

  if (section === 'conditions') {
    if (parts[1] === 'trainingClasses') {
      const fieldLabels: Record<string, string> = {
        name: 'Ngành học hoặc tên lớp học',
        schoolName: 'Tên trường/Lớp tổ chức',
        startDate: 'Học từ ngày',
        endDate: 'Học đến ngày',
        type: 'Hình thức học',
        certificate: 'Văn bằng, chứng chỉ, trình độ gì',
        certificateUrl: 'Link minh chứng'
      };
      return `Điều kiện kết nạp - Lớp đào tạo, bồi dưỡng - ${fieldLabels[parts[3]] || parts[3]}`;
    }
    if (parts[1] === 'academicTranscriptUrl') return 'Điều kiện kết nạp - Link Bảng điểm học tập, rèn luyện';
    if (parts[1] === 'residenceProof') {
      const fieldLabels: Record<string, string> = {
        type: 'Loại hình cư trú',
        fileUrl: 'Link minh chứng cư trú'
      };
      return `Điều kiện kết nạp - Minh chứng cư trú tại Đà Nẵng - ${fieldLabels[parts[2]] || parts[2]}`;
    }
    if (parts[1] === 'academicScores') {
      const fieldLabels: Record<string, string> = {
        semester: 'Kỳ/Năm học',
        academicScore: 'Điểm học tập',
        trainingScore: 'Điểm rèn luyện'
      };
      return `Điều kiện kết nạp - Điểm học tập (Kỳ ${parseInt(parts[2]) + 1}) - ${fieldLabels[parts[3]] || parts[3]}`;
    }
    if (parts[1] === 'certificates') {
      const fieldLabels: Record<string, string> = {
        monthYear: 'Tháng/Năm cấp',
        name: 'Tên giấy khen',
        issuer: 'Đơn vị cấp',
        fileUrl: 'Link minh chứng'
      };
      return `Điều kiện kết nạp - Minh chứng (${parseInt(parts[2]) + 1}) - ${fieldLabels[parts[3]] || parts[3]}`;
    }
  }

  if (section === 'personalHistory') {
    const fieldLabels: Record<string, string> = {
      timeRange: 'Thời gian',
      description: 'Nội dung'
    };
    return `Lịch sử bản thân - Giai đoạn ${parseInt(parts[1]) + 1} - ${fieldLabels[parts[2]] || parts[2]}`;
  }

  if (section === 'familyHistory') {
    if (parts.length === 3) {
      const fieldLabels: Record<string, string> = {
        relation: 'Quan hệ',
        fullName: 'Họ và tên',
        birthYear: 'Năm sinh',
        deathYear: 'Năm mất',
        hometown: 'Quê quán',
        birthplace: 'Nơi sinh',
        permanentAddress: 'Nơi thường trú',
        religion: 'Tôn giáo',
        ethnicity: 'Dân tộc',
        nationality: 'Quốc tịch',
        job: 'Nghề nghiệp',
        cccd: 'CCCD',
        partyDetails: 'Thông tin Đảng viên',
        rewards: 'Khen thưởng',
        politicalAttitude: 'Thái độ chính trị'
      };
      return `Lịch sử gia đình - Người thân ${parseInt(parts[1]) + 1} - ${fieldLabels[parts[2]] || parts[2]}`;
    }
    if (parts.length === 4 && parts[2] === 'history') {
      return `Lịch sử gia đình - Người thân ${parseInt(parts[1]) + 1} - Quá trình công tác (Giai đoạn ${parseInt(parts[3]) + 1})`;
    }
  }

  return path;
};

export default function ApplicationForm() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = parseInt(searchParams.get('step') || '0');
  
  const setCurrentStep = (step: number) => {
    setSearchParams(prev => {
      prev.set('step', step.toString());
      return prev;
    });
  };

  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    basicInfo: {},
    conditions: { academicScores: [], certificates: [] },
    personalHistory: [],
    familyHistory: [],
    otherInfo: {},
    selfAssessment: {},
    fieldFeedback: {}
  });
  const [loading, setLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [downloadingWord, setDownloadingWord] = useState(false);
  const [showPreview, setShowPreview] = useState(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('preview') === 'true';
  });
  const formRef = React.useRef<any>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading) {
      timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
    } else {
      setLoadingTimeout(false);
    }
    return () => clearTimeout(timeoutId);
  }, [loading]);

  useEffect(() => {
    console.log('ApplicationForm useEffect running', { authLoading, profile: !!profile, id });
    if (authLoading) return;

    if (!profile) {
      console.log('No profile, navigating to login');
      navigate('/login');
      return;
    }

    let unsubscribe: () => void;

    if (id) {
      console.log('Fetching specific application for admin:', id);
      // Fetch specific application for admin
      const docRef = doc(db, 'applications', id);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        console.log('Admin snapshot received, exists:', docSnap.exists());
        if (docSnap.exists()) {
          setApplicationId(docSnap.id);
          setFormData(prev => ({ ...prev, ...docSnap.data() }));
        }
        setLoading(false);
      }, (error) => {
        console.error('Admin snapshot error:', error);
        setLoading(false);
        try {
          handleFirestoreError(error, OperationType.GET, `applications/${id}`);
        } catch (e) {
          // Ignore
        }
      });
    } else {
      console.log('Fetching user application for uid:', profile.uid);
      // Fetch user's application
      const q = query(collection(db, 'applications'), where('userId', '==', profile.uid));
      unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('User snapshot received, empty:', querySnapshot.empty);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setApplicationId(doc.id);
          setFormData(prev => ({ ...prev, ...doc.data() }));
        } else {
          // No application exists yet, but we're done checking
          setApplicationId(null);
        }
        setLoading(false);
      }, (error) => {
        console.error('User snapshot error:', error);
        setLoading(false);
        try {
          handleFirestoreError(error, OperationType.GET, 'applications');
        } catch (e) {
          // Ignore
        }
      });
    }

    return () => {
      console.log('Cleaning up ApplicationForm useEffect');
      if (unsubscribe) unsubscribe();
    };
  }, [profile, id, authLoading, navigate]);

  const handleDownloadWord = async () => {
    const element = document.querySelector('.printable-cv');
    if (!element) return;
    
    setDownloadingWord(true);
    try {
      const css = `
        <style>
          @page { size: A4; margin: 1.5cm; }
          body { font-family: "Times New Roman", Times, serif; font-size: 11pt; line-height: 1.5; color: #000; }
          .pdf-page { page-break-after: always; clear: both; width: 100%; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-justify { text-align: justify; }
          .font-bold { font-weight: bold; }
          .italic { font-style: italic; }
          .uppercase { text-transform: uppercase; }
          .text-sm { font-size: 10pt; }
          .text-xs { font-size: 9pt; }
          .text-lg { font-size: 14pt; }
          .text-xl { font-size: 16pt; }
          .text-2xl { font-size: 18pt; }
          .text-5xl { font-size: 36pt; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-4 { margin-bottom: 16px; }
          .mb-6 { margin-bottom: 24px; }
          .mb-10 { margin-bottom: 40px; }
          .mb-20 { margin-bottom: 80px; }
          .mt-4 { margin-top: 16px; }
          .mt-10 { margin-top: 40px; }
          .my-20 { margin-top: 80px; margin-bottom: 80px; }
          .pl-4 { padding-left: 16px; }
          .pl-5 { padding-left: 20px; }
          .pr-10 { padding-right: 40px; }
          .w-full { width: 100%; }
          .w-1\\/2 { width: 50%; }
          .w-1\\/4 { width: 25%; }
          .mx-auto { margin-left: auto; margin-right: auto; }
          .ml-auto { margin-left: auto; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid black; padding: 5px; vertical-align: top; }
          .border-b { border-bottom: 1px solid black; }
          .border-dotted { border-bottom: 1px dotted black; }
          .whitespace-pre-wrap { white-space: pre-wrap; }
          .leading-loose { line-height: 2; }
          .list-disc { list-style-type: disc; }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .gap-1 { gap: 4px; }
          .gap-4 { gap: 16px; }
          .flex-grow { flex-grow: 1; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gap-x-4 { column-gap: 16px; }
          .gap-y-1 { row-gap: 4px; }
          .col-span-2 { grid-column: span 2 / span 2; }
        </style>
      `;

      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Lý Lịch</title>
          ${css}
        </head>
        <body>
          ${element.innerHTML}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LyLich_${formData.basicInfo?.fullName?.replace(/\s+/g, '_') || 'DangVien'}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating Word doc:', error);
    } finally {
      setDownloadingWord(false);
    }
  };

  const handleFeedbackChange = (fieldPath: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      fieldFeedback: {
        ...(prev.fieldFeedback || {}),
        [fieldPath]: value
      }
    }));
  };

  const handleSave = async (stepData: any, isSubmit = false, stayOnStep = false, nextStep?: number, isAutoSave = false) => {
    if (!profile || (profile.role === 'admin' && !id)) return;
    
    if (isAutoSave) {
      setIsAutoSaving(true);
    } else {
      setSaving(true);
    }
    
    try {
      const updatedData = { ...formData, ...stepData };
      
      // Handle eligibility status from ConditionsForm
      let eligibilityStatus = updatedData.eligibilityStatus;
      if (currentStep === 1 && stepData.conditions) {
        if (stepData.conditions.isEligible === false) {
          eligibilityStatus = 'not_eligible';
        } else if (stepData.conditions.isEligible === true) {
          eligibilityStatus = 'eligible';
        }
      }

      const appData = {
        userId: id ? formData.userId : profile.uid,
        status: isSubmit ? 'submitted' : (updatedData.status || 'draft'),
        eligibilityStatus: eligibilityStatus || null,
        createdAt: updatedData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...updatedData
      };

      let docRef;
      if (applicationId) {
        docRef = doc(db, 'applications', applicationId);
      } else {
        docRef = doc(collection(db, 'applications'));
        setApplicationId(docRef.id);
      }

      await setDoc(docRef, appData);
      setFormData(appData);
      setLastSaved(new Date().toLocaleTimeString());
      
      // Sync fullName and studentId to users collection if we are on step 0 (Basic Info)
      if (currentStep === 0 && stepData.basicInfo && !id) {
        const userDocRef = doc(db, 'users', profile.uid);
        const profileUpdate: any = {};
        if (stepData.basicInfo.fullName) profileUpdate.fullName = stepData.basicInfo.fullName.toUpperCase();
        if (stepData.basicInfo.studentId) profileUpdate.studentId = stepData.basicInfo.studentId;
        
        if (Object.keys(profileUpdate).length > 0) {
          await setDoc(userDocRef, profileUpdate, { merge: true });
        }
      }
      
      if (isSubmit) {
        navigate('/');
      } else if (!stayOnStep && typeof nextStep === 'number') {
        // Block navigation if ineligible and trying to go past step 1
        if (profile?.role !== 'admin' && appData.eligibilityStatus === 'not_eligible' && nextStep > 1) {
          setCurrentStep(currentStep); // Stay on current step
          return;
        }
        setCurrentStep(nextStep);
      } else if (!stayOnStep && !isAutoSave && currentStep < STEPS.length - 1) {
        // Block navigation if ineligible and trying to go past step 1
        if (profile?.role !== 'admin' && appData.eligibilityStatus === 'not_eligible' && currentStep + 1 > 1) {
          setCurrentStep(currentStep); // Stay on current step
          return;
        }
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Error saving application:', error);
      if (!isAutoSave) {
        try {
          handleFirestoreError(error, OperationType.WRITE, 'applications');
        } catch (e) {
          // Ignore the thrown error from handleFirestoreError so we can show the alert
        }
        alert('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.');
      }
    } finally {
      setSaving(false);
      setIsAutoSaving(false);
    }
  };

  const lastSavedDataRef = React.useRef<string>('');

  // Auto-save effect
  useEffect(() => {
    if (profile?.role === 'admin') return;
    if (loading) return;

    const currentDataStr = JSON.stringify({
      basicInfo: formData.basicInfo,
      conditions: formData.conditions,
      familyHistory: formData.familyHistory,
      personalHistory: formData.personalHistory,
      selfAssessment: formData.selfAssessment,
      otherInfo: formData.otherInfo,
    });

    // Don't auto-save if data hasn't changed since last save
    if (currentDataStr === lastSavedDataRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      handleSave(formData, false, true, undefined, true);
      lastSavedDataRef.current = currentDataStr;
    }, 1500); // 1.5s is a good balance

    return () => clearTimeout(timer);
  }, [formData, profile?.role, loading]);

  const navigateToStep = async (index: number) => {
    if (index === currentStep) return;
    
    // If admin, just navigate
    if (profile?.role === 'admin') {
      setCurrentStep(index);
      return;
    }

    // Block navigation if ineligible (only if they are trying to go past step 1)
    if (formData.eligibilityStatus === 'not_eligible' && index > 1) {
      return;
    }

    // For students, we want to save current step if possible
    setCurrentStep(index);
  };

  const handleDataChange = React.useCallback((section: string, data: any) => {
    setFormData((prev: any) => {
      // Deep comparison to prevent unnecessary state updates and loops
      if (JSON.stringify(prev[section]) === JSON.stringify(data)) {
        return prev;
      }
      return {
        ...prev,
        [section]: data
      };
    });
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-red mb-4" />
        <p className="text-gray-600 font-medium">Đang tải biểu mẫu...</p>
        {loadingTimeout && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl max-w-md text-sm text-yellow-800">
            <p className="font-bold mb-1">Kết nối đang chậm</p>
            <p>Vui lòng kiểm tra lại kết nối mạng của bạn. Hệ thống đang cố gắng tải dữ liệu...</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-white border border-yellow-300 rounded-lg text-yellow-700 font-bold hover:bg-yellow-100 transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        )}
      </div>
    );
  }

  const fieldFeedbackEntries = Object.entries(formData.fieldFeedback || {}).filter(([_, value]) => value && (value as string).trim() !== '');

  const isStepComplete = (index: number) => {
    switch (index) {
      case 0: // Basic Info
        return !!(formData.basicInfo?.fullName && formData.basicInfo?.studentId && formData.basicInfo?.cccd && formData.basicInfo?.dob && formData.basicInfo?.hometown && formData.basicInfo?.birthplace);
      case 1: // Conditions
        const hasPartyClass = formData.conditions?.hasPartyAwarenessClass === 'true' || formData.conditions?.hasPartyAwarenessClass === true;
        const partyClassComplete = hasPartyClass ? formData.conditions?.trainingClasses?.length > 0 : true;
        return !!(partyClassComplete && formData.conditions?.academicScores?.length > 0);
      case 2: // Personal History
        return !!(formData.personalHistory?.history?.length > 0 && formData.personalHistory?.currentResidence);
      case 3: // Family History
        return !!(formData.familyHistory?.length >= 6); // At least parents and grandparents
      case 4: // Other Info
        return !!(formData.otherInfo?.historicalCharacteristics);
      case 5: // Self Assessment
        return !!(formData.selfAssessment?.selfAssessment);
      default:
        return false;
    }
  };

  const progressPercentage = Math.round(((currentStep + 1) / STEPS.length) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
      <div className="flex flex-col gap-6">
        {/* Main Content Area */}
        <div className="w-full">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 bg-brand-red/10 rounded-xl">
                  <FileText className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">Cổng Thông Tin</h1>
                  <p className="text-xs text-gray-500 font-medium">Hỗ trợ sinh viên có nguyện vọng trở thành Đảng viên Đảng Cộng sản Việt Nam</p>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-wrap items-center gap-2"
              >
                {isAutoSaving || saving ? (
                  <span className="text-xs text-brand-red animate-pulse font-black flex items-center bg-red-50 px-4 py-2 rounded-full border border-red-100 uppercase tracking-widest">
                    <Loader2 size={14} className="animate-spin mr-2" />
                    {isAutoSaving ? 'Đang tự động lưu...' : 'Đang lưu...'}
                  </span>
                ) : lastSaved && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-bold bg-slate-50 px-4 py-2 rounded-full border border-slate-100 uppercase tracking-widest">
                      Đã lưu {lastSaved}
                    </span>
                    <button
                      onClick={() => handleSave(formData, false, true)}
                      className="text-xs text-brand-red font-black hover:underline px-2 uppercase tracking-widest"
                    >
                      Lưu ngay
                    </button>
                  </div>
                )}
                {(formData.status === 'submitted' || formData.status === 'approved' || profile?.role === 'admin') && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="text-white bg-blue-600 hover:bg-blue-700 flex items-center text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Xem trước Lý lịch
                  </button>
                )}
                {profile?.role === 'admin' && (
                  <button 
                    onClick={() => {
                      const searchParams = new URLSearchParams(location.search);
                      const from = searchParams.get('from');
                      const returnUrl = from ? `/${from}` : '/?tab=dashboard';
                      navigate(returnUrl);
                    }}
                    className="text-gray-600 hover:text-gray-900 flex items-center text-xs font-bold bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Quay lại danh sách
                  </button>
                )}
              </motion.div>
            </div>
            
            {/* Horizontal Stepper for Mobile/Desktop */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar"
            >
              <div className="flex items-center justify-between min-w-max gap-6 px-2">
                {STEPS.map((step, index) => {
                  const complete = isStepComplete(index);
                  const active = index === currentStep;
                  const isIneligible = profile?.role !== 'admin' && formData.eligibilityStatus === 'not_eligible' && index > 1;
                  const disabled = isIneligible;
                  
                  return (
                    <button
                      key={step}
                      onClick={() => !disabled && navigateToStep(index)}
                      disabled={disabled}
                      className={`flex flex-col items-center gap-2 group transition-all relative ${
                        active ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                      } ${disabled ? 'cursor-not-allowed grayscale opacity-30' : 'cursor-pointer'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 relative z-10
                        ${active 
                          ? 'bg-brand-red border-brand-red text-white scale-110 shadow-lg shadow-red-200' 
                          : index < currentStep 
                            ? (complete ? 'bg-green-500 border-green-500 text-white' : 'bg-yellow-500 border-yellow-500 text-white')
                            : 'bg-white border-gray-200 text-gray-400'}`}>
                        {index < currentStep ? (
                          complete ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <AlertCircle className="w-5 h-5" />
                          )
                        ) : index + 1}
                        
                        {active && (
                          <motion.div 
                            layoutId="active-step-ring"
                            className="absolute -inset-1.5 border-2 border-brand-red/20 rounded-full"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </div>
                      <span className={`text-xs font-black uppercase tracking-widest ${active ? 'text-brand-red' : 'text-slate-500'}`}>
                        {step}
                      </span>
                      {!complete && index <= currentStep && profile?.role !== 'admin' && !isIneligible && (
                        <span className="text-[10px] font-black text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100 uppercase tracking-widest">Thiếu thông tin</span>
                      )}
                      {isIneligible && (
                        <span className="text-[8px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100 uppercase tracking-widest">Bị khóa</span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-8 px-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tiến độ hoàn thành</span>
                  <span className="text-xs font-black text-brand-red uppercase tracking-widest">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    className="bg-brand-red h-full rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)]" 
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
            
            <AnimatePresence>
              {(formData.feedback || fieldFeedbackEntries.length > 0) && profile?.role !== 'admin' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-5 bg-red-50 border-l-4 border-red-500 rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-bold text-red-800">Nhận xét từ Ban quản trị:</h3>
                  </div>
                  {formData.feedback && (
                    <p className="mt-2 text-sm text-red-700 whitespace-pre-wrap leading-relaxed">{formData.feedback}</p>
                  )}
                  {fieldFeedbackEntries.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-red-100">
                      <p className="text-sm font-bold text-red-800 mb-2">Các mục cần điều chỉnh chi tiết:</p>
                      <ul className="space-y-2">
                        {fieldFeedbackEntries.map(([path, feedback]) => (
                          <li key={path} className="text-sm text-red-700 flex items-start gap-2 bg-white/50 p-2 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                            <span><span className="font-bold">{getFieldLabel(path)}:</span> {feedback as string}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {profile?.role === 'admin' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-5 bg-yellow-50 border-l-4 border-yellow-500 rounded-2xl shadow-sm"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-yellow-700" />
                    <h3 className="text-lg font-bold text-yellow-800">Nhận xét / Yêu cầu điều chỉnh:</h3>
                  </div>
                  <div className="flex items-center space-x-3 bg-white p-1.5 rounded-xl border border-yellow-200">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-2">Trạng thái:</label>
                    <select 
                      className="border-none rounded-lg text-sm font-bold p-1.5 bg-transparent focus:ring-0 outline-none text-gray-900"
                      value={formData.status || 'draft'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="draft">Đang soạn</option>
                      <option value="submitted">Chờ duyệt</option>
                      <option value="approved">Đã duyệt</option>
                      <option value="rejected">Yêu cầu sửa</option>
                    </select>
                  </div>
                </div>
                <textarea
                  className="w-full p-4 border border-yellow-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all bg-white/80 text-sm leading-relaxed"
                  rows={3}
                  value={formData.feedback || ''}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="Nhập nhận xét chung hoặc yêu cầu sinh viên điều chỉnh..."
                />
                {fieldFeedbackEntries.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-yellow-200">
                    <h4 className="text-sm font-bold text-yellow-800 mb-3">Danh sách các mục đã yêu cầu sửa chi tiết:</h4>
                    <ul className="space-y-2">
                      {fieldFeedbackEntries.map(([path, feedback]) => (
                        <li key={path} className="text-sm text-yellow-700 flex items-start gap-2 bg-white/50 p-2 rounded-lg">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                          <span><span className="font-bold">{getFieldLabel(path)}:</span> {feedback as string}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleSave({ feedback: formData.feedback, status: formData.status, fieldFeedback: formData.fieldFeedback }, false, true)}
                    disabled={saving}
                    className="bg-yellow-600 text-white px-6 py-2.5 rounded-xl hover:bg-yellow-700 transition-all text-sm font-bold shadow-lg shadow-yellow-900/20 active:scale-95 disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu nhận xét & Trạng thái'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <motion.div 
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-6 md:p-10 border border-gray-100 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-red to-red-400"></div>
            
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 bg-brand-red/10 text-brand-red rounded-lg flex items-center justify-center text-sm">
                  {currentStep + 1}
                </span>
                {STEPS[currentStep]}
              </h2>
            </div>

            {currentStep === 0 && (
              <BasicInfoForm 
                initialData={formData.basicInfo} 
                onSave={(data) => handleSave({ basicInfo: data }, false, false, 1)} 
                onDataChange={(data) => handleDataChange('basicInfo', data)}
                saving={saving}
                isAdmin={profile?.role === 'admin'}
                fieldFeedback={formData.fieldFeedback || {}}
                onFeedbackChange={handleFeedbackChange}
              />
            )}
            {currentStep === 1 && (
              <ConditionsForm 
                initialData={formData.conditions} 
                basicInfo={formData.basicInfo}
                onSave={(data) => handleSave({ conditions: data }, false, false, 2)} 
                onDataChange={(data) => handleDataChange('conditions', data)}
                onBack={() => setCurrentStep(0)}
                saving={saving}
                isAdmin={profile?.role === 'admin'}
                fieldFeedback={formData.fieldFeedback || {}}
                onFeedbackChange={handleFeedbackChange}
              />
            )}
            {currentStep === 2 && (
              <PersonalHistoryForm 
                initialData={formData.personalHistory} 
                onSave={(data) => handleSave({ personalHistory: data }, false, false, 3)} 
                onDataChange={(data) => handleDataChange('personalHistory', data)}
                onBack={() => setCurrentStep(1)}
                saving={saving}
                isAdmin={profile?.role === 'admin'}
                fieldFeedback={formData.fieldFeedback || {}}
                onFeedbackChange={handleFeedbackChange}
              />
            )}
            {currentStep === 3 && (
              <FamilyHistoryForm 
                initialData={formData.familyHistory} 
                onSave={(data) => handleSave({ familyHistory: data }, false, false, 4)} 
                onDataChange={(data) => handleDataChange('familyHistory', data)}
                onBack={() => setCurrentStep(2)}
                saving={saving}
                isAdmin={profile?.role === 'admin'}
                fieldFeedback={formData.fieldFeedback || {}}
                onFeedbackChange={handleFeedbackChange}
              />
            )}
            {currentStep === 4 && (
              <OtherInfoForm 
                initialData={formData.otherInfo} 
                onSave={(data) => handleSave({ otherInfo: data }, false, false, 5)} 
                onDataChange={(data) => handleDataChange('otherInfo', data)}
                onBack={() => setCurrentStep(3)}
                saving={saving}
                isAdmin={profile?.role === 'admin'}
                fieldFeedback={formData.fieldFeedback || {}}
                onFeedbackChange={handleFeedbackChange}
              />
            )}
            {currentStep === 5 && (
              <SelfAssessmentForm 
                initialData={formData.selfAssessment} 
                onSave={(data) => handleSave({ selfAssessment: data }, true)} 
                onDataChange={(data) => handleDataChange('selfAssessment', data)}
                onBack={() => setCurrentStep(4)}
                saving={saving}
                isAdmin={profile?.role === 'admin'}
                fieldFeedback={formData.fieldFeedback || {}}
                onFeedbackChange={handleFeedbackChange}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gray-100 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="flex justify-between items-center p-5 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Xem trước Lý lịch (Mẫu 2-KNĐ)</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadWord}
                    disabled={downloadingWord}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white rounded-xl hover:bg-brand-red-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-lg shadow-red-900/20 active:scale-95"
                  >
                    {downloadingWord ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tạo file Word...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Tải file Word
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6 md:p-10 bg-gray-200/50">
                <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-sm p-1">
                  <PrintableCV data={formData} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
