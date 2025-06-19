import { Button, Textarea, TextareaOnChangeData } from "@fluentui/react-components";
import { ArrowUpRegular } from "@fluentui/react-icons";
import { ChangeEvent, useState } from "react";
import { ChatHistory } from "../validators/types";

export const ChatUI = ({ context, inputHistory }: { context: string, inputHistory: ChatHistory }) => {
  const [query, setQuery] = useState<string>("");
  const [history, setHistory] = useState<ChatHistory>(inputHistory);

  const [isFetching, setIsFetching] = useState<boolean>(false);

  const handleSubmit = async () => {
    setIsFetching(true);
    const res: Response = await fetch('/api/v1/chat', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ context, }),
      credentials: "include",
    });

    if (res.ok) {
      await res.json().then((chatResponse) => {

      })
    }
  }

  return (
    <>
      <div className="flex flex-col h-full w-full">
        <div className="flex-1 overflow-y-auto">

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
