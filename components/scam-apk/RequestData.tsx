'use client'

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"



export default class RequestData {
    Url: string;
    Title: string;
    loading: boolean = false;
    method: string = "GET";
    data: any = null;
    finished: boolean = false;
    status: number = 0;

    constructor(Url: string, Title?: string, method?: string, data?: any) {
        this.Url = Url;
        this.Title = Title ?? "Data";
        this.loading = false;
        this.method = method ?? "GET";
        this.data = data ?? null;

    }

    public async req() {
        await new Promise(resolve => setTimeout(resolve,1000));
        this.loading = true;
        const url = this.Url;
        if (this.method === "GET") {
            const response = await fetch(url);
            const data = await response.json();
            this.status = response.status;
            if (response.ok) {
                this.data = data;
                
            } else {
                this.data = {
                    "status": response.status,
                    "error": "Failed to get information from Telegram API. Bot Description : " + data.description
                }
                
            }
        } else {
            const response = await fetch(url, {
                method: this.method,
                body: this.data
            });
            const data = await response.json();
            if (response.ok) {
                this.data = data;
            } else {
                this.data = {
                    "status": response.status,
                    "error": "Failed to get information from Telegram API. Bot Description : " + data.description
                }
            }
        }
        this.loading = false;
        this.finished = true;
    }

}



//   export default function RequestData({ Url,Title,load,waitLoadFunc }: { Url: string, Title?: string, load?: boolean,waitLoadFunc?: Function}) {
//     const [loading, setLoading] = useState(false);
//     const [data, setData] = useState<any>(null);
//     const requestData = async () => {
//         setLoading(true);
//         //https://api.telegram.org/botToken/getMe
//         const url = Url;
//         const response = await fetch(url);
//         const data = await response.json();
//         if (response.ok) {
//             setData(data);
//         } else {
//             setData({
//                 "error": "Failed to get information from Telegram API. Bot Description : " + data.description
//             })
//         }
//         setLoading(false);
//     }

//     //on componetn load
//     if(load){
//         requestData()
//     }

//     const generateTableFromJson = (json: any) => {
//         return (
//             <Table>
//                 <TableCaption>{Title??"Data"}</TableCaption>
//                 <TableHead>
//                     <TableRow>
//                         <TableHeader>Key</TableHeader>
//                         <TableHeader>Value</TableHeader>
//                     </TableRow>
//                 </TableHead>
//                 <TableBody>
//                     {Object.keys(json).map((key, index) => {
//                         return (
//                             <TableRow key={index}>
//                                 <TableCell>{key}</TableCell>
//                                 <TableCell>{json[key]}</TableCell>
//                             </TableRow>
//                         )
//                     })}
//                 </TableBody>
//             </Table>
//         )
//     }

//     return (
//         <div>
//             {loading && (
//                     <div className="loader-2 w-full"></div>
//                 )}
//             {data && generateTableFromJson(data)}
//         </div>
//     )
//   }