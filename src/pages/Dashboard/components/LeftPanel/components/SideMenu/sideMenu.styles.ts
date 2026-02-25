// prettier-ignore
export default {
  sideMenuContainer: 'side-menu-container flex flex-col gap-4',
  sideMenuHeader: 'side-menu-header flex items-center justify-between',
  sideMenuHeaderTitle: 'side-menu-header-title text-sm text-zinc-500',
  sideMenuHeaderIcon: 'side-menu-header-icon text-zinc-400 transition-transform duration-100',
  sideMenuHeaderIconRotated: 'rotate-180',
  sideMenuItems: 'side-menu-items flex flex-col transition-colors duration-100',
  sideMenuItemsHidden: 'hidden',
  sideMenuItem: 'side-menu-item flex items-center gap-2 px-3 py-2 cursor-pointer text-sm text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50 rounded-md transition-colors duration-100',
  sideMenuItemActive: 'side-menu-item-active text-zinc-50 bg-zinc-800/50 border-l-2 border-emerald-500 rounded-md',
  sideMenuItemTitle: 'side-menu-item-title text-sm'
} satisfies Record<string, string>;
