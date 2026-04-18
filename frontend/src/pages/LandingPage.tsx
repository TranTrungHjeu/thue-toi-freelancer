import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import LoadingOverlay from '../components/common/LoadingOverlay';
import AuthModal from '../components/auth/AuthModal';
import { useAuth } from '../hooks/useAuth';
import useMinimumLoadingState from '../hooks/useMinimumLoadingState';

const pullUpEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
const cardEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const heroVideoUrl = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4';
const featureVideoUrl = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4';

type FeatureCard = {
  number: string;
  title: string;
  icon: string;
  items: string[];
};

const featureCards: FeatureCard[] = [
  {
    number: '01',
    title: 'Bắt đầu nhanh.',
    icon: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=1280&q=85',
    items: [
      'Tạo tài khoản chỉ trong vài bước.',
      'Xác thực email bằng mã OTP an toàn.',
      'Vào khu làm việc ngay sau khi kích hoạt.',
      'Trải nghiệm liền mạch từ lần truy cập đầu tiên.',
    ],
  },
  {
    number: '02',
    title: 'Dự án rõ ràng.',
    icon: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171741_ed9845ab-f5b2-4018-8ce7-07cc01823522.png&w=1280&q=85',
    items: [
      'Đăng dự án nhanh với thông tin đầy đủ.',
      'Nhận báo giá phù hợp từ freelancer.',
      'Trao đổi tập trung theo từng dự án.',
    ],
  },
  {
    number: '03',
    title: 'Hợp đồng minh bạch.',
    icon: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171809_f56666dc-c099-4778-ad82-9ad4f209567b.png&w=1280&q=85',
    items: [
      'Theo dõi milestone và thanh toán tại một nơi.',
      'Nhận thông báo realtime khi có cập nhật mới.',
      'Giữ tiến độ công việc luôn minh bạch cho cả hai bên.',
    ],
  },
];

type NavItem = {
  label: string;
  targetId: string;
};

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
            transition={{ duration: 0.6, delay: index * 0.08, ease: pullUpEase }}
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
          transition={{ duration: 0.6, delay: index * 0.08, ease: pullUpEase }}
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
  const opacity = useTransform(progress, [start, end], [0.2, 1]);

  return <motion.span style={{ opacity }}>{char === ' ' ? '\u00A0' : char}</motion.span>;
};

type FeatureInfoCardProps = {
  card: FeatureCard;
  index: number;
};

const FeatureInfoCard = ({ card, index }: FeatureInfoCardProps) => {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.65, delay: index * 0.15, ease: cardEase }}
      className="flex h-full flex-col justify-between border border-[#2f2f2f] bg-[#212121] p-5 sm:p-6"
    >
      <div>
        <img src={card.icon} alt={card.title} className="h-10 w-10 rounded sm:h-12 sm:w-12" />
        <div className="mt-5 flex items-center gap-3">
          <span className="text-xs text-gray-500">{card.number}</span>
          <h3 className="text-base font-semibold text-primary-500 sm:text-lg">{card.title}</h3>
        </div>
        <ul className="mt-5 space-y-3">
          {card.items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-gray-400">
              <Check className="mt-0.5 h-4 w-4 text-primary-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <button className="mt-6 inline-flex w-fit items-center gap-2 text-sm text-primary-500 transition-opacity hover:text-primary-600">
        Xem chi tiết
        <ArrowRight className="h-4 w-4 -rotate-45" />
      </button>
    </motion.article>
  );
};

