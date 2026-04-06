import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { collection, query, getDocs, doc, updateDoc, setDoc, deleteDoc, where, or, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';
import * as XLSX from 'xlsx';
import { Upload, Users, FileText, CheckCircle, Clock, AlertCircle, Shield, Settings, UserPlus, BookOpen, Search, Filter, MoreVertical, Download, ArrowUpRight, MessageCircle, X } from 'lucide-react';
import FormSettings from '../components/admin/FormSettings';
import FAQSettings from '../components/admin/FAQSettings';
import { useAuth } from '../contexts/AuthContext';
import AlertToast, { AlertMessage } from '../components/AlertToast';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [adminEmails, setAdminEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const filterStatus = searchParams.get('status') || 'all';
  
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<AlertMessage | null>(null);

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

    setLoading(true);

    const appsQuery = profile.isSuperAdmin 
      ? query(collection(db, 'applications'))
      : query(collection(db, 'applications'), or(
          where('assignedTo', '==', profile.uid),
          where('assignedTo', 'array-contains', profile.uid)
        ));

    const unsubscribeApps = onSnapshot(appsQuery, (snapshot) => {
      const apps: any[] = [];
      snapshot.forEach((doc) => apps.push({ id: doc.id, ...doc.data() }));
      setApplications(apps);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.LIST, 'applications');
      } catch (e) {
        // Ignore
      }
    });

    let unsubscribeUsers: () => void;
    let unsubscribeAdminEmails: () => void;

    if (profile.isSuperAdmin) {
      unsubscribeUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
        const usersList: any[] = [];
        snapshot.forEach((doc) => usersList.push({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'users');
        } catch (e) {
          // Ignore
        }
      });

      unsubscribeAdminEmails = onSnapshot(query(collection(db, 'admin_emails')), (snapshot) => {
        const adminEmailsList: any[] = [];
        snapshot.forEach((doc) => adminEmailsList.push({ id: doc.id, ...doc.data() }));
        setAdminEmails(adminEmailsList);
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'admin_emails');
        } catch (e) {
          // Ignore
        }
      });
    }

    return () => {
      unsubscribeApps();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeAdminEmails) unsubscribeAdminEmails();
    };
  }, [profile]);

  const setFilterStatus = (status: string) => {
    setSearchParams(prev => {
      prev.set('status', status);
      return prev;
    });
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'applications', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${id}`);
    }
  };

  const assignApplication = async (appId: string, reviewerIds: string[]) => {
    try {
      const updateData: any = {
        assignedTo: reviewerIds.length > 0 ? reviewerIds : null,
      };
      
      const app = applications.find(a => a.id === appId);
      if (reviewerIds.length > 0 && app?.status === 'submitted') {
        updateData.status = 'assigned';
      } else if (reviewerIds.length === 0 && app?.status === 'assigned') {
        updateData.status = 'submitted';
      }

      await updateDoc(doc(db, 'applications', appId), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${appId}`);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;

    setAddingAdmin(true);
    try {
      const emailLower = newAdminEmail.toLowerCase().trim();
      await setDoc(doc(db, 'admin_emails', emailLower), {
        email: emailLower,
        fullName: newAdminName,
        role: newAdminRole,
        createdAt: new Date().toISOString()
      });
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminRole('admin');
      setAlertMessage({
        title: 'Thành công',
        message: 'Đã thêm tài khoản thành công. Họ có thể đăng nhập bằng Google hoặc Đăng ký bằng email này.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding admin:', error);
      setAlertMessage({
        title: 'Lỗi',
        message: 'Lỗi khi thêm tài khoản',
        type: 'error'
      });
    } finally {
      setAddingAdmin(false);
    }
  };

  const confirmRemoveAdmin = async () => {
    if (!adminToRemove) return;
    try {
      await deleteDoc(doc(db, 'admin_emails', adminToRemove));
      setAdminToRemove(null);
      setAlertMessage({
        title: 'Thành công',
        message: 'Đã xóa quyền Đảng viên hướng dẫn thành công.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error removing admin:', error);
      setAlertMessage({
        title: 'Lỗi',
        message: 'Lỗi khi xóa Đảng viên hướng dẫn',
        type: 'error'
      });
    }
  };

  const handleRemoveAdmin = (emailId: string) => {
    setAdminToRemove(emailId);
  };

  const handleExport = () => {
    let dataToExport: any[] = [];
    let filename = 'danh_sach.xlsx';

    if (activeTab === 'training') {
      dataToExport = applications
        .filter(app => app.conditions?.hasPartyAwarenessClass === 'false' || app.conditions?.hasPartyAwarenessClass === false)
        .map((app, index) => ({
          'STT': index + 1,
          'MSSV': app.basicInfo?.studentId || '',
          'CCCD': app.basicInfo?.cccd || '',
          'HỌ VÀ TÊN': app.basicInfo?.fullName || '',
          'LỚP': app.basicInfo?.class || '',
          'KHOA': app.basicInfo?.faculty || '',
          'NGÀY SINH': app.basicInfo?.dob ? new Date(app.basicInfo.dob).toLocaleDateString('vi-VN') : '',
          'NƠI SINH': app.basicInfo?.birthplace || '',
          'QUÊ QUÁN': app.basicInfo?.hometown || '',
          'SĐT (ZALO)': app.basicInfo?.zaloPhone || '',
          'EMAIL': app.basicInfo?.email || '',
          'TÌNH TRẠNG HỒ SƠ': app.status === 'approved' ? 'Đã duyệt' : 
                        app.status === 'rejected' ? 'Cần sửa' : 
                        app.status === 'assigned' ? 'Đã phân kiểm tra' :
                        app.status === 'writing_hardcopy' ? 'Đang viết bản cứng' :
                        app.status === 'verifying_background' ? 'Đang thẩm tra lý lịch' :
                        app.status === 'meeting_organized' ? 'Đang họp các cấp' :
                        app.status === 'submitted' ? 'Chờ duyệt' : 'Đang soạn',
          'ĐV HƯỚNG DẪN': app.assignedToName || '',
        }));
      filename = 'danh_sach_dang_ky_hoc_cam_tinh_dang.xlsx';
    } else {
      dataToExport = filteredApplications.map((app, index) => ({
        'STT': index + 1,
        'MSSV': app.basicInfo?.studentId || '',
        'CCCD': app.basicInfo?.cccd || '',
        'HỌ VÀ TÊN': app.basicInfo?.fullName || '',
        'LỚP': app.basicInfo?.class || '',
        'KHOA': app.basicInfo?.faculty || '',
        'TÌNH TRẠNG': app.status === 'approved' ? 'Đã duyệt' : 
                      app.status === 'rejected' ? 'Cần sửa' : 
                      app.status === 'assigned' ? 'Đã phân kiểm tra' :
                      app.status === 'writing_hardcopy' ? 'Đang viết bản cứng' :
                      app.status === 'verifying_background' ? 'Đang thẩm tra lý lịch' :
                      app.status === 'meeting_organized' ? 'Đang họp các cấp' :
                      app.status === 'submitted' ? 'Chưa duyệt' : 'Đang soạn',
        'ĐV HƯỚNG DẪN': app.assignedToName || '',
        'NGÀY NHẬN HỒ SƠ': app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : '',
        'NGÀY SINH': app.basicInfo?.dob ? new Date(app.basicInfo.dob).toLocaleDateString('vi-VN') : '',
        'QUÊ QUÁN': app.basicInfo?.hometown || '',
        'FACEBOOK': app.basicInfo?.facebookLink || '',
        'SĐT': app.basicInfo?.zaloPhone || '',
        'EMAIL': app.basicInfo?.email || '',
        'GHI CHÚ': (app.conditions?.hasPartyAwarenessClass === 'true' || app.conditions?.hasPartyAwarenessClass === true) ? 'Đã học cảm tình Đảng' : 'Chưa học cảm tình Đảng',
        'Giấy khen, Giấy chứng nhận': (app.conditions?.certificates || []).map((c: any) => c.name).join(', '),
        'ĐIỂM HỌC TẬP, RÈN LUYỆN': (app.conditions?.academicScores || []).map((s: any) => `Kỳ ${s.semester}: ${s.academicScore}/${s.trainingScore}`).join('; ')
      }));
      filename = 'danh_sach_ho_so.xlsx';
    }

    if (dataToExport.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách");
    XLSX.writeFile(wb, filename);
  };

  const stats = {
    total: applications.length,
    submitted: applications.filter(a => a.status === 'submitted').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    draft: applications.filter(a => a.status === 'draft' || !a.status).length,
    unassigned: applications.filter(a => a.status === 'submitted' && !a.assignedTo).length,
    assigned: applications.filter(a => a.status === 'assigned').length,
    writing_hardcopy: applications.filter(a => a.status === 'writing_hardcopy').length,
    verifying_background: applications.filter(a => a.status === 'verifying_background').length,
    meeting_organized: applications.filter(a => a.status === 'meeting_organized').length,
    not_eligible: applications.filter(a => a.eligibilityStatus === 'not_eligible').length,
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'not_eligible') return app.eligibilityStatus === 'not_eligible';
    return app.status === filterStatus;
  });

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

  return (
    <div className="flex flex-col">
      {/* Admin Hero Section */}
      <div className="bg-brand-red text-white py-10 mb-8 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-brand-yellow">Quản trị hệ thống</h1>
              <p className="text-red-100 text-sm font-medium">Quản lý hồ sơ, đảng viên và cấu hình hệ thống Chi bộ Sinh viên</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all shadow-sm backdrop-blur-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Xuất báo cáo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === 'dashboard' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-slate-50 text-slate-500 rounded-xl group-hover:bg-slate-100 transition-colors">
                  <FileText size={20} />
                </div>
                <span className="text-xs font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-full uppercase tracking-wider">Tổng cộng</span>
              </div>
              <p className="text-3xl font-black text-slate-900">
                {stats.submitted + stats.approved + stats.rejected + stats.assigned + stats.writing_hardcopy + stats.verifying_background + stats.meeting_organized}
              </p>
              <p className="text-sm text-slate-500 mt-1 font-bold">Hồ sơ đã nộp</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-100 transition-colors">
                  <CheckCircle size={20} />
                </div>
                <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-wider">Hoàn tất</span>
              </div>
              <p className="text-3xl font-black text-green-600">{stats.approved}</p>
              <p className="text-sm text-slate-500 mt-1 font-bold">Đã duyệt</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                  <Clock size={20} />
                </div>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">Đang chờ</span>
              </div>
              <p className="text-3xl font-black text-blue-600">{stats.submitted}</p>
              <p className="text-sm text-slate-500 mt-1 font-bold">Chưa duyệt</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                  <Users size={20} />
                </div>
                <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-wider">Cần phân công</span>
              </div>
              <p className="text-3xl font-black text-amber-600">{stats.unassigned}</p>
              <p className="text-sm text-slate-500 mt-1 font-bold">Chưa phân kiểm tra</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Tiến độ xử lý hồ sơ</h3>
                <button className="text-xs font-black text-brand-red hover:underline flex items-center gap-1">
                  Xem tất cả <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {[
                  { label: 'Đã phân kiểm tra', value: stats.assigned, color: 'bg-purple-500' },
                  { label: 'Đang viết bản cứng', value: stats.writing_hardcopy, color: 'bg-indigo-500' },
                  { label: 'Đang thẩm tra lý lịch', value: stats.verifying_background, color: 'bg-orange-500' },
                  { label: 'Đang họp các cấp', value: stats.meeting_organized, color: 'bg-pink-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-700">{item.label}</span>
                      <span className="text-xs font-black text-slate-900">{item.value}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${(item.value / (stats.total || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight mb-4">Hoạt động gần đây</h3>
              <div className="space-y-4">
                {applications.slice(0, 5).map((app, i) => (
                  <div key={app.id} className="flex gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      i % 2 === 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <UserPlus size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {app.basicInfo?.fullName || 'Sinh viên mới'}
                      </p>
                      <p className="text-xs text-slate-500 leading-tight font-medium">
                        {app.status === 'submitted' ? 'Vừa nộp hồ sơ' : 'Cập nhật thông tin'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {app.updatedAt ? new Date(app.updatedAt).toLocaleTimeString('vi-VN') : 'Vừa xong'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Danh sách hồ sơ sinh viên</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">Quản lý và phê duyệt hồ sơ xin vào Đảng</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm sinh viên..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-brand-red focus:border-brand-red transition-all"
                />
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'submitted', label: 'Chưa duyệt' },
                { id: 'assigned', label: 'Đã phân kiểm tra' },
                { id: 'approved', label: 'Đã duyệt' },
                { id: 'rejected', label: 'Cần sửa' },
                { id: 'not_eligible', label: 'Không đủ điều kiện' },
                { id: 'writing_hardcopy', label: 'Đang viết bản cứng' },
                { id: 'verifying_background', label: 'Đang thẩm tra lý lịch' },
                { id: 'meeting_organized', label: 'Đang họp các cấp' }
              ].map(status => (
                <button
                  key={status.id}
                  onClick={() => setFilterStatus(status.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest ${
                    filterStatus === status.id 
                      ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Sinh viên</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin học tập</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày cập nhật</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold text-sm">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-200">
                          <FileText size={48} />
                        </div>
                        Chưa có hồ sơ nào phù hợp
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/application/${app.id}?from=${encodeURIComponent(location.search)}`} className="flex items-center gap-3 cursor-pointer">
                          <div className="w-10 h-10 rounded-xl bg-brand-red/5 text-brand-red flex items-center justify-center font-black text-sm group-hover:bg-brand-red group-hover:text-white transition-all shadow-sm">
                            {(app.basicInfo?.fullName || 'S')[0]}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 group-hover:text-brand-red transition-colors">{app.basicInfo?.fullName || 'Chưa cập nhật'}</p>
                            <p className="text-xs text-slate-500 font-bold">{app.basicInfo?.studentId || 'N/A'}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-700 font-bold">{app.basicInfo?.class || 'N/A'}</p>
                        <p className="text-xs text-slate-500 font-medium">{app.basicInfo?.faculty || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-bold">
                        {app.updatedAt ? new Date(app.updatedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-[10px] leading-4 font-black uppercase tracking-widest rounded-lg border
                          ${app.eligibilityStatus === 'not_eligible' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                            app.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 
                            app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 
                            app.status === 'submitted' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                            app.status === 'assigned' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            app.status === 'writing_hardcopy' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                            app.status === 'verifying_background' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                            app.status === 'meeting_organized' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                            'bg-slate-50 text-slate-700 border-slate-100'}`}>
                          {app.eligibilityStatus === 'not_eligible' ? 'Không đủ ĐK' :
                           app.status === 'approved' ? 'Đã duyệt' : 
                           app.status === 'rejected' ? 'Cần sửa' : 
                           app.status === 'submitted' ? 'Chưa duyệt' : 
                           app.status === 'assigned' ? 'Đã phân kiểm tra' :
                           app.status === 'writing_hardcopy' ? 'Đang viết bản cứng' :
                           app.status === 'verifying_background' ? 'Đang thẩm tra lý lịch' :
                           app.status === 'meeting_organized' ? 'Đang họp các cấp' :
                           'Đang soạn'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                        <div className="flex items-center justify-end gap-2">
                          <select 
                            className="bg-white border border-slate-200 rounded-xl text-xs py-1.5 px-3 font-black text-slate-700 focus:ring-brand-red focus:border-brand-red transition-all shadow-sm"
                            value={app.status || 'draft'}
                            onChange={(e) => updateStatus(app.id, e.target.value)}
                          >
                            <option value="draft">Đang soạn</option>
                            <option value="submitted">Chưa duyệt</option>
                            <option value="assigned">Đã phân kiểm tra</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="rejected">Yêu cầu sửa</option>
                            <option value="writing_hardcopy">Đang viết bản cứng</option>
                            <option value="verifying_background">Đang thẩm tra lý lịch</option>
                            <option value="meeting_organized">Đang họp các cấp</option>
                          </select>
                          <Link 
                            to={`/application/${app.id}`}
                            className="p-2 text-slate-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all shadow-sm border border-slate-100"
                            title="Xem chi tiết"
                          >
                            <ArrowUpRight size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {profile?.isSuperAdmin && activeTab === 'training' && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Danh sách chưa học cảm tình Đảng</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Sinh viên cần được ưu tiên cử đi học lớp nhận thức về Đảng</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ và tên</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">MSSV / CCCD</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Lớp / Khoa</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày sinh / Nơi sinh</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Liên hệ</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {applications.filter(app => app.conditions?.hasPartyAwarenessClass === 'false' || app.conditions?.hasPartyAwarenessClass === false).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold text-sm">
                      Tất cả sinh viên đã hoàn thành lớp cảm tình Đảng
                    </td>
                  </tr>
                ) : (
                  applications.filter(app => app.conditions?.hasPartyAwarenessClass === 'false' || app.conditions?.hasPartyAwarenessClass === false).map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-black text-slate-900">{app.basicInfo?.fullName || 'Chưa cập nhật'}</p>
                        <p className="text-xs text-slate-500 font-medium">Quê: {app.basicInfo?.hometown || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-700 font-bold">{app.basicInfo?.studentId || 'N/A'}</p>
                        <p className="text-xs text-slate-500 font-medium">{app.basicInfo?.cccd || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-700 font-bold">{app.basicInfo?.class || 'N/A'}</p>
                        <p className="text-xs text-slate-500 font-medium">{app.basicInfo?.faculty || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-700 font-bold">{app.basicInfo?.dob ? new Date(app.basicInfo.dob).toLocaleDateString('vi-VN') : 'N/A'}</p>
                        <p className="text-xs text-slate-500 font-medium">{app.basicInfo?.birthplace || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-700 font-bold">{app.basicInfo?.zaloPhone || 'N/A'}</p>
                        <p className="text-xs text-slate-500 font-medium">{app.basicInfo?.email || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-[10px] leading-4 font-black uppercase tracking-widest rounded-lg border ${
                          app.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 
                          app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 
                          app.status === 'assigned' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          app.status === 'writing_hardcopy' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          app.status === 'verifying_background' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          app.status === 'meeting_organized' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                          'bg-yellow-50 text-yellow-700 border-yellow-100'
                        }`}>
                          {app.status === 'approved' ? 'Đã duyệt' : 
                           app.status === 'rejected' ? 'Cần sửa' : 
                           app.status === 'assigned' ? 'Đã phân kiểm tra' :
                           app.status === 'writing_hardcopy' ? 'Đang viết bản cứng' :
                           app.status === 'verifying_background' ? 'Đang thẩm tra lý lịch' :
                           app.status === 'meeting_organized' ? 'Đang họp các cấp' :
                           app.status === 'submitted' ? 'Chờ duyệt' : 'Đang soạn'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {profile?.isSuperAdmin && activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Quản lý Đảng viên hướng dẫn</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Cấp quyền cho Đảng viên tham gia hướng dẫn và kiểm tra hồ sơ sinh viên</p>
          </div>
          
          <div className="p-6 bg-slate-50/50 border-b border-slate-50">
            <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email Đảng viên *</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-brand-red focus:border-brand-red transition-all"
                  placeholder="email@due.udn.vn"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Họ và tên</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-brand-red focus:border-brand-red transition-all"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Quyền hạn</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-brand-red focus:border-brand-red transition-all"
                >
                  <option value="admin">Đảng viên hướng dẫn</option>
                  <option value="super_admin">Quản trị viên hệ thống</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={addingAdmin}
                className="bg-brand-red text-white px-6 py-2.5 rounded-xl font-black hover:bg-brand-red-dark disabled:opacity-50 transition-all shadow-lg shadow-brand-red/20 flex items-center justify-center gap-2 text-xs w-full md:w-auto uppercase tracking-widest"
              >
                <UserPlus size={16} />
                {addingAdmin ? 'Đang xử lý...' : 'Thêm Đảng viên'}
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Đảng viên</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Quyền hạn</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày thêm</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {adminEmails.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold text-sm">Chưa có Đảng viên hướng dẫn nào</td>
                  </tr>
                ) : (
                  adminEmails.map((admin) => {
                    const hasRegistered = users.some(u => u.email?.toLowerCase() === admin.email?.toLowerCase());
                    return (
                      <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900">
                          {admin.fullName || 'Chưa cập nhật'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-bold">
                          {admin.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-[10px] leading-4 font-black uppercase tracking-widest rounded-lg border ${admin.role === 'super_admin' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            {admin.role === 'super_admin' ? 'Quản trị viên' : 'Đảng viên HD'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-[10px] leading-4 font-black uppercase tracking-widest rounded-lg border ${hasRegistered ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                            {hasRegistered ? 'Đã đăng ký' : 'Chờ kích hoạt'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-bold">
                          {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                          <button
                            onClick={() => handleRemoveAdmin(admin.id)}
                            className="text-slate-400 hover:text-brand-red p-2 rounded-xl hover:bg-red-50 transition-all border border-slate-100"
                            title="Xóa quyền"
                          >
                            Xóa quyền
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {profile?.isSuperAdmin && activeTab === 'permissions' && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Phân công Đảng viên hướng dẫn</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Giao hồ sơ cho Đảng viên để thẩm định và hướng dẫn sinh viên</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Hồ sơ sinh viên</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">MSSV</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Đảng viên hướng dẫn</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {applications.filter(app => app.status !== 'draft').length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold text-sm">Không có hồ sơ nào cần phân công</td>
                  </tr>
                ) : (
                  applications.filter(app => app.status !== 'draft').map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900">
                        {app.basicInfo?.fullName || 'Chưa cập nhật'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-bold">
                        {app.basicInfo?.studentId || 'Chưa cập nhật'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-[10px] leading-4 font-black uppercase tracking-widest rounded-lg border ${(Array.isArray(app.assignedTo) ? app.assignedTo.length > 0 : !!app.assignedTo) ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                          {(Array.isArray(app.assignedTo) ? app.assignedTo.length > 0 : !!app.assignedTo) ? 'Đã phân công' : 'Chưa phân công'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(app.assignedTo) ? app.assignedTo.map((id: string) => {
                              const admin = users.find(u => u.id === id);
                              return (
                                <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                  {admin?.fullName || admin?.email || id}
                                  <button onClick={() => {
                                    const newAssigned = app.assignedTo.filter((a: string) => a !== id);
                                    assignApplication(app.id, newAssigned);
                                  }} className="hover:text-red-500"><X size={12} /></button>
                                </span>
                              );
                            }) : app.assignedTo && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                {users.find(u => u.id === app.assignedTo)?.fullName || users.find(u => u.id === app.assignedTo)?.email || app.assignedTo}
                                <button onClick={() => {
                                  assignApplication(app.id, []);
                                }} className="hover:text-red-500"><X size={12} /></button>
                              </span>
                            )}
                          </div>
                          <select
                            className="bg-white border border-slate-200 rounded-xl text-xs py-1.5 px-3 font-black text-slate-700 focus:ring-brand-red focus:border-brand-red transition-all w-full max-w-xs shadow-sm"
                            value=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const currentAssigned = Array.isArray(app.assignedTo) ? app.assignedTo : (app.assignedTo ? [app.assignedTo] : []);
                              if (!currentAssigned.includes(e.target.value)) {
                                assignApplication(app.id, [...currentAssigned, e.target.value]);
                              }
                            }}
                          >
                            <option value="">-- Thêm đảng viên --</option>
                            {users.filter(u => u.role === 'admin' && !(Array.isArray(app.assignedTo) ? app.assignedTo : (app.assignedTo ? [app.assignedTo] : [])).includes(u.id)).map(admin => (
                              <option key={admin.id} value={admin.id}>
                                {admin.fullName || admin.email}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {profile?.isSuperAdmin && activeTab === 'faq' && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Quản lý Hỏi đáp (Q&A)</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Cập nhật tài liệu kịch bản cho AI và trả lời các câu hỏi của sinh viên</p>
          </div>
          <div className="p-6 bg-slate-50/30">
            <FAQSettings />
          </div>
        </div>
      )}

      {profile?.isSuperAdmin && activeTab === 'settings' && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Cấu hình biểu mẫu</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Quản lý danh sách dân tộc, tôn giáo, khoa và các trường dữ liệu</p>
          </div>
          <div className="p-6">
            <FormSettings />
          </div>
        </div>
      )}
      </div>

      {/* Remove Admin Modal */}
      {adminToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-black uppercase tracking-tight">Xác nhận xóa</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6 font-medium">
              Bạn có chắc chắn muốn xóa quyền Đảng viên hướng dẫn của email <span className="font-bold text-slate-900">{adminToRemove}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAdminToRemove(null)}
                className="px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-100 rounded-xl transition-colors uppercase tracking-widest"
              >
                Hủy
              </button>
              <button
                onClick={confirmRemoveAdmin}
                className="px-4 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-600/20 uppercase tracking-widest"
              >
                Xóa quyền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Toast */}
      <AlertToast 
        alert={alertMessage} 
        onClose={() => setAlertMessage(null)} 
        duration={5000} 
      />
    </div>
  );
}
