import { useState, useEffect, useRef, useMemo } from "react";
import SwapChat from "swapchat";
import QRCode from "qrcode";

const POLL_TIMEOUT = 1000;
const REQUIRE_TERMS = import.meta.env.VITE_REQUIRE_TERMS === "true";

const THEMES: string[] = ["classic", "turbo", "norton", "matrix", "amber", "cga", "neon", "tron"];

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

  const getSetupStage = () => {
    if (REQUIRE_TERMS && localStorage.getItem("didAcceptTerms") !== "true") return "terms";
    if (!(props.signerKey || localStorage.getItem("swapchat_signerKey"))) return "signerKey";
    if (!(props.stamp || localStorage.getItem("swapchat_batchId"))) return "batchId";
    return "ready";
  };

  const [setupStage, setSetupStage] = useState(getSetupStage);
  const [termsReadMode, setTermsReadMode] = useState(false);
  const [termsPage, setTermsPage] = useState(0);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");
  const [batchInput, setBatchInput] = useState("");
  const [batchError, setBatchError] = useState("");

  const advanceSetup = () => {
    setSetupStage(getSetupStage());
  };

  const savedSignerKey = props.signerKey || localStorage.getItem("swapchat_signerKey") || "";
  const savedBatchId = props.stamp || localStorage.getItem("swapchat_batchId") || "";

  const termsPages = [
    "SWAPCHAT TERMS OF USE (APR 2026)\n\nSwapchat is an educational and evaluation tool developed by 1up.digital. It is built on Ethereum Swarm, a decentralized peer-to-peer storage and communication network.\n\nSwapchat is provided for testing and evaluation purposes only. It is not intended for production use. It is provided AS IS, at no charge, with no warranty of any kind.",
    "HOW IT WORKS\n\nMessages are end-to-end encrypted using a hybrid scheme combining classical elliptic curve key exchange (ECDH) with post-quantum key encapsulation (ML-KEM-768). Only you and your chat partner can read your messages.\n\nEncrypted messages are stored as chunks on the Swarm network. Because Swarm is decentralized, chunks may be stored by any node operator in any jurisdiction. Data persistence is not guaranteed.",
    "YOUR RESPONSIBILITIES\n\nYou agree to use Swapchat lawfully and responsibly. You shall not use Swapchat to store or transfer illegal, infringing, or harmful content, including malware.\n\nYou are solely responsible for the content you send. You agree not to interfere with or disrupt the integrity or availability of the service or the Swarm network.",
    "LIMITATIONS\n\nSwapchat and its developers bear no liability for any harm, damage, data loss, or other consequence arising from your use of the software.\n\nWe may discontinue Swapchat at any time without notice. We may modify these terms at any time.\n\nThese terms are governed by British law.",
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
    if (message.indexOf("/gateway") === 0) {
      const parts = message.split(" ");
      if (parts.length < 2 || !parts[1].trim()) {
        const gw = localStorage.getItem("swapchat_gateway") || props.apiURL;
        (async () => {
          try {
            const res = await fetch(gw + "/health", { signal: AbortSignal.timeout(5000) });
            if (!res.ok) throw new Error(`${res.status}`);
            sendSysMessage(`Gateway: ${gw} (OK)`);
          } catch (e) {
            sendSysMessage(`Gateway: ${gw} (NOT RESPONDING)`);
          }
        })();
        return true;
      }
      const url = parts[1].trim().replace(/\/+$/, "");
      (async () => {
        try {
          const res = await fetch(url + "/health", { signal: AbortSignal.timeout(5000) });
          if (!res.ok) throw new Error(`${res.status}`);
          swapChat.Swarm.Bee = new (swapChat.Swarm.Bee.constructor as any)(url);
          localStorage.setItem("swapchat_gateway", url);
          sendSysMessage(`Gateway changed to ${url}`);
        } catch (e) {
          sendSysMessage(`Gateway ${url} is not reachable`);
        }
      })();
      return true;
    }
    if (message.indexOf("/reset") === 0) {
      localStorage.clear();
      window.location.reload();
      return true;
    }
    if (message.indexOf("/clear") === 0) {
      clearConversations();
      return true;
    }
    if (message === "/copy code" || message === "/code") {
      if (chatRole === "respondent") {
        return true;
      }
      copyCodeToClipboard(false);
      return true;
    }
    if (message === "/copy link" || message === "/link") {
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
        "Copy invite code: /code",
        "Copy invite link: /link",
        "Open as respondent: /d",
        "Fullscreen QR code: /qr",
        "Change theme: /theme",
        "Change gateway: /gateway",
        "Toggle cursor: /cursor",
        "Fullscreen mode: /fs",
        "Clear messages: /clear",
        "Reset all settings: /reset",
        "Scroll: Arrow Up/Down, Page Up/Down",
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
          const bigQR = await generateQRCode(chatLink, 500);
          setFullscreenQRData(bigQR);
          setShowFullscreenQR(true);
        })();
      }
      return true;
    }
    if (message.indexOf("/themes") === 0 || message.indexOf("/theme") === 0) {
      const parts = message.split(" ");
      if (parts.length < 2) {
        const list = THEMES.map(t => `${t === theme ? "* " : "  "}${t}`).join("\n");
        sendSysMessage(`Themes:\n${list}\n\nUsage: /theme <name>`);
        return true;
      }
      const name = parts[1].toLowerCase().trim();
      if (THEMES.includes(name)) {
        setTheme(name);
        localStorage.setItem("swapchat_theme", name);
        sendSysMessage(`Theme set to ${name}`);
      } else {
        sendSysMessage(`Unknown theme: ${name}`);
      }
      return true;
    }
    if (message.indexOf("/fullscreen") === 0 || message.indexOf("/fs") === 0) {
      document.documentElement.requestFullscreen?.();
      return true;
    }
    if (message === "/cursor") {
      document.documentElement.classList.toggle("show-cursor");
      return true;
    }
    if (message === "/d") {
      if (chatLink) {
        window.open(chatLink, "_blank");
      } else {
        sendSysMessage("No chat link available yet.");
      }
      return true;
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
    if (setupStage !== "ready") return;
    if (message.trim() === "") return;
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
      const sanitised = message.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "").trim();
      if (sanitised === "") return;
      await swapChat.send(sanitised);
      // Save stamp bucket state after each send
      try {
        const state = swapChat.Swarm.getStampState?.();
        if (state) localStorage.setItem("swapchat_stampState", JSON.stringify(Array.from(state)));
      } catch (e) {}
      let messages = Array.from(swapChat.OwnConversation.messages);
      await setOwnConversation(messages);
      scrollToBottom();
    }
    animateElement(messageSendbutton);
    setMessage("");
  };

  const handleTextareaKeydown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if ((e.key === "ArrowUp" || e.key === "PageUp") && chatInner.current) {
      e.preventDefault();
      chatInner.current.scrollTop -= e.key === "PageUp" ? chatInner.current.clientHeight : 40;
    }
    if ((e.key === "ArrowDown" || e.key === "PageDown") && chatInner.current) {
      e.preventDefault();
      chatInner.current.scrollTop += e.key === "PageDown" ? chatInner.current.clientHeight : 40;
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
      POLL_TIMEOUT,
      props.socGatewayURL,
      props.gatewayMode ? undefined : POLL_TIMEOUT
    );
    if (savedBatchId) {
      sc.BatchID = savedBatchId;
    }
    if (savedSignerKey) {
      sc.SignerKey = savedSignerKey;
    }
    if (props.stampDepth) {
      sc.StampDepth = props.stampDepth;
    }
    // Restore stamp bucket state from localStorage
    if (savedSignerKey && savedBatchId) {
      try {
        const saved = localStorage.getItem("swapchat_stampState");
        if (saved) {
          const buckets = new Uint32Array(JSON.parse(saved));
          sc.Swarm.useClientStamp(savedSignerKey, savedBatchId, sc.StampDepth, buckets);
        }
      } catch (e) {}
    }
    return sc;
  });

  const [generatedToken, setGeneratedToken] = useState<string>("");
  const [chatLink, setChatLink] = useState<string>("");
  const [theme, setTheme] = useState(localStorage.getItem("swapchat_theme") || "classic");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // Regenerate QR with new theme colours
    if (chatLink) {
      (async () => {
        const qr = await generateQRCode(chatLink);
        setCurrentQRCodeData(qr);
      })();
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(() => {
    const handleWindowClick = () => focusTextbox();
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [connected, setConnected] = useState<boolean>(false);
  const [gatewayError, setGatewayError] = useState<boolean>(false);
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

  // One-time UI setup
  useEffect(() => {
    if (didLoad === false) {
      setDidLoad(true);
      setChatRole(props.chatRole);
      animateIsConnecting();

      //fix because mobile safari, brave and chrome vh differ
      if (chatInner.current) {
        if (window.innerWidth < 600) {
          chatInner.current.style.height = `${
            document.documentElement.clientHeight - 122
          }px`;
        }
      }
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chat initialization — runs when setup completes
  const [chatStarted, setChatStarted] = useState(false);
  useEffect(
    () => {
      if (setupStage !== "ready" || chatStarted) return;
      setChatStarted(true);
      focusTextbox();

      // Validate saved stamp on reload
      if (swapChat.Swarm.ClientStamper) {
        (async () => {
          const valid = await swapChat.Swarm.validateStampBatch();
          if (!valid) {
            localStorage.removeItem("swapchat_batchId");
            localStorage.removeItem("swapchat_stampState");
            setSetupStage("batchId");
            setChatStarted(false);
          }
        })();
      }

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

            // Save stamp state after handshake
            try {
              const state = swapChat.Swarm.getStampState?.();
              if (state) localStorage.setItem("swapchat_stampState", JSON.stringify(Array.from(state)));
            } catch (e) {}

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
    },
    //eslint-disable-next-line react-hooks/exhaustive-deps
    [setupStage]
  );

  // Gateway health check — runs every 30s when connected
  useEffect(() => {
    if (!connected) return;
    let active = true;
    let hadError = false;
    const checkGateway = async () => {
      try {
        const res = await fetch(props.apiURL + "/health", { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error(`${res.status}`);
        if (hadError) {
          setGatewayError(false);
          hadError = false;
        }
      } catch (e) {
        if (!hadError) {
          sendSysMessage(`Gateway error: ${props.apiURL} is not responding`);
          hadError = true;
        }
        setGatewayError(true);
      }
    };
    const interval = setInterval(() => { if (active) checkGateway(); }, 30000);
    return () => { active = false; clearInterval(interval); };
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const getThemeColor = (prop: string, fallback: string): string => {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || fallback;
  };

  const generateQRCode = (link: string, width = 150, dark?: string, light?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      var opts = {
        errorCorrectionLevel: "L" as const,
        margin: 0,
        width: width,
        color: {
          dark: dark || getThemeColor("--text-primary", "#000000"),
          light: light || getThemeColor("--bg-inner", "#FFFFFF"),
        },
      };

      QRCode.toDataURL(link, opts, function (err, url) {
        resolve(url);
      });
    });
  };

  return (
    <div className="Chat">
      {setupStage === "terms" && (
        <div
          className="Terms-screen"
          tabIndex={0}
          ref={(el) => el?.focus()}
          onKeyDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const acceptTerms = () => {
              localStorage.setItem("didAcceptTerms", "true");
              advanceSetup();
            };
            if (termsReadMode) {
              if ((e.key === " " || e.key === "Enter" || e.key === "ArrowRight" || e.key === "PageDown") && termsPage < termsPages.length - 1) {
                setTermsPage(termsPage + 1);
              } else if ((e.key === "ArrowLeft" || e.key === "PageUp") && termsPage > 0) {
                setTermsPage(termsPage - 1);
              } else if (e.key === "y" || e.key === "Y") {
                acceptTerms();
              } else if (e.key === "n" || e.key === "N") {
                window.open("https://www.youtube.com/watch?v=lAkuJXGldrM", "_blank");
              } else if (e.key === "Escape") {
                setTermsReadMode(false);
                setTermsPage(0);
              }
            } else {
              if (e.key === "y" || e.key === "Y") {
                acceptTerms();
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
      {setupStage === "signerKey" && (
        <div className="Terms-screen" tabIndex={0}>
          <div className="Terms-content">
            <div className="Terms-title">Wallet Configuration</div>
            <div className="Terms-strapline">
              Enter the private key for an account{"\n"}which has a usable stamp
            </div>
            <div className="Key-warning">
              Warning: use a burner key only!{"\n"}A webpage is not a secure way to handle{"\n"}important key material!!
            </div>
            <div className="Key-input-row">
              <span className="Key-prompt">&gt; </span>
              <input
                className="Key-input"
                type="password"
                ref={(el) => el?.focus()}
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value.replace(/^0x/, "")); setKeyError(""); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && keyInput.length === 64) {
                    localStorage.setItem("swapchat_signerKey", keyInput);
                    swapChat.SignerKey = keyInput;
                    advanceSetup();
                  } else if (e.key === "Enter" && keyInput.length > 0) {
                    setKeyError("Key must be 64 hex characters");
                  }
                }}
                placeholder="64 character hex private key"
                maxLength={64}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            {keyError && <div className="Key-error">{keyError}</div>}
            <div className="Terms-hint">{keyInput.length}/64 characters</div>
          </div>
        </div>
      )}
      {setupStage === "batchId" && (
        <div className="Terms-screen" tabIndex={0}>
          <div className="Terms-content">
            <div className="Terms-title">Stamp Configuration</div>
            <div className="Terms-strapline">Enter the postage batch ID</div>
            <div className="Key-input-row">
              <span className="Key-prompt">&gt; </span>
              <input
                className="Key-input"
                type="text"
                ref={(el) => el?.focus()}
                value={batchInput}
                onChange={(e) => { setBatchInput(e.target.value.replace(/^0x/, "")); setBatchError(""); }}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && batchInput.length === 64) {
                    setBatchError("Validating...");
                    swapChat.BatchID = batchInput;
                    const signerKey = swapChat.SignerKey || localStorage.getItem("swapchat_signerKey") || "";
                    if (signerKey) {
                      swapChat.Swarm.useClientStamp(signerKey, batchInput, swapChat.StampDepth);
                    }
                    const valid = await swapChat.Swarm.validateStampBatch();
                    if (valid) {
                      localStorage.setItem("swapchat_batchId", batchInput);
                      advanceSetup();
                      setTimeout(() => focusTextbox(), 50);
                    } else {
                      setBatchError("Stamp batch is not valid or not usable");
                    }
                  } else if (e.key === "Enter" && batchInput.length > 0) {
                    setBatchError("Batch ID must be 64 hex characters");
                  }
                }}
                placeholder="64 character hex batch ID"
                maxLength={64}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            {batchError && <div className="Key-error">{batchError}</div>}
            <div className="Terms-hint">{batchInput.length}/64 characters</div>
          </div>
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
          <div className="Chat-header-left-logotext">SwapChat 3.0</div>
        </div>
        {connected === true && (
          <div className="Chat-header-right">
            <span className="Chat-header-connect-feedback">Connected</span>
            <span className={`Chat-is-connected${gatewayError ? " Chat-is-error" : ""}`}> * </span>
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
        {theme === "tron" && <span className="Chat-prompt-easter-egg">:) </span>}
        <textarea
          ref={messageTextarea}
          rows={1}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleTextareaKeydown}
          value={message}
          maxLength={2048}
        />
        <button ref={messageSendbutton} onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
