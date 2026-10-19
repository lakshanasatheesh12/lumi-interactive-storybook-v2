import { Route, Routes } from 'react-router-dom';
import { ProgressProvider } from './lib/progress';
import { SparkleTrail } from './components/SparkleTrail';
import Home from './pages/Home';
import Backstory from './pages/Backstory';
import Toys from './pages/Toys';
import Workshop from './pages/Workshop';
import Delivery from './pages/Delivery';

export default function App() {
  return (
    <ProgressProvider>
      <SparkleTrail />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/backstory" element={<Backstory />} />
        <Route path="/toys" element={<Toys />} />
        <Route path="/workshop" element={<Workshop />} />
        <Route path="/delivery" element={<Delivery />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </ProgressProvider>
  );
}
