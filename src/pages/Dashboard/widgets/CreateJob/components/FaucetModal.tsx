import { motion } from 'motion/react';
import { Faucet } from 'pages/Dashboard/widgets/Faucet/Faucet';

interface FaucetModalProps {
  onClose: () => void;
}

export const FaucetModal = ({ onClose }: FaucetModalProps) => (
  <div
    className='fixed inset-0 z-50 flex items-end xs:items-center justify-center p-0 xs:p-4 bg-zinc-950/60 overflow-y-auto'
    role='dialog'
    aria-modal='true'
    aria-labelledby='faucet-title'
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className='bg-zinc-900 border border-zinc-800 rounded-t-xl xs:rounded-xl max-w-md w-full p-5 xs:p-6 flex flex-col gap-4 xs:gap-5'
      onClick={(e) => e.stopPropagation()}
    >
      <div>
        <h3
          id='faucet-title'
          className='text-lg font-semibold text-zinc-50 tracking-tight'
        >
          Devnet Faucet
        </h3>
        <p className='text-base text-zinc-400 mt-2 leading-relaxed'>
          Get 5 xEGLD — test tokens with no real value. Use them to start chats,
          try a Mystery Box, and do everything Max can do. One request every 24
          hours.
        </p>
      </div>

      <Faucet />

      <button
        type='button'
        onClick={onClose}
        className='text-base text-zinc-500 hover:text-zinc-300 transition-colors duration-150 cursor-pointer self-center rounded-lg px-4 py-2.5 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30'
      >
        Close
      </button>
    </motion.div>
  </div>
);
