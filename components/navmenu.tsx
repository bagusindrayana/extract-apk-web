'use client'
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

import * as React from "react"

import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BsMoonStarsFill } from "react-icons/bs";
import { BsSunFill } from "react-icons/bs";
import { Label } from "@/components/ui/label"

export default function NavMenu() {
    const { setTheme } = useTheme()
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
            <div className="hidden md:flex items-center">
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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" id="changeThemeMobile">
                            <BsSunFill className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <BsMoonStarsFill className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            Light
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            System
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
                                    <FaGithub className="text-2xl mx-2" /> <span>Repository</span>
                                </a>
                            </MenubarItem>
                            <MenubarItem>
                                <div className="flex mx-1 content-center items-center align-middle">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" id="changeThemeMobile">
                                                <BsSunFill className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                                <BsMoonStarsFill className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                                <span className="sr-only">Toggle theme</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setTheme("light")}>
                                                Light
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                                                Dark
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setTheme("system")}>
                                                System
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Label className="ml-1" htmlFor="changeThemeMobile">Theme</Label>
                                </div>
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