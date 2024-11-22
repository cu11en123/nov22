import axios from 'axios';

// Helper function to check if we're in a Chrome extension environment
const isChromeExtension = (): boolean => {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
};

// Helper function to get data from storage
export const getFromStorage = async (keys: string[]): Promise<{ [key: string]: any }> => {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        resolve(result);
      });
    });
  } else {
    const result: { [key: string]: any } = {};
    keys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        result[key] = JSON.parse(value);
      }
    });
    return result;
  }
};

// Helper function to set data in storage
export const setInStorage = async (data: { [key: string]: any }): Promise<void> => {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    });
  } else {
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }
};

export const setupSalesforceOAuth = async (): Promise<void> => {
  if (isChromeExtension()) {
    const extensionId = chrome.runtime.id;
    const redirectUri = `https://${extensionId}.chromiumapp.org/`;
    
    const authUrl = new URL('https://login.salesforce.com/services/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'token');
    authUrl.searchParams.append('client_id', await getClientId());
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'api refresh_token offline_access');

    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl.toString(),
          interactive: true
        },
        (redirectUrl) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            reject(new Error('Failed to authenticate with Salesforce'));
            return;
          }
          
          if (!redirectUrl) {
            reject(new Error('No redirect URL received'));
            return;
          }

          try {
            const url = new URL(redirectUrl);
            const params = new URLSearchParams(url.hash.slice(1));
            const accessToken = params.get('access_token');
            const instanceUrl = params.get('instance_url');
            
            if (accessToken && instanceUrl) {
              setInStorage({
                salesforceToken: accessToken,
                salesforceInstanceUrl: instanceUrl
              }).then(resolve);
            } else {
              reject(new Error('Failed to obtain Salesforce credentials'));
            }
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } else {
    console.warn('Salesforce OAuth setup is not available in non-extension environment');
    await setInStorage({
      salesforceToken: 'mock_salesforce_token',
      salesforceInstanceUrl: 'https://mock.salesforce.com'
    });
  }
};

const getClientId = async (): Promise<string> => {
  const { clientId } = await getFromStorage(['clientId']);
  if (!clientId) {
    throw new Error('Client ID not found. Please enter your Connected App Consumer Key.');
  }
  return clientId;
};

export const setupOpenAIAPI = async (): Promise<void> => {
  const result = await getFromStorage(['openAIKey']);
  if (result.openAIKey) {
    return;
  } else {
    if (isChromeExtension()) {
      const apiKey = prompt('Please enter your OpenAI API key:');
      if (apiKey) {
        await setInStorage({ openAIKey: apiKey });
      } else {
        throw new Error('OpenAI API key is required');
      }
    } else {
      console.warn('OpenAI API setup is not available in non-extension environment');
      await setInStorage({ openAIKey: 'mock_openai_key' });
    }
  }
};

export const checkAuthentication = async (): Promise<boolean> => {
  const { salesforceToken, openAIKey } = await getFromStorage(['salesforceToken', 'openAIKey']);
  return !!(salesforceToken && openAIKey);
};