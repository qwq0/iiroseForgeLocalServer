import { QwQSocketServer, QwQSocketServerClient } from "qwq-socket";
import { JSOBin } from "jsobin";
import { serverBinder } from "./ruleBinder.js";

let textDecoder = new TextDecoder("utf-8");
let textEncoder = new TextEncoder();
let jsob = new JSOBin();

/**
 * @type {Set<Client>}
 */
export let onlineClinetSet = new Set();

/**
 * 客户端实例
 */
export class Client
{
    /**
     * websocket实例
     * @type {import("ws").WebSocket}
     */
    socket = null;

    /**
     * qwqsocket客户端上下文
     * @type {QwQSocketServerClient}
     */
    client = null;

    /**
     * qwqsocket操作器上下文
     */
    operator = null;

    /**
     * 使用jsobin作为数据包发送格式
     * 否则使用json作为发送格式
     * @type {boolean}
     */
    sendJsobin = false;

    /**
     * @param {import("ws").WebSocket} socket
     * @param {QwQSocketServer} server
     */
    constructor(socket, server)
    {
        this.socket = socket;
        socket.binaryType = "arraybuffer";

        this.client = server.createClient();
        serverBinder.applyToInstance(this.client);
        this.client.sendData.add(e =>
        {
            if (socket)
            {
                if (this.sendJsobin)
                {
                    let prefixBuffer = textEncoder.encode(e.prefix);
                    let jsobBuffer = jsob.encode(e.body);

                    let packageBuffer = new Uint8Array(prefixBuffer.length + 1 + jsobBuffer.length);
                    packageBuffer.set(prefixBuffer, 0);
                    packageBuffer.set(jsobBuffer, prefixBuffer.length + 1);

                    socket.send(packageBuffer);
                }
                else
                    socket.send(e.prefix + "\0" + JSON.stringify(e.body));
            }
        });

        socket.on("message", (rawData, isBinary) =>
        {
            try
            {
                if (isBinary)
                {
                    let data = new Uint8Array(/** @type {ArrayBuffer} */(rawData));
                    let separatorIndex = data.indexOf(0);
                    if (this.client)
                    {
                        if (separatorIndex != -1)
                            this.client.receiveData(
                                textDecoder.decode(data.subarray(0, separatorIndex)),
                                jsob.decode(data.subarray(separatorIndex + 1))
                            );
                        else
                            this.client.receiveData(
                                textDecoder.decode(data),
                                undefined
                            );
                    }
                    else
                        this.close();
                }
                else
                {
                    let data = textDecoder.decode(/** @type {ArrayBuffer} */(rawData));
                    let separatorIndex = data.indexOf("\0");
                    if (this.client)
                    {
                        if (separatorIndex != -1)
                            this.client.receiveData(
                                data.slice(0, separatorIndex),
                                JSON.parse(data.slice(separatorIndex + 1))
                            );
                        else
                            this.client.receiveData(
                                data,
                                undefined
                            );
                    }
                    else
                        this.close();
                }
            }
            catch (err)
            {
                console.error("QwQ-socket error:", err);
            }
        });

        socket.on("close", () =>
        {
            this.close();
        });

        socket.on("error", () =>
        {
            this.close();
        });

        onlineClinetSet.add(this);
    }


    /**
     * 断开连接
     */
    close()
    {
        if (this.socket)
        {
            this.socket.close();
            this.socket = null;
        }
        if (this.client)
        {
            this.client.sendData.removeAll();
            this.client = null;
        }
        if (this.operator)
            this.operator = null;
        onlineClinetSet.delete(this);
    }
}