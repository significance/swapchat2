import { useState, useEffect, useRef, useMemo } from "react";
import SwapChat from "swapchat";
import QRCode from "qrcode";

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

  const codeCopyInput = useRef<HTMLInputElement>(null);
  const copyCodeToClipboard = () => {
    if (codeCopyInput.current) {
      codeCopyInput.current.select();
      document.execCommand("copy");
      focusTextbox();
      sendSysMessage("Code copied to clipboard.");
    }
  };

  const linkCopyInput = useRef<HTMLInputElement>(null);
  const copyLinkToClipboard = () => {
    if (linkCopyInput.current) {
      linkCopyInput.current.select();
      document.execCommand("copy");
      focusTextbox();
      sendSysMessage("Link copied to clipboard.");
    }
  };

  const [otherConversation, setOtherConversation] = useState<any>([]);

  const chatModal = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (chatModal.current) {
      let messages = chatModal.current.getElementsByClassName("Chat-message");
      messages[messages.length - 1].scrollIntoView();
    }
  };

  const chatInner = useRef<HTMLDivElement>(null);

  const messageWasReceived = async () => {
    let messages = Array.from(swapChat.OtherPartyConversation.messages);
    await setOtherConversation(messages);
    scrollToBottom();
    animateElement(chatInner);
  };

  const didAcceptTerms = () => {
    return localStorage.getItem("didAcceptTerms") === "true";
  };

  const acceptTerms = () => {
    localStorage.setItem("didAcceptTerms", "true");
    sendSysMessage("Terms accepted. Thanks for chatting with Swapchat! :)");
  };

  const clearConversations = () => {
    setOwnConversation([]);
    setOtherConversation([]);
    setSysConversation([]);
  };

  const [ownConversation, setOwnConversation] = useState<any>([]);

  const parseSlashCommands = (message: string) => {
    //display QR code big
    //notarise on X chain
    if (message.indexOf("/clear") === 0) {
      clearConversations();
      return true;
    }
    if (message.indexOf("/copy code") === 0) {
      if (chatRole === "respondent") {
        return true;
      }
      copyCodeToClipboard();
      return true;
    }
    if (message.indexOf("/copy link") === 0) {
      if (chatRole === "respondent") {
        return true;
      }
      copyLinkToClipboard();
      return true;
    }
    if (message.indexOf("/terms accept") === 0 || message.indexOf("/a") === 0) {
      acceptTerms();
      return true;
    }
    if (message.indexOf("/terms view") === 0) {
      window.open("/terms-and-conditions.txt", "_blank");
      return true;
    }
    if (message.indexOf("/help connect") === 0) {
      let helpMessages = [
        "Scan the QR code above or send the link to the recipient device to connect.",
        "Copy link: /copy link",
        "Copy code: /copy code",
      ];
      helpMessages.forEach((m) => sendSysMessage(m));
      return true;
    }
    if (message.indexOf("/help") === 0) {
      let helpMessage =
        "Swapchat is brought to you by 1UP.digital and the almighty Swarm";
      sendSysMessage(helpMessage);
      let helpMessages = [
        "View terms: /terms view",
        "Accept terms: /terms accept (/a)",
        "Help with connection: /help connect",
        "View useful links: /links",
        "Clear messages: /clear",
      ];
      helpMessages.forEach((m) => sendSysMessage(m));
      return true;
    }
    if (message.indexOf("/links") === 0) {
      let helpMessages = [
        "Swarm: /links swarm",
        "1UP: /links 1UP",
        "View code on Github: /links source",
        "View lib on Github: /links engine",
      ];
      helpMessages.forEach((m) => sendSysMessage(m));
      return true;
    }
    if (message.indexOf("/links swarm") === 0) {
      window.open("https://ethswarm.org", "_blank");
      return true;
    }
    if (message.indexOf("/links 1UP") === 0) {
      window.open("https://1up.digital", "_blank");
      return true;
    }
    if (message.indexOf("/links source") === 0) {
      window.open("https://github.com/signficance/swapchat2", "_blank");
      return true;
    }
    if (message.indexOf("/links engine") === 0) {
      window.open("https://github.com/signficance/swapchat-engine", "_blank");
      return true;
    }
    if (message.indexOf("/d") === 0 && message.length === 3) {
      if (chatRole === "initiator") {
        window.open(chatLink, "_blank");
        return true;
      }
    }
    if (message.indexOf("/") === 0) {
      return true;
    }
    return false;
  };

  const animateElement = (element: any, timeout = 1000) => {
    element.current.classList.add("animate");
    setTimeout(() => {
      element.current.classList.remove("animate");
    }, timeout);
  };

  const messageSendbutton = useRef<HTMLButtonElement>(null);

  const [message, setMessage] = useState<string>("");
  const sendMessage = async () => {
    let didParse = parseSlashCommands(message);
    if (didAcceptTerms() !== true) {
      let helpMessages = [
        "You must accept the Terms and Conditions to proceed.",
        "View terms: /terms view",
        "Accept terms: /terms accept",
      ];
      helpMessages.forEach((m) => sendSysMessage(m));
    }
    if (
      didAcceptTerms() === true &&
      didParse === false &&
      connected !== true &&
      props.chatRole === "initiator"
    ) {
      let helpMessages = [
        "The recipient must connect.",
        "Copy link: /copy link",
        "Copy code: /copy code",
      ];
      helpMessages.forEach((m) => sendSysMessage(m));
    }
    if (
      didAcceptTerms() === true &&
      didParse === false &&
      connected !== true &&
      props.chatRole === "respondent"
    ) {
      let helpMessages = ["Waiting to connect to initiator."];
      helpMessages.forEach((m) => sendSysMessage(m));
    }
    if (
      didAcceptTerms() === true &&
      didParse === false &&
      connected === true &&
      message !== ""
    ) {
      await swapChat.send(message);
      let messages = Array.from(swapChat.OwnConversation.messages);
      await setOwnConversation(messages);
      scrollToBottom();
    }
    animateElement(messageSendbutton);
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

  const [swapChat, setSwapChat] = useState<SwapChat>(
    new SwapChat(
      props.apiURL,
      props.debugURL,
      messageWasReceived,
      props.gatewayMode
    )
  );

  const [generatedToken, setGeneratedToken] = useState<string>("");
  const [chatLink, setChatLink] = useState<string>("");

  const [connected, setConnected] = useState<boolean>(false);
  const [secretCode, setSecretCode] = useState<string>("------");
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

  const messageTextarea = useRef<HTMLTextAreaElement>(null);
  const focusTextbox = () => {
    if (messageTextarea.current) {
      messageTextarea.current.focus();
    }
  };

  useEffect(() => {
    if (didLoad === false) {
      focusTextbox();

      //fix because mobile safari, brave and chrome vh differ
      if (chatInner.current) {
        if (window.innerWidth < 600) {
          chatInner.current.style.height = `${
            document.documentElement.clientHeight - 122
          }px`;
        }
      }

      setDidLoad(true);
      setChatRole(props.chatRole);
      animateIsConnecting();
      if (props.chatRole === "initiator") {
        (async () => {
          sendSysMessage("Type /help for help :)");
          await swapChat.initiate();

          const gt = swapChat.getToken();
          setGeneratedToken(gt);

          const cl = `${window.location.origin}/?token=${gt}`;
          setChatLink(cl);

          let qrCodeData = await generateQRCode(cl);

          setCurrentQRCodeData(qrCodeData);

          await swapChat.waitForRespondentHandshakeChunk();

          sendSysMessage("Connected!");

          if (swapChat.SecretCode !== undefined) {
            setSecretCode(swapChat.SecretCode.toString("hex").slice(0, 6));
          }
          setConnected(true);
        })();
      } else {
        (async () => {
          swapChat.respond(props.token);
          await swapChat.waitForInitiatorHandshakeChunk();
          sendSysMessage("Type /help for help :)");

          sendSysMessage("Connected!");

          if (swapChat.SecretCode !== undefined) {
            setSecretCode(swapChat.SecretCode.toString("hex").slice(0, 6));
          }
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
            <span className="Chat-header-connect-feedback">Connected</span>
            <span className="Chat-is-connected"> * </span>
          </div>
        )}
        {connected === false && (
          <div className="Chat-header-right">
            <span className="Chat-header-connect-feedback">Connecting</span>
            <span className="Chat-is-connecting"> {isConnectingAnimation}</span>
          </div>
        )}
      </header>

      <div className="Chat-inner" ref={chatInner}>
        {chatRole == "initiator" && (
          <div>
            <div className="Chat-welcome">** Welcome to SWAPCHAT **</div>
            <div className="Chat-code">
              <div className="Chat-code-qr">
                <img src={currentQRCodeData} />
              </div>
              <ul className="Chat-code-meta">
                <li className="Chat-code-verification">{secretCode}</li>
                <li className="Chat-code-code">
                  <input
                    readOnly
                    ref={codeCopyInput}
                    className="Chat-code-copyToClipboard"
                    value={`${generatedToken}`}
                  />
                  <a onClick={copyCodeToClipboard}>
                    <img src="./copy.png" />
                    Code
                  </a>
                </li>
                <li className="Chat-code-link">
                  <input
                    readOnly
                    ref={linkCopyInput}
                    className="Chat-code-copyToClipboard"
                    value={chatLink}
                  />
                  <a onClick={copyLinkToClipboard}>
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
              <div className="Chat-code-verification">{secretCode}</div>
            </div>
          </div>
        )}

        <div className="Chat-conversation" ref={chatModal}>
          {comboConversation.map((message: any, index: any) => {
            return (
              <div
                key={index}
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
          ref={messageTextarea}
          rows={1}
          onChange={(e) => setMessage(e.target.value)}
          onKeyUp={handleTextareaKeyup}
          value={message}
        />
        <button ref={messageSendbutton} onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
