'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"

import { Label } from "@/components/ui/label"
import RequestData from "@/components/scam-apk/RequestData"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"


//make GetInformationButton component with props BotToken
export default function SpamBotButton({ BotToken, ChatId }: { BotToken: string, ChatId?: string }) {
    const [spamCount, setSpamCount] = useState<number>(0);
    const [spamMessage, setSpamMessage] = useState<string>("");
    const [spamFile, setSpamFile] = useState<File | null>(null);
    const [request, setRequest] = useState<RequestData[]>([])
    const [sendFile, setSendFile] = useState<boolean>(false);
    const [sending, setSending] = useState<boolean>(false);
    const [asyncReq, setAsyncReq] = useState<boolean>(false);

    useEffect(() => {
        updateRequset();
    }, [BotToken, ChatId, spamMessage, spamFile, sendFile])

    //smooth scroll to the bottom of the page
    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        })
    }

    //smooth scroll to id
    const scrollToId = (id: string) => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: "smooth" });
    }

    const checkSpamFile = () => {
        // check spam file is photo, video or document
        if (spamFile) {
            if (spamFile.type.includes("image")) {
                return "photo";
            } else if (spamFile.type.includes("video")) {
                return "video";
            } else {
                return "document";
            }
        }
    }

    //parse message to urlencode
    const urlencode = (msg: string) => {
        return encodeURIComponent(msg);
    }

    const updateRequset = () => {
        setSending(false);
        const spamType = sendFile ? checkSpamFile() : "text";
        const r = [];
        for (let i = 0; i < spamCount; i++) {
            if (spamType === "text") {
                r.push(new RequestData(`https://api.telegram.org/${BotToken}/sendMessage?chat_id=${ChatId}&parse_mode=markdown&text=${urlencode(spamMessage)}`, "Text Spam"));
            } else if (spamType === "photo") {
                const n = new RequestData(`https://api.telegram.org/${BotToken}/sendPhoto?chat_id=${ChatId}`, "Photo Spam");
                n.method = "POST";
                n.data = new FormData();
                n.data.append("photo", spamFile!);
                r.push(n);
            } else if (spamType === "video") {
                const n = new RequestData(`https://api.telegram.org/${BotToken}/sendVideo?chat_id=${ChatId}`, "Video Spam");
                n.method = "POST";
                n.data = new FormData();
                n.data.append("video", spamFile!);
                r.push(n);
            } else if (spamType === "document") {
                const n = new RequestData(`https://api.telegram.org/${BotToken}/sendDocument?chat_id=${ChatId}`, "Document Spam");
                n.method = "POST";
                n.data = new FormData();
                n.data.append("document", spamFile!);
                r.push(n);
            }

            setRequest(r);

        }
    }


    const sendSpam = async () => {
        // updateRequset();
        setSending(true);
        for (let i = 0; i < request.length; i++) {
            request[i].loading = true;
            setRequest([...request]);

        }
        await new Promise(resolve => setTimeout(resolve, 100));
        scrollToId("result");
        if (asyncReq) {
            for (let i = 0; i < request.length; i++) {
                await request[i].req();
                setRequest([...request]);
                await new Promise(resolve => setTimeout(resolve, 100));

            }
        } else {
            for (let i = 0; i < request.length; i++) {
                request[i].refresh = () => { setRequest([...request]) };
                request[i].req();
            }
        }
    }


    return (
        <div className="flex flex-col  my-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button >Spam Bot</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-screen-md">
                    <DialogHeader>
                        <DialogTitle>Spam Telegram Bot</DialogTitle>
                        <DialogDescription>
                            Send message or file to scammer Bot, Telegram Bot have limit to send 30 message per second.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="file">Spam Count</Label>
                            <Input type="number" id="file" value={spamCount} onChange={(e) => { setSpamCount(parseInt(e.target.value)) }} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="async-req" onChange={
                                (e) => {
                                    setAsyncReq(!asyncReq)
                                }
                            } />
                            <label
                                htmlFor="async-req"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Async Request
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="airplane-mode">Text</Label>
                            <Switch id="airplane-mode" onClick={
                                (e) => {
                                    setSendFile(!sendFile)
                                }
                            } />
                            <Label htmlFor="airplane-mode">File</Label>
                        </div>
                        {
                            sendFile ?
                                <div>
                                    <Label htmlFor="file">File</Label>
                                    <Input type="file" id="file" onChange={(e) => { setSpamFile(e.target.files![0]) }} />
                                </div>
                                :
                                <div>
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea id="message" value={spamMessage} onChange={(e) => { setSpamMessage(e.target.value ?? "") }} />
                                </div>
                        }

                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="submit" onClick={sendSpam}>Send</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Accordion type="single" collapsible>
                {request.map((req, index) => (
                    <>
                        {sending && (
                            <AccordionItem value={"spam-status-" + index.toString()} key={index} className="w-full">
                                <AccordionTrigger className="w-full text-start">
                                    <div className="p-2 w-full">
                                        <p className="font-bold text-xl">
                                            {req.Title}
                                            {req.status !== 0 && (
                                                <span className={
                                                    req.status === 200 ? "text-green-500" : "text-red-500"
                                                }> {req.status}</span>
                                            )}
                                        </p>
                                        {req.loading && (
                                            <div className="loader-2 w-full"></div>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {(req.data && req.data.result) && (
                                        <div className="p-2">
                                            {/* pre code */}
                                            <pre className="bg-gray-100 p-2 rounded-md">
                                                {JSON.stringify(req.data.result, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    {(req.data && req.data.error) && (
                                        <div className="p-2">
                                            <p>{req.data.error}</p>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        )}
                    </>

                ))}

            </Accordion>
            {/* <div className="flex flex-col" id="result-spam">
                {request.map((req, index) => (
                    <div key={index}>
                        {req.loading && (
                            <div className="p-2">
                                <p className="font-bold text-xl">{req.Title}</p>
                                <div className="loader-2 w-full"></div>
                            </div>
                        )}
                        {(req.data && req.data.result) && (
                            <div className="p-2">
                                <p className="font-bold text-xl">{req.Title}</p>
                                <pre className="bg-gray-100 p-2 rounded-md">
                                    {JSON.stringify(req.data.result, null, 2)}
                                </pre>
                            </div>
                        )}
                        {(req.data && req.data.error) && (
                            <div className="p-2">
                                <p className="font-bold text-xl">{req.Title}</p>
                                <p>{req.data.error}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div> */}
        </div>
    )
}