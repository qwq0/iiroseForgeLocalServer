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
        if (!(/^[a-zA-Z0-9\.]+$/.test(part)))
            throw "file path error";
        return part;
    })).join("/");
}

serverBinder.setQueryProcessors({
    writeFile: async (/** @type {{ filePath: string, content: string }} */e, client) =>
    {
        let pathName = path.join("./data/", pathLegitimization(e.filePath));
        try
        {
            await fs.mkdir(path.dirname(pathName), { recursive: true });
            await fs.writeFile(pathName, e.content, { encoding: "utf-8" });
            return { ok: true };
        }
        catch (err)
        {
            console.error("write file error:", err);
            return { ok: false };
        }
    },
    traversalWriteJson: async (/** @type {{ filePath: string, deleteTree: string, json: string }} */e, client) =>
    {
        let pathName = path.join("./data/", pathLegitimization(e.filePath));
        try
        {
            let originalJson = "";
            try
            {
                originalJson = await fs.readFile(pathName, { encoding: "utf-8" });
            }
            catch (err)
            {
            }
            let originalObj = (originalJson != "" ? JSON.parse(originalJson) : {});

            let deleteTree = (e.deleteTree != "" ? JSON.parse(e.deleteTree) : null);
            let overlayObj = (e.json != "" ? JSON.parse(e.json) : null);

            let traversal = (/** @type {Object} */ original, /** @type {Object} */ deleteTree, /** @type {Object} */ overlay) =>
            {
                let deleteKeySet = new Set();
                if (deleteTree)
                    Object.keys(deleteTree).forEach(key =>
                    {
                        if (deleteTree[key] == true)
                            deleteKeySet.add(key);
                    });

                let overlayKeySet = new Set();
                if (overlay)
                    Object.keys(overlay).forEach(key => { overlayKeySet.add(key); });

                overlayKeySet.forEach(key =>
                {
                    let overlayValue = overlay[key];
                    let originalValue = original[key];
                    if (
                        (typeof (originalValue) == "object" && originalValue != null && !Array.isArray(originalValue)) &&
                        (typeof (overlayValue) == "object" && overlayValue != null && !Array.isArray(overlayValue)) &&
                        !deleteKeySet.has(key)
                    )
                    {
                        traversal(originalValue, deleteTree?.[key], overlayValue);
                    }
                    else
                    {
                        original[key] = overlayValue;
                    }
                });

                deleteKeySet.forEach(key =>
                {
                    if (!overlayKeySet.has(key))
                        delete original[key];
                });
            };

            traversal(originalObj, deleteTree, overlayObj);

            await fs.mkdir(path.dirname(pathName), { recursive: true });
            await fs.writeFile(pathName, JSON.stringify(originalObj), { encoding: "utf-8" });

            return { ok: true };
        }
        catch (err)
        {
            console.error("traversalWriteJson error:", err);
            return { ok: false };
        }
    },
    readFile: async (/** @type {{ filePath: string }} */e, client) =>
    {
        let pathName = path.join("./data/", pathLegitimization(e.filePath));
        try
        {
            let content = await fs.readFile(pathName, { encoding: "utf-8" });
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