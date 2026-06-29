import ReactMarkdown from "react-markdown";

import type { ChatMessage } from "../../types/chat";

interface Props {

    message: ChatMessage;

}

export default function ChatBubble({

    message

}: Props) {

    const isUser = message.role === "user";

    return (

        <div
            className={
                isUser
                    ? "bubble-row user-row"
                    : "bubble-row assistant-row"
            }
        >

            {

                !isUser && (

                    <div className="avatar">

                        V

                    </div>

                )

            }

            <div
                className={
                    isUser
                        ? "bubble user-bubble"
                        : "bubble assistant-bubble"
                }
            >

                <ReactMarkdown>

                    {message.content}

                </ReactMarkdown>

            </div>

        </div>

    );

}