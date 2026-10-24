import { BrowserRouter } from 'react-router';
import { AppProvider } from './context/AppContext.jsx';
import AppRoutes from './routes.jsx';

// Router first, because the app context reads the station from the URL
export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
