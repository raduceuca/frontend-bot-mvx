import classNames from 'classnames';
import { useState } from 'react';
import maxAvatar from 'assets/img/max-avatar.png';
import { ItemsIdentifiersEnum } from 'pages/Dashboard/dashboard.types';
import { ItemIcon } from './components';
import styles from './sideMenu.styles';
import { MenuItemsType, SideMenuPropsType } from './sideMenu.types';

const menuItems: MenuItemsType[] = [
  {
    title: 'New Job',
    iconSrc: maxAvatar,
    id: ItemsIdentifiersEnum.createJob
  }
];

export const SideMenu = ({ setIsOpen }: SideMenuPropsType) => {
  const [activeItem, setActiveItem] = useState(ItemsIdentifiersEnum.createJob);

  const handleMenuItemClick = (id: ItemsIdentifiersEnum) => {
    setIsOpen(false);
    const target = document.getElementById(id);
    if (target) {
      const y = target.getBoundingClientRect().top + window.scrollY - 250;
      window.scrollTo({ top: y, behavior: 'smooth' });

      setActiveItem(id);
    }
  };

  return (
    <div className={styles.sideMenuContainer}>
      <div className={styles.sideMenuItems}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleMenuItemClick(item.id)}
            className={classNames(styles.sideMenuItem, {
              [styles.sideMenuItemActive]: item.id === activeItem
            })}
          >
            {item.iconSrc ? (
              <img src={item.iconSrc} alt='' className='w-4 h-4 rounded-sm' />
            ) : item.icon ? (
              <ItemIcon icon={item.icon} />
            ) : null}

            <div className={styles.sideMenuItemTitle}>{item.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
