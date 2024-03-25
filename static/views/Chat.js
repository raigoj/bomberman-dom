import Mframe from "../framework/mframe.js";
import Ws from "../websocket.js";

export default function Chat({ messages, setMessages, username, chatId }) {
    const handleChange = event => {
        msg = {
            Mtype: "chat",
            data: {
                username: username,
                message: event.target.value,
            },
        }
        Ws.send(msg)
        document.getElementById("inputbox").value = ""
    }

    const scrollToBottom = () => {
        const serverMessagesElement = document.getElementById("log");
        serverMessagesElement.scrollTop = serverMessagesElement.scrollHeight;
    };

    setTimeout(scrollToBottom, 0);

    return (
        <div id="chat">
            <div className="server-message">{chatId === "joinedLobby" ? "Joined lobby chat" : "Joined global chat"}</div>
            <div id="log" className="chat-messages">
                {messages.map((item, index) => (
                    <div className="message-div">
                        <p className="chat-username">{item.username}:</p>
                        <p className="chat-message">{item.message}</p>
                    </div>
                ))}

            </div>
            {username ? <input id="inputbox" placeholder="Type your message..." onchange={handleChange} /> : <input id="inputbox" placeholder="Enter username to chat" onchange={handleChange} disabled />}
        </div>

    )
}
