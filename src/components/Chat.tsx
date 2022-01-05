import { useState, useEffect, useRef, useMemo } from "react";
import SwapChat from "swapchat-engine";
import QRCode from "qrcode";

// document.execCommand("copy")

const Chat = (props: any) => {
  const [sysConversation, setSysConversation] = useState<any>([]);

  const sendSysMessage = async (content: string) => {
    let message = {
      content: content,
      timestamp: Date.now(),
    };
    await setSysConversation((sysConversation: Array<any>) => [
      ...sysConversation,
      message,
    ]);
    scrollToBottom();
  };

  const [otherConversation, setOtherConversation] = useState<any>([]);

  const chatModal = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (chatModal.current) {
      let messages = chatModal.current.getElementsByClassName("Chat-message");
      messages[messages.length - 1].scrollIntoView();
    }
  };

  const messageWasReceived = async () => {
    let messages = Array.from(swapChat.OtherPartyConversation.messages);
    await setOtherConversation(messages);
    scrollToBottom();
  };

  const [ownConversation, setOwnConversation] = useState<any>([]);

  const parseSlashCommands = (message: string) => {
    if (message.indexOf("/help") === 0) {
      let helpMessage =
        "Swapchat is brought to you by 1UP.digital and the allmighty Swarm";
      sendSysMessage(helpMessage);
      let helpMessage2 = "Info on connection: /help connect";
      sendSysMessage(helpMessage2);
      return true;
    }
    return false;
  };

  const [message, setMessage] = useState<string>("");
  const sendMessage = async () => {
    let didParse = parseSlashCommands(message);
    if (didParse === false) {
      await swapChat.send(message);
      let messages = Array.from(swapChat.OwnConversation.messages);
      await setOwnConversation(messages);
      scrollToBottom();
    }
    setMessage("");
  };

  const handleTextareaKeyup = (e: any) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const orderConversation = (a: any, b: any) => {
    if (a.timestamp < b.timestamp) {
      return -1;
    }
    if (a.timestamp > b.timestamp) {
      return 1;
    }
    return 0;
  };

  const comboConversation = useMemo(() => {
    let combo: Array<any> = [];
    combo = combo.concat(
      sysConversation.map((c: any) => {
        c.sender = "sys";
        return c;
      })
    );
    combo = combo.concat(
      otherConversation.map((c: any) => {
        c.sender = "other";
        return c;
      })
    );
    combo = combo.concat(
      ownConversation.map((c: any) => {
        c.sender = "own";
        return c;
      })
    );
    return combo.sort(orderConversation);
  }, [sysConversation, ownConversation, otherConversation]);

  // const [comboConversation, setComboConversation] = useState<any>([]);
  // const mergeCombo = () => {
  //   setComboConversation(combo);
  // };

  const [swapChat, setSwapChat] = useState<SwapChat>(
    new SwapChat(props.apiURL, props.debugURL, messageWasReceived)
  );

  const [generatedToken, setGeneratedToken] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [chatRole, setChatRole] = useState<string>("");
  const [didLoad, setDidLoad] = useState<boolean>(false);

  const [currentQRCodeData, setCurrentQRCodeData] = useState("");

  const [isConnectingAnimation, setIsConnectingAnimation] = useState("");

  const animateIsConnectingSequence = ["\\", "|", "/", "-"];
  const animateIsConnecting = async (i = 0) => {
    await new Promise((r) => setTimeout(r, 60));
    if (i < animateIsConnectingSequence.length - 1) {
      i = i + 1;
    } else {
      i = 0;
    }
    setIsConnectingAnimation(animateIsConnectingSequence[i]);
    animateIsConnecting(i);
  };

  useEffect(() => {
    if (didLoad === false) {
      setDidLoad(true);
      setChatRole(props.chatRole);
      animateIsConnecting();
      if (props.chatRole === "initiator") {
        (async () => {
          sendSysMessage("Type /help for help :)");
          await swapChat.initiate();

          const gt = swapChat.getToken();
          setGeneratedToken(gt);
          let qrCodeData = await generateQRCode(gt);
          setCurrentQRCodeData(qrCodeData);

          await swapChat.waitForRespondentHandshakeChunk();

          sendSysMessage("Connected!");
          setConnected(true);
        })();
      } else {
        (async () => {
          swapChat.respond(props.token);
          await swapChat.waitForInitiatorHandshakeChunk();
          sendSysMessage("Type /help for help :)");

          sendSysMessage("Connected!");
          setConnected(true);
        })();
      }
    }
  });

  const generateQRCode = (link: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      var opts = {
        quality: 0.3,
        margin: 0,
        width: 150,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      };

      QRCode.toDataURL(link, opts, function (err, url) {
        resolve(url);
      });
    });
  };

  return (
    <div className="Chat">
      <header>
        <div className="Chat-header-left">
          <img className="Swapchat-logo" src="./swapchat3.png" />
          <div className="Chat-header-left-logotext">SwapChat 2.0</div>
        </div>
        {connected === true && (
          <div className="Chat-header-right">
            <span>Connected</span>
            <span className="Chat-is-connected"> * </span>
          </div>
        )}
        {connected === false && (
          <div className="Chat-header-right">
            <span>Connecting</span>
            <span className="Chat-is-connecting"> {isConnectingAnimation}</span>
          </div>
        )}
      </header>

      <div className="Chat-inner">
        {chatRole == "initiator" && (
          <div>
            <div className="Chat-welcome">** Welcome to SWAPCHAT **</div>
            <div className="Chat-code">
              <div className="Chat-code-qr">
                <img src={currentQRCodeData} />
              </div>
              <ul className="Chat-code-meta">
                <li className="Chat-code-verification">a7f02e</li>
                <li className="Chat-code-code">
                  <a
                    target="_blank"
                    href={`${window.location.origin}/?token=${generatedToken}`}
                  >
                    <img src="./copy.png" />
                    Code
                  </a>
                </li>
                <li className="Chat-code-link">
                  <a
                    target="_blank"
                    href={`${window.location.origin}/?token=${generatedToken}`}
                  >
                    <img src="./copy.png" />
                    Link
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}

        {chatRole == "respondent" && (
          <div>
            <div className="Chat-welcome">** Welcome to SWAPCHAT **</div>
            <div className="Chat-code">
              <div className="Chat-code-verification">a7f02e</div>
            </div>
          </div>
        )}

        <div className="Chat-conversation" ref={chatModal}>
          {comboConversation.map((message: any, index: any) => {
            return (
              <div
                className={`Chat-message-outer Chat-message-sender-${message.sender}`}
              >
                <div key={index} className={"Chat-message"}>
                  {message.content}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="Chat-controls">
        <textarea
          rows={1}
          onChange={(e) => setMessage(e.target.value)}
          onKeyUp={handleTextareaKeyup}
          value={message}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;