import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './features/arbitrage';

function App() {
  return (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  );
}

export default App;
