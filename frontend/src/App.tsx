import { ChatBubble } from './components/ChatBubble';

function App() {
  return (
    <>
      {/* This is a demo page - in production, the widget would be embedded on your client's website */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Demo Website Content */}
        <div className="max-w-6xl mx-auto px-6 py-20">
          {/* Demo Header */}
          <nav className="flex items-center justify-between mb-20">
            <div className="text-2xl font-bold text-white">YourBusiness.com</div>
            <div className="flex gap-8 text-white/60">
              <a href="#" className="hover:text-white transition">Home</a>
              <a href="#" className="hover:text-white transition">Services</a>
              <a href="#" className="hover:text-white transition">About</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
          </nav>

          {/* Demo Hero */}
          <div className="text-center py-20">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Welcome to Our Website
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
              This is a demo website showing how the Sammy chat widget works. 
              Click the chat bubble in the bottom-right corner to talk to Sammy!
            </p>
            <div className="flex gap-4 justify-center">
              <button className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition">
                Get Started
              </button>
              <button className="px-8 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition">
                Learn More
              </button>
            </div>
          </div>

          {/* Demo Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            {['Service One', 'Service Two', 'Service Three'].map((service) => (
              <div key={service} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{service}</h3>
                <p className="text-white/60">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                  Sed do eiusmod tempor incididunt.
                </p>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-20 p-8 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
            <p className="text-indigo-300 text-lg">
              👉 <strong>Click the chat bubble</strong> in the bottom-right corner to talk to Sammy!
            </p>
          </div>
        </div>
      </div>

      {/* The Sammy Chat Widget - This is what gets embedded */}
      <ChatBubble />
    </>
  );
}

export default App;
