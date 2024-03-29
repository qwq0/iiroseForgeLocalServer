import * as ws from "ws";
import * as fs from "fs/promises";
import { QwQSocketServer } from "qwq-socket";
import { serverBinder } from "./ruleBinder.js";
import { JSOBin } from "jsobin";
import { Client } from "./Client.js";
import "./listener.js";

const optionFilePath = "./option.json";
let textEncoder = new TextEncoder();
let textDecoder = new TextDecoder();
let jsob = new JSOBin();

(async () =>
{
    /** @type {{ port: number }} */
    let option = JSON.parse(await fs.readFile(optionFilePath, { encoding: "utf-8" }));
    let wsServer = new ws.WebSocketServer({
        port: option.port
    });

    let server = new QwQSocketServer();
    serverBinder.applyToInstance(server);

    wsServer.on("connection", (socket, request) =>
    {
        let url = String(request.url);
        if (!url.endsWith("/forgeLocalServer"))
        {
            socket.close();
            return;
        }
        console.log("client connect");
        new Client(socket, server);
    });
    console.log(`forge local server start on port ${option.port}`);
})();