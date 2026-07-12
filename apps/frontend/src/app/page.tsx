// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { streamFlow } from 'genkit/beta/client';
import { useApi } from '../lib/api-client';

// Define the shape of your expected completed JSON object
interface Recipe {
  title?: string;
  description?: string;
  servings?: number;
  ingredients?: Array<{ name: string; quantity: string; onSale?: boolean }>;
  steps?: string[];
}

interface Messages {
  role?: string;
  content?: string;
}

const defaultChatId = 'cmri52b2d00004kekd1ccdkp2';

export default function ChatComponent() {
  const [input, setInput] = useState('');
  //const [ingredient, setIngredient] = useState('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const [messages, setMessages] = useState<Messages[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const { postFile, streamAi, get } = useApi();

  useEffect(() => {
    // Initialize with default chat ID
    getMessages();
  }, [defaultChatId]);

  const handleGenerateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setRecipe(null);
    setIsLoading(true);

    try {
      // 1. Initialize the stream pointing to your Genkit backend route
      const responseStream = streamFlow({
        url: 'http://localhost:4444/v1/api/genericFlow', // 👈 Update to your actual route
        input, // 👈 Matches your Flow's input schema
      });
      // 2. Async iterate through chunks as Genkit sends them
      for await (const chunk of responseStream.stream) {
        console.log(chunk);
        if (chunk) {
          // Append chunks to state in real time
          setRecipe(chunk as Recipe);
        }
      }
    } catch (error) {
      console.error('Streaming failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMessages = async () => {
    const chats = await get(`/chats/${defaultChatId}`);
    setMessages(chats);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prevMsg) => [
      ...prevMsg,
      {
        role: 'USER',
        message: input,
      },
    ]);
    let uploadedFiles = new FormData();
    files.forEach((el) => {
      uploadedFiles.append('files', el);
    });
    uploadedFiles.append('message', input);
    setIsUploadLoading(true);
    let resultFile;
    try {
      resultFile = await postFile('/chats', uploadedFiles);
    } catch (e) {
      console.log('File Upload Failed:', e);
    } finally {
      setIsUploadLoading(false);
    }
    setIsLoading(true);

    try {
      // 1. Initialize the stream pointing to your Genkit backend route
      const responseStream = streamAi('/genericFlow', {
        message: input,
        chatId: resultFile.chatId,
        role: 'ASSISTANT',
      });
      let i = 0;
      // 2. Async iterate through chunks as Genkit sends them
      for await (const chunk of responseStream.stream) {
        if (chunk.text) {
          // Append chunks to state in real time
          if (i == 0) {
            setMessages((prevMsg) => [
              ...prevMsg,
              {
                role: 'ASSISTANT',
                content: chunk.text,
              },
            ]);
            i++;
          } else {
            setMessages((prevMsg) => {
              const newMsgs = [...prevMsg];
              newMsgs[newMsgs.length - 1].content += chunk.text;
              return newMsgs;
            });
          }
        }
      }
    } catch (error) {
      console.error('Streaming failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const RecipeData = () =>
    recipe ? (
      <div>
        <h2>{recipe.title}</h2>
        <p>{recipe.description}</p>
        <p>Servings: {recipe.servings}</p>
        <h3>Ingredients:</h3>
        <ul>
          {recipe.ingredients?.map((ing, index) => (
            <li key={index}>
              {ing.name}: {ing.quantity} {ing.onSale && '(On Sale!)'}
            </li>
          ))}
        </ul>
        <h3>Steps:</h3>
        <ol>
          {recipe.steps?.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>
    ) : (
      'Output will appear here...'
    );

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          disabled={isLoading}
          style={{
            flexGrow: 1,
            padding: '8px',
            color: '#000000',
            border: '2px solid #797979',
            borderRadius: '2px',
          }}
        />
        <input
          type="file"
          accept="application/pdf,application/json"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{ padding: '8px 16px' }}
        >
          {isLoading ? 'Streaming...' : 'Send'}
        </button>
      </form>

      {messages.length ? (
        messages.map((el, index) => {
          return (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                border: '1px solid #ccc',
                backgroundColor: '#f9f9f9',
                color: '#333',
                minHeight: '100px',
                whiteSpace: 'pre-wrap',
              }}
              key={(el?.content ?? '') + index}
            >
              {/*<RecipeData />*/}
              {el.role} : {el.content}
            </div>
          );
        })
      ) : (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            border: '1px solid #ccc',
            backgroundColor: '#f9f9f9',
            color: '#333',
            minHeight: '100px',
            whiteSpace: 'pre-wrap',
          }}
        >
          'Output will appear here...'
        </div>
      )}
    </div>
  );
}
