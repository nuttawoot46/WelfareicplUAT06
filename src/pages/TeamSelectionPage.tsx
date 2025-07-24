import { WelcomeBanner } from '@/components/teamSelection/WelcomeBanner';
import { supabase } from '@/integrations/supabase/client';
import FlowerAnimation from '@/components/animation/FlowerAnimation';

const TeamSelectionPage = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Selection Form */}
      <div className="md:w-1/2 flex flex-col items-center justify-center p-8 md:p-16">
        {/* Login Form Section */}
        <div className="w-full max-w-md text-center mb-8">
          <div className="mb-8">
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-10">
              <img
                src="/Picture/logo-Photoroom.jpg"
                alt="ICP Ladda Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-3xl font-bold gradient-animated-text">ระบบสวัสดิการพนักงาน ICP Ladda</h1>
            <p className="mt-2 gradient-animated-text">กรุณาเข้าสู่ระบบด้วยบัญชี Microsoft</p>
          </div>

          {/* Microsoft Login Button */}
          <button
            onClick={async () => {
              await supabase.auth.signInWithOAuth({
                provider: 'azure',
                options: {
                  scopes: 'openid profile email',
                  redirectTo: window.location.origin + '/auth/callback',
                },
              });
            }}
            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-[#2F2F2F] text-white font-semibold py-3 px-6 rounded-lg shadow hover:bg-[#1a1a1a]"
            style={{ border: '1px solid #2F2F2F' }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft Logo" className="w-6 h-6" />
            <span>Login with Microsoft</span>
          </button>
          {/* End Microsoft Login Button */}
        </div>


      </div>

      {/* Right side - Decorative Background */}
      <WelcomeBanner />
      
      {/* Flower Animation */}
      <FlowerAnimation />
    </div>
  );
};

export default TeamSelectionPage;
