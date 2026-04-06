import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      navigate('/');
    }
  }, [profile, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    // Basic validation for identifier (MSSV or CCCD)
    if (identifier.length < 10) {
      setError('Mã số sinh viên hoặc CCCD không hợp lệ.');
      return;
    }

    setLoading(true);

    try {
      let email = identifier.trim();
      if (!email.includes('@')) {
        email = `${email}@student.edu.vn`;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Check if email is in admin_emails
      const adminEmailsRef = collection(db, 'admin_emails');
      const q = query(adminEmailsRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      const isInvitedAdmin = !querySnapshot.empty;

      const isAdmin = isInvitedAdmin || 
        email.toLowerCase() === 'levinhdienthptbenhai@gmail.com' ||
        email.toLowerCase() === 'levinhdienqt123@gmail.com' ||
        email.toLowerCase() === 'levinhdien9bthcschuvanan@gmail.com';

      // Create user profile
      const userProfile = {
        uid: userCredential.user.uid,
        email: email,
        role: isAdmin ? 'admin' : 'student',
        studentId: identifier,
        fullName: fullName.toUpperCase(),
        createdAt: new Date().toISOString(),
      };

      console.log('Attempting to create user profile:', userProfile);
      await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
      console.log('User profile created successfully');

      // Navigation is handled by useEffect when profile is loaded
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Tài khoản này đã tồn tại.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Phương thức đăng nhập bằng Email/Mật khẩu chưa được bật trong Firebase Console.');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu. Vui lòng nhập ít nhất 6 ký tự.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email không hợp lệ.');
      } else {
        setError(`Đăng ký thất bại: ${err.message || 'Vui lòng thử lại sau.'}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7] font-sans">
      {/* Top borders */}
      <div className="h-2 bg-[#c62828] w-full"></div>
      <div className="h-1 bg-yellow-400 w-full"></div>

      <div className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        {/* Header Section */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="w-28 h-28 mx-auto mb-6 relative z-20 transition-transform hover:scale-105 duration-300 drop-shadow-md">
            <img 
              src="https://drive.google.com/thumbnail?id=1O7UZhqrJoTc6xac8yB05_laRxhZsfhom&sz=w1000" 
              alt="Logo Chi Bộ Sinh Viên" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-[#c62828] font-bold text-sm md:text-base tracking-wider uppercase mb-3">
            Đảng bộ trường Đại học Kinh tế
          </h2>
          <div className="bg-white px-8 py-2.5 rounded-full shadow-sm border border-red-100 mb-8">
            <h3 className="text-[#c62828] font-bold text-lg md:text-xl uppercase tracking-widest">
              Chi bộ Sinh viên
            </h3>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#c62828] max-w-4xl leading-tight uppercase tracking-tight">
            Cổng thông tin hỗ trợ sinh viên <br className="hidden md:block" />
            <span className="relative inline-block mt-2 md:mt-4">
              Xin vào Đảng
              <div className="absolute -bottom-2 md:-bottom-3 left-0 w-full h-1.5 md:h-2 bg-yellow-400"></div>
            </span>
          </h1>
        </div>

        {/* Main Content Area */}
        <div className="w-full max-w-md flex justify-center">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 md:p-10 w-full border border-gray-100 relative">
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Đăng ký tài khoản
              </h2>
              <p className="text-gray-500 mt-2 text-sm">Dành cho sinh viên</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl mb-6 text-sm text-center border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c62828]/20 focus:border-[#c62828] transition-all uppercase"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="NGUYỄN VĂN A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mã số sinh viên / CCCD
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c62828]/20 focus:border-[#c62828] transition-all"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nhập đủ 12 số"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c62828]/20 focus:border-[#c62828] transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c62828]/20 focus:border-[#c62828] transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3.5 px-4 rounded-xl transition-colors disabled:opacity-50 font-semibold shadow-md bg-[#c62828] hover:bg-[#b71c1c] shadow-red-900/20"
              >
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-semibold hover:underline text-[#c62828]">
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#c62828] text-white/90 py-5 text-center text-sm font-medium tracking-wide">
        © 2025 Bản quyền thuộc về Chi bộ Sinh viên
      </footer>
    </div>
  );
}
