import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="page">
      <div className="home-hero">
        <h1>灵魂象限</h1>
        <p>基于 MBTI 性格测试的智能择偶匹配系统，发现与你灵魂契合的另一半</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/register" className="btn btn-primary btn-large">
            开始寻找灵魂伴侣
          </Link>
          <Link to="/login" className="btn btn-secondary btn-large">
            已有账号登录
          </Link>
        </div>
      </div>

      <div className="container">
        <div className="features">
          <div className="feature-card">
            <div className="icon">🧭</div>
            <h3>灵魂测试</h3>
            <p>通过专业的 MBTI 性格测试，深入了解你的内心世界</p>
          </div>
          <div className="feature-card">
            <div className="icon">🔮</div>
            <h3>智能匹配</h3>
            <p>基于性格兼容度和价值观相似度，算法推荐最契合的人</p>
          </div>
          <div className="feature-card">
            <div className="icon">🎭</div>
            <h3>渐进披露</h3>
            <p>四层信息解锁机制，保护你的隐私同时发现真爱我</p>
          </div>
          <div className="feature-card">
            <div className="icon">💬</div>
            <h3>实时聊天</h3>
            <p>匹配成功后即可开始深入交流，了解彼此</p>
          </div>
        </div>

        <div className="quadrant-grid" style={{ maxWidth: '500px', margin: '3rem auto' }}>
          <div className="quadrant-cell explorer">
            <span className="emoji">🚀</span>
            <span className="name">探险家</span>
            <span className="desc">勇于尝试、追求刺激</span>
          </div>
          <div className="quadrant-cell builder">
            <span className="emoji">🏗️</span>
            <span className="name">建造者</span>
            <span className="desc">踏实稳定、注重实际</span>
          </div>
          <div className="quadrant-cell artist">
            <span className="emoji">🎨</span>
            <span className="name">艺术家</span>
            <span className="desc">追求美感、富有创造力</span>
          </div>
          <div className="quadrant-cell philosopher">
            <span className="emoji">🤔</span>
            <span className="name">思想家</span>
            <span className="desc">热爱思考、追求真理</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          <p>已有 <strong style={{ color: 'var(--primary)' }}>12,847</strong> 人找到了灵魂伴侣</p>
        </div>
      </div>
    </div>
  );
}
