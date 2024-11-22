import React, { useState } from 'react';
import { setupSalesforceOAuth, setupOpenAIAPI } from '../utils/auth';
import { Settings, ChevronRight, ChevronDown, ExternalLink, Key, Lock, CreditCard, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

interface InstructionStepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

const InstructionStep: React.FC<InstructionStepProps> = ({ number, title, children }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 font-semibold text-blue-700 mb-2">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100">
        {number}
      </span>
      {title}
    </div>
    <div className="ml-8 text-gray-700">
      {children}
    </div>
  </div>
);

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState<'requirements' | 'salesforce' | 'openai'>('requirements');
  const [showInstructions, setShowInstructions] = useState(true);
  const [salesforceConnected, setSalesforceConnected] = useState(false);
  const [openAIConnected, setOpenAIConnected] = useState(false);
  const [clientId, setClientId] = useState('');
  const [showOpenAIInstructions, setShowOpenAIInstructions] = useState(true);
  
  const handleSalesforceSetup = async () => {
    if (!clientId.trim()) {
      alert('Please enter your Connected App Consumer Key');
      return;
    }
    
    try {
      await setupSalesforceOAuth();
      setSalesforceConnected(true);
      setCurrentScreen('openai');
    } catch (error) {
      console.error('Salesforce setup failed:', error);
    }
  };

  const handleOpenAISetup = async () => {
    try {
      await setupOpenAIAPI();
      setOpenAIConnected(true);
      onComplete();
    } catch (error) {
      console.error('OpenAI setup failed:', error);
    }
  };

  const RequirementsScreen = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="max-w-md">
        <ShieldAlert className="w-16 h-16 text-indigo-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Before You Begin</h2>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Requirements</h3>
          <ul className="space-y-4 text-left">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                1
              </div>
              <div>
                <span className="font-medium">Salesforce System Administrator Access</span>
                <p className="text-sm text-gray-600 mt-1">Full administrative privileges in your Salesforce org</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                2
              </div>
              <div>
                <span className="font-medium">OpenAI API Paid Account</span>
                <p className="text-sm text-gray-600 mt-1">Active paid API subscription (not ChatGPT Plus)</p>
              </div>
            </li>
          </ul>
        </div>

        <button
          onClick={() => setCurrentScreen('salesforce')}
          className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 w-full"
        >
          Get Started
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderProgressBar = () => {
    if (currentScreen === 'requirements') return null;
    
    return (
      <div className="flex gap-2 mb-4">
        <div className={`flex-1 p-2 rounded ${currentScreen === 'salesforce' ? 'bg-blue-100' : 'bg-gray-100'}`}>
          1. Salesforce Setup
        </div>
        <div className={`flex-1 p-2 rounded ${currentScreen === 'openai' ? 'bg-blue-100' : 'bg-gray-100'}`}>
          2. OpenAI Setup
        </div>
      </div>
    );
  };

  if (currentScreen === 'requirements') {
    return <RequirementsScreen />;
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <h2 className="text-xl font-bold mb-4 flex items-center text-blue-700">
          <Settings className="mr-2" />
          Setup Wizard
        </h2>

        {renderProgressBar()}
      </div>

      <div className="p-4 flex-1 overflow-auto">
        {currentScreen === 'salesforce' && (
          <div>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center gap-2 w-full p-2 bg-blue-50 rounded mb-4 hover:bg-blue-100 transition-colors"
            >
              {showInstructions ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
            </button>

            {showInstructions && (
              <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-bold mb-4 text-lg">Salesforce Connected App Setup Instructions</h3>
                
                <InstructionStep number={1} title="Log in to Salesforce">
                  <p>Log in to your Salesforce org as an administrator.</p>
                </InstructionStep>

                <InstructionStep number={2} title="Navigate to App Manager">
                  <p>Go to Setup → App Manager:</p>
                  <ul className="list-disc ml-4 mb-2">
                    <li>Click the gear icon ⚙️ in the top right</li>
                    <li>Select "Setup"</li>
                    <li>In the left sidebar, type "App Manager"</li>
                    <li>Click on "App Manager"</li>
                  </ul>
                </InstructionStep>

                <InstructionStep number={3} title="Create New Connected App">
                  <p className="mb-2">Click "New Connected App" and fill in the following:</p>
                  <div className="bg-gray-50 p-3 rounded mb-2">
                    <p><strong>Connected App Name:</strong> ChatGPT Integration</p>
                    <p><strong>API Name:</strong> ChatGPT_Integration</p>
                    <p><strong>Contact Email:</strong> Your email address</p>
                    <p><strong>Enable OAuth Settings:</strong> ✓ Checked</p>
                    <p><strong>Callback URL:</strong> https://YOUR_EXTENSION_ID.chromiumapp.org/</p>
                    <p><strong>Selected OAuth Scopes:</strong></p>
                    <ul className="list-disc ml-6">
                      <li>Access and manage your data (api)</li>
                      <li>Perform requests at any time (refresh_token, offline_access)</li>
                    </ul>
                  </div>
                </InstructionStep>

                <InstructionStep number={4} title="Save and Copy Consumer Key">
                  <p className="mb-2">After saving:</p>
                  <ul className="list-disc ml-4 mb-2">
                    <li>Wait for the Connected App to be created</li>
                    <li>Copy the Consumer Key (also called Client ID)</li>
                    <li>Paste it in the input field below</li>
                  </ul>
                </InstructionStep>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm">
                  <strong>Note:</strong> It may take a few minutes for your Connected App settings to propagate in Salesforce.
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                  Connected App Consumer Key
                </label>
                <input
                  type="text"
                  id="clientId"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your Consumer Key"
                />
              </div>
              
              <button
                onClick={handleSalesforceSetup}
                className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Lock size={20} />
                Connect to Salesforce
              </button>
            </div>
          </div>
        )}

        {currentScreen === 'openai' && (
          <div>
            <button
              onClick={() => setShowOpenAIInstructions(!showOpenAIInstructions)}
              className="flex items-center gap-2 w-full p-2 bg-blue-50 rounded mb-4 hover:bg-blue-100 transition-colors"
            >
              {showOpenAIInstructions ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              {showOpenAIInstructions ? 'Hide Instructions' : 'Show Instructions'}
            </button>

            {showOpenAIInstructions && (
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <h3 className="font-bold mb-4 text-lg">OpenAI API Setup Instructions</h3>
                
                <InstructionStep number={1} title="Create OpenAI Account">
                  <p className="mb-2">If you don't have an OpenAI account:</p>
                  <ul className="list-disc ml-4 mb-2">
                    <li>Visit <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 inline-flex items-center">OpenAI Signup <ExternalLink size={16} /></a></li>
                    <li>Complete the registration process</li>
                    <li>Verify your email address</li>
                  </ul>
                </InstructionStep>

                <InstructionStep number={2} title="Set Up Billing">
                  <div className="flex items-start gap-2 mb-2">
                    <CreditCard className="mt-1 text-gray-600" size={20} />
                    <div>
                      <p className="mb-1">Add a payment method to your account:</p>
                      <ul className="list-disc ml-4">
                        <li>Go to <a href="https://platform.openai.com/account/billing/overview" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 inline-flex items-center">Billing Settings <ExternalLink size={16} /></a></li>
                        <li>Click "Set up paid account"</li>
                        <li>Add your payment details</li>
                      </ul>
                    </div>
                  </div>
                </InstructionStep>

                <InstructionStep number={3} title="Generate API Key">
                  <p className="mb-2">Create a new API key:</p>
                  <ol className="list-decimal ml-4 mb-2">
                    <li>Visit the <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 inline-flex items-center">API Keys page <ExternalLink size={16} /></a></li>
                    <li>Click "Create new secret key"</li>
                    <li>Give your key a name (e.g., "Salesforce Integration")</li>
                    <li>Click "Create secret key"</li>
                    <li><strong>Copy your API key immediately</strong></li>
                  </ol>
                </InstructionStep>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm mt-4 flex items-start gap-2">
                  <AlertCircle className="text-yellow-700 mt-0.5" size={16} />
                  <div>
                    <strong>Important:</strong>
                    <ul className="mt-1 list-disc ml-4">
                      <li>Copy your API key immediately after creation - you won't be able to see it again!</li>
                      <li>Keep your API key secure and never share it publicly</li>
                      <li>You can always create a new key if needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleOpenAISetup}
              className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Key size={20} />
              Connect OpenAI
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;