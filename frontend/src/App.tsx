import { RouterProvider } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { router } from './routes';
import { useInitAuth } from './hooks/useInitAuth';
import { ToastProvider } from './components/ui/Toast';
import i18n from './i18n';
import { useLanguageSync } from './i18n/useLanguage';

/**
 * Split out so the language sync runs inside the provider: it calls
 * `changeLanguage`, and every subscriber must already be mounted to re-render.
 */
function AppShell() {
  useInitAuth();
  useLanguageSync();

  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AppShell />
    </I18nextProvider>
  );
}

export default App;
