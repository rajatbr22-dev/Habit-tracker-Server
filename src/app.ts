import { Elysia } from "elysia";
import swagger from "@elysiajs/swagger";
import jwt from "@elysiajs/jwt";

export const app = new Elysia()

    // .use(
    //     swagger({

    //         documentation: {
    //             info: {

    //                 title: "HRMS API",
    //                 version: "1.0.0",
    //                 description: "HR Management System API",

    //             },

    //             components: {

    //                 securitySchemes: {

    //                     bearerAuth: {

    //                         type: "http",
    //                         scheme: "bearer",
    //                         bearerFormat: "JWT",

    //                     },
    //                 },
    //             },

                
    //             security: [
    //                 {
    //                     bearerAuth: [],
    //                 },
    //             ],
    //         },

    //     })
    // )

    .use(
        swagger({

            documentation: {

                info: {

                    title: "Habit Tracker",
                    version: "1.0.0",
                    
                },

                components: {

                    securitySchemes: {

                        bearerAuth: {
                            type: "http",
                            scheme: "bearer",
                            bearerFormat: "JWT",
                            description: "Paste ONLY the JWT token. Do NOT include 'Bearer ' prefix."
                        },

                    },
                },
                security: [{ bearerAuth: [] }],
            },
        })
    )


    .use(

        jwt({

            name: "jwt",
            secret: process.env.JWT_SECRET!,
            exp: "24h",

        })

    );

export type App = typeof app;