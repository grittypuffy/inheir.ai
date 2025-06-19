import { Chat, ChatHistoryResponse, ChatResponse } from "@/lib/validators/types";
import { Button, Textarea, TextareaOnChangeData } from "@fluentui/react-components";
import { ArrowUpRegular } from "@fluentui/react-icons";
import { ChangeEvent, useEffect, useState } from "react";

export const ChatUI = ({ caseId }: { caseId: string }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const handleSubmit = async () => {
    setIsFetching(true);
    const res: Response = await fetch('/api/v1/chat', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        case_id: caseId,
        query: query,
      }),
      credentials: "include",
    });

    if (res.ok) {
      await res.json().then((chatResponse: ChatResponse) => {
        const responseChat: Chat = {
          content: chatResponse.response.content,
          type: 'response',
        };
        setChatHistory(prev => [...prev, responseChat]);
      })
    }
  }

  const fetchChatHistory = async () => {
    const res: Response = await fetch(`/api/v1/case/${caseId}/chats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (res.ok) {
      const data: ChatHistoryResponse = await res.json();
      data.chats.forEach((chat: ChatResponse) => {
        const queryChat: Chat = {
          content: chat.query.content,
          type: 'query',
        };
        const responseChat: Chat = {
          content: chat.response.content,
          type: 'response',
        };
        setChatHistory(prev => [...prev, queryChat, responseChat]);
      })
    }
  };

  useEffect(() => {
    fetchChatHistory();
    setIsLoading(false);
  }, [])

  return (
    <>
      <div className="flex flex-col h-full w-full">
        <div className="flex-1 overflow-y-auto h-screen">

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
                setQuery(data.value)
              }}
            />
            <Button
              appearance="primary"
              type="submit"
              shape="circular"
              disabled={isFetching}
            >
              <span
              >
                Send
              </span>
              <ArrowUpRegular />
            </Button>
          </form>
        </div>
      </div >
    </>
  )
}
