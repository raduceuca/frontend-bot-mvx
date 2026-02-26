import axios from 'axios';
import { useCallback, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Button } from 'components/Button';
import { Loader } from 'components/Loader';
import { EXTRAS_API_URL } from 'config';
import { useGetAccount, useGetLoginInfo } from 'lib';

const SITE_KEY = '6LeOnY0fAAAAABCn_KfmqldzSsOEOP1JHvdfyYGd';

export const Faucet = () => {
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [requestDisabled, setRequestDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  const { address } = useGetAccount();
  const { tokenLogin } = useGetLoginInfo();

  const handleReCaptchaChange = useCallback((value: string | null) => {
    setRequestDisabled(!value);
    setCaptcha(value);
  }, []);

  const handleRequestClick = async () => {
    if (!captcha || !address) return;

    try {
      setIsLoading(true);
      setMessage(null);

      await axios.post(
        `${EXTRAS_API_URL}/faucet`,
        { captcha },
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
          }
        }
      );

      setMessage({
        text: 'Tokens requested successfully! They should arrive shortly.',
        isError: false
      });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        'Failed to request tokens. You can request once every 24 hours.';
      setMessage({ text: errorMsg, isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setMessage(null);
    setCaptcha(null);
    setRequestDisabled(true);
  };

  return (
    <div className='flex flex-col items-start gap-4'>
      <p className='text-base text-zinc-400'>
        Request 5 xEGLD from the Devnet Faucet. Available once every 24 hours.
      </p>

      {message && (
        <div
          role='alert'
          className={`text-base ${
            message.isError ? 'text-error' : 'text-teal'
          }`}
        >
          {message.text}
        </div>
      )}

      {(!message || message.isError) && (
        <div className='w-full'>
          <ReCAPTCHA
            sitekey={SITE_KEY}
            onChange={handleReCaptchaChange}
            theme='dark'
          />
        </div>
      )}

      {isLoading ? (
        <Loader />
      ) : message?.isError ? (
        <Button onClick={handleRetry} className='mt-2 w-full xs:w-auto'>
          Try Again
        </Button>
      ) : (
        <Button
          disabled={
            requestDisabled ||
            isLoading ||
            (message && !message.isError) ||
            !address
          }
          onClick={handleRequestClick}
          className='mt-2 w-full xs:w-auto'
        >
          Request 5 xEGLD
        </Button>
      )}
    </div>
  );
};
