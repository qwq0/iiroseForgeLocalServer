import { serverBinder } from "./ruleBinder.js";
import * as fs from "fs/promises";
import * as path from "path";
import { onlineClinetSet } from "./Client.js";

/**
 * @param {string} srcPathName
 */
function pathLegitimization(srcPathName)
{
    let pathPart = srcPathName.split("/");
    return (pathPart.map(part =>
    {
        if (!(/^[a-zA-Z0-9]+$/.test(part)))
            throw "file path error";
        return part;
    })).join("/");
}

serverBinder.setQueryProcessors({
    writeFile: async (/** @type {{ filePath: string, content: string }} */e, client) =>
    {
        let pathName = pathLegitimization(e.filePath);
        await fs.writeFile(path.join("./data/", pathName), e.content, { encoding: "utf-8" });
        return { ok: true };
    },
    readFile: async (/** @type {{ filePath: string }} */e, client) =>
    {
        let pathName = pathLegitimization(e.filePath);
        try
        {
            let content = await fs.readFile(path.join("./data/", pathName), { encoding: "utf-8" });
            return {
                exist: true,
                content: content
            };
        }
        catch (err)
        {
            return {
                exist: false,
                content: ""
            };
        }
    },
    sendBroadcast: (/** @type {{ content: string }} */e, client) =>
    {
        onlineClinetSet.forEach(o =>
        {
            if (o.client != client)
                o.client.sendTrigger("broadcast", {
                    content: e.content
                });
        });
        return { ok: true };
    },
});