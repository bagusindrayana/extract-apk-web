'use client'

import { Button } from "@/components/ui/button"
import RequestData from "@/components/scam-apk/RequestData"
import { useEffect, useState } from "react"


export default function LogoutBotButton({ BotToken }: { BotToken: string }) {
    const [request, setRequest] = useState<RequestData[]>([])
    
    const [sending, setSending] = useState<boolean>(false);

    useEffect(() => {
        setSending(false);
        setRequest([
            new RequestData(`https://api.telegram.org/${BotToken}/close`, "Close Bot Session"),
            new RequestData(`https://api.telegram.org/${BotToken}/logOut`, "Log Out Bot"),
        ]);
    }, [BotToken])

    const logoutBot = async () => {
        setSending(true);
        for (let i = 0; i < request.length; i++) {
            request[i].loading = true;
            setRequest([...request]);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        for (let i = 0; i < request.length; i++) {
            await request[i].req();
            setRequest([...request]);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return (
        <>
            <div className="flex flex-col my-2">
                <Button onClick={logoutBot} >
                    Close & Log Out Bot
                </Button>
                {sending && (
                    <div className="flex flex-col space-y-4" id="result-information">
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
                                    <p className="font-bold text-xl">{req.Title} {req.status !== 0 && (
                                        <span className={
                                            req.status === 200 ? "text-green-500" : "text-red-500"
                                        }> {req.status}</span>
                                    )}</p>
                                    <p>{req.data.result.toString()}</p>
                                </div>

                            )}
                            {(req.data && req.data.error) && (
                                <div className="p-2">
                                    <p className="font-bold text-xl">{req.Title} {req.status !== 0 && (
                                        <span className={
                                            req.status === 200 ? "text-green-500" : "text-red-500"
                                        }> {req.status}</span>
                                    )}</p>
                                    <p>{req.data.error}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                )}
            </div>
        </>
    )
}