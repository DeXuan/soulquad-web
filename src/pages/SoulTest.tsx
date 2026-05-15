import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MBTI_QUESTIONS, calculateMBTI, getSoulQuadrant, QUADRANT_INFO, VALUES, INTERESTS } from '../data/mbti';
import { api, City } from '../services/api';
import { useAuth } from '../hooks/useAuth';

type TestStep = 'intro' | 'mbti' | 'values' | 'interests' | 'optional' | 'complete';

export function SoulTest() {
  const [step, setStep] = useState<TestStep>('intro');
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Optional info states
  const [hasHouse, setHasHouse] = useState<boolean | null>(null);
  const [houseLocation, setHouseLocation] = useState('');
  const [hasCar, setHasCar] = useState<boolean | null>(null);
  const [education, setEducation] = useState('');
  const [income, setIncome] = useState<number | null>(null);

  const [cities, setCities] = useState<City[]>([]);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const data = await api.getCities();
      setCities(data);
    } catch {
      // ignore
    }
  };

  const filteredCities = cities.filter(c =>
    c.name.includes(citySearch) || c.province.includes(citySearch)
  );

  const getProgress = () => {
    switch (step) {
      case 'intro': return 0;
      case 'mbti': return Math.round(((currentQuestion + 1) / MBTI_QUESTIONS.length) * 30);
      case 'values': return 45;
      case 'interests': return 60;
      case 'optional': return 80;
      case 'complete': return 100;
      default: return 0;
    }
  };

  const getStepLabel = () => {
    switch (step) {
      case 'intro': return '灵魂测试';
      case 'mbti': return `灵魂测试 · ${currentQuestion + 1}/${MBTI_QUESTIONS.length}`;
      case 'values': return '核心价值观';
      case 'interests': return '兴趣爱好';
      case 'optional': return '基本信息（选填）';
      case 'complete': return '测试完成';
      default: return '';
    }
  };

  const handleMBTIAnswer = (answer: 'A' | 'B') => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestion < MBTI_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep('values');
    }
  };

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter(v => v !== value));
    } else if (selectedValues.length < 5) {
      setSelectedValues([...selectedValues, value]);
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else if (selectedInterests.length < 5) {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const calculateProfileScore = (): number => {
    let score = 50; // Base score

    // Education bonus
    const educationScores: Record<string, number> = {
      '博士': 15, '硕士': 12, '本科': 8, '高中': 4, '其他': 2
    };
    score += educationScores[education] || 0;

    // House bonus
    if (hasHouse) {
      score += 15;
      if (houseLocation && ['北京', '上海', '深圳'].includes(houseLocation)) {
        score += 10;
      }
    }

    // Car bonus
    if (hasCar) score += 8;

    // Income bonus
    if (income) {
      if (income >= 100) score += 15;
      else if (income >= 50) score += 10;
      else if (income >= 30) score += 6;
      else score += 3;
    }

    return Math.min(score, 100);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const mbti = calculateMBTI(answers);
      const soulQuadrant = getSoulQuadrant(mbti);
      const profileScore = calculateProfileScore();

      const user = await api.submitSoulTest({
        mbti,
        soul_quadrant: soulQuadrant,
        values: selectedValues,
        interests: selectedInterests,
        assets: hasHouse !== null ? {
          has_house: hasHouse,
          house_location: houseLocation,
          house_value: null,
          has_car: hasCar,
          car_brand: '',
          car_value: null
        } : undefined,
        credit: education ? {
          education,
          ant_credit_score: null,
          annual_income: income,
          has_credit_report: null
        } : undefined,
        profile_score: profileScore
      });

      updateUser(user);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const renderIntro = () => (
    <div className="test-container fade-in">
      <div style={{
        textAlign: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🧪</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>
          灵魂测试
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
          通过简单的测试，了解你的性格类型、价值观和兴趣爱好
        </p>

        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <p style={{ color: 'var(--primary)', fontSize: '0.9375rem', fontWeight: 500, margin: 0 }}>
            💡 答题越多，人物画像越丰满，更容易匹配到契合的人
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>测试内容</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: '🧠', text: `MBTI性格测试（${MBTI_QUESTIONS.length}题）` },
              { icon: '💎', text: '核心价值观（选5个）' },
              { icon: '🎯', text: '兴趣爱好（选5个）' },
              { icon: '📝', text: '基本信息（选填）' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary btn-large"
          onClick={() => setStep('mbti')}
          style={{ width: '100%', maxWidth: '300px' }}
        >
          开始测试
        </button>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          预计用时 3-5 分钟
        </p>
      </div>
    </div>
  );

  const renderMBTI = () => (
    <div className="test-container fade-in">
      <div className="test-progress">
        <div className="test-progress-bar">
          <div className="test-progress-fill" style={{ width: `${getProgress()}%` }} />
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {getStepLabel()}
        </span>
      </div>

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.25rem'
          }}>
            {currentQuestion + 1}
          </div>
          <h2 style={{ fontSize: '1.125rem', lineHeight: 1.5 }}>
            {MBTI_QUESTIONS[currentQuestion].question}
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            className="test-option"
            onClick={() => handleMBTIAnswer('A')}
            style={{ padding: '1rem', textAlign: 'left' }}
          >
            {MBTI_QUESTIONS[currentQuestion].optionA.text}
          </button>
          <button
            className="test-option"
            onClick={() => handleMBTIAnswer('B')}
            style={{ padding: '1rem', textAlign: 'left' }}
          >
            {MBTI_QUESTIONS[currentQuestion].optionB.text}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '1.5rem' }}>
          {MBTI_QUESTIONS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentQuestion ? '20px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i < currentQuestion ? 'var(--primary)' :
                           i === currentQuestion ? 'var(--primary)' : 'var(--border)',
                transition: 'all 0.2s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderValues = () => (
    <div className="test-container fade-in">
      <div className="test-progress">
        <div className="test-progress-bar">
          <div className="test-progress-fill" style={{ width: `${getProgress()}%` }} />
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {getStepLabel()}
        </span>
      </div>

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2>你最看重什么？</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            选择最多 5 个
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {VALUES.map(value => (
            <button
              key={value}
              className={`test-option ${selectedValues.includes(value) ? 'selected' : ''}`}
              onClick={() => toggleValue(value)}
              style={{
                padding: '0.875rem 0.75rem',
                fontSize: '0.9375rem'
              }}
            >
              {value}
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border)'
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            已选择: {selectedValues.length}/5
          </span>
          <button
            className="btn btn-primary"
            onClick={() => setStep('interests')}
            disabled={selectedValues.length === 0}
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );

  const renderInterests = () => (
    <div className="test-container fade-in">
      <div className="test-progress">
        <div className="test-progress-bar">
          <div className="test-progress-fill" style={{ width: `${getProgress()}%` }} />
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {getStepLabel()}
        </span>
      </div>

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2>你平时喜欢做什么？</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            选择最多 5 个
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {INTERESTS.map(interest => (
            <button
              key={interest}
              className={`test-option ${selectedInterests.includes(interest) ? 'selected' : ''}`}
              onClick={() => toggleInterest(interest)}
              style={{
                padding: '0.875rem 0.75rem',
                fontSize: '0.9375rem'
              }}
            >
              {interest}
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border)'
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            已选择: {selectedInterests.length}/5
          </span>
          <button
            className="btn btn-primary"
            onClick={() => setStep('optional')}
            disabled={selectedInterests.length === 0}
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );

  const renderOptional = () => (
    <div className="test-container fade-in">
      <div className="test-progress">
        <div className="test-progress-bar">
          <div className="test-progress-fill" style={{ width: `${getProgress()}%` }} />
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {getStepLabel()}
        </span>
      </div>

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2>基本信息（选填）</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            完善信息可获得更精准的匹配
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Education */}
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
              学历
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {['博士', '硕士', '本科', '高中', '其他'].map(opt => (
                <button
                  key={opt}
                  className={`test-option ${education === opt ? 'selected' : ''}`}
                  onClick={() => setEducation(opt)}
                  style={{ padding: '0.625rem' }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Income */}
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
              年收入
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {[
                { label: '20万以下', value: 15 },
                { label: '20-50万', value: 35 },
                { label: '50-100万', value: 75 },
                { label: '100万以上', value: 150 }
              ].map(opt => (
                <button
                  key={opt.label}
                  className={`test-option ${income === opt.value ? 'selected' : ''}`}
                  onClick={() => setIncome(opt.value)}
                  style={{ padding: '0.625rem' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* House */}
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
              是否有房产
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className={`test-option ${hasHouse === true ? 'selected' : ''}`}
                onClick={() => setHasHouse(true)}
                style={{ flex: 1, padding: '0.875rem' }}
              >
                有
              </button>
              <button
                className={`test-option ${hasHouse === false ? 'selected' : ''}`}
                onClick={() => setHasHouse(false)}
                style={{ flex: 1, padding: '0.875rem' }}
              >
                无
              </button>
              <button
                className={`test-option ${hasHouse === null ? 'selected' : ''}`}
                onClick={() => setHasHouse(null)}
                style={{ flex: 1, padding: '0.875rem' }}
              >
                保密
              </button>
            </div>
          </div>

          {/* Car */}
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
              是否有车辆
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className={`test-option ${hasCar === true ? 'selected' : ''}`}
                onClick={() => setHasCar(true)}
                style={{ flex: 1, padding: '0.875rem' }}
              >
                有
              </button>
              <button
                className={`test-option ${hasCar === false ? 'selected' : ''}`}
                onClick={() => setHasCar(false)}
                style={{ flex: 1, padding: '0.875rem' }}
              >
                无
              </button>
              <button
                className={`test-option ${hasCar === null ? 'selected' : ''}`}
                onClick={() => setHasCar(null)}
                style={{ flex: 1, padding: '0.875rem' }}
              >
                保密
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginTop: '2rem'
        }}>
          <button
            className="btn btn-secondary"
            onClick={() => setStep('interests')}
            style={{ flex: 1 }}
          >
            上一步
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ flex: 2 }}
          >
            {loading ? '分析中...' : '完成测试'}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          跳过，直接查看结果
        </button>
      </div>
    </div>
  );

  const renderComplete = () => {
    const mbti = calculateMBTI(answers);
    const quadrant = getSoulQuadrant(mbti);
    const quadrantInfo = QUADRANT_INFO[quadrant];
    const profileScore = calculateProfileScore();

    const quadrantColors: Record<string, string> = {
      explorer: 'linear-gradient(135deg, #f59e0b, #f97316)',
      builder: 'linear-gradient(135deg, #22c55e, #16a34a)',
      artist: 'linear-gradient(135deg, #ec4899, #d946ef)',
      philosopher: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
    };

    return (
      <div className="test-container fade-in">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ marginBottom: '0.5rem' }}>测试完成！</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            你的灵魂画像已生成
          </p>

          <div style={{
            background: 'var(--bg-dark)',
            borderRadius: '16px',
            padding: '2rem 1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: quadrantColors[quadrant] || 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '2.5rem'
            }}>
              {quadrantInfo.emoji}
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {quadrantInfo.name}
            </h2>
            <p style={{
              display: 'inline-block',
              padding: '0.375rem 1rem',
              background: 'rgba(99, 102, 241, 0.15)',
              borderRadius: '20px',
              color: 'var(--primary)',
              fontWeight: 600,
              fontSize: '0.9375rem',
              marginBottom: '1rem'
            }}>
              MBTI: {mbti}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
              {quadrantInfo.description}
            </p>

            {/* Profile Score */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              background: 'var(--bg-card)',
              borderRadius: '12px'
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                综合画像评分
              </p>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: profileScore >= 70 ? '#22c55e' : profileScore >= 40 ? '#f59e0b' : '#ef4444'
              }}>
                {profileScore}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                基于资料完善度综合评估
              </p>
            </div>
          </div>

          <button
            className="btn btn-primary btn-large"
            onClick={() => navigate('/discover')}
            style={{ width: '100%' }}
          >
            开始发现灵魂伴侣
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div style={{ padding: '16px 12px', maxWidth: '430px', margin: '0 auto' }}>
        {/* Progress Header */}
        {step !== 'intro' && step !== 'complete' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => {
                if (step === 'mbti') setStep('intro');
                else if (step === 'values') { setStep('mbti'); setCurrentQuestion(MBTI_QUESTIONS.length - 1); }
                else if (step === 'interests') setStep('values');
                else if (step === 'optional') setStep('interests');
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              ←
            </button>
          </div>
        )}

        {step === 'mbti' && renderMBTI()}
        {step === 'values' && renderValues()}
        {step === 'interests' && renderInterests()}
        {step === 'optional' && renderOptional()}
        {step === 'complete' && renderComplete()}
        {step === 'intro' && renderIntro()}
      </div>

      {/* City Picker Modal */}
      {showCityPicker && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1200,
            display: 'flex', alignItems: 'flex-end'
          }}
          onClick={() => setShowCityPicker(false)}
        >
          <div
            style={{
              width: '100%', maxHeight: '70vh',
              background: 'var(--bg-secondary)',
              borderRadius: '16px 16px 0 0',
              padding: '1.5rem', overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>选择城市</h3>
              <button onClick={() => setShowCityPicker(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>
            <input
              type="text"
              placeholder="搜索城市..."
              value={citySearch}
              onChange={e => setCitySearch(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem 1rem',
                background: 'var(--input-bg)', border: '1px solid var(--border)',
                borderRadius: '10px', color: 'var(--text-primary)',
                fontSize: '0.9375rem', marginBottom: '1rem'
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {filteredCities.slice(0, 50).map(city => (
                <button
                  key={city.code}
                  onClick={() => {
                    setHouseLocation(city.name);
                    setShowCityPicker(false);
                    setCitySearch('');
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: houseLocation === city.name ? 'var(--primary)' : 'var(--bg-glass)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}