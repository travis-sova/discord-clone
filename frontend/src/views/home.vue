<script setup>
import homeNav from '../components/home-nav.vue';
import homeFooter from '../components/home-footer.vue';
</script>

<template>
    <homeNav />


    <div id="main" class="bg-[url(/BG-2025.png)] bg-no-repeat bg-cover bg-[#1a2081]">
        <div
            class="bg-[url(/Texture_Headline.webp)] bg-no-repeat bg-scroll bg-position-[100%_-33%] bg-size-[95.5%] h-auto">
            <div class="w-4/5 mx-auto pt-36 pb-32">
                <div class="flex mb-10">
                    <div class="a max-w-2/5 flex flex-col justify-center">
                        <div
                            class="bg-[url(/Set_1_10.webp)] transform-3d bg-no-repeat bg-cover h-48 block float-none absolute w-48 -mt-86 ml-96 animate-crown">
                        </div>
                        <h1 class="text-[3.5rem] leading-12 font-ginto-nord uppercase mb-2">Group chat that’s all fun &
                            games</h1>
                        <p class="text-xl leading-6.5">Discord is great for playing games and chilling with friends, or
                            even building a worldwide
                            community.
                            Customize your own space to talk, play, and hang out.</p>
                    </div>

                    <div
                        class="bg-[url(/Set_1_14.webp)] transform-3d bg-no-repeat bg-cover bg-center h-48 w-48 block float-none absolute animate-cup right-4 mt-20 overflow-hidden">
                    </div>
                    <img class="w-1/2" src="/CHARACTERS_FULL.webp">
                </div>

                <div class="flex justify-center">
                    <a class="btn btn-xl m-1 border-0 bg-white text-black rounded-xl hover:bg-plum-6 text-xl font-normal"
                        href="/download">
                        <svg width="24" height="24" viewBox="0 0 24 24" class="icon-2tQ9Jt">
                            <g fill="currentColor">
                                <path
                                    d="M17.707 10.708L16.293 9.29398L13 12.587V2.00098H11V12.587L7.70697 9.29398L6.29297 10.708L12 16.415L17.707 10.708Z">
                                </path>
                                <path
                                    d="M18 18.001V20.001H6V18.001H4V20.001C4 21.103 4.897 22.001 6 22.001H18C19.104 22.001 20 21.103 20 20.001V18.001H18Z">
                                </path>
                            </g>
                        </svg>
                        Download for windows
                    </a>
                    <button class="btn btn-xl border-0 m-1 rounded-xl relative overflow-hidden bg-brand group">
                        <span class="relative z-10 text-xl font-normal">Open discord in your browser</span>
                        <span
                            class="absolute inset-0 bg-linear-180 from-brand to-[#1f1d5d] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </button>
                </div>
            </div>
        </div>



        <div class="pt-36 pb-28 bg-[url(/Texture_2.webp)] bg-no-repeat relative bg-size-[93%]  bg-position-[100%_100%]">
            <div>
                <img src="/party_wumpus.gif" class="absolute block max-w-36 right-80 bottom-184">
                <div class="w-4/5 mx-auto bg-[url(/F-bg.png)] bg-no-repeat bg-cover backdrop-blur-sm rounded-[120px] bg-position-[65%]">
                    <div class="p-7">
                        <div class="flex columns-2 gap-8.5">
                            <video autoplay loop muted playsinline
                                class="rounded-[104px] w-full h-full object-cover aspect-auto">
                                <source src="/Discord_Websote_Refresh_Emojis2_EN-transcode.webm" type="video/webm">
                            </video>


                            <div class="flex flex-col max-w-96 justify-center">
                                <h2 class="mb-2.5 leading-8 text-4xl uppercase font-ginto-nord">MAKE YOUR GROUP CHATS
                                    MORE FUN</h2>
                                <p class="text-xl leading-6.5 pr-5">Use custom emoji, stickers, soundboard effects and
                                    more to add your personality to your
                                    voice, video, or text chat. Set your avatar and a custom status, and write your own
                                    profile to show up in chat your way.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="pt-36 pb-28 bg-[url(/Texture_3.webp)] bg-no-repeat">
            <div>
                <div
                    class="w-4/5 mx-auto bg-[url(/Featur-card.png)] bg-no-repeat bg-cover backdrop-blur-sm rounded-[120px]">
                    <div class="p-7">
                        <div class="flex columns-2 gap-8.5">
                            <div class="flex flex-col max-w-96 justify-center">
                                <h2 class="mb-2.5 leading-8 text-4xl uppercase font-ginto-nord">stream like you’re in
                                    the same room</h2>
                                <p class="text-xl leading-6.5 pr-5">High quality and low latency streaming makes it feel
                                    like you're hanging out on the couch with friends while playing a game, watching
                                    shows, looking at photos, or idk doing homework or something.</p>
                            </div>

                            <video autoplay loop muted playsinline
                                class="rounded-[104px] w-full h-full object-cover aspect-auto">
                                <source src="/Discord_Website_Refresh_EN-transcode.webm" type="video/webm">
                            </video>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="pt-36 pb-28 bg-[url(/Texture_4.webp)] bg-no-repeat bg-cover bg-position-[0_0]">
            <div>
                <img src="/Box.webp" class="absolute block right-44 -bottom-516 z-100 max-w-52">
                <div
                    class="w-4/5 mx-auto bg-[url(/F-card-3.png)] bg-no-repeat bg-cover backdrop-blur-sm rounded-[120px]">
                    <div class="p-7">
                        <div class="flex columns-2 gap-8.5">
                            <video autoplay loop muted playsinline
                                class="rounded-[104px] w-full h-full object-cover aspect-auto">
                                <source src="/Homepage_Hop-In_EN-transcode.webm" type="video/webm">
                            </video>


                            <div class="flex flex-col max-w-96 justify-center">
                                <h2 class="mb-2.5 leading-8 text-4xl uppercase font-ginto-nord">Hop in when you're free,
                                    no need to call</h2>
                                <p class="text-xl leading-6.5 pr-5">Easily hop in and out of voice or text chats without
                                    having to call or invite anyone, so your party chat lasts before, during, and after
                                    your game session.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex bg-[url(/line_1.png)] bg-no-repeat bg-cover bg-center h-36 items-center overflow-hidden">
            <div class="flex w-max shrink-0 basis-auto animate-marquee">
                <div class="flex gap-14 justify-start items-center shrink-0 pr-14"><img src="/discord-mark-white_2.webp"
                        loading="lazy" alt="" class="max-w-9 max-h-7">
                    <div class="font-ginto-nord font-bold text-6xl">talk</div><img src="/discord-mark-white_2.webp"
                        loading="lazy" alt="" class="max-w-9 max-h-7">
                    <div class="font-ginto-nord font-bold text-6xl">play</div><img src="/discord-mark-white_2.webp"
                        loading="lazy" alt="" class="max-w-9 max-h-7">
                    <div class="font-ginto-nord font-bold text-6xl">chat</div><img src="/discord-mark-white_2.webp"
                        loading="lazy" alt="" class="max-w-9 max-h-7">
                    <div class="font-ginto-nord font-bold text-6xl">hang out</div>
                </div>

                <div class="flex gap-14 justify-start items-center shrink-0  pr-14"><img
                        src="/discord-mark-white_2.webp" loading="lazy" alt="" class="max-w-9 max-h-7">
                    <div class="font-ginto-nord font-bold text-6xl">talk</div><img src="/discord-mark-white_2.webp"
                        loading="lazy" alt="" class="max-w-9 max-h-7">
                    <div class="font-ginto-nord font-bold text-6xl">play</div><img src="/discord-mark-white_2.webp"
                        loading="lazy" alt="" class="max-w-9 max-h-7">
                    <div class="font-ginto-nord font-bold text-6xl">chat</div><img src="/discord-mark-white_2.webp"
                        loading="lazy" alt="" class="max-w-9 max-h-7">
                    <div class="font-ginto-nord font-bold text-6xl">hang out</div>
                </div>
            </div>
        </div>

        <div class="pt-36 pb-28 bg-[url(/Texture_5.webp)] bg-no-repeat bg-position-[50%_0] bg-cover">
            <div>
                <div class="w-4/5 mx-auto bg-[url(/FEAT-C.png)] bg-no-repeat bg-cover backdrop-blur-sm rounded-[120px]">
                    <div class="p-7">
                        <div class="flex columns-2 gap-8.5">
                            <div class="flex flex-col max-w-96 justify-center">
                                <h2 class="mb-2.5 leading-8 text-4xl uppercase font-ginto-nord">See who's around to
                                    chill</h2>
                                <p class="text-xl leading-6.5 pr-5">See who's around, playing games, or just hanging
                                    out. For supported games, you can see what modes or characters your friends are
                                    playing and directly join up.</p>
                            </div>

                            <video autoplay loop muted playsinline
                                class="rounded-[104px] w-full h-full object-cover aspect-auto">
                                <source src="/Homepage_AroundToChill_EN-transcode.webm" type="video/webm">
                            </video>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="pt-36 pb-28 bg-[url(/Texture_6.webp)] bg-no-repeat bg-position-[100%_-5%] bg-size-[95%]">
            <div>
                <img src="/woman-top.webp" class="absolute block right-100 -bottom-979 z-100 max-w-52">
                <img src="/Men_1.webp" class="absolute block right-58 -bottom-1018 z-0 max-w-52">
                <div
                    class="w-4/5 mx-auto bg-[url(/fb_Feature-card.png)] bg-no-repeat bg-cover backdrop-blur-sm rounded-[120px] bg-position-[70%]">
                    <div class="p-7">
                        <div class="flex columns-2 gap-8.5">
                            <video autoplay loop muted playsinline
                                class="rounded-[104px] w-full h-full object-cover aspect-auto">
                                <source src="/Discord_Refresh_Activities_EN-transcode.webm" type="video/webm">
                            </video>


                            <div class="flex flex-col max-w-96 justify-center">
                                <h2 class="mb-2.5 leading-8 text-4xl uppercase font-ginto-nord">always have something to
                                    do together</h2>
                                <p class="text-xl leading-6.5 pr-5">Watch videos, play built-in games, listen to music,
                                    or just scroll together and spam memes. Seamlessly text, call, video chat, and play
                                    games, all in one group chat.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="pt-36 pb-28 bg-[url(/Texture_7.webp)] bg-no-repeat bg-position-[0_0] bg-size-[93%]">
            <div>
                <div class="w-4/5 mx-auto bg-[url(/F-c.png)] bg-no-repeat bg-cover backdrop-blur-sm rounded-[120px]">
                    <div class="p-7">
                        <div class="flex columns-2 gap-8.5">
                            <video autoplay loop muted playsinline
                                class="rounded-[104px] w-full h-full object-cover aspect-auto">
                                <source src="/Discord_Refresh_Platforms-transcode.webm" type="video/webm">
                            </video>


                            <div class="flex flex-col max-w-96 justify-center">
                                <h2 class="mb-2.5 leading-8 text-4xl uppercase font-ginto-nord">wherever YOU GAME, HANG
                                    OUT HERE</h2>
                                <p class="text-xl leading-6.5 pr-5">On your PC, phone, or console, you can still hang
                                    out on Discord. Easily switch between devices and use tools to manage multiple group
                                    chats with friends.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="pt-36 pb-0 bg-[url(/Texture_7.webp)] bg-no-repeat bg-cover bg-[#20269a00] bg-postition-[50%_-20%]">
            <div>
                <h2 class="text-5xl font-ginto-nord font-bold flex justify-center text-center">
                    YOU CAN'T SCROLL ANYMORE.<br>
                    BETTER GO CHAT.
                </h2>

                <div class="flex justify-center">
                    <a class="btn btn-xl m-1 border-0 bg-white text-black rounded-xl hover:bg-plum-6 text-xl font-normal"
                        href="/download">
                        <svg width="24" height="24" viewBox="0 0 24 24" class="icon-2tQ9Jt">
                            <g fill="currentColor">
                                <path
                                    d="M17.707 10.708L16.293 9.29398L13 12.587V2.00098H11V12.587L7.70697 9.29398L6.29297 10.708L12 16.415L17.707 10.708Z">
                                </path>
                                <path
                                    d="M18 18.001V20.001H6V18.001H4V20.001C4 21.103 4.897 22.001 6 22.001H18C19.104 22.001 20 21.103 20 20.001V18.001H18Z">
                                </path>
                            </g>
                        </svg>
                        Download for windows
                    </a>
                </div>
            </div>

            <div class="mx-auto -mb-5 max-w-5xl relative">
                <img src="/Footer.webp" class="relative z-1">

                <img src="/Wumpus.webp" class="absolute block right-85 -bottom-30 z-100 max-w-86">
                <img src="/Wumpus_leaf.webp" class="absolute block right-84 bottom-67 z-100 max-w-86 animate-leaf">
            </div>

        </div>
    </div>

    <homeFooter />
</template>