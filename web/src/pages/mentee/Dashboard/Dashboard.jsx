import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Sample data - replace with real API calls
  const upcomingClasses = [
    {
      id: 1,
      title: 'Excel Mastery: Data Visualization',
      mentor: 'Minh Tran',
      time: 'Today, 2:00 PM',
      seatsLeft: 4,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCELbtArZYMJprjuOKbN-_Q62eckAnUBqq1z6hEZb6YBHnzoZSyDwUt1lHWzLNJjJfHF2oVsbYTJvDedWXw58-rNCU5_o9X3aPIMiqT93ZiYAmAeUcq-XNDsPcpyT06-XTLQzhHQTlZUSP9EPgkUuXuznjMy9b2thEhXcIvBDDwr5BYY4SqSPzVoojdQ9N36sZw2GKhHRwc1U6NU-uY_BLomB-hOWv2DgrSeLZO0HhqCC5z39Xff3nKHTv96wQzWwdVGURsaeU-Rirr',
      isLive: true,
      available: true
    },
    {
      id: 2,
      title: 'Cyber Security 101',
      mentor: 'Sarah J.',
      time: 'Tomorrow, 10:00 AM',
      seatsLeft: 0,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXIoX4chRs0GTu1NdPNuMWQooXyjJFTvI6SvqnzvKyh78zdvaM6h4wmNdUNPkpKu4XYc_ZVGcIPuhSkT2zni3xC0asmYDbxn4d_0DMTLQ4IrKXXXzt08Ffd9ziOYqjrGMwnKmr_n4mONUOPUZ-ATlGzqSHlXuHiTcHQGtu8DIO-b1PD6VOBsHLwI-U_FrsDquaunfEnrmC62rCnDws_zlCno5bKqo33FebzwdPmFllbS8e6ADNHr1UG3kuiSQ2hx3oSMqoAOizI5L7',
      isLive: false,
      available: false
    }
  ];

  const skillMarketplace = [
    {
      id: 1,
      title: 'Effective Public Speaking',
      category: 'Soft Skills',
      description: 'Learn the secrets of engaging an audience, structuring your speech, and conquering stage fright with David L.',
      students: 15,
      nextSession: 'Fri, 3:00 PM',
      icon: 'psychology'
    },
    {
      id: 2,
      title: 'Intro to React Native',
      category: 'Technical',
      description: 'Build mobile apps for iOS and Android using your existing web development skills.',
      students: 6,
      nextSession: 'Mon, 9:00 AM',
      icon: 'terminal'
    }
  ];

  const wishlistItems = [
    { id: 1, name: 'Advanced Python', votes: 24, voted: true },
    { id: 2, name: 'UX Design Fundamentals', votes: 18, voted: false },
    { id: 3, name: 'Negotiation Skills', votes: 12, voted: false }
  ];

  const badges = [
    { icon: 'speed', color: 'primary', title: 'Fast Learner' },
    { icon: 'share', color: 'purple', title: 'Knowledge Sharer' },
    { icon: 'calendar_today', color: 'blue', title: 'Consistent' }
  ];

  const trendingTags = ['#AI_Tools', '#Teamwork', '#SQL', '#Marketing', '#Leadership'];

  return (
    <div className="min-h-screen bg-bg-light">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white px-4 md:px-10 py-3">
        <div className="max-w-360 mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-deep-blue">
                <span className="material-symbols-outlined text-xl">bolt</span>
              </div>
              <h2 className="text-slate-900 text-xl font-bold tracking-tight">InnerG</h2>
            </div>
            <nav className="hidden lg:flex items-center gap-6">
              <Link to="/dashboard" className="text-primary text-sm font-bold border-b-2 border-primary pb-1">
                Home
              </Link>
              <Link to="/learning" className="text-slate-900 text-sm font-medium hover:text-primary transition-colors">
                My Learning
              </Link>
              <Link to="/resources" className="text-slate-900 text-sm font-medium hover:text-primary transition-colors">
                Resource Hub
              </Link>
              <Link to="/rewards" className="text-slate-900 text-sm font-medium hover:text-primary transition-colors">
                Rewards
              </Link>
            </nav>
          </div>

          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input 
                className="w-full bg-gray-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                placeholder="Search skills, mentors, or classes..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button 
              onClick={handleLogout}
              className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold hover:bg-primary/30 transition-colors"
            >
              {user?.userName?.charAt(0).toUpperCase() || 'U'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-360 mx-auto px-4 md:px-10 py-8 grid grid-cols-12 gap-8">
        {/* Sidebar Navigation & User Info */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                {user?.userName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-bold text-lg">{user?.userName || 'User'}</h3>
                <p className="text-gray-500 text-sm">Senior Developer</p>
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-bold"
              >
                <span className="material-symbols-outlined">dashboard</span> Dashboard
              </Link>
              <Link 
                to="/mentors" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="material-symbols-outlined">groups</span> Mentors
              </Link>
              <Link 
                to="/skills" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="material-symbols-outlined">bolt</span> My Skills
              </Link>
              <Link 
                to="/wishlist" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="material-symbols-outlined">favorite</span> Wishlist
              </Link>
            </nav>

            <div className="mt-8 p-4 bg-deep-blue rounded-xl text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-80">InnerG Points</span>
                <span className="material-symbols-outlined text-primary">stars</span>
              </div>
              <p className="text-2xl font-bold mb-4">1,250</p>
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-xs opacity-60">250 pts to Level 5</p>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Recently Earned Badges
              </h4>
              <div className="flex gap-2">
                {badges.map((badge, index) => (
                  <div 
                    key={index}
                    className={`w-10 h-10 rounded-full ${
                      badge.color === 'primary' ? 'bg-primary/20 text-primary' :
                      badge.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                      'bg-blue-100 text-blue-600'
                    } flex items-center justify-center`}
                    title={badge.title}
                  >
                    <span className="material-symbols-outlined text-xl">{badge.icon}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-8">
          {/* Upcoming Classes Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Lớp học sắp tới (Upcoming Classes)</h2>
              <Link to="/calendar" className="text-primary text-sm font-medium hover:underline">
                See Calendar
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {upcomingClasses.map((classItem) => (
                <div 
                  key={classItem.id}
                  className="min-w-70 bg-white rounded-xl p-4 border border-gray-100 shadow-sm shrink-0"
                >
                  <div 
                    className="h-32 rounded-lg bg-cover bg-center mb-4 relative"
                    style={{ backgroundImage: `url(${classItem.image})` }}
                  >
                    {classItem.isLive && (
                      <div className="absolute top-2 right-2 bg-primary text-deep-blue text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                        Live Session
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-base mb-1">{classItem.title}</h4>
                  <p className="text-gray-500 text-xs mb-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">person</span> 
                    Mentor: {classItem.mentor}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">{classItem.time}</span>
                      <span className={`text-[10px] font-bold ${
                        classItem.available ? 'text-orange-500' : 'text-gray-400'
                      }`}>
                        {classItem.available ? `${classItem.seatsLeft} seats left` : 'Fully Booked'}
                      </span>
                    </div>
                    <button 
                      className={`font-bold text-xs py-2 px-4 rounded-lg ${
                        classItem.available 
                          ? 'bg-primary text-deep-blue hover:brightness-105' 
                          : 'bg-gray-100 text-gray-500'
                      } transition-all`}
                    >
                      {classItem.available ? 'Join' : 'Waitlist'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Skill Marketplace Feed */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Skill Marketplace</h2>
              <div className="flex gap-2">
                <button className="text-xs font-bold px-3 py-1 bg-white rounded-full border border-gray-200">
                  Recent
                </button>
                <button className="text-xs font-bold px-3 py-1 hover:bg-white rounded-full transition-colors">
                  Popular
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {skillMarketplace.map((item) => (
                <div 
                  key={item.id}
                  className="group bg-white p-5 rounded-xl border border-gray-100 hover:border-primary transition-all"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <span className="bg-gray-100 text-[10px] px-2 py-1 rounded font-bold uppercase">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mt-1 mb-4 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-300"></div>
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-400"></div>
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold">
                              +{item.students - 2}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">Next session: {item.nextSession}</span>
                        </div>
                        <button className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                          Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar - Wishlist */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Learning Wishlist</h3>
              <span className="material-symbols-outlined text-gray-400">info</span>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              What would you like to learn next? Upvote skills or suggest your own.
            </p>
            <div className="flex flex-col gap-4 mb-6">
              {wishlistItems.map((item) => (
                <div 
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    item.voted ? 'bg-bg-light' : 'border border-gray-100'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm">{item.name}</p>
                    <span className="text-[10px] text-gray-400">
                      Requested by {item.votes} people
                    </span>
                  </div>
                  <button className={`flex flex-col items-center gap-0.5 group ${
                    item.voted ? 'text-primary' : 'text-gray-400 hover:text-primary'
                  }`}>
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                      thumb_up
                    </span>
                    <span className="text-[10px] font-bold">{item.votes}</span>
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full bg-primary py-3 rounded-lg text-deep-blue font-bold text-sm flex items-center justify-center gap-2 hover:brightness-105 transition-all">
              <span className="material-symbols-outlined text-sm">add</span> Request a Skill
            </button>
          </div>

          {/* Trending Topics */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">
              Trending Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <footer className="max-w-360 mx-auto px-10 py-8 border-t border-gray-100 text-center">
        <p className="text-gray-400 text-xs">
          © 2024 InnerG SaaS Platform. Powered by internal knowledge exchange.
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;