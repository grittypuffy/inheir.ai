import { Chat, ChatHistoryResponse, ChatResponse } from '@/lib/validators/types';
import { Button, Textarea, TextareaOnChangeData } from '@fluentui/react-components';
import { ArrowUpRegular } from '@fluentui/react-icons';
import { ChangeEvent, useEffect, useState } from 'react';

export const ChatUI = ({ caseId }: { caseId: string }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Chat[]>([
    {
      content: 'Welcome to the AI Chatbot! How can I assist you today?',
      type: 'response',
    },
  ]);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  useEffect(() => {
    fetchChatHistory();
  }, [caseId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const userChat: Chat = {
      content: query,
      type: 'query',
    };
    setChatHistory((prev) => [...prev, userChat]);
    setIsFetching(true);

    const form = new FormData();
    form.append('case_id', caseId);
    form.append('query', userChat.content);

    const res: Response = await fetch('/api/v1/chatbot/chat', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: form,
      credentials: 'include',
    });

    if (res.ok) {
      await res.json().then((chatResponse: ChatResponse) => {
        const responseChat: Chat = {
          content: chatResponse.response.content,
          type: 'response',
        };
        setChatHistory((prev) => [...prev, responseChat]);
      });
      await fetchChatHistory();
    } else {
      const errorChat: Chat = {
        content: "Sorry, I couldn't process your request. Please try again later.",
        type: 'response',
      };
      setChatHistory((prev) => [...prev, errorChat]);
    }
    setIsFetching(false);
  };

  const fetchChatHistory = async () => {
    setIsLoading(true);
    try {
      const res: Response = await fetch(`/api/v1/case/${caseId}/chats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (res.ok) {
        const apiData = await res.json();
        const data: ChatHistoryResponse = apiData.chats;
        console.log('Fetched chat history:', data);
        const newChatHistory: Chat[] = [];

        data.chats.forEach((chat: ChatResponse) => {
          const queryChat: Chat = {
            content: chat.query.content,
            type: 'query',
          };
          const responseChat: Chat = {
            content: chat.response.content,
            type: 'response',
          };
          newChatHistory.push(queryChat, responseChat);
        });

        setChatHistory(
          newChatHistory.length > 0
            ? newChatHistory
            : [
                {
                  content: 'Welcome to the AI Chatbot! How can I assist you today?',
                  type: 'response',
                },
              ]
        );
      } else {
        setChatHistory([
          {
            content: 'Failed to fetch chat history.',
            type: 'response',
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      setChatHistory([
        {
          content: 'Failed to fetch chat history.',
          type: 'response',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChatBubble = (chat: Chat, index: number) => {
    const isUser = chat.type === 'query';

    return (
      <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div
          className={`max-w-[70%] rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-200 text-gray-800 rounded-bl-none'
          }`}
        >
          <p className="whitespace-pre-wrap">{chat.content}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col w-full h-full">
        <div
          className="flex-1 overflow-y-auto p-4"
          style={{ scrollBehavior: 'smooth' }}
          ref={(el) => {
            if (el && (chatHistory.length > 0 || isFetching)) {
              el.scrollTop = el.scrollHeight;
            }
          }}
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {chatHistory.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                <>{chatHistory.map((chat, index) => renderChatBubble(chat, index))}</>
              )}
              {isFetching && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 rounded-bl-none">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.4s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="bg-gray-100 border-t-2">
          <form className="flex items-center p-3 gap-3" onSubmit={handleSubmit}>
            <Textarea
              type="text"
              placeholder="Type your message..."
              resize="vertical"
              size="medium"
              className="flex-1"
              onChange={(_: ChangeEvent<HTMLTextAreaElement>, data: TextareaOnChangeData) => {
                setQuery(data.value);
              }}
            />
            <Button appearance="primary" type="submit" shape="circular" disabled={isFetching}>
              <span>Send</span>
              <ArrowUpRegular />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};
