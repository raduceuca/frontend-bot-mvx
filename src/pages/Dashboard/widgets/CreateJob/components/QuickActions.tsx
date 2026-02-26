import maxAvatar from 'assets/img/max-avatar.webp';

interface QuickActionsProps {
  isLoggedIn: boolean;
  jobId: string | null;
  isBusy: boolean;
  isDevnet: boolean;
  hasSentTokens: boolean;
  variant?: 'inline' | 'placeholder';
  onMysteryBox: (amount: string) => void;
  onSetPrompt: (text: string) => void;
}

const chipClass =
  'px-3 py-2 text-sm text-zinc-400 bg-zinc-800/50 border border-zinc-700/50 rounded-full hover:bg-zinc-800 hover:text-zinc-50 hover:border-zinc-600 transition-colors duration-150 cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 shrink-0';

export const QuickActions = ({
  isLoggedIn,
  jobId,
  isBusy,
  isDevnet,
  hasSentTokens,
  variant = 'inline',
  onMysteryBox,
  onSetPrompt
}: QuickActionsProps) => {
  const actionsDisabled = !isLoggedIn || !jobId;
  const isPlaceholder = variant === 'placeholder';

  const chips = (
    <>
      {/* 1. Mystery Box -- primary CTA */}
      <button
        onClick={() => onMysteryBox('1')}
        disabled={!isLoggedIn || !jobId || isBusy || hasSentTokens}
        className={`px-3 py-2 text-sm border rounded-full transition-colors duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 ${
          !isLoggedIn || !jobId
            ? 'bg-teal/5 text-teal/40 border-teal/10 cursor-default'
            : 'bg-teal/10 text-teal border-teal/20 hover:bg-teal/20 hover:border-teal/30 cursor-pointer disabled:opacity-40'
        }`}
      >
        <img
          src={maxAvatar}
          alt=''
          className='w-3 h-3 inline-block mr-1 -mt-0.5 rounded-sm'
        />
        Mystery Box &middot; 1 xEGLD
      </button>

      {/* 2. Get Free Hugs -- devnet only */}
      {isDevnet && (
        <button
          onClick={() =>
            onSetPrompt(
              'Send me 69 HUGS tokens (HUGS-667b07, 18 decimals) from the bot wallet. I want free hugs!'
            )
          }
          disabled={actionsDisabled || isBusy}
          className={`px-3 py-2 text-sm border rounded-full transition-colors duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/30 ${
            actionsDisabled
              ? 'bg-pink-400/5 text-pink-300/40 border-pink-400/10 cursor-default'
              : 'bg-pink-400/10 text-pink-300 border-pink-400/20 hover:bg-pink-400/20 hover:border-pink-400/30 cursor-pointer disabled:opacity-40'
          }`}
        >
          <img
            src='https://tools.multiversx.com/assets-cdn/devnet/tokens/HUGS-667b07/icon.png'
            alt=''
            className='w-3.5 h-3.5 inline-block mr-1 -mt-0.5 rounded-full'
          />
          Get Free Hugs
        </button>
      )}

      {/* 3. Fun prompts */}
      <button
        onClick={() =>
          onSetPrompt('Who\u2019s the best user on devnet? Wrong answers only.')
        }
        disabled={actionsDisabled || isBusy}
        className={`${chipClass} ${
          actionsDisabled ? 'opacity-40 cursor-default' : ''
        }`}
      >
        Best devnet user?
      </button>

      <button
        onClick={() =>
          onSetPrompt('Pick a random token and convince me to ape in.')
        }
        disabled={actionsDisabled || isBusy}
        className={`${chipClass} ${
          actionsDisabled ? 'opacity-40 cursor-default' : ''
        }`}
      >
        Shill me something
      </button>

      <button
        onClick={() =>
          onSetPrompt('What would you do with 100 xEGLD and zero morals?')
        }
        disabled={actionsDisabled || isBusy}
        className={`${chipClass} ${
          actionsDisabled ? 'opacity-40 cursor-default' : ''
        }`}
      >
        100 xEGLD, zero morals
      </button>

      <button
        onClick={() => onSetPrompt('Rate my wallet. Be brutally honest.')}
        disabled={actionsDisabled || isBusy}
        className={`${chipClass} ${
          actionsDisabled ? 'opacity-40 cursor-default' : ''
        }`}
      >
        Rate my wallet
      </button>

      <button
        onClick={() =>
          onSetPrompt('Write a haiku about gas fees on MultiversX.')
        }
        disabled={actionsDisabled || isBusy}
        className={`${chipClass} ${
          actionsDisabled ? 'opacity-40 cursor-default' : ''
        }`}
      >
        Haiku about gas fees
      </button>

      <button
        onClick={() =>
          onSetPrompt(
            'If every token on MultiversX was a person at a party, describe the vibe.'
          )
        }
        disabled={actionsDisabled || isBusy}
        className={`${chipClass} ${
          actionsDisabled ? 'opacity-40 cursor-default' : ''
        }`}
      >
        Tokens at a party
      </button>

      <button
        onClick={() =>
          onSetPrompt('Explain what you do like I\u2019m a golden retriever.')
        }
        disabled={actionsDisabled || isBusy}
        className={`${chipClass} ${
          actionsDisabled ? 'opacity-40 cursor-default' : ''
        }`}
      >
        Explain like I&apos;m a golden retriever
      </button>

      <button
        onClick={() =>
          onSetPrompt(
            'Give me a mass-adoption conspiracy theory that sounds almost plausible.'
          )
        }
        disabled={actionsDisabled || isBusy}
        className={`${chipClass} ${
          actionsDisabled ? 'opacity-40 cursor-default' : ''
        }`}
      >
        Crypto conspiracy theory
      </button>
    </>
  );

  if (isPlaceholder) {
    return (
      <div className='px-3 xs:px-4 sm:px-5 py-3 xs:py-4'>
        <h3 className='text-sm font-medium text-primary mb-1'>Try something</h3>
        <p className='text-sm text-zinc-500 mb-4'>
          Max can do a lot more &mdash; these are just a few ideas to get you
          started
        </p>
        <div className='flex flex-wrap gap-1.5'>{chips}</div>
      </div>
    );
  }

  return (
    <div
      className='relative px-3 xs:px-4 sm:px-5 pb-1.5'
      style={{
        maskImage:
          'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)'
      }}
    >
      <div className='flex gap-1.5 overflow-x-auto scrollbar-none'>{chips}</div>
    </div>
  );
};
