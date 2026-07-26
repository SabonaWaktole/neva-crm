import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useInitAuth } from './hooks/useInitAuth';
import { ToastProvider } from './components/ui/Toast';

function App() {
  useInitAuth();

  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

export default App;
