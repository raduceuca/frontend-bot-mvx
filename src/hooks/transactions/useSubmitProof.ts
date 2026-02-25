import axios from 'axios';
import { TASK_SERVICE_API_URL } from 'config';
import { useGetLoginInfo } from 'lib';

export const useSubmitProof = () => {
  const { tokenLogin } = useGetLoginInfo();

  const submitProof = async (jobId: string) => {
    try {
      // Call the task service which will trigger the agent to submit proof
      await axios.post(
        `${TASK_SERVICE_API_URL}/tasks/finish`,
        { jobId },
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`
          }
        }
      );

      return { success: true };
    } catch (err: any) {
      console.error('Submit proof failed', err);
      throw new Error(
        err.response?.data?.message || err.message || 'Failed to finish job'
      );
    }
  };

  return { submitProof };
};
