'use client'

import {  useState,useEffect } from "react";
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import RequestData from "@/components/scam-apk/RequestData"


//make GetInformationButton component with props BotToken
export default function GetInformationButton({ BotToken, ChatId }: { BotToken: string, ChatId?: string }) {
    const [request, setRequest] = useState<RequestData[]>([])

    useEffect(() => {
    setRequest([
        new RequestData(`https://api.telegram.org/${BotToken}/getMe`, "Bot Information"),
        new RequestData(`https://api.telegram.org/${BotToken}/getChat?chat_id=${ChatId}`, "Chat Information"),
    ]);
    },[BotToken,ChatId])

    //smooth scroll to the bottom of the page
    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        })
    }

    const getInformation = async () => {
        
        for (let i = 0; i < request.length; i++) {
            request[i].loading = true;
            setRequest([...request]);

        }
        await new Promise(resolve => setTimeout(resolve,100));
        scrollToBottom();
        for (let i = 0; i < request.length; i++) {
            await request[i].req();
            setRequest([...request]);
            await new Promise(resolve => setTimeout(resolve,100));
            scrollToBottom();

        }
    }

    const cleanKeys = (key:string) => {
        return key.replace(/_/g, " ").replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
    }

    const generateTableFromJson = (json: any,caption:string) => {
        return (
            <div className="w-full p-2">
                 <p className="font-bold text-xl">{caption}</p>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.keys(json).map((key, index) => {
                            return (
                                <TableRow key={index}>
                                    <TableCell>{cleanKeys(key)}</TableCell>
                                    <TableCell>{json[key].toString()}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col">
                <Button onClick={getInformation} >
                    Get Information
                </Button>
                <div className="flex flex-col space-y-4">
                    {request.map((req, index) => (
                        <div key={index}>
                            
                            {req.loading && (
                                <div className="p-2">
                                    <p className="font-bold text-xl">{req.Title}</p>
                                    <div className="loader-2 w-full"></div>
                                </div>
                            )}
                            {(req.data && req.data.result) && generateTableFromJson(req.data.result, req.Title)}
                            {(req.data && req.data.error) && (
                                <div className="p-2">
                                    <p className="font-bold text-xl">{req.Title}</p>
                                    <p>{req.data.error}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}