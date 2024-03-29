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

    wsServer.on("connection", socket =>
    {
        new Client(socket, server);
    });
    console.log(`forge local server start on port ${option.port}`);
})();