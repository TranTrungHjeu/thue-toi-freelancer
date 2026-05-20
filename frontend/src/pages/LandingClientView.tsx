import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, AnimatePresence, type MotionValue } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Star,
  ShieldCheck,
  Zap,
  ChevronDown,
  Users,
  Briefcase,
  MessageSquare,
  Lock,
  Award,
  Globe,
  UserPlus
} from 'lucide-react';
import LoadingOverlay from '../components/common/LoadingOverlay';
import AuthModal from '../components/auth/AuthModal';
import { useAuth } from '../hooks/useAuth';
import useMinimumLoadingState from '../hooks/useMinimumLoadingState';
import { getProjectCoverImage } from '../utils/projectImages';

const pullUpEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
const cardEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const heroVideoUrl = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4';

type FeatureCard = {
  number: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  items: string[];
};

const featureCards: FeatureCard[] = [
  {
    number: '01',
    title: 'Bắt đầu nhanh chóng',
    description: 'Đăng ký tài khoản và đăng dự án hoặc tìm việc chỉ trong vài phút.',
    icon: UserPlus,
    items: [
      'Tạo tài khoản siêu nhanh gọn',
      'Bảo mật đăng nhập bằng mã OTP',
      'Sẵn sàng làm việc ngay lập tức',
      'Giao diện thân thiện, dễ nhìn',
    ],
  },
  {
    number: '02',
    title: 'Quản lý dễ dàng',
    description: 'Xem báo giá, so sánh lựa chọn và trao đổi trực tiếp với freelancer.',
    icon: Briefcase,
    items: [
      'Đăng tin dự án hoàn toàn miễn phí',
      'Dễ dàng so sánh các mức giá',
      'Nhắn tin trao đổi ngay trên trang',
    ],
  },
  {
    number: '03',
    title: 'Thanh toán an tâm',
    description: 'Hệ thống giữ tiền an toàn cho đến khi bạn hoàn toàn ưng ý với kết quả.',
    icon: ShieldCheck,
    items: [
      'Chia nhỏ công việc để dễ theo dõi',
      'Tiền được bảo vệ bởi hệ thống',
      'Cập nhật tiến độ mọi lúc mọi nơi',
    ],
  },
];

type NavItem = {
  label: string;
  targetId: string;
};

type AuthMode = 'login' | 'register' | 'verify';
type RegisterRole = 'customer' | 'freelancer';

type WordsPullUpProps = {
  text: string;
  className?: string;
  showAsterisk?: boolean;
};

