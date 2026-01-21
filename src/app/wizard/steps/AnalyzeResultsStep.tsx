import { Lightbulb, BarChart3 } from 'lucide-react';

export function AnalyzeResultsStep() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-6 text-center">Analyze Results</h1>

      {/* Rationale Panel */}
      <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-5 mb-8 flex items-start gap-4">
        <Lightbulb className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-100 text-lg">
          So you can gauge interest in real-time and make data-driven decisions about your idea's market fit
        </p>
      </div>

      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Test in Progress</h3>
          <p className="text-gray-400 mb-6">
            We're launching your landing page and ads. Check back in 24-48 hours for initial results.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-white mb-1">0</div>
              <div className="text-sm text-gray-400">Page Visits</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-white mb-1">0</div>
              <div className="text-sm text-gray-400">Sign-ups</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-white mb-1">0%</div>
              <div className="text-sm text-gray-400">Conversion Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Promise Panel with Actions */}
      <div className="mt-8 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-8">
        <h3 className="text-xl font-semibold text-white mb-3">What you can do</h3>
        <p className="text-indigo-200 text-lg mb-6">
          Monitor real-time results to gauge market interest, then decide whether to stop the experiment or continue to
          iterate and optimize.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-8 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold text-lg">
            Stop Experiment
          </button>
          <button className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg">
            Continue to Iterate
          </button>
        </div>
      </div>
    </div>
  );
}
