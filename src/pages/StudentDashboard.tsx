import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';
import { FileText, CheckCircle, Clock, AlertCircle, ArrowRight, Download, User, Calendar, GraduationCap, Eye, X, Search, Mail, Users } from 'lucide-react';
import { motion } from 'motion/react';
import PrintableCV from '../components/PrintableCV';

const SAMPLE_DATA = {
  basicInfo: {
    fullName: "NGUYỄN VĂN A",
    gender: "Nam",
    dob: "01/01/2000",
    birthplace: "Phường X, Quận Y, Thành phố Đà Nẵng",
    hometown: "Xã Z, Huyện W, Tỉnh Quảng Nam",
    permanentAddress: "Số 123 Đường ABC, Phường X, Quận Y, Thành phố Đà Nẵng",
    temporaryAddress: "Ký túc xá Đại học Kinh tế, Đà Nẵng",
    ethnicity: "Kinh",
    religion: "Không",
    job: "Sinh viên",
    education: "12/12",
    degree: "Đang học Đại học",
    foreignLanguage: "Tiếng Anh B1",
    youthUnionJoinDate: "26/03/2015",
    youthUnionJoinPlace: "Trường THPT Lê Quý Đôn",
    cccd: "048200001234",
    cccdDate: "15/05/2021",
    cccdPlace: "Cục Cảnh sát QLHC về TTXH"
  },
  personalHistory: {
    history: [
      {
        startTime: "09/2006",
        endTime: "05/2011",
        content: "Học sinh Trường Tiểu học Nguyễn Du, TP Đà Nẵng"
      },
      {
        startTime: "09/2011",
        endTime: "05/2015",
        content: "Học sinh Trường THCS Trưng Vương, TP Đà Nẵng"
      },
      {
        startTime: "09/2015",
        endTime: "05/2018",
        content: "Học sinh Trường THPT Lê Quý Đôn, TP Đà Nẵng"
      },
      {
        startTime: "09/2018",
        endTime: "Nay",
        content: "Sinh viên Trường Đại học Kinh tế - ĐHĐN"
      }
    ]
  },
  familyHistory: [
    {
      relation: "Cha đẻ",
      fullName: "Nguyễn Văn B",
      birthYear: "1970",
      job: "Giáo viên",
      hometown: "Xã Z, Huyện W, Tỉnh Quảng Nam",
      permanentAddress: "Số 123 Đường ABC, Phường X, Quận Y, Thành phố Đà Nẵng",
      politicalAttitude: "Chấp hành tốt chủ trương, đường lối của Đảng, chính sách pháp luật của Nhà nước.",
      history: [
        {
          startTime: "1990",
          endTime: "Nay",
          content: "Giáo viên Trường THPT Trần Phú, TP Đà Nẵng"
        }
      ]
    },
    {
      relation: "Mẹ đẻ",
      fullName: "Trần Thị C",
      birthYear: "1975",
      job: "Nội trợ",
      hometown: "Phường M, Quận N, Thành phố Đà Nẵng",
      permanentAddress: "Số 123 Đường ABC, Phường X, Quận Y, Thành phố Đà Nẵng",
      politicalAttitude: "Chấp hành tốt chủ trương, đường lối của Đảng, chính sách pháp luật của Nhà nước.",
      history: [
        {
          startTime: "1995",
          endTime: "Nay",
          content: "Làm nội trợ tại gia đình"
        }
      ]
    }
  ],
  selfAssessment: {
    qualities: "Có lập trường tư tưởng chính trị vững vàng, tuyệt đối trung thành với mục tiêu lý tưởng của Đảng. Chấp hành tốt mọi chủ trương, đường lối của Đảng, chính sách pháp luật của Nhà nước.",
    shortcomings: "Còn rụt rè trong các buổi sinh hoạt tập thể đông người. Đôi khi chưa sắp xếp thời gian hợp lý giữa việc học và tham gia phong trào.",
    date: "15/08/2023",
    place: "Đà Nẵng"
  }
};

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showSample, setShowSample] = useState(false);

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
    if (!profile) return;

    const q = query(collection(db, 'applications'), where('userId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        setApplication({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
      } else {
        setApplication(null);
      }
      setLoading(false);
    }, (error) => {
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.LIST, 'applications');
      } catch (e) {
        // Ignore
      }
    });

    return () => unsubscribe();
  }, [profile]);

  if (loading) {
    return (
      <div className="text-center py-10 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
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

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'draft':
        return { text: 'Đang soạn thảo', color: 'text-amber-600', bg: 'bg-amber-50', icon: <FileText size={20} />, step: 1 };
      case 'submitted':
        return { text: 'Đã nộp hồ sơ, chờ duyệt', color: 'text-blue-600', bg: 'bg-blue-50', icon: <Clock size={20} />, step: 1 };
      case 'assigned':
        return { text: 'Đảng viên đang kiểm tra', color: 'text-purple-600', bg: 'bg-purple-50', icon: <User size={20} />, step: 1 };
      case 'writing_hardcopy':
        return { text: 'Kê khai & Viết lý lịch', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <FileText size={20} />, step: 2 };
      case 'verifying_background':
        return { text: 'Đang thẩm tra lý lịch', color: 'text-orange-600', bg: 'bg-orange-50', icon: <Search size={20} />, step: 3 };
      case 'meeting_organized':
        return { text: 'Họp các tổ chức đoàn các cấp', color: 'text-pink-600', bg: 'bg-pink-50', icon: <Users size={20} />, step: 4 };
      case 'approved':
        return { text: 'Hoàn thành hồ sơ', color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle size={20} />, step: 5 };
      case 'rejected':
        return { text: 'Cần chỉnh sửa', color: 'text-red-600', bg: 'bg-red-50', icon: <AlertCircle size={20} />, step: 1 };
      default:
        return { text: 'Chưa tạo', color: 'text-slate-600', bg: 'bg-slate-50', icon: <FileText size={20} />, step: 0 };
    }
  };

  const statusDisplay = getStatusDisplay(application?.status);

  const steps = [
    { id: 1, label: 'Làm hồ sơ', icon: <FileText size={16} /> },
    { id: 2, label: 'Kê khai & Viết lý lịch', icon: <FileText size={16} /> },
    { id: 3, label: 'Thẩm tra lý lịch', icon: <Search size={16} /> },
    { id: 4, label: 'Họp các cấp', icon: <Users size={16} /> },
    { id: 5, label: 'Hoàn thành', icon: <CheckCircle size={16} /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <div className="bg-brand-red text-white py-16 mb-10 relative overflow-hidden bg-pattern">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-brand-yellow text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-sm border border-white/10">
              <span className="w-2 h-2 bg-brand-yellow rounded-full animate-pulse"></span>
              Cổng Thông Tin - Hỗ trợ sinh viên có nguyện vọng trở thành Đảng viên Đảng Cộng sản Việt Nam
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-tight">
              Chào mừng, <span className="text-brand-yellow underline decoration-brand-yellow/30 underline-offset-8">{profile?.fullName || 'Sinh viên'}</span>
            </h1>
            <p className="text-red-50/90 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
              Tiến bước vào hàng ngũ của Đảng Cộng sản Việt Nam. 
              Hoàn thiện hồ sơ của bạn một cách chuyên nghiệp và nhanh chóng.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Status Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200 transition-all hover:shadow-2xl hover:shadow-slate-200/60 group">
              <div className="h-2 bg-gradient-to-r from-brand-red to-brand-red-dark"></div>
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                      <div className="p-2 bg-brand-red/5 rounded-xl text-brand-red">
                        <FileText size={24} />
                      </div>
                      Trạng thái hồ sơ
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Theo dõi tiến độ xét duyệt hồ sơ của bạn</p>
                  </div>
                  <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm ${statusDisplay.bg} ${statusDisplay.color} border border-current/10`}>
                    {statusDisplay.icon}
                    {statusDisplay.text}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
                  <p className="text-slate-600 leading-relaxed text-sm font-medium">
                    Hệ thống hỗ trợ sinh viên kê khai các thông tin cần thiết để xét duyệt kết nạp Đảng. 
                    Dữ liệu của bạn sẽ được bảo mật và chỉ sử dụng cho mục đích thẩm tra lý lịch.
                  </p>
                </div>

                {/* Progress Roadmap */}
                <div className="mb-10 px-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Lộ trình phát triển</h3>
                    <span className="text-[10px] font-bold text-brand-red bg-red-50 px-2 py-0.5 rounded-full">
                      Bước {statusDisplay.step}/5
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100"></div>
                    <div 
                      className="absolute top-5 left-0 h-0.5 bg-brand-red transition-all duration-1000"
                      style={{ width: `${((statusDisplay.step - 1) / 4) * 100}%` }}
                    ></div>
                    
                    <div className="relative flex justify-between">
                      {steps.map((step) => {
                        const isCompleted = statusDisplay.step > step.id;
                        const isCurrent = statusDisplay.step === step.id;
                        
                        return (
                          <div key={step.id} className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 border-4 ${
                              isCompleted ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/20' :
                              isCurrent ? 'bg-white text-brand-red border-brand-red shadow-xl scale-110' :
                              'bg-white text-slate-300 border-slate-100'
                            }`}>
                              {isCompleted ? <CheckCircle size={18} /> : step.icon}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-tighter ${
                              isCurrent ? 'text-brand-red' : 'text-slate-400'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  {(!application || application.status === 'draft' || application.status === 'rejected') ? (
                    <Link
                      to="/application"
                      className="flex-1 min-w-[200px] inline-flex items-center justify-center px-8 py-4 bg-brand-red text-white font-black rounded-2xl hover:bg-brand-red-dark transition-all shadow-xl shadow-brand-red/20 group text-sm uppercase tracking-widest"
                    >
                      {application ? 'Tiếp tục hoàn thiện' : 'Bắt đầu kê khai ngay'}
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <Link
                      to="/application"
                      className="flex-1 min-w-[200px] inline-flex items-center justify-center px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 font-black rounded-2xl hover:bg-slate-50 transition-all text-sm uppercase tracking-widest"
                    >
                      Xem chi tiết hồ sơ
                    </Link>
                  )}
                  
                  {application && (
                    <Link
                      to="/application?preview=true"
                      className="flex-1 min-w-[200px] inline-flex items-center justify-center px-8 py-4 bg-blue-50 text-blue-700 font-black rounded-2xl hover:bg-blue-100 transition-all border border-blue-100 text-sm uppercase tracking-widest"
                    >
                      <Eye className="mr-2 w-5 h-5" />
                      Xem trước Lý lịch
                    </Link>
                  )}

                  <button
                    onClick={() => setShowSample(true)}
                    className="flex-1 min-w-[200px] inline-flex items-center justify-center px-8 py-4 bg-slate-50 text-slate-700 font-black rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 text-sm uppercase tracking-widest"
                  >
                    <FileText className="mr-2 w-5 h-5" />
                    Xem file mẫu 2-KNĐ
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 flex items-start gap-4 hover-lift">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Thông tin học tập</h3>
                  <p className="text-sm text-slate-500 mt-1 font-bold">Lớp: <span className="text-slate-900">{profile?.class || 'Chưa cập nhật'}</span></p>
                  <p className="text-sm text-slate-500 font-bold">Khoa: <span className="text-slate-900">{profile?.faculty || 'Chưa cập nhật'}</span></p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 flex items-start gap-4 hover-lift">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl shadow-sm">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Thời gian cập nhật</h3>
                  <p className="text-sm text-slate-500 mt-1 font-bold">
                    {application?.updatedAt 
                      ? `Lần cuối: ${new Date(application.updatedAt).toLocaleDateString('vi-VN')}`
                      : 'Chưa có dữ liệu'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-br from-brand-red to-red-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-brand-yellow uppercase tracking-widest">
                <AlertCircle size={24} />
                Lưu ý quan trọng
              </h3>
              <ul className="space-y-4 text-sm text-red-50 font-bold">
                {[
                  'Khai trung thực, đầy đủ các mục theo hướng dẫn.',
                  'Các mốc thời gian trong lịch sử bản thân phải liên tục.',
                  'Kiểm tra kỹ thông tin người thân (Lịch sử gia đình).'
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed">
                    <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center text-brand-yellow text-xs font-black">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Help Card */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h3 className="text-lg font-black text-brand-yellow uppercase tracking-widest mb-4">Hỗ trợ trực tuyến</h3>
              <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">Nếu bạn gặp khó khăn trong quá trình làm hồ sơ, hãy liên hệ với Chi bộ Sinh viên.</p>
              <a 
                href="mailto:chibosinhvien@due.edu.vn" 
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/10"
              >
                <Mail size={16} />
                Gửi Email hỗ trợ
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sample Modal */}
      {showSample && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-gray-100 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-3 bg-white border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Mẫu tham khảo (2-KNĐ)</h3>
              <button 
                onClick={() => setShowSample(false)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 md:p-6 bg-gray-200">
              <PrintableCV data={SAMPLE_DATA} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
