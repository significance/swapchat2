import { useState, useEffect, useRef, useMemo } from "react";
import SwapChat from "swapchat";
import QRCode from "qrcode";

const POLL_TIMEOUT = 1000;
const REQUIRE_TERMS = import.meta.env.VITE_REQUIRE_TERMS === "true";

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
  const copyCodeToClipboard = (e: any) => {
    if (e !== false) {
      e.preventDefault();
    }
    if (codeCopyInput.current) {
      codeCopyInput.current.select();
      document.execCommand("copy");
      focusTextbox();
      sendSysMessage("Code copied to clipboard.");
    }
  };

  const linkCopyInput = useRef<HTMLInputElement>(null);
  const copyLinkToClipboard = (e: any) => {
    if (e !== false) {
      e.preventDefault();
    }
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
    setTimeout(() => {
      if (chatModal.current) {
        let messages = chatModal.current.getElementsByClassName("Chat-message");
        if (messages.length > 0) {
          messages[messages.length - 1].scrollIntoView();
        }
      }
    }, 50);
  };

  const chatInner = useRef<HTMLDivElement>(null);

  const messageWasReceived = async () => {
    let messages = Array.from(swapChat.OtherPartyConversation.messages);
    await setOtherConversation(messages);
    scrollToBottom();
    animateElement(chatInner);
  };

  const [showTermsScreen, setShowTermsScreen] = useState(
    REQUIRE_TERMS && localStorage.getItem("didAcceptTerms") !== "true"
  );
  const [termsReadMode, setTermsReadMode] = useState(false);
  const [termsPage, setTermsPage] = useState(0);

  const termsPages = [
    "SWAPCHAT USER TESTING TERMS AND CONDITIONS (JAN 2022)\n\nWelcome to Swapchat, currently being developed and graciously provided by the 1up.digital. Swarm is a peer-to-peer network of nodes that collectively provide a decentralized storage and communication service. Swapchat is currently provided for testing purposes only.\n\nBy testing Swapchat, you accept the following terms:",
    "We make, at our sole discretion, Swapchat available to you at no charge. You may choose to try Swapchat at your sole discretion. Swapchat testing is intended for evaluation purposes only and not for production use. It is currently not supported.\n\nData storage and transfer through Swapchat is not encrypted. Data storage through Swapchat is not guaranteed in time and data may thus disappear, respectively be erased, at any time.",
    "You agree to not upload and transfer personal data and data that contain legally protected contents. You agree to not use Swapchat in a way that threatens the security, integrity or availability of the service.\n\nYou are solely responsible for the uploaded and downloaded files. You may only upload and/or transfer files that belong to you and/or that you are explicitly authorized to upload and/or transfer.",
    "You acknowledge that Swapchat is not free from bugs or errors and that Swarm bears no liability for any harm or damage arising out of or in connection with Swapchat.\n\nWe reserve the right to modify these User Testing Terms and Conditions at any time. These terms are governed by British law.",
  ];

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
      copyCodeToClipboard(false);
      return true;
    }
    if (message.indexOf("/copy link") === 0) {
      if (chatRole === "respondent") {
        return true;
      }
      copyLinkToClipboard(false);
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
        "Swapchat is brought to you by 1UP.digital and the irrepressible Swarm.";
      sendSysMessage(helpMessage);
      let helpMessages = [
        "Help with connection: /help connect",
        "View useful links: /links",
        "Fullscreen QR code: /qr",
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
    if (message.indexOf("/qr") === 0) {
      if (chatRole === "initiator" && chatLink) {
        (async () => {
          const bigQR = await generateQRCode(chatLink, 500, "#0170f8");
          setFullscreenQRData(bigQR);
          setShowFullscreenQR(true);
        })();
      }
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
    if (showTermsScreen) return;
    let didParse = parseSlashCommands(message);
    if (
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
      didParse === false &&
      connected !== true &&
      props.chatRole === "respondent"
    ) {
      let helpMessages = ["Waiting to connect to initiator."];
      helpMessages.forEach((m) => sendSysMessage(m));
    }
    if (
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
    if (e.key === "PageUp" && chatInner.current) {
      e.preventDefault();
      chatInner.current.scrollTop -= chatInner.current.clientHeight;
    }
    if (e.key === "PageDown" && chatInner.current) {
      e.preventDefault();
      chatInner.current.scrollTop += chatInner.current.clientHeight;
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

  const [swapChat] = useState<SwapChat>(() => {
    const sc = new SwapChat(
      props.apiURL,
      messageWasReceived,
      props.gatewayMode,
      POLL_TIMEOUT
    );
    if (props.stamp) {
      sc.BatchID = props.stamp;
    }
    return sc;
  });

  const [generatedToken, setGeneratedToken] = useState<string>("");
  const [chatLink, setChatLink] = useState<string>("");

  const [connected, setConnected] = useState<boolean>(false);
  const [secretCode, setSecretCode] = useState<string>("------");
  const [chatRole, setChatRole] = useState<string>("");
  const [didLoad, setDidLoad] = useState<boolean>(false);

  const [currentQRCodeData, setCurrentQRCodeData] = useState("");
  const [fullscreenQRData, setFullscreenQRData] = useState("");
  const [showFullscreenQR, setShowFullscreenQR] = useState(false);

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

  useEffect(
    () => {
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
    },
    //eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const generateQRCode = (link: string, width = 150, dark = "#000000"): Promise<string> => {
    return new Promise((resolve, reject) => {
      var opts = {
        errorCorrectionLevel: "L" as const,
        margin: 0,
        width: width,
        color: {
          dark: dark,
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
      {showTermsScreen && (
        <div
          className="Terms-screen"
          tabIndex={0}
          ref={(el) => el?.focus()}
          onKeyDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (termsReadMode) {
              if ((e.key === " " || e.key === "Enter" || e.key === "ArrowRight" || e.key === "PageDown") && termsPage < termsPages.length - 1) {
                setTermsPage(termsPage + 1);
              } else if ((e.key === "ArrowLeft" || e.key === "PageUp") && termsPage > 0) {
                setTermsPage(termsPage - 1);
              } else if (e.key === "y" || e.key === "Y") {
                localStorage.setItem("didAcceptTerms", "true");
                setShowTermsScreen(false);
                setTimeout(() => focusTextbox(), 50);
              } else if (e.key === "n" || e.key === "N") {
                window.open("https://www.youtube.com/watch?v=lAkuJXGldrM", "_blank");
              } else if (e.key === "Escape") {
                setTermsReadMode(false);
                setTermsPage(0);
              }
            } else {
              if (e.key === "y" || e.key === "Y") {
                localStorage.setItem("didAcceptTerms", "true");
                setShowTermsScreen(false);
                setTimeout(() => focusTextbox(), 50);
              }
              if (e.key === "r" || e.key === "R") {
                setTermsReadMode(true);
                setTermsPage(0);
              }
              if (e.key === "n" || e.key === "N") {
                window.open("https://www.youtube.com/watch?v=lAkuJXGldrM", "_blank");
              }
            }
          }}
        >
          {!termsReadMode ? (
            <div className="Terms-content">
              <div className="Terms-title">Welcome to Swapchat : )</div>
              <div className="Terms-strapline">Chat like it's 1998!</div>
              <div className="Terms-prompt">Agree to Terms? Y/N</div>
              <div className="Terms-hint">Press R to read</div>
            </div>
          ) : (
            <div className="Terms-content Terms-reader">
              <div className="Terms-reader-text">{termsPages[termsPage]}</div>
              <div className="Terms-reader-nav">
                Page {termsPage + 1} of {termsPages.length}
                {termsPage < termsPages.length - 1
                  ? " - Press SPACE for next"
                  : ""}
              </div>
              {termsPage === termsPages.length - 1 && (
                <div className="Terms-prompt">Agree to Terms? Y/N</div>
              )}
              <div className="Terms-hint">ESC to go back</div>
            </div>
          )}
        </div>
      )}
      {showFullscreenQR && (
        <div
          className="QR-fullscreen"
          tabIndex={0}
          ref={(el) => el?.focus()}
          onKeyDown={() => { setShowFullscreenQR(false); focusTextbox(); }}
          onClick={() => { setShowFullscreenQR(false); focusTextbox(); }}
        >
          <img alt="qr code fullscreen" src={fullscreenQRData} />
        </div>
      )}
      <header>
        <div className="Chat-header-left">
          <img className="Swapchat-logo" alt="swapchat" src="./swapchat3.png" />
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
        {chatRole === "initiator" && (
          <div>
            <div className="Chat-welcome">** Welcome to SWAPCHAT **</div>
            <div className="Chat-code">
              <div className="Chat-code-qr">
                <img alt="qr code" src={currentQRCodeData} />
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
                  <a
                    onClick={(e) => copyCodeToClipboard(e)}
                    href={generatedToken}
                  >
                    <img alt="copy code" src="./copy.png" />
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
                  <a onClick={(e) => copyLinkToClipboard(e)} href={chatLink}>
                    <img alt="copy link" src="./copy.png" />
                    Link
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}

        {chatRole === "respondent" && (
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
