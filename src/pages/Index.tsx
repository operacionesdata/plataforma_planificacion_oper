import DivingDashboard from '@/components/DivingDashboard';
import underwaterBg from '@/assets/underwater-background.jpg';

const Index = () => {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${underwaterBg})` }}
    >
      <div className="min-h-screen bg-black/40 backdrop-blur-sm">
        <DivingDashboard />
      </div>
    </div>
  );
};

export default Index;
