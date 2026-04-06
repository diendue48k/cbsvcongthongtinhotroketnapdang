import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, collection, query, getDocs, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Save, MessageCircle, CheckCircle, Clock, Upload, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import * as mammothModule from 'mammoth/mammoth.browser.js';

const mammoth = (mammothModule as any).default || mammothModule;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function FAQSettings() {
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [savingKb, setSavingKb] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribeKb = onSnapshot(doc(db, 'knowledge_base', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setKnowledgeBase(docSnap.data().content || '');
      }
    }, (error) => {
      console.error('Error fetching knowledge base:', error);
    });

    const unsubscribeQuestions = onSnapshot(query(collection(db, 'pending_questions')), (qSnapshot) => {
      const questions: any[] = [];
      qSnapshot.forEach(doc => {
        questions.push({ id: doc.id, ...doc.data() });
      });
      // Sort by date descending
      questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPendingQuestions(questions);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching pending questions:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeKb();
      unsubscribeQuestions();
    };
  }, []);

  const handleSaveKb = async () => {
    setSavingKb(true);
    try {
      await setDoc(doc(db, 'knowledge_base', 'main'), {
        content: knowledgeBase,
        updatedAt: new Date().toISOString()
      });
      alert('Đã lưu tài liệu kịch bản thành công!');
    } catch (error) {
      console.error('Error saving knowledge base:', error);
      alert('Lỗi khi lưu tài liệu kịch bản.');
    } finally {
      setSavingKb(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    try {
      let extractedText = '';
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'txt') {
        extractedText = await file.text();
      } else if (fileExtension === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        extractedText = text;
      } else if (fileExtension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else {
        alert('Định dạng file không được hỗ trợ. Vui lòng tải lên file .txt, .pdf hoặc .docx');
        setExtracting(false);
        return;
      }

      setKnowledgeBase(prev => {
        const newText = prev 
          ? prev + '\n\n--- Nội dung từ file: ' + file.name + ' ---\n\n' + extractedText 
          : '--- Nội dung từ file: ' + file.name + ' ---\n\n' + extractedText;
        return newText;
      });
      alert('Đã trích xuất nội dung từ file thành công! Vui lòng kiểm tra và nhấn "Lưu tài liệu".');
    } catch (error) {
      console.error('Error extracting text:', error);
      alert('Đã có lỗi xảy ra khi đọc file. Vui lòng thử lại.');
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnswer = async (id: string) => {
    if (!answerText.trim()) return;
    
    try {
      await updateDoc(doc(db, 'pending_questions', id), {
        answer: answerText,
        status: 'answered',
        answeredAt: new Date().toISOString()
      });
      
      // Reset state and refresh
      setAnsweringId(null);
      setAnswerText('');
      
      alert('Đã lưu câu trả lời. Bạn có thể gửi email thủ công cho người dùng với nội dung này.');
    } catch (error) {
      console.error('Error answering question:', error);
      alert('Lỗi khi lưu câu trả lời.');
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-8">
      {/* Knowledge Base Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Tài liệu kịch bản (Knowledge Base)</h3>
            <p className="text-xs text-slate-500 mt-1">Nhập các thông tin, quy định, hướng dẫn để hệ thống sử dụng.</p>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept=".txt,.pdf,.docx" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              {extracting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {extracting ? 'Đang đọc file...' : 'Tải file lên'}
            </button>
            <button
              onClick={handleSaveKb}
              disabled={savingKb}
              className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl text-xs font-bold hover:bg-brand-red-dark transition-all disabled:opacity-50"
            >
              <Save size={16} />
              {savingKb ? 'Đang lưu...' : 'Lưu tài liệu'}
            </button>
          </div>
        </div>
        <div className="p-5">
          <textarea
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
            placeholder="Nhập nội dung tài liệu ở đây hoặc tải file lên (.txt, .pdf, .docx)... Ví dụ: Điều kiện kết nạp Đảng là gì? Quy trình gồm những bước nào?..."
            className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all resize-none"
          />
        </div>
      </div>

      {/* Pending Questions Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Câu hỏi chờ xử lý</h3>
          <p className="text-xs text-slate-500 mt-1">Các câu hỏi cần Ban quản trị giải đáp.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {pendingQuestions.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">
              Không có câu hỏi nào đang chờ xử lý.
            </div>
          ) : (
            pendingQuestions.map(q => (
              <div key={q.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        q.status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {q.status === 'answered' ? 'Đã trả lời' : 'Chờ xử lý'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(q.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Hỏi: {q.question}</h4>
                    <p className="text-xs text-slate-500 mb-3">Email liên hệ: <span className="font-medium text-slate-700">{q.email}</span></p>
                    
                    {q.status === 'answered' ? (
                      <div className="bg-green-50 border border-green-100 p-3 rounded-xl text-sm text-green-800">
                        <span className="font-bold block mb-1">Đã trả lời:</span>
                        {q.answer}
                      </div>
                    ) : (
                      answeringId === q.id ? (
                        <div className="mt-3 space-y-3">
                          <textarea
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            placeholder="Nhập câu trả lời của bạn..."
                            className="w-full h-24 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAnswer(q.id)}
                              className="px-4 py-2 bg-brand-red text-white rounded-xl text-xs font-bold hover:bg-brand-red-dark transition-all"
                            >
                              Gửi câu trả lời
                            </button>
                            <button
                              onClick={() => {
                                setAnsweringId(null);
                                setAnswerText('');
                              }}
                              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAnsweringId(q.id);
                            setAnswerText('');
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-brand-red hover:text-brand-red-dark transition-colors"
                        >
                          <MessageCircle size={14} />
                          Trả lời câu hỏi này
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
