'use client'
import { useState, useEffect } from "react";
import { ApkLoader } from '../../lib/ApkLoader';
import { ImageIcon } from "@/lib/AndroidImages";
import { Button } from "@/components/ui/button"
import { FiUpload } from "react-icons/fi";
import { FcAndroidOs } from "react-icons/fc";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import GetInformationButton from "@/components/scam-apk/GetInformationButton";
import SpamBotButton from "@/components/scam-apk/SpamBotButton";
import LogoutBotButton from "@/components/scam-apk/LogoutBotButton";


interface BotTokenData {
    botToken: string;
    chatId?: string;
}

export default function ScamApkPage() {
    const [apkLoader, setApkLoader] = useState<ApkLoader | null>();

    const [selectedFile, setSelectedFile] = useState<File | null>();
    const [packageName, setPackageName] = useState<string>('');
    const [labelName, setLabelName] = useState<string>('');
    const [version, setVersion] = useState<string>('');
    const [size, setSize] = useState<number>(0);

    const [loading, setLoading] = useState(false);

    const [listBotToken, setListBotToken] = useState<BotTokenData[]>([]);
    let linkArray: string[] = [];

    const exampleApks = [
        "UNDANGAN PERNIKAHAN.apk",
    ]

    useEffect(() => {
        if (apkLoader) {
            loadApk();
        }
    }, [apkLoader]);


    const handleDrag = function (e: React.DragEvent<HTMLLabelElement>) {
        e.preventDefault();
        e.stopPropagation();

    };

    // triggers when file is dropped
    const handleDrop = function (e: React.DragEvent<HTMLLabelElement>) {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const file = e.target.files[0];
        handleFile(file);
    };

    const loadRemoteFile = async (url: string) => {
        setLoading(true);
        try {
            url = url.replace(".apk", ".archive")
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Failed to load remote file");
            }

            const blob = await response.blob();
            const file = new File([blob], url, { type: "application/vnd.android.package-archive" });
            handleFile(file);
        } catch (error) {
            //console.error(error);
            alert("Failed to load remote file");
            setLoading(false);
        }
    }

    const handleFile = function (file: File) {
        if (file) {
            const ext = file.name.split('.').pop();
            if (file.size > 50 * 1024 * 1024) {
                alert("File too large, max 50mb");
            } else if (file.type.toLowerCase() == "application/vnd.android.package-archive" || ext?.toLowerCase() == "apk") {
                setSelectedFile(file);
                setSize(file.size);
                try {
                    const n = new ApkLoader(file);
                    setApkLoader(n);
                } catch (error) {
                    //console.error(error);
                    alert("Failed to load APK file");
                }
            } else {
                alert("Invalid file type, only APK file allowed, your file is " + file.type);
            }
        }

    }

    //load apk file with jszip, find AndroidManifest.xml, and parse it
    const loadApk = async () => {

        if (!apkLoader) {
            alert("Failed to load APK file");
            return;
        }
        setLoading(true);
        //await 1 seconds
        await new Promise(resolve => setTimeout(resolve, 1000));
        await apkLoader.load();
        if (apkLoader.manifest) {
            try {
                setPackageName(apkLoader.manifest.package);
                if (typeof apkLoader.manifest.applicationLabel === 'string') {
                    setLabelName(apkLoader.manifest.applicationLabel);
                } else {
                    setLabelName(apkLoader.resourceTable?.getResource(apkLoader.manifest.applicationLabel) || '');
                }

                setVersion(apkLoader.manifest.versionName);

            } catch (error) {
                //console.error(error);
                alert("Failed to load XML data");
            }



            try {
                const links = await apkLoader.getLinks();
                // setLinkArray(links);
                linkArray = links;
            } catch (error) {
                //console.error(error);
                alert("Failed to load link data");
            }
            await findBotToken();

        } else {
            alert("Failed to load data inside APK file");
        }
        setLoading(false);
    };

    const searchLink = (token: string) => {
        //loop linkArray and if contain token, return the link
        const link = linkArray.find((link) => {
            return link.includes(token);
        });
        return link;

    }

    const findBotToken = async () => {
        //botxxxxxxxxxx:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        const botTokenRegex = /bot\d+:[\w-]+/g;
        const regex = new RegExp(botTokenRegex);
        const botToken = await apkLoader?.customSearch(regex);
        if (botToken) {
            //array unique
            const uniqueBotToken = Array.from(new Set(botToken));

            const BotTokenData = uniqueBotToken.map((token) => {
                const link = searchLink(token);
                //get query chat_id
                let chatId = undefined;
                if (link) {
                    const url = new URL(link);
                    const searchParams = new URLSearchParams(url.search);
                    chatId = searchParams.get("chat_id") || "";
                }
                console.log(chatId);
                return {
                    botToken: token,
                    chatId: chatId
                }
            });
            setListBotToken(BotTokenData);
        } else {
            alert("Failed to find bot token");
        }
    }


    return (
        <div className="w-full py-12 height-content">
            <div className="container flex flex-col gap-4 px-4 md:px-6">
                <div className="grid gap-2">
                    <h1 className="text-3xl font-bold">Extract Spam APK</h1>
                    <p className="max-w-[800px] text-gray-500 md:text-base/relaxed dark:text-gray-400">
                        Upload APK file to extract the data. all process is done in client side, no data will be sent to server.
                    </p>
                    <p className="text-red-500">
                        will extract and search for the telegram bot token from within the APK, after that it will request the telegram bot API to get bot and user information, and will spam or force the bot to log out or be turned off. only work if bot token store as plain text in classes.dex
                    </p>
                    <p>
                        please be aware of the file size,max file size is 50MB, but recomended file size is less than 20MB or your browser will freeze or crash.
                    </p>
                </div>

                <div className="grid gap-2">
                    <h3 className="text-lg font-bold">Example APK</h3>
                    <div className="grid gap-2 md:grid-cols-3">
                        {
                            exampleApks.map((apk, index) => {
                                return (
                                    <Button key={index} size="sm" onClick={() => {
                                        loadRemoteFile(`/examples/scam-apk/${apk}`);
                                    }}>{apk}</Button>
                                )
                            })
                        }
                    </div>
                </div>

                <div className="grid gap-4">
                    <label onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className="border-2 border-dashed rounded-lg grid h-[200px] items-center w-full border-gray-200 dark:border-gray-800">
                        <input onChange={handleFileChange} accept="application/vnd.android.package-archive,.apk" type="file" className="cursor-pointer relative hidden opacity-0 w-full h-full p-20 z-50" />
                        <div className="flex flex-col gap-1.5 items-center justify-center text-center">
                            {(selectedFile === null || selectedFile === undefined) ? (
                                <>
                                    <FiUpload className="w-10 h-10" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Drag and drop your file here or
                                        <Button size="sm" className="mx-2" onClick={
                                            () => {
                                                (document.querySelector('input[type="file"]') as HTMLInputElement)?.click();
                                            }
                                        }>Browse</Button>
                                    </p>
                                </>
                            ) : (
                                <>
                                    <FcAndroidOs className="w-10 h-10" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {selectedFile?.name}
                                    </p>
                                </>
                            )}
                        </div>
                    </label>

                </div>
                <div className="border rounded-lg border-gray-200 dark:border-gray-800">
                    {
                        loading ? (
                            <div className="flex flex-col justify-center items-center py-4 w-full text-center">
                                <div className="loader"></div>
                                <p>Loading....</p>
                            </div>
                        ) : ("")
                    }

                    {
                        packageName !== '' || labelName !== "" || version !== "" ? (
                            <>
                                <div className="grid gap-2 p-4">
                                    <h3 className="text-lg font-bold">Extracted Data</h3>
                                    <div className="grid gap-2">
                                        <div className="grid md:grid-cols-2 gap-2">
                                            <div className="font-bold">Label Name</div>
                                            <div>{labelName}</div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-2">
                                            <div className="font-bold">Package Name</div>
                                            <div>{packageName}</div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-2">
                                            <div className="font-bold">Version</div>
                                            <div>{version}</div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-2">
                                            <div className="font-bold">File Size</div>
                                            <div>{size} bytes / {(size / 1000000).toFixed(2)} MB</div>
                                        </div>
                                    </div>
                                </div>
                                <hr />
                                <div className="w-full my-3 p-4">
                                    <h4 className="font-bold text-2xl">Bot Token</h4>
                                    {
                                        listBotToken.length > 0 ? (
                                            <Accordion type="single" collapsible>
                                                {
                                                    listBotToken.map((data, index) => {
                                                        return (
                                                            <AccordionItem value={"item-" + index.toString()} key={index}>
                                                                <AccordionTrigger className="overflow-x-auto">
                                                                    <p className="underline text-blue-500">{data.botToken}</p>
                                                                </AccordionTrigger>
                                                                <AccordionContent>
                                                                    <div className="flex flex-col">
                                                                        <GetInformationButton BotToken={data.botToken} ChatId={data.chatId}></GetInformationButton>
                                                                        <SpamBotButton BotToken={data.botToken} ChatId={data.chatId}></SpamBotButton>
                                                                        <LogoutBotButton BotToken={data.botToken}></LogoutBotButton>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        )
                                                    })
                                                }

                                            </Accordion>
                                        ) : (
                                            <div className="grid gap-2 p-4">
                                                <h3 className="text-lg font-bold">Bot Token</h3>
                                                <p>Bot token not found</p>
                                            </div>
                                        )
                                    }
                                </div>

                            </>

                        ) : ("")
                    }


                </div>
            </div>
        </div>
    )
}
