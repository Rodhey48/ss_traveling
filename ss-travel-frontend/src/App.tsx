import AppProvider from '@/providers/app-provider';
import AppRouter from '@/routes';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <AppProvider>
      <AppRouter />
      <Toaster />
    </AppProvider>
  );
}

export default App;
