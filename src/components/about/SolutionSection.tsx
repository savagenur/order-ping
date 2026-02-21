import { motion } from 'framer-motion';
import { QrCode, LayoutDashboard, LineChart, CheckCircle2, Bell, Instagram } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: QrCode,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    glow: 'group-hover:shadow-blue-500/20',
    title: 'Print a QR Code',
    description: 'Generate your unique QR code in seconds. Stick it on your cart, menu board, or table tent.',
  },
  {
    number: '02',
    icon: LayoutDashboard,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'group-hover:shadow-cyan-500/20',
    title: 'Manage Orders Live',
    description: 'Your dashboard shows every order. One tap marks it ready — the queue updates instantly for everyone.',
  },
  {
    number: '03',
    icon: Bell,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    glow: 'group-hover:shadow-violet-500/20',
    title: 'Customers Stay Informed',
    description: 'Customers watch their order move from "Preparing" to "Ready" on their phone — no app needed.',
  },
];

const features = [
  { icon: CheckCircle2, text: 'No app download required' },
  { icon: CheckCircle2, text: 'Works on any device' },
  { icon: CheckCircle2, text: 'Real-time updates' },
  { icon: CheckCircle2, text: 'Setup in under 30 seconds' },
  { icon: Instagram, text: 'Built-in social links' },
  { icon: LineChart, text: 'Analytics dashboard' },
];

export default function SolutionSection() {
  return (
    <section className="py-20 sm:py-32 px-4 relative">
      {/* Subtle background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-block text-xs font-semibold tracking-widest text-blue-400 uppercase mb-4">How It Works</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            Three steps to a
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">calmer, smarter cart.</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {steps.map(({ number, icon: Icon, color, bg, border, glow, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              viewport={{ once: true }}
              className={`group relative bg-zinc-900/70 border ${border} rounded-2xl p-7 hover:shadow-xl ${glow} transition-all duration-300 overflow-hidden`}
            >
              {/* Step number watermark */}
              <span className="absolute top-4 right-5 text-6xl font-black text-white/[0.04] select-none leading-none">
                {number}
              </span>

              <div className={`inline-flex items-center justify-center w-12 h-12 ${bg} rounded-xl mb-6`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>

              <div className={`text-xs font-bold tracking-widest ${color} uppercase mb-2`}>Step {number}</div>
              <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>

              {/* Connector arrow (hidden on last) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                  <div className="w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center">
                    <span className="text-zinc-500 text-xs">›</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sm:p-8"
        >
          <p className="text-center text-sm text-zinc-500 uppercase tracking-widest font-semibold mb-6">Everything included</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-sm text-zinc-300">{text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
