import { faLayerGroup, faWallet } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ReactNode } from 'react';
import { ReactComponent as XLogo } from 'assets/img/x-logo.svg';
import { Label } from 'components/Label';
import { FormatAmount, MvxTrim, useGetAccount } from 'lib';
import { DataTestIdsEnum } from 'localConstants';
import styles from './account.styles';

interface AccountDetailType {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

export const Account = () => {
  const { address, balance, shard } = useGetAccount();

  const accountDetails: AccountDetailType[] = [
    {
      icon: <FontAwesomeIcon icon={faWallet} className={styles.icon} />,
      label: 'Address',
      value: (
        <MvxTrim dataTestId='accountAddress' text={address} className='w-max' />
      )
    },
    {
      icon: <FontAwesomeIcon icon={faLayerGroup} className={styles.icon} />,
      label: 'Shard',
      value: <span data-testid={DataTestIdsEnum.addressShard}>{shard}</span>
    },
    {
      icon: <XLogo className={styles.xLogo} />,
      label: 'Balance',
      value: (
        <FormatAmount
          value={balance}
          data-testid='balance'
          decimalClass='opacity-70'
          labelClass='opacity-70'
          showLabel={true}
        />
      )
    }
  ];

  return (
    <div className={styles.container}>
      {accountDetails.map((detail, index) => (
        <div key={index} className={styles.row}>
          <div className={styles.iconBox}>{detail.icon}</div>
          <div className={styles.text}>
            <Label>{detail.label}</Label>
            <span className={styles.value}>{detail.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
