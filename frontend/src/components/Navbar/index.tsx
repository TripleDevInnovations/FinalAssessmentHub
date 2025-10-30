import React from 'react';
import { IconPlus, IconList } from '@tabler/icons-react';
import { Center, Stack, Tooltip, UnstyledButton } from '@mantine/core';
import { MantineLogo } from '@mantinex/mantine-logo';
import classes from './Navbar.module.css';


type View = 'add' | 'list';


interface NavbarProps {
  currentView: View;
  onChangeView: (v: View) => void;
}


interface NavbarLinkProps {
  icon: typeof IconPlus;
  label: string;
  active?: boolean;
  onClick?: () => void;
}


function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton onClick={onClick} className={classes.link} data-active={active || undefined}>
        <Icon />
      </UnstyledButton>
    </Tooltip>
  );
}


export function Navbar({ currentView, onChangeView }: NavbarProps) {
  const links: Array<{ icon: typeof IconPlus; label: string; view: View }> = [
    { icon: IconPlus, label: 'Add', view: 'add' },
    { icon: IconList, label: 'List', view: 'list' },
  ];


  return (
    <nav className={classes.navbar}>

      <div className={classes.navbarMain}>
        <Stack justify="center" gap={0}>
          {links.map((link) => (
            <NavbarLink
              key={link.view}
              icon={link.icon}
              label={link.label}
              active={currentView === link.view}
              onClick={() => onChangeView(link.view)}
            />
          ))}
        </Stack>
      </div>


      {/* optional: other actions (logout etc.) can be added here if needed */}
    </nav>
  );
}