import { MantineProvider } from '@mantine/core';
import { DoubleNavbar } from './components/Sidebar/Sidebar';

export default function App(): JSX.Element {
  return (
    <MantineProvider>
      <div>
        <DoubleNavbar />
        <main>Das ist ein Test</main>
      </div>
    </MantineProvider>
  );
}
