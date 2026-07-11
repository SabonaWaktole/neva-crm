import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useInitAuth } from './hooks/useInitAuth';

function App() {
  useInitAuth();

  return <RouterProvider router={router} />;
}

export default App;
