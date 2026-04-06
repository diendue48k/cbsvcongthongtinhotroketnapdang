import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      navigate('/');
    }
  }, [profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let email = identifier.trim();
      if (!email.includes('@')) {
        email = `${email}@student.edu.vn`;
      }
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation is handled by useEffect when profile is loaded
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Thông tin đăng nhập không chính xác.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Tài khoản đã bị khóa tạm thời do nhập sai nhiều lần. Vui lòng thử lại sau.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Phương thức đăng nhập bằng Email/Mật khẩu chưa được bật trong Firebase Console.');
      } else {
        setError(`Đăng nhập thất bại: ${err.message || 'Vui lòng kiểm tra lại thông tin.'}`);
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
                Đăng nhập hệ thống
              </h2>
              <p className="text-gray-500 mt-2 text-sm">Vui lòng nhập thông tin để tiếp tục</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl mb-6 text-sm text-center border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
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
                  placeholder="Nhập MSSV hoặc CCCD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c62828]/20 focus:border-[#c62828] transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3.5 px-4 rounded-xl transition-colors disabled:opacity-50 font-semibold shadow-md bg-[#c62828] hover:bg-[#b71c1c] shadow-red-900/20"
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold hover:underline text-[#c62828]">
                Đăng ký ngay
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
