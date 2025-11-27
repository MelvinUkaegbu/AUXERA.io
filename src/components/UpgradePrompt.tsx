import { Crown, Check, ArrowRight } from 'lucide-react';

export default function UpgradePrompt() {
  return (
    <div className="bg-primary-950 text-white rounded-2xl p-8 border-2 border-primary-900 animate-fade-in mt-8 shadow-elegant">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-gold-500 text-primary-950 border-2 border-gold-600">
          <Crown className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-2">
            Unlock Premium Property Insights
          </h3>
          <p className="text-slate-300 mb-6 font-medium">
            Get comprehensive analysis with historical data, detailed recommendations, and priority support
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {[
              'Historical flood data (10 years)',
              'Elevation cost estimates',
              'Insurance premium analysis',
              'Compliance recommendations',
              'Priority email support',
              'Export to PDF & CSV',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center border border-slate-700">
                  <Check className="w-3 h-3 text-gold-500" />
                </div>
                <span className="text-sm text-slate-300 font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button className="bg-gold-500 hover:bg-gold-600 text-primary-950 px-8 py-3 rounded-lg font-bold transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 border-2 border-gold-600">
              Upgrade to Premium
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="text-sm text-slate-300">
              Starting at <span className="font-bold text-gold-400">$29/month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