const LandingPage = () => {
  const { user } = useAuth();
  const [isHeroMediaReady, setIsHeroMediaReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'verify'>('login');
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
    : 'Đăng ký ngay';

  const secondaryAction = user
    ? '/workspace/projects'
    : '/auth/login';

  const secondaryLabel = user
    ? 'Xem dự án'
    : 'Đăng nhập';

  const openAuthModal = (mode: 'login' | 'register' | 'verify') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  useEffect(() => {
    const safetyTimer = window.setTimeout(() => {
      setIsHeroMediaReady(true);
    }, 1800);

    return () => {
      window.clearTimeout(safetyTimer);
    };
  }, []);

  const aboutText = 'Thuê Tôi giúp khách hàng và freelancer kết nối nhanh, làm việc rõ ràng và theo dõi toàn bộ tiến độ trên cùng một nền tảng.';
  const chars = Array.from(aboutText);
  const navbarItems: NavItem[] = [
    { label: 'Trang chủ', targetId: 'hero' },
    { label: 'Giới thiệu', targetId: 'about' },
    { label: 'Dự án', targetId: 'features' },
    { label: 'Hợp đồng', targetId: 'features' },
    { label: 'Thông báo', targetId: 'features' },
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
      <LoadingOverlay isActive={isBootLoading} className="fixed" spinnerSize="lg" />
      <AuthModal
        key={`auth-modal-${isAuthModalOpen}-${authModalMode}`}
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        initialEmail={''}
        redirectTo="/workspace"
        onClose={closeAuthModal}
      />
      <section id="hero" className="h-screen p-4 md:p-6">
        <div className="relative h-full overflow-hidden rounded-2xl md:rounded-[2rem]">
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
          <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

          <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2 rounded-b-2xl bg-black/95 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm md:rounded-b-3xl md:px-8">
            <ul className="flex max-w-[92vw] flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center sm:gap-x-6 md:gap-x-12 lg:gap-x-14">
              {navbarItems.map((item) => (
                <li key={`${item.label}-${item.targetId}`}>
                  <a
                    href={`#${item.targetId}`}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToSection(item.targetId);
                    }}
                    className="text-[10px] text-primary-500/80 transition-colors hover:text-primary-500 sm:text-xs md:text-sm"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-6 sm:px-8 sm:pb-8 md:px-10 md:pb-10">
            <div className="grid grid-cols-12 items-end gap-4">
              <div className="col-span-12 md:col-span-8">
                <WordsPullUp
                  text="Nền tảng kết nối khách hàng và freelancer chuyên nghiệp."
                  className="max-w-full text-[clamp(3.25rem,10vw,7.5rem)] font-medium leading-[0.9] tracking-[-0.07em]"
                />
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.5, ease: pullUpEase }}
                className="col-span-12 md:col-span-4"
              >
                  <p className="max-w-[34rem] text-xs leading-[1.35] text-primary-100/85 sm:text-sm md:text-base">
                  Đăng dự án, nhận báo giá, theo dõi hợp đồng và trao đổi realtime trong một không gian làm việc thống nhất.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  {user ? (
                    <>
                      <Link
                        to={primaryAction}
                        className="group inline-flex max-w-full items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700 hover:gap-3 sm:text-base"
                      >
                        <span>{primaryLabel}</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/90 transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                          <ArrowRight className="h-4 w-4 text-primary-500" />
                        </span>
                      </Link>
                      <Link
                        to={secondaryAction}
                        className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/85 transition-colors hover:border-white/35 hover:bg-white/5 sm:text-base"
                      >
                        {secondaryLabel}
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openAuthModal('register')}
                        className="group inline-flex max-w-full items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700 hover:gap-3 sm:text-base"
                      >
                        <span>{primaryLabel}</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/90 transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                          <ArrowRight className="h-4 w-4 text-primary-500" />
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openAuthModal('login')}
                        className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/85 transition-colors hover:border-white/35 hover:bg-white/5 sm:text-base"
                      >
                        {secondaryLabel}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="bg-black px-4 py-14 sm:px-6 md:px-10 md:py-20">
        <div className="mx-auto max-w-6xl bg-[#101010] px-5 py-10 text-center sm:px-10 sm:py-14 md:px-14 md:py-16">
          <WordsPullUpMultiStyle
            className="mx-auto mt-6 max-w-4xl text-3xl leading-[0.95] sm:text-4xl sm:leading-[0.9] md:text-5xl lg:text-6xl"
            segments={[
              { text: 'Không gian rõ ràng cho khách hàng và freelancer,', className: 'font-normal' },
              { text: 'với trải nghiệm hiện đại, minh bạch và dễ theo dõi.', className: "italic font-normal [font-family:'Lora',serif]" },
              { text: 'Mọi thao tác quan trọng đều tập trung trong một luồng làm việc gọn gàng.', className: 'font-normal' },
            ]}
          />

          <p ref={paragraphRef} className="mx-auto mt-8 max-w-4xl text-xs text-primary-500 sm:text-sm md:text-base">
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

      <section id="features" className="relative min-h-screen overflow-hidden bg-black px-4 py-14 sm:px-6 md:px-10 md:py-20">
        <div className="bg-noise pointer-events-none absolute inset-0 opacity-[0.15]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
              <WordsPullUpMultiStyle
              className="justify-center text-xl font-normal sm:text-2xl md:text-3xl lg:text-4xl"
                segments={[{ text: 'Luồng làm việc tinh gọn cho đội ngũ hiện đại.', className: 'text-primary-500' }]}
            />
            <WordsPullUpMultiStyle
              className="mt-2 justify-center text-xl font-normal sm:text-2xl md:text-3xl lg:text-4xl"
                segments={[{ text: 'Tập trung vào dự án, báo giá, hợp đồng và thông báo realtime.', className: 'text-gray-500' }]}
            />
          </div>

          <div className="mt-10 grid gap-3 sm:gap-2 md:gap-1 md:grid-cols-2 lg:h-[480px] lg:grid-cols-4">
            <motion.article
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.65, delay: 0, ease: cardEase }}
              className="relative overflow-hidden border border-[#2f2f2f]"
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
                src={featureVideoUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <p className="text-sm text-primary-500 sm:text-base">Khu làm việc tập trung.</p>
              </div>
            </motion.article>

            {featureCards.map((card, index) => (
              <FeatureInfoCard key={card.number} card={card} index={index + 1} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
