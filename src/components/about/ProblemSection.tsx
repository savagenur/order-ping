import { motion } from 'framer-motion';
import { UserX, Volume2, TrendingDown, Clock } from 'lucide-react';

const problems = [
  {
    icon: UserX,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    title: 'Lost Customers',
    stat: '~30%',
    statLabel: 'walk away confused',
    description:
      "When customers can't see their order status, they wander off, get frustrated, or leave entirely. Every confused customer is a lost sale.",
  },
  {
    icon: Volume2,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    title: 'Constant Noise',
    stat: '100%',
    statLabel: 'avoidable chaos',
    description:
      'Shouting order numbers stresses your staff and makes your cart look unprofessional. Your customers deserve a calmer experience.',
  },
  {
    icon: TrendingDown,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    title: 'Missed Reviews',
    stat: '4x',
    statLabel: 'fewer repeat visits',
    description:
      'A chaotic pickup experience kills word-of-mouth. Happy customers who wait smoothly are far more likely to leave 5-star reviews.',
  },
  {
    icon: Clock,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    title: 'Staff Burnout',
    stat: '2x',
    statLabel: 'more interruptions',
    description:
      'Your team spends half their time answering "is my order ready?" instead of cooking. That slows everything down during peak hours.',
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 sm:py-32 px-4 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold tracking-widest text-red-400 uppercase mb-4">The Problem</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            Running a food cart is hard enough.
            <br />
            <span className="text-zinc-500">Order chaos makes it worse.</span>
          </h2>
        </motion.div>

        {/* Problem cards grid */}
        <div className="grid sm:grid-cols-2 gap-5">
          {problems.map(({ icon: Icon, color, bg, border, title, stat, statLabel, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`relative bg-zinc-900/60 border ${border} rounded-2xl p-6 sm:p-8 backdrop-blur-sm overflow-hidden group hover:bg-zinc-900/80 transition-colors duration-300`}
            >
              {/* Subtle corner glow */}
              <div className={`absolute -top-8 -right-8 w-32 h-32 ${bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center w-11 h-11 ${bg} rounded-xl mb-5`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>

                <div className="flex items-end gap-3 mb-3">
                  <span className={`text-3xl font-black ${color}`}>{stat}</span>
                  <span className="text-zinc-500 text-sm mb-1">{statLabel}</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">{description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
