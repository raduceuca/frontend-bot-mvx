import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faArrowUpRightFromSquare,
  faBook,
  faCode,
  faCubes,
  faLink,
  faRocket,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

const steps = [
  {
    number: '01',
    title: 'Create skills',
    description:
      'Define what your agent can do. Skills are modular capabilities — swap tokens, read on-chain data, call APIs, or anything you can script.',
    repo: {
      label: 'openclaw-skills',
      url: 'https://github.com/sasurobert/multiversx-openclaw-skills'
    }
  },
  {
    number: '02',
    title: 'Deploy the bot',
    description:
      'Use the starter kit to spin up a bot that listens for jobs, executes skills, and returns results. Connects to the MultiversX network out of the box.',
    repo: {
      label: 'moltbot-starter-kit',
      url: 'https://github.com/sasurobert/moltbot-starter-kit'
    }
  },
  {
    number: '03',
    title: 'Set up payments',
    description:
      'Smart contracts handle job creation, payments, and reputation. The x402 integration adds HTTP-native micropayments so agents can pay for services too.',
    repo: {
      label: 'mx-8004',
      url: 'https://github.com/sasurobert/mx-8004'
    }
  },
  {
    number: '04',
    title: 'Register your agent',
    description:
      'Publish your agent to the MultiversX agent registry. Set your service IDs, pricing, and capabilities. Users can discover and interact with your agent on-chain.'
  }
];

const resources = [
  {
    icon: faBook,
    label: 'Agent Standards',
    description: 'Protocol specification for MultiversX agents',
    url: 'https://agents.multiversx.com/standards'
  },
  {
    icon: faUserPlus,
    label: 'Register an Agent',
    description: 'Publish your agent to the registry',
    url: 'https://agents.multiversx.com/register'
  },
  {
    icon: faLink,
    label: 'x402 Integration',
    description: 'HTTP-native micropayments for agents',
    url: 'https://github.com/sasurobert/x402_integration'
  },
  {
    icon: faCubes,
    label: 'Relayer',
    description: 'Transaction relaying infrastructure',
    url: 'https://github.com/sasurobert/multiversx-openclaw-relayer'
  }
];

export const BuildYourAgent = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className='relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 xs:pt-8 pb-6 xs:pb-8'>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className='w-full flex items-center justify-between gap-3 py-4 border-t border-zinc-800 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 rounded-sm'
        aria-expanded={expanded}
        aria-controls='build-agent-section'
      >
        <div className='flex items-center gap-2.5'>
          <div className='w-7 h-7 rounded-md bg-zinc-800 text-teal flex items-center justify-center text-sm'>
            <FontAwesomeIcon icon={faCode} />
          </div>
          <span className='text-base font-medium text-zinc-300 group-hover:text-zinc-50 transition-colors duration-150'>
            How it works &middot; Build your own agent
          </span>
        </div>
        <span className='text-sm text-zinc-600 group-hover:text-zinc-400 transition-colors duration-150'>
          {expanded ? 'Collapse' : 'Expand'}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            id='build-agent-section'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='flex flex-col gap-10 pb-8 overflow-hidden'
          >
            {/* How it works */}
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1'>
                <h2 className='text-lg font-semibold text-zinc-50 tracking-tight'>
                  How it works
                </h2>
                <p className='text-base text-zinc-400 leading-relaxed max-w-2xl'>
                  This demo runs on{' '}
                  <a
                    href='https://github.com/sasurobert/multiversx-openclaw-skills'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-teal hover:text-teal/80 transition-colors duration-150'
                  >
                    OpenClaw
                  </a>
                  , an open-source agent framework for MultiversX. You need an
                  OpenClaw instance running before anything else — it handles
                  skill execution, job orchestration, and on-chain interactions.
                  Once that&apos;s set up, the flow is simple:
                </p>
              </div>

              <div className='flex flex-col sm:flex-row items-start sm:items-center gap-1.5 xs:gap-2 text-sm xs:text-base text-zinc-500 font-mono'>
                <span>Run OpenClaw</span>
                <span className='text-teal/50 hidden sm:inline'>&rarr;</span>
                <span>Create job (0.05 xEGLD)</span>
                <span className='text-teal/50 hidden sm:inline'>&rarr;</span>
                <span>Chat with agent</span>
                <span className='text-teal/50 hidden sm:inline'>&rarr;</span>
                <span>Agent executes on-chain</span>
              </div>
            </div>

            {/* Build your own */}
            <div className='flex flex-col gap-6'>
              <div className='flex flex-col gap-1'>
                <div className='flex items-center gap-2'>
                  <FontAwesomeIcon
                    icon={faRocket}
                    className='text-teal text-sm'
                  />
                  <h2 className='text-lg font-semibold text-zinc-50 tracking-tight'>
                    Build your own agent
                  </h2>
                </div>
                <p className='text-base text-zinc-400 leading-relaxed max-w-2xl'>
                  The entire stack is open source. Four steps to go from zero to
                  a live agent on MultiversX.
                </p>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className='bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 xs:p-5 flex flex-col gap-2.5 xs:gap-3 hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-200'
                  >
                    <div className='flex items-center gap-3'>
                      <span className='text-sm font-mono font-semibold text-teal/60'>
                        {step.number}
                      </span>
                      <h3 className='text-base font-medium text-zinc-50'>
                        {step.title}
                      </h3>
                    </div>
                    <p className='text-base text-zinc-400 leading-relaxed'>
                      {step.description}
                    </p>
                    {step.repo && (
                      <a
                        href={step.repo.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-1.5 text-sm text-teal hover:text-teal/80 transition-colors duration-150 mt-auto'
                      >
                        <FontAwesomeIcon icon={faGithub} />
                        <span>{step.repo.label}</span>
                        <FontAwesomeIcon
                          icon={faArrowUpRightFromSquare}
                          className='text-sm opacity-50'
                        />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div className='flex flex-col gap-4'>
              <h3 className='text-base font-medium text-zinc-300'>Resources</h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                {resources.map((res) => (
                  <a
                    key={res.label}
                    href={res.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2.5 xs:gap-3 px-3 xs:px-4 py-2.5 xs:py-3 rounded-lg border border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/40 transition-colors duration-150 group'
                  >
                    <div className='w-8 h-8 rounded-md bg-zinc-800 text-zinc-400 group-hover:text-teal flex items-center justify-center text-sm transition-colors duration-150'>
                      <FontAwesomeIcon icon={res.icon} />
                    </div>
                    <div className='flex flex-col min-w-0'>
                      <span className='text-sm font-medium text-zinc-50'>
                        {res.label}
                      </span>
                      <span className='text-sm text-zinc-500 truncate'>
                        {res.description}
                      </span>
                    </div>
                    <FontAwesomeIcon
                      icon={faArrowUpRightFromSquare}
                      className='ml-auto text-sm text-zinc-600 group-hover:text-zinc-400 transition-colors duration-150 shrink-0'
                    />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
