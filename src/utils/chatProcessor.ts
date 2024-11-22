import axios from 'axios';
import OpenAI from 'openai';
import { getFromStorage } from './auth';
import { templates, getTemplateDescription } from './commandTemplates';
import { useChatStore } from '../store/chatStore';

let openai: OpenAI;

const initializeAPIs = async () => {
  const { openAIKey } = await getFromStorage(['openAIKey']);
  
  if (!openai && openAIKey) {
    openai = new OpenAI({ 
      apiKey: openAIKey,
      dangerouslyAllowBrowser: true
    });
  }
};

const describeSObject = async (objectName: string): Promise<any> => {
  const { salesforceToken, salesforceInstanceUrl } = await getFromStorage(['salesforceToken', 'salesforceInstanceUrl']);
  
  try {
    const response = await axios.get(
      `${salesforceInstanceUrl}/services/data/v55.0/sobjects/${objectName}/describe`,
      {
        headers: {
          'Authorization': `Bearer ${salesforceToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error describing object ${objectName}:`, error);
    throw error;
  }
};

const listSObjects = async (): Promise<string[]> => {
  const { salesforceToken, salesforceInstanceUrl } = await getFromStorage(['salesforceToken', 'salesforceInstanceUrl']);
  
  try {
    const response = await axios.get(
      `${salesforceInstanceUrl}/services/data/v55.0/sobjects`,
      {
        headers: {
          'Authorization': `Bearer ${salesforceToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.sobjects
      .filter((obj: any) => obj.queryable)
      .map((obj: any) => obj.name);
  } catch (error) {
    console.error('Error listing objects:', error);
    throw error;
  }
};

const executeSOQL = async (query: string): Promise<any> => {
  const { salesforceToken, salesforceInstanceUrl } = await getFromStorage(['salesforceToken', 'salesforceInstanceUrl']);
  
  if (!salesforceToken || !salesforceInstanceUrl) {
    throw new Error('Salesforce credentials not found. Please reconnect to Salesforce.');
  }

  try {
    const response = await axios.get(
      `${salesforceInstanceUrl}/services/data/v55.0/query?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${salesforceToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error executing SOQL:', error);
    if (error.response?.data?.length > 0) {
      throw new Error(`Salesforce query error: ${error.response.data[0].message}`);
    }
    throw error;
  }
};

const updateRecord = async (objectName: string, recordId: string, fields: Record<string, any>): Promise<void> => {
  const { salesforceToken, salesforceInstanceUrl } = await getFromStorage(['salesforceToken', 'salesforceInstanceUrl']);
  
  try {
    await axios.patch(
      `${salesforceInstanceUrl}/services/data/v55.0/sobjects/${objectName}/${recordId}`,
      fields,
      {
        headers: {
          'Authorization': `Bearer ${salesforceToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error updating record:', error);
    throw error;
  }
};

const createRecord = async (objectName: string, fields: Record<string, any>): Promise<string> => {
  const { salesforceToken, salesforceInstanceUrl } = await getFromStorage(['salesforceToken', 'salesforceInstanceUrl']);
  
  try {
    const response = await axios.post(
      `${salesforceInstanceUrl}/services/data/v55.0/sobjects/${objectName}`,
      fields,
      {
        headers: {
          'Authorization': `Bearer ${salesforceToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.id;
  } catch (error) {
    console.error('Error creating record:', error);
    throw error;
  }
};

const generateResponse = async (
  userInput: string,
  queryResult: any,
  context: Record<string, any>
): Promise<string> => {
  const prompt = `
You are an AI assistant helping with Salesforce data analysis. 
User input: ${userInput}
Query result: ${JSON.stringify(queryResult)}
Context: ${JSON.stringify(context)}

Generate a natural language response that:
1. Directly answers the user's question
2. Provides relevant insights from the data
3. Is concise but informative
4. Uses proper business terminology
5. Includes specific numbers/metrics when available
6. Suggests relevant follow-up actions if appropriate

Format numbers appropriately (e.g., currency with 2 decimal places, percentages, etc.).
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "Generate response" }
    ],
    temperature: 0.7,
  });

  return completion.choices[0].message.content || 'No response generated';
};

const parseCommand = async (input: string): Promise<{
  action: string;
  parameters: Record<string, any>;
  query?: string;
}> => {
  const systemPrompt = `
You are a Salesforce command parser. Analyze the user input and categorize it into one of these actions:
- query (for data retrieval)
- update (for record updates)
- create (for new records)
- analyze (for KPIs and trends)
- task (for task/reminder creation)
- favorite (for saving queries)
- help (for assistance)

Return a JSON object with:
{
  "action": "action_type",
  "parameters": {
    // relevant parameters based on action
  },
  "query": "SOQL query if needed"
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: input }
    ],
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
};

export const processUserInput = async (input: string): Promise<string> => {
  await initializeAPIs();

  if (!openai) {
    throw new Error('OpenAI API not initialized. Please check your configuration.');
  }

  const store = useChatStore.getState();
  
  try {
    const command = await parseCommand(input);
    let response: string;

    switch (command.action) {
      case 'query':
        const queryResult = await executeSOQL(command.query!);
        response = await generateResponse(input, queryResult, store.context);
        break;

      case 'update':
        await updateRecord(
          command.parameters.objectName,
          command.parameters.recordId,
          command.parameters.fields
        );
        response = `Updated ${command.parameters.objectName} record successfully.`;
        break;

      case 'create':
        const newRecordId = await createRecord(
          command.parameters.objectName,
          command.parameters.fields
        );
        response = `Created new ${command.parameters.objectName} record with ID: ${newRecordId}`;
        break;

      case 'analyze':
        const analysisResult = await executeSOQL(command.query!);
        response = await generateResponse(input, analysisResult, store.context);
        store.updateContext({ lastAnalysis: analysisResult });
        break;

      case 'task':
        const taskId = await createRecord('Task', command.parameters.taskFields);
        response = `Created new task with ID: ${taskId}`;
        break;

      case 'favorite':
        store.addFavorite(input, command.parameters.description);
        response = 'Command saved to favorites.';
        break;

      case 'help':
        response = 'Available commands:\n' +
          '- Query data: "Show me...", "List...", "Find..."\n' +
          '- Update records: "Update...", "Change..."\n' +
          '- Create records: "Create...", "Add..."\n' +
          '- Analyze data: "Calculate...", "Compare..."\n' +
          '- Tasks: "Remind me...", "Create task..."\n' +
          '- Favorites: "Save this as favorite..."';
        break;

      default:
        throw new Error('Unknown command type');
    }

    store.addMessage({ role: 'assistant', content: response });
    return response;

  } catch (error) {
    console.error('Error processing command:', error);
    throw error;
  }
};