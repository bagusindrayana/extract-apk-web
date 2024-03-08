'use client'
import { Inter } from "next/font/google";
import { FaGithub } from "react-icons/fa";
import { TiThMenu } from "react-icons/ti";
import { useState } from "react";
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger,
} from "@/components/ui/menubar"

export default function NavMenu() {
    const menus = {
        "/": "Home",
        "/scam-apk": "SpamScam APK",
    };
    const [open, setOpen] = useState(false);

    return (

        <div className="flex justify-between items-center bg-gray-800 p-4">
            <div className="flex items-center">

                <h1 className="text-2xl text-white">Extract APK Data</h1>

            </div>

            {/* responsive menu */}
            <div className="hidden md:flex">
                {Object.entries(menus).map(([href, label]) => (
                    <a
                        key={href}
                        href={href}
                        className="mx-2 text-white underline hover:no-underline"
                    >
                        {label}
                    </a>
                ))}
                <a className="mx-2" href="https://github.com/bagusindrayana/extract-apk-web">
                    <FaGithub className="text-white text-2xl" />
                </a>
            </div>

            {/* hamburger menu for mobile */}
            <div className="md:hidden">

                <Menubar>
                    <MenubarMenu>
                        <MenubarTrigger>
                            <TiThMenu className="text-2xl"></TiThMenu >
                        </MenubarTrigger>
                        <MenubarContent>
                            {Object.entries(menus).map(([href, label]) => (
                                <MenubarItem key={href}>
                                    <a href={href}>{label}</a>
                                </MenubarItem>
                            ))}
                            <MenubarSeparator />
                            <MenubarItem>
                                <a className="mx-1 flex" href="https://github.com/bagusindrayana/extract-apk-web">
                                    <FaGithub className="text-2xl mr-1" /> Repository
                                </a>
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                </Menubar>
            </div>

            {/* responsive menu */}
            {open && (
                <div className="md:hidden">
                    {Object.entries(menus).map(([href, label]) => (
                        <a
                            key={href}
                            href={href}
                            className="block text-white"
                        >
                            {label}
                        </a>
                    ))}
                </div>
            )}




        </div>
    )
}