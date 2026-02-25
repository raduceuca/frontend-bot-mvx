import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Button } from 'components/Button';
import { Loader } from 'components/Loader';
import { environment, EXTRAS_API_URL } from 'config';
import { useGetAccount, useGetLoginInfo } from 'lib';
import { EnvironmentsEnum } from 'lib/sdkDapp/sdkDapp.types';
import { WidgetType } from 'types/widget.types';
import { DashboardHeader, Widget } from './components';
import styles from './dashboard.styles';
import { CreateJob, Faucet, MysteryBox } from './widgets';

const SITE_KEY = '6LeOnY0fAAAAABCn_KfmqldzSsOEOP1JHvdfyYGd';
const MIN_BALANCE_THRESHOLD = '50000000000000000'; // 0.05 EGLD in atoms

const isBalanceSufficient = (balance: string): boolean => {
  try {
    return BigInt(balance) >= BigInt(MIN_BALANCE_THRESHOLD);
  } catch {
    return false;
  }
};

const defaultWidgets: WidgetType[] = [
  {
    title: 'New Job',
    widget: CreateJob,
    description: 'Launch the agent and give it something to do',
    reference: '/create-job'
  },
  {
    title: 'Mystery Box',
    widget: MysteryBox,
    description:
      'Let the agent trade 1 EGLD on xExchange. See what comes back.',
    reference: '/mystery-box'
  }
];

export const Dashboard = () => {
  const { address, balance } = useGetAccount();
  const { tokenLogin } = useGetLoginInfo();
  const isDevnet = environment === EnvironmentsEnum.devnet;
  const hasFunds = isBalanceSufficient(balance);
  const [faucetDone, setFaucetDone] = useState(false);

  // Faucet gate state
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [requestDisabled, setRequestDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [faucetMessage, setFaucetMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  const showFaucetGate = isDevnet && !hasFunds && !faucetDone;

  const handleReCaptchaChange = useCallback((value: string | null) => {
    setRequestDisabled(!value);
    setCaptcha(value);
  }, []);

  const handleRequestClick = async () => {
    if (!captcha || !address) return;

    try {
      setIsLoading(true);
      setFaucetMessage(null);

      await axios.post(
        `${EXTRAS_API_URL}/faucet`,
        { captcha },
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
          }
        }
      );

      setFaucetMessage({
        text: 'Tokens requested! They should arrive shortly.',
        isError: false
      });
      setFaucetDone(true);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        'Failed to request tokens. You can request once every 24 hours.';
      setFaucetMessage({ text: errorMsg, isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const activeWidgets = useMemo(() => {
    const widgets = [...defaultWidgets];

    if (isDevnet) {
      widgets.push({
        title: 'Devnet Faucet',
        widget: Faucet,
        description: 'Request 5 xEGLD tokens for testing',
        reference: 'https://devnet-wallet.multiversx.com/faucet'
      });
    }

    return widgets;
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <div className='flex flex-col w-full min-h-screen'>
      <div className='flex flex-col gap-4 items-center flex-1 w-full overflow-auto pt-4 pb-6 lg:pt-6 lg:pb-10'>
        <DashboardHeader />

        {showFaucetGate && (
          <div className='w-full max-w-3xl mx-auto px-4 mb-6'>
            <div className='bg-emerald-900/20 border border-emerald-500/20 rounded-lg p-6 lg:p-8 flex flex-col gap-4'>
              <h2 className='text-lg font-semibold text-zinc-50 tracking-tight'>
                You need xEGLD to get started
              </h2>
              <p className='text-base text-zinc-400'>
                Request 5 xEGLD from the devnet faucet to try the agent.
              </p>

              {faucetMessage && (
                <div
                  className={`text-base ${
                    faucetMessage.isError ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {faucetMessage.text}
                </div>
              )}

              {(!faucetMessage || faucetMessage.isError) && (
                <ReCAPTCHA
                  sitekey={SITE_KEY}
                  onChange={handleReCaptchaChange}
                  theme='dark'
                />
              )}

              {isLoading ? (
                <Loader />
              ) : (
                <Button
                  disabled={
                    requestDisabled ||
                    isLoading ||
                    (faucetMessage !== null && !faucetMessage.isError) ||
                    !address
                  }
                  onClick={handleRequestClick}
                  className='w-full xs:w-auto'
                >
                  Request xEGLD
                </Button>
              )}
            </div>
          </div>
        )}

        <div className={styles.dashboardWidgets}>
          {activeWidgets.map((element: WidgetType) => (
            <Widget key={element.title} {...element} />
          ))}
        </div>
      </div>
    </div>
  );
};
