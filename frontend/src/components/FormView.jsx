import React, { useState } from 'react';
import { extractKeywords } from '../utils/analyze';
import { Send, History, CheckCircle, ChevronRight, Check } from 'lucide-react';

export default function FormView({ onReportAdded }) {
  const [name, setName] = useState('');
  const [thisWeekTask, setThisWeekTask] = useState('');
  const [nextWeekTask, setNextWeekTask] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Past History Load
  const [showHistory, setShowHistory] = useState(false);
  const [myPastReports, setMyPastReports] = useState([]);

  const loadMyHistory = async () => {
    if (!name.trim()) {
      alert("담당자 이름을 먼저 입력해주세요.");
      return;
    }
    
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/reports`);
      const data = await res.json();
      const mine = data.filter(r => r.name.includes(name.trim())).sort((a,b) => new Date(b.date) - new Date(a.date));
      setMyPastReports(mine);
      setShowHistory(true);
    } catch (err) {
      console.error(err);
      alert("과거 이력을 불러오는데 실패했습니다.");
    }
  };

  const applyPastReport = (report) => {
    // Bring past 'nextWeekTask' to current 'thisWeekTask' if available, otherwise just use their past thisWeekTask
    if (report.nextWeekTask && report.nextWeekTask.trim().length > 0) {
      setThisWeekTask(report.nextWeekTask + '\n\n[지난주 예정사항에서 가져옴. 진행 내역으로 수정해주세요.]');
    } else {
      setThisWeekTask(report.thisWeekTask);
    }
    setShowHistory(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || (!thisWeekTask && !nextWeekTask)) {
      alert('이름과 업무 내용을 최소 하나 이상 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    // Combine for keyword extraction to keep metadata rich
    const combinedTask = `${thisWeekTask}\n${nextWeekTask}`;
    const keywordsArray = extractKeywords(combinedTask);
    const keywordsString = keywordsArray.join(',');

    let uploadedImagePath = '';
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      try {
        const upRes = await fetch(`/api/upload`, {
          method: 'POST',
          body: formData
        });
        if (upRes.ok) {
          const upData = await upRes.json();
          uploadedImagePath = upData.imagePath;
        }
      } catch (err) {
        console.error('Image upload failed', err);
      }
    }

    const payload = {
      date: new Date().toISOString(),
      name: name.trim(),
      thisWeekTask,
      nextWeekTask,
      imagePath: uploadedImagePath,
      keywords: keywordsString
    };

    try {
      const res = await fetch(`/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setSuccess(true);
        setName('');
        setThisWeekTask('');
        setNextWeekTask('');
        setImageFile(null);
        setTimeout(() => {
          setSuccess(false);
          onReportAdded();
        }, 1500);
      } else {
        const errData = await res.json();
        alert(`저장 실패: ${errData.error || '알 수 없는 오류'}\n(혹시 엑셀에서 CSV 파일을 열어두고 계신다면 종료해주세요.)`);
      }
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-wrapper" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2>주간 업무 작성</h2>
        <p>복잡한 양식 없이 금주 진행 사항과 차주 계획을 나열식으로 편하게 작성하세요.</p>
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '1rem', borderRadius: '8px', marginTop: '1rem', fontWeight: 'bold', display: 'inline-block', textAlign: 'left' }}>
          💡 [스마트 작성 규칙]<br/>
          매번 대괄호를 쓸 필요 없이, <b>[프로젝트명]</b>을 한 번만 적고 줄바꿈을 하세요!<br/>
          그 아래에 적는 모든 내용은 다음 대괄호가 나오기 전까지 해당 프로젝트로 자동 묶음 처리됩니다.
        </div>
      </div>

      <div className="card" style={{ padding: '3rem', position: 'relative' }}>
        {success && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '16px' }}>
            <CheckCircle size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', color: '#064e3b' }}>성공적으로 제출되었습니다!</h3>
            <p style={{ color: '#059669', marginTop: '0.5rem' }}>대시보드로 이동합니다...</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label>담당자 이름</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="예: 장동훈 (직급 생략 가능)" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <button type="button" className="btn-secondary" onClick={loadMyHistory} style={{ padding: '0.875rem 1.5rem' }}>
              <History size={18} /> 내 과거 이력 불러오기
            </button>
          </div>

          {showHistory && (
            <div style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                <History size={16} /> 최근 작성 이력
              </h4>
              {myPastReports.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>조회된 과거 이력이 없습니다.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {myPastReports.slice(0,3).map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ flex: 1, marginRight: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                          {new Date(r.date).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#1e293b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {r.thisWeekTask}
                        </div>
                      </div>
                      <button type="button" className="btn-secondary" onClick={() => applyPastReport(r)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                        복사하여 가져오기
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-group" style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e40af' }}>
              <Check size={18} /> 금주 진행 업무
            </label>
            <textarea 
              className="form-control" 
              placeholder="예)&#10;[공통]&#10;- 알루미늄 분말 구매&#10;&#10;[LIG]&#10;- EOS M290 프린팅 진행 검토&#10;&#10;[연구개발]&#10;- 구리 공정변수 열처리 접수"
              value={thisWeekTask}
              onChange={(e) => setThisWeekTask(e.target.value)}
              style={{ minHeight: '180px', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}
            />
          </div>

          <div className="form-group" style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857' }}>
              <ChevronRight size={18} /> 차주 업무 계획
            </label>
            <textarea 
              className="form-control" 
              placeholder="예)&#10;[풍산]&#10;- 4/30일 풍산과 기술미팅 예정&#10;&#10;[Limlaser]&#10;- 공인시험 접수 예정"
              value={nextWeekTask}
              onChange={(e) => setNextWeekTask(e.target.value)}
              style={{ minHeight: '180px', borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' }}
            />
          </div>

          <div className="form-group" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <label>첨부 파일 (현장/시편 사진 등 - 옵션)</label>
            <input 
              type="file" 
              accept="image/*"
              className="form-control" 
              onChange={(e) => setImageFile(e.target.files[0])}
              style={{ padding: '0.5rem 1rem' }}
            />
            {imageFile && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#047857' }}>
                선택된 파일: {imageFile.name}
              </div>
            )}
          </div>

          <div style={{ marginTop: '3rem', textAlign: 'right' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
              <Send size={20} /> {isSubmitting ? '저장 중...' : '보고서 제출하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