const WordsPullUp = ({ text, className = '', showAsterisk = false }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true });
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <div ref={ref} className={className}>
      {words.map((word, index) => {
        const isLast = index === words.length - 1;
        const shouldShowAsterisk = showAsterisk && isLast && word.toLowerCase().endsWith('a');

        return (
          <motion.span
            key={`${word}-${index}`}
            initial={{ y: 20, opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ duration: 0.6, delay: index * 0.05, ease: pullUpEase }}
            className={`inline-block ${isLast ? '' : 'mr-2'}`}
          >
            {shouldShowAsterisk ? (
              <span className="relative inline-block">
                {word}
                <span className="absolute -right-[0.3em] top-[0.65em] text-[0.31em]">*</span>
              </span>
            ) : (
              word
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

type StyledSegment = {
  text: string;
  className: string;
};

type WordsPullUpMultiStyleProps = {
  segments: StyledSegment[];
  className?: string;
};

const WordsPullUpMultiStyle = ({ segments, className = '' }: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true });
  const words = segments.flatMap((segment) =>
    segment.text.split(/\s+/).filter(Boolean).map((word) => ({ word, className: segment.className })),
  );

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center gap-x-2 gap-y-1 ${className}`}>
      {words.map((entry, index) => (
        <motion.span
          key={`${entry.word}-${index}`}
          initial={{ y: 20, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ duration: 0.6, delay: index * 0.05, ease: pullUpEase }}
          className={`inline-block ${entry.className}`}
        >
          {entry.word}
        </motion.span>
      ))}
    </div>
  );
};

type AnimatedLetterProps = {
  char: string;
  progress: MotionValue<number>;
  index: number;
  totalChars: number;
};

const AnimatedLetter = ({ char, progress, index, totalChars }: AnimatedLetterProps) => {
  const charProgress = index / totalChars;
  const start = Math.max(0, charProgress - 0.1);
  const end = Math.min(1, charProgress + 0.05);
  const opacity = useTransform(progress, [start, end], [0.25, 1]);

  return <motion.span style={{ opacity }}>{char === ' ' ? '\u00A0' : char}</motion.span>;
};

type FeatureInfoCardProps = {
  card: FeatureCard;
  index: number;
};

const FeatureInfoCard = ({ card, index }: FeatureInfoCardProps) => {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const Icon = card.icon;

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: cardEase }}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-zinc-950 p-6 transition-all duration-300 hover:border-primary-500/30 hover:bg-zinc-900/60"
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary-500/5 blur-2xl group-hover:bg-primary-500/10 transition-colors" />
      <div>
        <div className="flex items-center justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-primary-400">
            <Icon className="h-6 w-6" />
          </span>
          <span className="text-3xl font-extrabold text-zinc-800 group-hover:text-primary-500/20 transition-colors">{card.number}</span>
        </div>
        <h3 className="mt-6 text-xl font-bold text-white group-hover:text-primary-400 transition-colors">{card.title}</h3>
        <p className="mt-2 text-sm text-zinc-400">{card.description}</p>

        <ul className="mt-6 space-y-3.5">
          {card.items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
              <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                <Check className="h-3 w-3" />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <button className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-500 transition-all hover:gap-3">
        Xem chi tiết
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.article>
  );
};

type Skill = string | { id?: string | number; name: string };

export type Project = {
  id: string | number;
  title: string;
  description?: string;
  budgetMax?: number;
  skills?: Skill[];
  createdAt: string;
};

const ProjectDate = ({ project }: { project: Project }) => {
  const [dateStr, setDateStr] = useState(() => {
    try {
      return new Date(project.createdAt).toISOString().slice(0, 10);
    } catch {
      return project.createdAt;
    }
  });

  useEffect(() => {
    try {
      setDateStr(new Date(project.createdAt).toLocaleDateString('vi-VN'));
    } catch {
      // ignore
    }
  }, [project.createdAt]);

  return <span className="text-xs text-zinc-400 font-medium">Đăng lúc: {dateStr}</span>;
};

const LandingProjectCard = ({ project, index }: { project: Project; index: number }) => {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const coverImage = getProjectCoverImage(project.skills || []);

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: cardEase }}
      className="relative flex flex-col h-[400px] overflow-hidden rounded-2xl cursor-pointer group bg-zinc-950 border border-white/5 transition-all duration-300 hover:border-primary-500/20 hover:shadow-[0_8px_30px_rgb(34,197,94,0.05)]"
    >
      <div className="absolute inset-0 w-full h-full">
        <img
          src={coverImage}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-60" />
      </div>

      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        <div className="flex flex-wrap gap-1.5">
          {project.skills?.slice(0, 2).map((skill, idx) => {
            const skillName = typeof skill === 'string' ? skill : (skill?.name || '');
            const skillKey = typeof skill === 'string' ? skill : (skill?.id || skill?.name || idx);
            return (
              <span key={skillKey} className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/45 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full shadow-lg">
                {skillName}
              </span>
            );
          })}
        </div>
        <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-black/45 backdrop-blur-md border border-white/10 text-white/70 group-hover:text-primary-400 group-hover:border-primary-500/40 transition-all">
          <ArrowRight className="w-4 h-4 -rotate-45" />
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end z-10">
        <div className="mb-3">
          <span className="inline-block text-xs font-extrabold text-primary-400 bg-primary-950/40 backdrop-blur-sm border border-primary-500/20 px-3 py-1 rounded-lg">
            {project.budgetMax ? `$${project.budgetMax}` : 'Thỏa thuận'}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white leading-snug mb-2 group-hover:text-primary-300 transition-colors line-clamp-2">
          {project.title}
        </h3>

        <div className="grid grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100 transition-all duration-500 ease-in-out">
          <div className="overflow-hidden">
            <p className="mt-2 text-xs text-zinc-300 line-clamp-2 leading-relaxed">
              {project.description}
            </p>

            <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between">
              <ProjectDate project={project} />
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-400 uppercase tracking-wide">
                Xem ngay
              </span>
            </div>
          </div>
        </div>

      </div>
    </motion.article>
  );
};

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 text-left transition-colors hover:text-white"
      >
        <span className="text-base font-semibold text-zinc-100">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 185 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-zinc-500"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-4 pt-2 text-sm leading-relaxed text-zinc-400">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LandingClientView = ({ recentProjects = [] }: { recentProjects?: Project[] }) => {
  const { user, loading: isAuthLoading } = useAuth();
  const [isHeroMediaReady, setIsHeroMediaReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [authRegisterRole, setAuthRegisterRole] = useState<RegisterRole>('customer');
  const [isScrolled, setIsScrolled] = useState(false);
  const paragraphRef = useRef<HTMLParagraphElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: paragraphRef,
    offset: ['start 0.8', 'end 0.2'],
  });
  const isBootLoading = useMinimumLoadingState(!isHeroMediaReady, 220);

  const primaryAction = user
    ? (user.verified ? '/workspace' : `/auth/verify-email?email=${encodeURIComponent(user.email || '')}`)
    : '/auth/register';

  const primaryLabel = user
    ? (user.verified ? 'Vào khu làm việc' : 'Xác thực email')
    : 'Đăng dự án miễn phí';

  const secondaryAction = user
    ? '/workspace/projects'
    : '/auth/register';

  const secondaryLabel = user
    ? 'Xem dự án'
    : 'Tìm việc freelance';

  const openAuthModal = (mode: AuthMode, role: RegisterRole = 'customer') => {
    setAuthModalMode(mode);
    setAuthRegisterRole(role);
    setIsAuthModalOpen(true);
  };

  const openCustomerRegister = () => openAuthModal('register', 'customer');
  const openFreelancerRegister = () => openAuthModal('register', 'freelancer');

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const safetyTimer = window.setTimeout(() => {
      setIsHeroMediaReady(true);
    }, 1800);

    return () => {
      window.clearTimeout(safetyTimer);
    };
  }, []);

  const aboutText = 'Nền tảng giúp bạn kết nối nhanh chóng, theo dõi tiến độ công việc rõ ràng và thanh toán an toàn chỉ với vài cú click chuột.';
  const chars = Array.from(aboutText);
  const navbarItems: NavItem[] = [
    { label: 'Trang chủ', targetId: 'hero' },
    { label: 'Dự án mới', targetId: 'recent-jobs' },
    { label: 'Điểm nổi bật', targetId: 'features' },
    { label: 'Ưu điểm', targetId: 'why-us' },
    { label: 'Đánh giá', targetId: 'testimonials' },
    { label: 'Hỏi đáp', targetId: 'faq' },
  ];

  const scrollToSection = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="relative overflow-x-clip bg-black text-primary-500 [font-family:'Manrope',sans-serif]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <LoadingOverlay isActive={isBootLoading} className="fixed text-primary-500" spinnerSize="lg" />

      <AuthModal
        key={`auth-modal-${isAuthModalOpen}-${authModalMode}`}
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        initialEmail={''}
        initialRegisterRole={authRegisterRole}
        redirectTo="/workspace"
        onClose={closeAuthModal}
      />

      {/* Floating Glassmorphism Navbar */}
      <header className={`fixed top-4 left-1/2 z-50 w-[92%] max-w-7xl -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-6 py-3.5 backdrop-blur-md transition-all duration-300 ${isScrolled ? 'top-2 bg-black/85 shadow-lg border-white/20' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <img src="/favicon.svg" alt="ThuêTôi.vn Logo" className="h-8 w-8 object-contain" />
            <span className="hidden text-base font-black tracking-tight text-white sm:block">
              ThuêTôi<span className="text-primary-500">.vn</span>
            </span>
          </div>

          <nav className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {navbarItems.map((item) => (
                <li key={`${item.label}-${item.targetId}`}>
                  <a
                    href={`#${item.targetId}`}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToSection(item.targetId);
                    }}
                    className="text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-zinc-800" />
            ) : user ? (
              <Link
                to="/workspace"
                className="inline-flex h-9 items-center justify-center rounded-full bg-primary-600 px-5 text-xs font-bold text-white transition-colors hover:bg-primary-700"
              >
                Khu làm việc
              </Link>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="hidden text-xs font-bold text-zinc-300 transition-colors hover:text-white sm:block px-3 py-1.5"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={openCustomerRegister}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-primary-600 px-5 text-xs font-bold text-white transition-colors hover:bg-primary-700"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen px-4 pt-28 pb-12 md:px-6 md:pb-20 flex flex-col justify-center">
        <div className="mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <WordsPullUp
              text="Tìm chuyên gia giỏi & làm việc an toàn."
              className="text-[clamp(2.5rem,5.5vw,4rem)] font-extrabold leading-[1.1] tracking-tight text-white mb-6"
            />

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: pullUpEase }}
              className="max-w-xl text-base leading-relaxed text-zinc-300 mb-8 md:text-lg"
            >
              Tìm kiếm freelancer IT, thiết kế, marketing dễ dàng hơn bao giờ hết. Đăng việc miễn phí, trao đổi trực tiếp và an tâm tuyệt đối với hệ thống giữ tiền thanh toán của chúng tôi.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.45, ease: pullUpEase }}
              className="flex flex-wrap gap-4 min-h-[48px] items-center mb-10"
            >
              {isAuthLoading ? (
                <>
                  <div className="h-12 w-40 animate-pulse rounded-full bg-primary-600/30" />
                  <div className="h-12 w-40 animate-pulse rounded-full bg-zinc-800" />
                </>
              ) : user ? (
                <>
                  <Link
                    to={primaryAction}
                    className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary-600 px-6 text-sm font-bold text-white transition-all hover:bg-primary-700"
                  >
                    <span>{primaryLabel}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to={secondaryAction}
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-bold text-zinc-300 transition-colors hover:border-white/30 hover:bg-white/5"
                  >
                    {secondaryLabel}
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={openCustomerRegister}
                    className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary-600 px-6 text-sm font-bold text-white transition-all hover:bg-primary-700"
                  >
                    <span>{primaryLabel}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={openFreelancerRegister}
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-bold text-zinc-300 transition-colors hover:border-white/30 hover:bg-white/5"
                  >
                    {secondaryLabel}
                  </button>
                </>
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.6 }}
              className="mb-8 text-xs text-zinc-500"
            >
              Miễn phí đăng ký · Không cần thẻ thanh toán · Bắt đầu trong 2 phút
            </motion.p>

            {/* Trust highlights */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-3 gap-4 border-t border-white/5 pt-8 max-w-md"
            >
              <div>
                <span className="block text-2xl font-black text-white">Miễn phí</span>
                <span className="text-xs text-zinc-400">Đăng dự án nhanh</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-white">An toàn</span>
                <span className="text-xs text-zinc-400">Giữ tiền đến khi nghiệm thu</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-white">Hỗ trợ</span>
                <span className="text-xs text-zinc-400">Đồng hành khi có sự cố</span>
              </div>
            </motion.div>
          </div>

          {/* Interactive Screen Preview */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 1 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full aspect-video lg:aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950"
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
                src={heroVideoUrl}
                onLoadedData={() => {
                  setIsHeroMediaReady(true);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
              <div className="absolute inset-0 bg-primary-500/5 mix-blend-color-add pointer-events-none" />

              {/* Dynamic Overlay Tags */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-bold">Dự án tiêu biểu</span>
                <span className="text-sm font-extrabold text-white">Phát triển ứng dụng di động Fintech</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Recent Projects Section */}
      <section id="recent-jobs" className="relative bg-[#050505] px-4 py-20 sm:px-6 md:px-10 md:py-28 border-y border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.02),transparent_35%)] pointer-events-none" />
        <div className="mx-auto max-w-7xl relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="flex items-center gap-2 text-primary-500 text-xs font-extrabold uppercase tracking-widest mb-3">
                <Briefcase className="h-4 w-4" />
                <span>Việc làm nổi bật</span>
              </div>
              <WordsPullUpMultiStyle
                className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white"
                segments={[{ text: 'Cơ hội việc làm mới nhất', className: 'text-white font-extrabold' }]}
              />
              <p className="mt-4 text-sm text-zinc-400 max-w-xl leading-relaxed">
                Khám phá ngay các dự án mới nhất từ khách hàng. Gửi báo giá và bắt đầu trò chuyện trực tiếp để nhận việc ngay hôm nay.
              </p>
            </div>
            <Link
              to={user ? "/workspace/projects" : "/auth/register"}
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  openAuthModal('register');
                }
              }}
              className="shrink-0 inline-flex items-center gap-2 text-sm font-bold text-primary-500 hover:text-primary-400 transition-colors bg-primary-500/5 hover:bg-primary-500/10 border border-primary-500/10 px-5 py-2.5 rounded-full"
            >
              Xem tất cả dự án <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentProjects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recentProjects.slice(0, 4).map((project, index) => (
                <div
                  key={project.id}
                  onClick={() => user ? window.location.href = '/workspace/projects' : openAuthModal('login')}
                  className="h-full"
                >
                  <LandingProjectCard project={project} index={index} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40">
              <Briefcase className="h-10 w-10 text-zinc-600 mb-4 animate-bounce" />
              <p className="text-zinc-400 text-sm font-semibold">Chưa có dự án nào đang mở ở thời điểm hiện tại.</p>
              <button
                onClick={openFreelancerRegister}
                className="mt-4 text-xs font-bold text-primary-500 hover:underline"
              >
                Đăng ký ngay để nhận thông báo khi có dự án mới
              </button>
            </div>
          )}
        </div>
      </section>

      {/* User Paths Section */}
      <section id="user-paths" className="relative bg-black px-4 py-20 sm:px-6 md:px-10 md:py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Bạn muốn bắt đầu theo cách nào?</h2>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              Chọn đúng lộ trình phù hợp với vai trò của bạn để bắt đầu nhanh hơn.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-primary-500/15 bg-primary-500/5 p-7">
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-primary-400">
                <Briefcase className="h-4 w-4" />
                Khách hàng
              </span>
              <h3 className="mt-4 text-2xl font-bold text-white">Tôi muốn thuê freelancer</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Đăng dự án miễn phí, nhận báo giá nhanh và chọn đúng người phù hợp với ngân sách của bạn.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-zinc-300">
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary-500" />Đăng việc chỉ trong vài phút</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary-500" />So sánh hồ sơ và đánh giá trước khi chọn</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary-500" />Thanh toán an toàn theo tiến độ</li>
              </ul>
              <button
                onClick={openCustomerRegister}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary-600 px-6 text-sm font-bold text-white transition-colors hover:bg-primary-700"
              >
                Đăng dự án miễn phí
              </button>
            </article>

            <article className="rounded-2xl border border-white/10 bg-zinc-950 p-7">
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-zinc-300">
                <Users className="h-4 w-4" />
                Freelancer
              </span>
              <h3 className="mt-4 text-2xl font-bold text-white">Tôi muốn nhận việc freelance</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                Tạo hồ sơ năng lực, tiếp cận dự án mới mỗi ngày và nhận thanh toán minh bạch khi hoàn thành công việc.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-zinc-300">
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary-500" />Nhận dự án đúng chuyên môn</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary-500" />Trao đổi trực tiếp với khách hàng</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary-500" />Rút tiền về ngân hàng nhanh chóng</li>
              </ul>
              <button
                onClick={openFreelancerRegister}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-bold text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/5"
              >
                Tìm việc freelance
              </button>
            </article>
          </div>
        </div>
      </section>

      {/* About Reveal Text */}
      <section id="about" className="relative bg-black px-4 py-20 sm:px-6 md:px-10 md:py-28 overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary-500/5 blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-5xl bg-zinc-950/80 border border-white/5 px-6 py-12 text-center rounded-3xl sm:px-12 sm:py-20 md:px-16 relative">
          <div className="absolute left-6 top-6 text-primary-500/20 text-6xl font-serif">“</div>
          <div className="absolute right-6 bottom-6 text-primary-500/20 text-6xl font-serif">”</div>

          <WordsPullUpMultiStyle
            className="mx-auto max-w-4xl text-2xl font-extrabold tracking-tight leading-snug sm:text-3xl md:text-4xl text-white"
            segments={[
              { text: 'Kết nối đúng người,', className: 'text-white' },
              { text: 'làm việc đúng cách.', className: "text-primary-400 italic [font-family:'Lora',serif] font-normal" },
              { text: ' Môi trường an toàn và minh bạch cho mọi giao dịch.', className: 'text-white' },
            ]}
          />

          <p ref={paragraphRef} className="mx-auto mt-10 max-w-3xl text-sm leading-relaxed text-zinc-400 md:text-base font-medium">
            {chars.map((char, index) => (
              <AnimatedLetter
                key={`${char}-${index}`}
                char={char}
                progress={scrollYProgress}
                index={index}
                totalChars={chars.length}
              />
            ))}
          </p>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="relative bg-[#050505] px-4 py-20 sm:px-6 md:px-10 md:py-28 border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary-500 text-xs font-extrabold uppercase tracking-widest mb-3">
              <Star className="h-4 w-4" />
              <span>Khám phá nền tảng</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Mọi thứ bạn cần để hoàn thành công việc
            </h2>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              Từ lúc bắt đầu tìm người cho đến khi nghiệm thu dự án, chúng tôi cung cấp đầy đủ công cụ để bạn trao đổi, quản lý tiến độ và thanh toán một cách cực kỳ dễ dàng.
            </p>
          </div>

          {/* Bento Grid Design */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((card, index) => (
              <div key={card.number} className="col-span-1">
                <FeatureInfoCard card={card} index={index + 1} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className="relative bg-black px-4 py-20 sm:px-6 md:px-10 md:py-28 border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2 text-primary-500 text-xs font-extrabold uppercase tracking-widest mb-3">
                <ShieldCheck className="h-4 w-4" />
                <span>Cam kết của chúng tôi</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-tight">
                Làm việc an tâm với ThuêTôi.vn
              </h2>
              <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                Chúng tôi luôn đồng hành để đảm bảo mọi dự án đều diễn ra suôn sẻ, an toàn tài chính và luôn sẵn sàng hỗ trợ bạn giải quyết mọi vấn đề phát sinh.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { title: 'Bảo vệ thông tin cá nhân', desc: 'Mọi tin nhắn, thông tin dự án và file tài liệu của bạn đều được giữ kín.' },
                  { title: 'Hỗ trợ nhanh chóng & nhiệt tình', desc: 'Đội ngũ của chúng tôi luôn túc trực để lắng nghe và giúp đỡ bạn khi cần.' },
                  { title: 'Chi phí minh bạch, rõ ràng', desc: 'Tuyệt đối không có phụ phí ẩn, mọi khoản phí đều được thông báo rõ từ đầu.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 mt-1">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: ShieldCheck, title: 'Giữ tiền an toàn', desc: 'Tiền của bạn được hệ thống giữ lại và chỉ chuyển cho freelancer khi công việc hoàn tất như thoả thuận.' },
                { icon: MessageSquare, title: 'Trò chuyện trực tiếp', desc: 'Nhắn tin, gọi điện và gửi file ngay trên trang web mà không cần cài thêm ứng dụng nào khác.' },
                { icon: Lock, title: 'Hợp đồng rõ ràng', desc: 'Cam kết về bản quyền và bảo mật thông tin (NDA) được quy định rành mạch để bảo vệ cả hai bên.' },
                { icon: Award, title: 'Đánh giá người thật việc thật', desc: 'Mọi đánh giá đều đến từ các dự án đã hoàn thành thực tế, giúp bạn yên tâm chọn đúng người.' },
              ].map((box, index) => (
                <div key={index} className="border border-primary-500/10 bg-primary-500/5 hover:border-primary-500/25 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 text-primary-400">
                  <box.icon className="h-8 w-8 mb-4" />
                  <h3 className="font-bold text-white text-base mb-2">{box.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{box.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="relative bg-black px-4 py-20 sm:px-6 md:px-10 md:py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center mb-14">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Làm việc bên ngoài hay dùng ThuêTôi.vn?</h2>
            <p className="mt-4 text-sm text-zinc-400">
              Khác biệt lớn nhất là bạn có một hệ thống rõ ràng để làm việc và bảo vệ giao dịch.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-7">
              <h3 className="text-lg font-bold text-white">Làm việc bên ngoài</h3>
              <ul className="mt-5 space-y-3 text-sm text-zinc-300">
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-zinc-500" />Khó theo dõi tiến độ và deadline</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-zinc-500" />Tin nhắn và file dễ bị phân tán nhiều nơi</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-zinc-500" />Rủi ro thanh toán khi chưa có cam kết rõ ràng</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-zinc-500" />Không có bên hỗ trợ khi có tranh chấp</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-primary-500/20 bg-primary-500/5 p-7">
              <h3 className="text-lg font-bold text-white">Dùng ThuêTôi.vn</h3>
              <ul className="mt-5 space-y-3 text-sm text-zinc-100">
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary-400" />Trao đổi, file và hợp đồng ở cùng một nơi</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary-400" />Theo dõi tiến độ và nghiệm thu minh bạch</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary-400" />Tiền được giữ an toàn đến khi hoàn tất công việc</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary-400" />Có đội ngũ hỗ trợ khi phát sinh sự cố</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative bg-[#050505] px-4 py-20 sm:px-6 md:px-10 md:py-28 border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary-500 text-xs font-extrabold uppercase tracking-widest mb-3">
              <Users className="h-4 w-4" />
              <span>Ý kiến từ người dùng</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Mọi người nói gì về chúng tôi?
            </h2>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              Cùng lắng nghe những chia sẻ chân thực từ các khách hàng và freelancer đang đồng hành cùng nền tảng.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                text: "Tôi đăng dự án thiết kế landing page vào buổi sáng, chiều đã có 5 bạn freelancer gửi báo giá. Phần giữ tiền giúp tôi yên tâm hơn khi làm với người mới.",
                name: "Nguyễn Minh Đức",
                role: "Founder, cửa hàng thời trang online",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80"
              },
              {
                text: "Mình làm freelancer nhiều năm nên sợ nhất là bị chậm thanh toán. Từ khi dùng ThuêTôi.vn, mọi thứ rõ ràng hơn vì có mốc nghiệm thu và lịch sử trao đổi đầy đủ.",
                name: "Trần Thị Lan Anh",
                role: "UI/UX Designer Freelancer",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80"
              },
              {
                text: "Trước đây mình phải nhắn tin qua nhiều app khác nhau rất rối. Bây giờ trao đổi, gửi file và theo dõi tiến độ đều ở một chỗ nên tiết kiệm được nhiều thời gian.",
                name: "Phạm Hoàng Nam",
                role: "Fullstack Developer",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80"
              }
            ].map((test, index) => (
              <div key={index} className="border border-white/5 bg-zinc-950 p-6 rounded-2xl relative flex flex-col justify-between transition-colors hover:border-primary-500/10">
                <div>
                  <div className="flex gap-1 text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-300 italic">"{test.text}"</p>
                </div>
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
                  <img src={test.avatar} alt={test.name} className="h-10 w-10 rounded-full object-cover border border-white/10" />
                  <div>
                    <h4 className="font-bold text-white text-xs">{test.name}</h4>
                    <span className="text-[10px] text-zinc-500">{test.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative bg-black px-4 py-20 sm:px-6 md:px-10 md:py-28 border-t border-white/5">
        <div className="mx-auto max-w-4xl relative">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary-500 text-xs font-extrabold uppercase tracking-widest mb-3">
              <Globe className="h-4 w-4" />
              <span>Hỏi đáp</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Các câu hỏi thường gặp
            </h2>
            <p className="mt-4 text-sm text-zinc-400">
              Những thắc mắc phổ biến nhất khi bạn chuẩn bị bắt đầu sử dụng nền tảng của chúng tôi.
            </p>
          </div>

          <div className="space-y-2">
            <FAQItem
              question="Hệ thống giữ tiền an toàn (Ký quỹ) hoạt động như thế nào?"
              answer="Khi hai bên đồng ý làm việc, khách hàng sẽ gửi tiền vào hệ thống. Số tiền này được giữ an toàn tuyệt đối. Chỉ khi freelancer giao sản phẩm và khách hàng đồng ý bấm nghiệm thu, hệ thống mới chuyển tiền cho freelancer. Cách này giúp cả hai bên đều an tâm làm việc mà không sợ rủi ro."
            />
            <FAQItem
              question="Tôi có phải trả phí để đăng bài tìm người không?"
              answer="Việc đăng bài tìm freelancer là hoàn toàn miễn phí! Chúng tôi chỉ thu một mức phí dịch vụ rất nhỏ (từ 3% - 5%) trên mỗi dự án thành công. Khoản phí này giúp chúng tôi duy trì máy chủ hệ thống, hỗ trợ khách hàng và bảo vệ dòng tiền của bạn an toàn."
            />
            <FAQItem
              question="Làm xong việc tôi có thể rút tiền về ngân hàng dễ dàng không?"
              answer="Chắc chắn rồi! Sau khi nhận được thanh toán, bạn có thể tạo lệnh rút tiền về bất kỳ tài khoản ngân hàng nào tại Việt Nam. Tiền thường sẽ về tài khoản của bạn rất nhanh chóng, chỉ mất từ 15 đến 30 phút trong giờ hành chính."
            />
            <FAQItem
              question="Nếu lỡ hai bên không thống nhất được kết quả công việc thì sao?"
              answer="Nếu không may có sự cố hoặc bất đồng về kết quả công việc, bạn có thể yêu cầu hệ thống hỗ trợ giải quyết tranh chấp. Đội ngũ quản trị của chúng tôi sẽ đứng ra xem xét lịch sử trò chuyện, yêu cầu công việc ban đầu và các file đã giao để đưa ra phán quyết công bằng và hợp lý nhất."
            />
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="relative overflow-hidden bg-[#050505] py-20 border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.06),transparent_65%)] pointer-events-none" />
        <div className="mx-auto max-w-4xl text-center px-4 relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Sẵn sàng bắt đầu dự án mới?
          </h2>
          <p className="mt-6 text-sm md:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Đăng dự án để tìm chuyên gia ngay, hoặc đăng ký làm freelancer để nhận việc phù hợp với kỹ năng của bạn.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={openCustomerRegister}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-primary-600 px-8 text-sm font-bold text-white transition-colors hover:bg-primary-700"
            >
              Bắt đầu ngay hôm nay
            </button>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('about');
              }}
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 px-8 text-sm font-bold text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/5"
            >
              Tìm hiểu thêm
            </a>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-black border-t border-white/5 pt-16 pb-8 px-4 sm:px-6 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Logo and Description */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/favicon.svg" alt="ThuêTôi.vn Logo" className="h-7 w-7 object-contain" />
                <span className="text-lg font-black tracking-tight text-white">ThuêTôi<span className="text-primary-500">.vn</span></span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mb-6">
                Nền tảng kết nối việc làm tự do uy tín. Nơi khách hàng tìm đúng người, freelancer nhận đúng việc.
              </p>
              <div className="flex gap-3">
                {['facebook', 'linkedin', 'twitter', 'youtube'].map((social) => (
                  <span key={social} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/5 bg-zinc-950 text-zinc-500 hover:text-white hover:border-white/10 transition-colors">
                    <span className="text-[10px] uppercase font-bold">{social[0]}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Menu Columns */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white mb-4">Khách hàng</h4>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li><Link to="/auth/register" className="hover:text-primary-500 transition-colors">Đăng việc hoàn toàn miễn phí</Link></li>
                <li><span className="hover:text-primary-500 transition-colors cursor-pointer">Xem hồ sơ Freelancer</span></li>
                <li><span className="hover:text-primary-500 transition-colors cursor-pointer">Tìm hiểu cách giữ tiền an toàn</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white mb-4">Freelancer</h4>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li><Link to="/auth/register" className="hover:text-primary-500 transition-colors">Nhận việc mới nhất</Link></li>
                <li><span className="hover:text-primary-500 transition-colors cursor-pointer">Cập nhật hồ sơ (CV)</span></li>
                <li><span className="hover:text-primary-500 transition-colors cursor-pointer">Hướng dẫn rút tiền</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white mb-4">Hỗ trợ & Chính sách</h4>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li><span className="hover:text-primary-500 transition-colors cursor-pointer">Điều khoản sử dụng</span></li>
                <li><span className="hover:text-primary-500 transition-colors cursor-pointer">Chính sách bảo mật</span></li>
                <li><span className="hover:text-primary-500 transition-colors cursor-pointer">Hỗ trợ khi có sự cố</span></li>
                <li><span className="hover:text-primary-500 transition-colors cursor-pointer">Liên hệ hỗ trợ</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-zinc-500 font-medium">
            <span>© {new Date().getFullYear()} ThuêTôi Việt Nam. Mọi quyền được bảo lưu.</span>
            <div className="flex gap-6">
              <span className="hover:text-zinc-400 transition-colors cursor-pointer">Chính sách Cookie</span>
              <span className="hover:text-zinc-400 transition-colors cursor-pointer">Trung tâm trợ giúp</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingClientView;
