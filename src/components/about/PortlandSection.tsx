import { motion } from 'framer-motion';
import { MapPin, Heart, Coffee, Umbrella } from 'lucide-react';

const socialProofStats = [
  { value: '50+', label: 'Portland carts' },
  { value: '10k+', label: 'Orders managed' },
  { value: '4.9★', label: 'Avg. rating' },
  { value: '0', label: 'Hardware needed' },
];

const localPerks = [
  { icon: Coffee, text: 'Built for PDX lunch rushes' },
  { icon: Umbrella, text: 'Works on rainy festival days' },
  { icon: Heart, text: 'Local founder, local support' },
];

export default function PortlandSection() {
  return (
    <section className="py-20 sm:py-32 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800/60 rounded-2xl overflow-hidden border border-zinc-800 mb-16"
        >
          {socialProofStats.map(({ value, label }) => (
            <div key={label} className="bg-zinc-950 flex flex-col items-center justify-center py-8 px-4">
              <span className="text-3xl sm:text-4xl font-black text-white mb-1">{value}</span>
              <span className="text-xs text-zinc-500 font-medium">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Local story card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl p-8 sm:p-12 overflow-hidden"
        >
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-600/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-10">
            {/* Text */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-zinc-800/80 border border-zinc-700 rounded-full px-3 py-1.5 mb-6">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-zinc-300 font-medium">Built in Portland, OR</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug">
                Made by someone who's stood
                <br />
                <span className="text-zinc-400">in line at a food cart.</span>
              </h2>

              <p className="text-zinc-400 leading-relaxed max-w-lg">
                OrderPing was born from watching Portland cart owners struggle with the same problem every lunch rush.
                We built the tool we wished existed — simple, fast, and built for the real chaos of running a cart in PDX.
              </p>
            </div>

            {/* Perks list */}
            <div className="flex flex-col gap-4 min-w-[200px]">
              {localPerks.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl shrink-0">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm text-zinc-300">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
